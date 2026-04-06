"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Edge, IsValidConnection, Node } from "@xyflow/react";
import { flowDefinitionSchema, type TriggerType } from "@telegram-builder/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFlowState } from "./hooks/useFlowState";
import { useFlowCallbacks } from "./hooks/useFlowCallbacks";
import { canCreateConnection, defaultFlowDefinition, getNodeMeta, toFlowDefinition } from "./utils";
import { FlowToolbar } from "./FlowToolbar";
import { FlowCanvas } from "./FlowCanvas";
import { FlowEditorLayout } from "./FlowEditorLayout";
import { FlowInspector } from "./FlowInspector";
import type { BotOption, RuleOption } from "./types";

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

function getDraftStorageKey(ruleId: string) {
  return `telegraph.flow-builder.draft.${ruleId}`;
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
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [autosaveState, setAutosaveState] = useState("Saved");
  const [viewportCenter, setViewportCenter] = useState({ x: 220, y: 180 });
  const selectedRule = rules.find((rule) => rule.id === selectedRuleId) ?? null;
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
    setSelectedRuleId(initialRuleId ?? "new");
  }, [initialRuleId]);

  // Load rule when selectedRuleId changes
  useEffect(() => {
    const existing = rules.find((rule) => rule.id === selectedRuleId);
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
  }, [bots, rules, selectedRuleId]); // eslint-disable-line react-hooks/exhaustive-deps

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
      "{{vars}}",
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
    ({ nodes: selectedNodes, edges: selectedEdges }: { nodes: Node[]; edges: Edge[] }) => {
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
          Add trigger, condition, and action nodes from the toolbar, connect them on the canvas, then configure the selected node in the inspector.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FlowToolbar
          botId={botId}
          bots={bots}
          name={name}
          selectedRuleId={selectedRuleId}
          rules={rules}
          isSaving={isSaving}
          isDirty={isDirty}
          autosaveState={autosaveState}
          status={status}
          nodeCount={nodes.length}
          edgeCount={edges.length}
          hasTrigger={nodes.some((node) => node.type === "start")}
          validationIssues={validationIssues}
          canUndo={historyIndexRef.current > 0}
          canRedo={historyIndexRef.current < historyRef.current.length - 1}
          onBotChange={setBotId}
          onNameChange={setName}
          onRuleChange={setSelectedRuleId}
          onAddNode={(kind) => addNode(kind, viewportCenter)}
          onUndo={undo}
          onRedo={redo}
          onDuplicateNode={duplicateSelectedNode}
          onSave={saveFlow}
        />

        <FlowEditorLayout
          hasInspector={Boolean(selectedNode)}
          canvas={
            <FlowCanvas
              nodes={nodes}
              edges={edges}
              trigger={trigger}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onSelectionChange={onSelectionChange}
              isValidConnection={isValidConnection}
              onViewportCenterChange={setViewportCenter}
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
    </Card>
  );
}
