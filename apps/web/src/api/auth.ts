import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "./client";

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  tenantName: string;
  tenantSlug: string;
}

interface AuthResponse {
  token: string;
  user: { id: string; email: string; name: string; tenantId: string };
}

interface MeResponse {
  id: string;
  email: string;
  name: string;
  tenantId: string;
}

export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/auth/me"),
  });
}
