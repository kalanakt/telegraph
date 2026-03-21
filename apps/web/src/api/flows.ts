import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Edge, Node } from "@xyflow/react";
import { apiFetch } from "./client";

interface Flow {
  id: string;
  name: string;
  description: string;
  version: number;
  published: boolean;
  nodes: Node[];
  edges: Edge[];
  createdAt: string;
}

interface CreateFlowInput {
  botId: string;
  name: string;
  description?: string;
}

interface SaveFlowInput {
  botId: string;
  flowId: string;
  nodes: Node[];
  edges: Edge[];
}

export function useFlows(botId: string) {
  return useQuery({
    queryKey: ["flows", botId],
    queryFn: () => apiFetch<Flow[]>(`/bots/${botId}/flows`),
    enabled: Boolean(botId),
  });
}

export function useFlow(botId: string, flowId: string) {
  return useQuery({
    queryKey: ["flows", botId, flowId],
    queryFn: () => apiFetch<Flow>(`/bots/${botId}/flows/${flowId}`),
    enabled: Boolean(botId) && Boolean(flowId),
  });
}

export function useCreateFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ botId, ...input }: CreateFlowInput) =>
      apiFetch<Flow>(`/bots/${botId}/flows`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (_data: Flow, vars: CreateFlowInput) =>
      qc.invalidateQueries({ queryKey: ["flows", vars.botId] }),
  });
}

export function useSaveFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ botId, flowId, nodes, edges }: SaveFlowInput) =>
      apiFetch<Flow>(`/bots/${botId}/flows/${flowId}`, {
        method: "PUT",
        body: JSON.stringify({ graphJson: { nodes, edges } }),
      }),
    onSuccess: (_data: Flow, vars: SaveFlowInput) =>
      qc.invalidateQueries({ queryKey: ["flows", vars.botId, vars.flowId] }),
  });
}

export function usePublishFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ botId, flowId }: { botId: string; flowId: string }) =>
      apiFetch<{ version: number }>(`/bots/${botId}/flows/${flowId}/publish`, {
        method: "POST",
      }),
    onSuccess: (_data: { version: number }, vars: { botId: string; flowId: string }) =>
      qc.invalidateQueries({ queryKey: ["flows", vars.botId] }),
  });
}
