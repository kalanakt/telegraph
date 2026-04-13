const CRYPTO_PAY_MAINNET_BASE_URL = "https://pay.crypt.bot";
const CRYPTO_PAY_TESTNET_BASE_URL = "https://testnet-pay.crypt.bot";

type CryptoPayMethod = "getMe" | "createInvoice";

export type CryptoPayPaidButtonName = "viewItem" | "openChannel" | "openBot" | "callback";
export type CryptoPayCurrencyType = "crypto" | "fiat";

export type CryptoPayCreateInvoiceParams = {
  currency_type?: CryptoPayCurrencyType;
  asset?: string;
  fiat?: string;
  accepted_assets?: string;
  amount: string;
  swap_to?: string;
  description?: string;
  hidden_message?: string;
  paid_btn_name?: CryptoPayPaidButtonName;
  paid_btn_url?: string;
  payload?: string;
  allow_comments?: boolean;
  allow_anonymous?: boolean;
  expires_in?: number;
};

export type CryptoPayInvoice = {
  invoice_id: number;
  hash: string;
  currency_type: CryptoPayCurrencyType;
  status: "active" | "paid" | "expired";
  amount: string;
  asset?: string | null;
  fiat?: string | null;
  accepted_assets?: string | null;
  description?: string | null;
  payload?: string | null;
  bot_invoice_url?: string | null;
  mini_app_invoice_url?: string | null;
  web_app_invoice_url?: string | null;
  paid_asset?: string | null;
  paid_amount?: string | null;
  paid_at?: string | null;
  paid_btn_name?: CryptoPayPaidButtonName | null;
  paid_btn_url?: string | null;
  [key: string]: string | number | boolean | null | undefined;
};

export type CryptoPayApp = {
  app_id?: number | string;
  name?: string;
  payment_processing_bot_username?: string;
  [key: string]: unknown;
};

type CryptoPayResponse<T> =
  | {
      ok: true;
      result: T;
    }
  | {
      ok: false;
      error?: string;
    };

export class CryptoPayRequestError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, input?: { status?: number; code?: string }) {
    super(message);
    this.name = "CryptoPayRequestError";
    this.status = input?.status;
    this.code = input?.code;
  }
}

function getCryptoPayBaseUrl(useTestnet = false) {
  return useTestnet ? CRYPTO_PAY_TESTNET_BASE_URL : CRYPTO_PAY_MAINNET_BASE_URL;
}

async function cryptoPayRequest<T>(
  token: string,
  method: CryptoPayMethod,
  params?: Record<string, unknown>,
  options?: { useTestnet?: boolean }
): Promise<T> {
  const response = await fetch(`${getCryptoPayBaseUrl(options?.useTestnet)}/api/${method}`, {
    method: params ? "POST" : "GET",
    headers: {
      "content-type": "application/json",
      "Crypto-Pay-API-Token": token
    },
    body: params ? JSON.stringify(params) : undefined
  });

  let payload: CryptoPayResponse<T> | null = null;
  try {
    payload = (await response.json()) as CryptoPayResponse<T>;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new CryptoPayRequestError(
      payload && !payload.ok ? payload.error ?? `Crypto Pay ${method} failed` : `Crypto Pay ${method} failed`,
      { status: response.status }
    );
  }

  if (!payload) {
    throw new CryptoPayRequestError(`Crypto Pay ${method} returned an empty response`, {
      status: response.status
    });
  }

  if (!payload.ok) {
    throw new CryptoPayRequestError(payload.error ?? `Crypto Pay ${method} failed`, {
      status: response.status,
      code: payload.error
    });
  }

  return payload.result;
}

export async function cryptoPayGetMe(token: string, options?: { useTestnet?: boolean }) {
  return cryptoPayRequest<CryptoPayApp>(token, "getMe", undefined, options);
}

export async function cryptoPayCreateInvoice(
  token: string,
  params: CryptoPayCreateInvoiceParams,
  options?: { useTestnet?: boolean }
) {
  return cryptoPayRequest<CryptoPayInvoice>(token, "createInvoice", params, options);
}
