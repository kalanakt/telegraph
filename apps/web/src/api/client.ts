const BASE_URL = import.meta.env.VITE_API_URL as string | undefined;

function getToken(): string | null {
  return localStorage.getItem("telegraph_token");
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL ?? ""}/api${path}`;
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("telegraph_token");
    localStorage.removeItem("telegraph_user");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        `Request failed: ${String(res.status)}`,
    );
  }

  return res.json() as Promise<T>;
}
