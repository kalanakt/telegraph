"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { IsValidConnection, Node } from "@xyflow/react";
import { flowDefinitionSchema, type FlowDefinition, type TriggerType } from "@telegram-builder/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBuilderCatalog, formatTriggerLabel } from "@/lib/flow-builder";
import { useFlowState } from "./hooks/useFlowState";
import { useFlowCallbacks } from "./hooks/useFlowCallbacks";
import {
  buildCallbackToken,
  canCreateConnection,
  createBuilderEdge,
  defaultFlowDefinition,
  findLinkedCallbackFlows,
  getBranchHandleForInsertedNode,
  getEdgeMidpoint,
  getInlineButtonCallbackToken,
  getInlineButtonLabel,
  getInlineKeyboard,
  getNodeMeta,
  normalizeActionNodeData,
  setInlineButtonCallbackToken,
  toFlowDefinition,
} from "./utils";
import { FlowToolbar } from "./FlowToolbar";
import { FlowCanvas } from "./FlowCanvas";
import { FlowEditorLayout } from "./FlowEditorLayout";
import { FlowInspector } from "./FlowInspector";
import { FlowNodePalette } from "./FlowNodePalette";
import { QuickAddPopover } from "./QuickAddPopover";
import type {
  BotOption,
  BuilderNodeCatalogItem,
  DecoratedBuilderEdge,
  DecoratedBuilderNode,
  QuickAddContext,
  RuleOption,
} from "./types";

type DraftPayload = {
  botId: string;
  name: string;
  trigger: TriggerType;
  flowDefinition: ReturnType<typeof defaultFlowDefinition>;
};

type CanvasSnapshot = {
  flowDefinition: ReturnType<typeof defaultFlowDefinition>;
  trigger: TriggerType;
};

function isEditableKeyboardTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return Boolean(target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]'));
}

function getDraftStorageKey(ruleId: string) {
  return `telegraph.flow-builder.draft.${ruleId}`;
}

function buildCallbackFlowDefinition(token: string, buttonLabel: string): FlowDefinition {
  return {
    nodes: [
      {
        id: "start_callback",
        type: "start",
        position: { x: 60, y: 180 },
        meta: { label: "Trigger", key: "trigger" },
        data: {},
      },
      {
        id: "condition_callback",
        type: "condition",
        position: { x: 320, y: 180 },
        meta: { label: `${buttonLabel} pressed`, key: "button_pressed" },
        data: { type: "callback_data_equals", value: token },
      },
    ],
    edges: [{ id: "edge_callback_condition", source: "start_callback", target: "condition_callback" }],
  };
}

type Props = {
  bots: BotOption[];
  rules: RuleOption[];
  initialRuleId?: string;
};

export function FlowBuilderStudio({ bots, rules, initialRuleId }: Props) {
  const [botId, setBotId] = useState(bots[0]?.id ?? "");
  const [name, setName] = useState("Flow");
  const [selectedRuleId, setSelectedRuleId] = useState<string>(initialRuleId ?? "new");
  const [availableRules, setAvailableRules] = useState(rules);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [autosaveState, setAutosaveState] = useState("Saved");
  const [viewportCenter, setViewportCenter] = useState({ x: 220, y: 180 });
  const [paletteQuery, setPaletteQuery] = useState("");
  const [paletteMobileOpen, setPaletteMobileOpen] = useState(false);
  const [quickAddContext, setQuickAddContext] = useState<QuickAddContext | null>(null);
  const [quickAddQuery, setQuickAddQuery] = useState("");
  const selectedRule = availableRules.find((rule) => rule.id === selectedRuleId) ?? null;
  const historyRef = useRef<CanvasSnapshot[]>([]);
  const historyIndexRef = useRef(-1);
  const isRestoringRef = useRef(false);
  const baselineSignatureRef = useRef("");
  const clipboardNodeRef = useRef<Node | null>(null);

  const flowState = useFlowState(defaultFlowDefinition());
  const {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
    trigger,
    loadFlow,
  } = flowState;

  const callbacks = useFlowCallbacks(
    { nodes, setNodes, edges, setEdges, selectedNodeId, setSelectedNodeId, selectedNode },
    setStatus,
  );

  const {
    setTrigger,
    addNode,
    onConnect,
    updateSelectedNodeData,
    replaceSelectedAction,
    updateSelectedActionParams,
    deleteNodeById,
    deleteSelectedNode,
  } = callbacks;

  const currentFlowDefinition = useMemo(() => toFlowDefinition(nodes, edges), [edges, nodes]);
  const validationResult = useMemo(
    () => flowDefinitionSchema.safeParse(currentFlowDefinition),
    [currentFlowDefinition],
  );
  const validationIssues = useMemo(
    () => (validationResult.success ? [] : validationResult.error.issues.map((issue) => issue.message)),
    [validationResult],
  );
  const editorSignature = useMemo(
    () =>
      JSON.stringify({
        botId,
        name,
        trigger,
        flowDefinition: currentFlowDefinition,
      }),
    [botId, currentFlowDefinition, name, trigger],
  );

  const applySnapshot = useCallback(
    (snapshot: CanvasSnapshot) => {
      isRestoringRef.current = true;
      loadFlow(snapshot.flowDefinition, snapshot.trigger);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      window.setTimeout(() => {
        isRestoringRef.current = false;
      }, 0);
    },
    [loadFlow, setSelectedNodeId],
  );

  useEffect(() => {
    setAvailableRules(rules);
  }, [rules]);

  useEffect(() => {
    setSelectedRuleId(initialRuleId ?? "new");
  }, [initialRuleId]);

  useEffect(() => {
    const existing = availableRules.find((rule) => rule.id === selectedRuleId);
    let nextDraft: DraftPayload = {
      botId: existing?.botId ?? bots[0]?.id ?? "",
      name: existing?.name ?? "Flow",
      trigger: existing?.trigger ?? "message_received",
      flowDefinition: existing?.flowDefinition ?? defaultFlowDefinition(),
    };

    if (typeof window !== "undefined") {
      const rawDraft = window.localStorage.getItem(getDraftStorageKey(selectedRuleId));
      if (rawDraft) {
        try {
          const parsed = JSON.parse(rawDraft) as Partial<DraftPayload>;
          if (parsed.flowDefinition && parsed.trigger && parsed.botId && parsed.name) {
            nextDraft = {
              botId: parsed.botId,
              name: parsed.name,
              trigger: parsed.trigger,
              flowDefinition: parsed.flowDefinition,
            };
            setStatus("Restored local draft.");
          }
        } catch {
          // ignore local draft parse errors
        }
      }
    }

    setBotId(nextDraft.botId);
    setName(nextDraft.name);
    applySnapshot({
      flowDefinition: nextDraft.flowDefinition,
      trigger: nextDraft.trigger,
    });
    historyRef.current = [
      {
        flowDefinition: nextDraft.flowDefinition,
        trigger: nextDraft.trigger,
      },
    ];
    historyIndexRef.current = 0;
    baselineSignatureRef.current = JSON.stringify(nextDraft);
    setAutosaveState("Saved");
    setIsDirty(false);
    setPaletteQuery("");
    setQuickAddContext(null);
    setQuickAddQuery("");
  }, [availableRules, applySnapshot, bots, selectedRuleId]);

  const isValidConnection: IsValidConnection = useCallback(
    (connection) => canCreateConnection(connection, nodes, edges),
    [edges, nodes],
  );

  const availableTokens = useMemo(() => {
    const base = [
      "{{event.text}}",
      "{{event.chatId}}",
      "{{event.fromUserId}}",
      "{{event.messageId}}",
      "{{event.callbackData}}",
      "{{event.contactPhoneNumber}}",
      "{{event.invoicePayload}}",
      "{{event.shippingOptionId}}",
      "{{event.successfulPaymentChargeId}}",
      "{{event.subscriptionExpirationDate}}",
      "{{vars}}",
      "{{session.id}}",
      "{{session.chatId}}",
      "{{customer.id}}",
      "{{customer.telegramUserId}}",
      "{{customer.phoneNumber}}",
      "{{order.id}}",
      "{{order.invoicePayload}}",
      "{{order.status}}",
    ];

    const nodeTokens = nodes.flatMap((node) => {
      const meta = getNodeMeta(node.data, { label: node.id, key: node.id });
      const key = meta.key?.trim();
      if (!key) {
        return [];
      }

      return [
        `{{vars.${key}.body}}`,
        `{{vars.${key}.status}}`,
        `{{vars.${key}.ok}}`,
      ];
    });

    return [...base, ...nodeTokens];
  }, [nodes]);

  const paletteSections = useMemo(
    () => getBuilderCatalog(trigger, nodes.some((node) => node.type === "start")),
    [nodes, trigger],
  );
  const quickAddSections = useMemo(
    () =>
      paletteSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => item.kind !== "start"),
        }))
        .filter((section) => section.items.length > 0),
    [paletteSections],
  );

  useEffect(() => {
    setIsDirty(editorSignature !== baselineSignatureRef.current);
    setAutosaveState(editorSignature !== baselineSignatureRef.current ? "Unsaved changes" : "Saved");
  }, [editorSignature]);

  useEffect(() => {
    if (isRestoringRef.current) {
      return;
    }

    const snapshot: CanvasSnapshot = {
      flowDefinition: currentFlowDefinition,
      trigger,
    };

    const current = JSON.stringify(snapshot);
    const existing = historyRef.current[historyIndexRef.current];
    if (existing && JSON.stringify(existing) === current) {
      return;
    }

    historyRef.current = [...historyRef.current.slice(0, historyIndexRef.current + 1), snapshot];
    historyIndexRef.current = historyRef.current.length - 1;
  }, [currentFlowDefinition, trigger]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const timer = window.setTimeout(() => {
      const payload: DraftPayload = {
        botId,
        name,
        trigger,
        flowDefinition: currentFlowDefinition,
      };
      window.localStorage.setItem(getDraftStorageKey(selectedRuleId), JSON.stringify(payload));
      setAutosaveState("Draft autosaved");
    }, 800);

    return () => window.clearTimeout(timer);
  }, [botId, currentFlowDefinition, name, selectedRuleId, trigger]);

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: { nodes: Node[]; edges: DecoratedBuilderEdge[] }) => {
      setSelectedEdgeId(selectedEdges[0]?.id ?? null);
      setSelectedNodeId(selectedNodes[0]?.id ?? null);
    },
    [setSelectedNodeId],
  );

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) {
      return;
    }
    historyIndexRef.current -= 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    if (snapshot) {
      applySnapshot(snapshot);
      setStatus("Undid last change.");
    }
  }, [applySnapshot]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) {
      return;
    }
    historyIndexRef.current += 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    if (snapshot) {
      applySnapshot(snapshot);
      setStatus("Redid change.");
    }
  }, [applySnapshot]);

  const duplicateSelectedNode = useCallback(() => {
    if (!selectedNode) {
      return;
    }

    const copy = JSON.parse(JSON.stringify(selectedNode)) as Node;
    const nextId = `${selectedNode.type}_${Date.now()}`;
    copy.id = nextId;
    copy.position = {
      x: selectedNode.position.x + 40,
      y: selectedNode.position.y + 40,
    };

    const meta = getNodeMeta(copy.data, { label: selectedNode.id, key: selectedNode.id });
    copy.data = {
      ...(copy.data as Record<string, unknown>),
      __meta: {
        ...meta,
        label: meta.label ? `${meta.label} Copy` : "Copy",
        key: `${meta.key ?? "node"}_copy_${Date.now()}`,
      },
    };

    setNodes((current) => [...current, copy]);
    setSelectedNodeId(copy.id);
    setStatus("Node duplicated.");
  }, [selectedNode, setNodes, setSelectedNodeId]);

  const pasteClipboardNode = useCallback(() => {
    if (!clipboardNodeRef.current) {
      return;
    }

    const copy = JSON.parse(JSON.stringify(clipboardNodeRef.current)) as Node;
    copy.id = `${copy.type}_${Date.now()}`;
    copy.position = {
      x: viewportCenter.x + 40,
      y: viewportCenter.y + 40,
    };
    const meta = getNodeMeta(copy.data, { label: copy.id, key: copy.id });
    copy.data = {
      ...(copy.data as Record<string, unknown>),
      __meta: {
        ...meta,
        key: `${meta.key ?? "node"}_copy_${Date.now()}`,
      },
    };
    setNodes((current) => [...current, copy]);
    setSelectedNodeId(copy.id);
    setStatus("Pasted node.");
  }, [setNodes, setSelectedNodeId, viewportCenter]);

  const deleteSelection = useCallback(() => {
    if (selectedNode) {
      deleteSelectedNode();
      return;
    }

    if (!selectedEdgeId) {
      return;
    }

    setEdges((current) => current.filter((edge) => edge.id !== selectedEdgeId));
    setSelectedEdgeId(null);
    setStatus("Edge removed.");
  }, [deleteSelectedNode, selectedEdgeId, selectedNode, setEdges]);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.defaultPrevented || isEditableKeyboardTarget(event.target)) {
        return;
      }

      const metaKey = event.metaKey || event.ctrlKey;
      if (metaKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (metaKey && event.key.toLowerCase() === "c" && selectedNode) {
        clipboardNodeRef.current = JSON.parse(JSON.stringify(selectedNode)) as Node;
        setStatus("Node copied.");
        return;
      }

      if (metaKey && event.key.toLowerCase() === "v") {
        event.preventDefault();
        pasteClipboardNode();
        return;
      }

      if (metaKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicateSelectedNode();
        return;
      }

      if (event.key === "Escape") {
        setQuickAddContext(null);
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        if (selectedNode || selectedEdgeId) {
          event.preventDefault();
          deleteSelection();
        }
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [deleteSelection, duplicateSelectedNode, pasteClipboardNode, redo, selectedEdgeId, selectedNode, undo]);

  const persistDraftSnapshot = useCallback(
    (nextNodes: Node[]) => {
      if (typeof window === "undefined") {
        return;
      }

      window.localStorage.setItem(
        getDraftStorageKey(selectedRuleId),
        JSON.stringify({
          botId,
          name,
          trigger,
          flowDefinition: toFlowDefinition(nextNodes, edges),
        } satisfies DraftPayload),
      );
    },
    [botId, edges, name, selectedRuleId, trigger],
  );

  const ensureInlineButtonToken = useCallback(
    (nodeId: string, rowIndex: number, buttonIndex: number) => {
      const actionNode = nodes.find((node) => node.id === nodeId && node.type === "action");
      if (!actionNode) {
        return null;
      }

      const action = normalizeActionNodeData(actionNode.data);
      const buttonLabel = getInlineButtonLabel(action.params, rowIndex, buttonIndex);
      let token = getInlineButtonCallbackToken(action.params, rowIndex, buttonIndex);
      let nextParams = action.params;

      if (!token) {
        token = buildCallbackToken({
          ruleId: selectedRuleId === "new" ? "draft" : selectedRuleId,
          nodeId,
          rowIndex,
          buttonIndex,
          buttonLabel,
        });
        nextParams = setInlineButtonCallbackToken(action.params, rowIndex, buttonIndex, token);
        const nextNodes = nodes.map((node) =>
          node.id === nodeId && node.type === "action"
            ? { ...node, data: { ...action, params: nextParams } }
            : node,
        );
        setNodes(nextNodes);
        persistDraftSnapshot(nextNodes);
      }

      return { token, buttonLabel, params: nextParams };
    },
    [nodes, persistDraftSnapshot, selectedRuleId, setNodes],
  );

  const handleLinkCallbackFlow = useCallback(
    (nodeId: string, rowIndex: number, buttonIndex: number) => {
      const prepared = ensureInlineButtonToken(nodeId, rowIndex, buttonIndex);
      if (!prepared) {
        setStatus("Callback button not found.");
        return;
      }

      const linked = findLinkedCallbackFlows(availableRules, prepared.params, rowIndex, buttonIndex);
      if (linked[0]) {
        window.location.href = `/flows?edit=${linked[0].ruleId}`;
        return;
      }

      setStatus("No callback flow linked yet. Create one from this button.");
    },
    [availableRules, ensureInlineButtonToken],
  );

  const handleCreateCallbackFlow = useCallback(
    async (nodeId: string, rowIndex: number, buttonIndex: number) => {
      const prepared = ensureInlineButtonToken(nodeId, rowIndex, buttonIndex);
      if (!prepared) {
        setStatus("Callback button not found.");
        return;
      }

      const linked = findLinkedCallbackFlows(availableRules, prepared.params, rowIndex, buttonIndex);
      if (linked[0]) {
        window.location.href = `/flows?edit=${linked[0].ruleId}`;
        return;
      }

      setStatus("Creating callback flow...");
      const callbackName = `${name}: ${prepared.buttonLabel}`;
      const response = await fetch("/api/flows", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          botId,
          name: callbackName,
          trigger: "callback_query_received",
          flowDefinition: buildCallbackFlowDefinition(prepared.token, prepared.buttonLabel),
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.rule?.id) {
        setStatus(json.error ?? "Failed to create callback flow.");
        return;
      }

      const newRule: RuleOption = {
        id: json.rule.id as string,
        botId,
        name: callbackName,
        trigger: "callback_query_received",
        flowDefinition: buildCallbackFlowDefinition(prepared.token, prepared.buttonLabel),
        webhookEndpoint: null,
      };
      setAvailableRules((current) => [newRule, ...current]);
      setStatus(`Created callback flow "${callbackName}".`);

      if (selectedRuleId !== "new") {
        window.location.href = `/flows?edit=${newRule.id}`;
      }
    },
    [availableRules, botId, ensureInlineButtonToken, name, selectedRuleId],
  );

  const openNodeInsert = useCallback(
    (nodeId: string, sourceHandle: string | undefined, anchor: { x: number; y: number }) => {
      setQuickAddQuery("");
      setQuickAddContext({
        mode: "node",
        sourceNodeId: nodeId,
        sourceHandle,
        anchor,
      });
    },
    [],
  );

  const applyCatalogItem = useCallback(
    (item: BuilderNodeCatalogItem, context: QuickAddContext | null) => {
      if (item.kind === "start") {
        const existingStart = nodes.find((node) => node.type === "start");
        if (existingStart) {
          setTrigger(item.trigger ?? trigger);
          setSelectedNodeId(existingStart.id);
          setStatus(`Trigger updated to ${formatTriggerLabel(item.trigger ?? trigger)}.`);
        } else {
          const nextNode = addNode("start", viewportCenter, { trigger: item.trigger });
          if (nextNode) {
            setStatus(`Added ${item.title}.`);
          }
        }
        setPaletteMobileOpen(false);
        return;
      }

      const edgeContext = context?.mode === "edge" ? edges.find((edge) => edge.id === context.edgeId) : null;
      const sourceNode = context ? nodes.find((node) => node.id === context.sourceNodeId) : null;
      const position =
        edgeContext
          ? getEdgeMidpoint(edgeContext, nodes)
          : sourceNode
          ? {
              x: Math.round((sourceNode.position.x + 280) / 20) * 20,
              y: Math.round(sourceNode.position.y / 20) * 20,
            }
          : undefined;
      const nextNode =
        item.kind === "action"
          ? addNode("action", viewportCenter, { actionType: item.actionType, position })
          : addNode(item.kind, viewportCenter, { position });

      if (!nextNode) {
        return;
      }

      if (context?.mode === "edge" && edgeContext) {
        setEdges((current) => {
          const withoutEdge = current.filter((edge) => edge.id !== edgeContext.id);
          return [
            ...withoutEdge,
            createBuilderEdge({
              source: edgeContext.source,
              sourceHandle: edgeContext.sourceHandle ?? null,
              target: nextNode.id,
              targetHandle: null,
            }),
            createBuilderEdge({
              source: nextNode.id,
              sourceHandle: getBranchHandleForInsertedNode(item.kind) ?? null,
              target: edgeContext.target,
              targetHandle: null,
            }),
          ];
        });
      } else if (context?.mode === "node") {
        const candidate = createBuilderEdge({
          source: context.sourceNodeId,
          sourceHandle: context.sourceHandle ?? null,
          target: nextNode.id,
          targetHandle: null,
        });

        if (!canCreateConnection(candidate, [...nodes, nextNode], edges)) {
          setNodes((current) => current.filter((node) => node.id !== nextNode.id));
          setSelectedNodeId(context.sourceNodeId);
          setStatus("That branch already has a connection.");
          setPaletteMobileOpen(false);
          setQuickAddContext(null);
          return;
        }

        setEdges((current) => [...current, candidate]);
      }

      setSelectedNodeId(nextNode.id);
      setStatus(context ? `Connected ${item.title}.` : `Added ${item.title}.`);
      setPaletteMobileOpen(false);
      setQuickAddContext(null);
    },
    [addNode, edges, nodes, setEdges, setSelectedNodeId, setTrigger, trigger, viewportCenter],
  );

  const handleNodeActivate = useCallback(
    (node: Node) => {
      setSelectedEdgeId(null);
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId],
  );

  const decoratedNodes = useMemo<DecoratedBuilderNode[]>(
    () =>
      nodes.map((node) => {
        const action = node.type === "action" ? normalizeActionNodeData(node.data) : null;
        const linked =
          action
            ? Array.from(
                new Map(
                  getInlineKeyboard(action.params)
                    .flatMap((row, rowIndex) => {
                      return row.flatMap((_, buttonIndex) =>
                        findLinkedCallbackFlows(availableRules, action.params, rowIndex, buttonIndex),
                      );
                    })
                    .map((item) => [`${item.ruleId}:${item.token}`, item]),
                ).values(),
              )
            : [];

        return {
          ...node,
          data: {
            ...(node.data as Record<string, unknown>),
            id: node.id,
            __runtime: {
              onTriggerSelect: () => setSelectedNodeId(node.id),
              onCreateCallbackFlow: handleCreateCallbackFlow,
              onLinkCallbackFlow: handleLinkCallbackFlow,
              linkedCallbackFlows: linked,
              onQuickAdd: openNodeInsert,
              onDeleteNode: deleteNodeById,
            },
          },
        };
      }),
    [
      availableRules,
      handleCreateCallbackFlow,
      deleteNodeById,
      handleLinkCallbackFlow,
      nodes,
      openNodeInsert,
      setSelectedNodeId,
    ],
  );

  const decoratedEdges = useMemo<DecoratedBuilderEdge[]>(
    () =>
      edges.map((edge) => ({
        ...edge,
        type: "builder-edge",
        className:
          selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId)
            ? "builder-edge-connected"
            : undefined,
        data: {},
      })),
    [edges, selectedNodeId],
  );

  async function saveFlow() {
    setIsSaving(true);
    setStatus("Validating...");

    const parsed = flowDefinitionSchema.safeParse(currentFlowDefinition);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Flow graph is invalid.";
      const friendlyMessage =
        message === "Flow must include exactly one start node."
          ? "Add exactly one trigger node before saving."
          : message.includes("not reachable from the start node")
          ? "Connect every condition and action to the trigger flow before saving."
          : message;
      setStatus(friendlyMessage);
      setIsSaving(false);
      return;
    }

    const body: Record<string, unknown> = {
      botId,
      name,
      trigger,
      flowDefinition: parsed.data,
    };

    const isUpdating = selectedRuleId !== "new";
    if (isUpdating) body.ruleId = selectedRuleId;

    setStatus(isUpdating ? "Updating flow..." : "Creating flow...");

    const res = await fetch("/api/flows", {
      method: isUpdating ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (!res.ok) {
      const issueMessage =
        Array.isArray(json.issues) && json.issues.length > 0
          ? `${json.issues[0]?.path || "flow"}: ${json.issues[0]?.message || "invalid"}`
          : null;
      setStatus(issueMessage ?? json.error ?? "Could not save flow.");
      setIsSaving(false);
      return;
    }

    setStatus(isUpdating ? "Flow updated." : "Flow created.");
    setIsSaving(false);
    baselineSignatureRef.current = JSON.stringify({
      botId,
      name,
      trigger,
      flowDefinition: parsed.data,
    });
    setIsDirty(false);
    setAutosaveState("Saved");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(getDraftStorageKey(selectedRuleId));
    }
    const nextId = (json.rule?.id as string | undefined) ?? selectedRuleId;
    window.location.href = `/flows?edit=${nextId}`;
  }

  if (bots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Create Flow</CardTitle>
          <CardDescription>Add a Telegram bot first to enable flow creation.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="surface-panel">
      <CardHeader>
        <CardTitle className="text-xl">Flows Studio</CardTitle>
        <CardDescription>
          Use the node catalog to add triggers, logic, and actions. Connect nodes directly from each card, or insert new nodes on any edge.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FlowToolbar
          botId={botId}
          bots={bots}
          name={name}
          selectedRuleId={selectedRuleId}
          rules={availableRules}
          isSaving={isSaving}
          isDirty={isDirty}
          autosaveState={autosaveState}
          status={status}
          nodeCount={nodes.length}
          edgeCount={edges.length}
          validationIssues={validationIssues}
          canUndo={historyIndexRef.current > 0}
          canRedo={historyIndexRef.current < historyRef.current.length - 1}
          onBotChange={setBotId}
          onNameChange={setName}
          onRuleChange={setSelectedRuleId}
          onUndo={undo}
          onRedo={redo}
          onDuplicateNode={duplicateSelectedNode}
          onSave={saveFlow}
          onOpenPalette={() => setPaletteMobileOpen(true)}
        />

        <FlowEditorLayout
          hasInspector={Boolean(selectedNode)}
          palette={
            <FlowNodePalette
              sections={paletteSections}
              query={paletteQuery}
              onQueryChange={setPaletteQuery}
              onSelectItem={(item) => applyCatalogItem(item, null)}
              mobileOpen={paletteMobileOpen}
              onMobileClose={() => setPaletteMobileOpen(false)}
            />
          }
          canvas={
            <FlowCanvas
              nodes={decoratedNodes}
              edges={decoratedEdges}
              trigger={trigger}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onSelectionChange={onSelectionChange}
              isValidConnection={isValidConnection}
              onViewportCenterChange={setViewportCenter}
              onNodeActivate={handleNodeActivate}
              onPaneClick={() => {
                setSelectedNodeId(null);
                setSelectedEdgeId(null);
              }}
            />
          }
          inspector={
            <FlowInspector
              selectedNode={selectedNode}
              trigger={trigger}
              selectedRule={selectedRule}
              onTriggerChange={setTrigger}
              onUpdateNodeData={updateSelectedNodeData}
              onReplaceAction={replaceSelectedAction}
              onUpdateActionParams={updateSelectedActionParams}
              onDeleteNode={deleteSelectedNode}
              availableTokens={availableTokens}
            />
          }
        />
      </CardContent>

      <QuickAddPopover
        context={quickAddContext}
        sections={quickAddSections}
        query={quickAddQuery}
        onQueryChange={setQuickAddQuery}
        onSelectItem={(item) => applyCatalogItem(item, quickAddContext)}
        onClose={() => setQuickAddContext(null)}
      />
    </Card>
  );
}
