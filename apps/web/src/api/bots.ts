import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";

interface Bot {
  id: string;
  name: string;
  username: string;
  status: string;
  webhookConfigured: boolean;
  createdAt: string;
}

interface CreateBotInput {
  name: string;
  username: string;
  token: string;
}

interface UpdateBotInput {
  botId: string;
  name?: string;
  username?: string;
}

export function useBots() {
  return useQuery({
    queryKey: ["bots"],
    queryFn: () => apiFetch<Bot[]>("/bots"),
  });
}

export function useBot(botId: string) {
  return useQuery({
    queryKey: ["bots", botId],
    queryFn: () => apiFetch<Bot>(`/bots/${botId}`),
    enabled: Boolean(botId),
  });
}

export function useCreateBot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBotInput) =>
      apiFetch<Bot>("/bots", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bots"] }),
  });
}

export function useUpdateBot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ botId, ...input }: UpdateBotInput) =>
      apiFetch<Bot>(`/bots/${botId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bots"] }),
  });
}

export function useDeleteBot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (botId: string) =>
      apiFetch<void>(`/bots/${botId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bots"] }),
  });
}
