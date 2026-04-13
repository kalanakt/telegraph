"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  botId: string;
  connected: boolean;
  appId?: string | null;
  appName?: string | null;
  webhookUrl?: string | null;
  defaultWebhookUrl?: string | null;
  useTestnet?: boolean;
  connectedAt?: string | null;
};

type ResponsePayload = {
  connected: boolean;
  appId?: string | null;
  appName?: string | null;
  webhookUrl?: string | null;
  defaultWebhookUrl?: string | null;
  useTestnet?: boolean;
  connectedAt?: string | null;
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "string") {
    const normalized = error.trim();
    return normalized.length > 0 ? normalized : fallback;
  }

  if (error instanceof Error) {
    return getErrorMessage(error.message, fallback);
  }

  if (Array.isArray(error)) {
    const parts: string[] = error
      .map((item) => getErrorMessage(item, ""))
      .filter((item) => item.length > 0);
    return parts.length > 0 ? parts.join(", ") : fallback;
  }

  if (error && typeof error === "object") {
    const candidate = error as Record<string, unknown>;

    for (const key of ["error", "message", "detail", "description"]) {
      if (key in candidate) {
        return getErrorMessage(candidate[key], fallback);
      }
    }

    try {
      const serialized = JSON.stringify(candidate);
      return serialized.length > 0 ? serialized : fallback;
    } catch {
      return fallback;
    }
  }

  return fallback;
}

export function CryptoPayConnectionCard({
  botId,
  connected,
  appId,
  appName,
  webhookUrl,
  defaultWebhookUrl,
  useTestnet = false,
  connectedAt,
}: Props) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [testnet, setTestnet] = useState(useTestnet);
  const [state, setState] = useState<ResponsePayload>({
    connected,
    appId,
    appName,
    webhookUrl,
    defaultWebhookUrl,
    useTestnet,
    connectedAt,
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadConnection() {
      const response = await fetch(`/api/bots/${botId}/cryptopay`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | ({ error?: string } & ResponsePayload)
        | null;

      if (!cancelled && response.ok && payload) {
        setState(payload);
        setTestnet(payload.useTestnet ?? false);
      }
    }

    void loadConnection();

    return () => {
      cancelled = true;
    };
  }, [botId]);

  const environmentLabel = useMemo(
    () => (state.useTestnet ? "Testnet" : "Mainnet"),
    [state.useTestnet],
  );

  async function connect() {
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/bots/${botId}/cryptopay`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          token,
          useTestnet: testnet,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | ({ error?: string } & ResponsePayload)
        | null;

      if (!response.ok || !payload) {
        throw new Error(getErrorMessage(payload?.error, "Could not connect Crypto Pay."));
      }

      setState(payload);
      setToken("");
      setMessage("Crypto Pay is connected.");
      router.refresh();
    } catch (nextError) {
      setError(getErrorMessage(nextError, "Could not connect Crypto Pay."));
    } finally {
      setIsSaving(false);
    }
  }

  async function disconnect() {
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/bots/${botId}/cryptopay`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as
        | ({ error?: string } & ResponsePayload)
        | null;

      if (!response.ok || !payload) {
        throw new Error(getErrorMessage(payload?.error, "Could not disconnect Crypto Pay."));
      }

      setState(payload);
      setMessage("Crypto Pay is disconnected.");
      router.refresh();
    } catch (nextError) {
      setError(getErrorMessage(nextError, "Could not disconnect Crypto Pay."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="interactive-lift">
      <CardHeader>
        <CardTitle className="font-display">Crypto Pay</CardTitle>
        <CardDescription>
          Connect a Crypto Bot app token so flows can create payment links with the Create Crypto Pay Invoice action.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">Status</p>
            <p className="text-sm">{state.connected ? "Connected" : "Not connected"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">Environment</p>
            <p className="text-sm">{environmentLabel}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">App</p>
            <p className="text-sm">{state.appName || state.appId || "-"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">Connected</p>
            <p className="text-sm">
              {state.connectedAt ? new Date(state.connectedAt).toLocaleString() : "-"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase text-muted-foreground">API token</span>
            <Input
              type="password"
              value={token}
              placeholder="Paste your Crypto Pay API token"
              onChange={(event) => setToken(event.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={testnet}
              onChange={(event) => setTestnet(event.target.checked)}
            />
            Use Crypto Pay testnet
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={isSaving || token.trim().length === 0} onClick={connect}>
              {isSaving ? "Connecting..." : state.connected ? "Reconnect" : "Connect"}
            </Button>
            {state.connected ? (
              <Button type="button" size="sm" variant="outline" disabled={isSaving} onClick={disconnect}>
                Disconnect
              </Button>
            ) : null}
          </div>
        </div>

        {state.webhookUrl ? (
          <div className="space-y-2">
            <p className="text-xs uppercase text-muted-foreground">Webhook URL to paste into Crypto Pay</p>
            <Input readOnly value={state.webhookUrl ?? ""} className="text-xs" />
            <p className="text-xs text-muted-foreground">
              Add this URL in the Crypto Bot app Webhooks settings. Telegraph verifies the Crypto Pay signature on each delivery and uses these updates to mark paid invoices.
            </p>
          </div>
        ) : null}

        {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
