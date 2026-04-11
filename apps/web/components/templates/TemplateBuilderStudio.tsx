"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { IsValidConnection, Node } from "@xyflow/react";
import { workflowTemplateDraftSchema } from "@telegram-builder/shared";
import { FlowCanvas } from "@/components/flow-builder/FlowCanvas";
import { FlowEditorLayout } from "@/components/flow-builder/FlowEditorLayout";
import { FlowInspector } from "@/components/flow-builder/FlowInspector";
import { useFlowCallbacks } from "@/components/flow-builder/hooks/useFlowCallbacks";
import { useFlowState } from "@/components/flow-builder/hooks/useFlowState";
import { canCreateConnection, getNodeMeta, toFlowDefinition } from "@/components/flow-builder/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createStarterTemplateFlow, type TemplateEditorFlow } from "@/lib/template-builder";
import { TemplateInstallPanel } from "./TemplateInstallPanel";

type BotOption = {
  id: string;
  label: string;
};

type TemplateVersionSummary = {
  id: string;
  version: number;
  title: string;
  description: string | null;
  createdAt: string;
};

type TemplateEditorData = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  visibility: "PRIVATE" | "PUBLIC";
  isPublished: boolean;
  draftFlows: Array<TemplateEditorFlow & { id?: string; sortOrder: number }>;
  versions: TemplateVersionSummary[];
};

type LocalTemplateFlow = TemplateEditorFlow & {
  localId: string;
  sortOrder: number;
};

type Props = {
  template: TemplateEditorData;
  bots: BotOption[];
};

function makeLocalFlowId(flow: { id?: string }, index: number) {
  return flow.id ?? `flow-${index + 1}`;
}

function toLocalFlow(flow: TemplateEditorData["draftFlows"][number], index: number): LocalTemplateFlow {
  return {
    ...flow,
    localId: makeLocalFlowId(flow, index),
    sortOrder: flow.sortOrder ?? index
  };
}

export function TemplateBuilderStudio({ template, bots }: Props) {
  const initialLocalFlows = template.draftFlows.map(toLocalFlow);
  const fallbackFlow: LocalTemplateFlow = {
    ...createStarterTemplateFlow("Flow 1"),
    localId: "flow-1",
    sortOrder: 0
  };

  const [title, setTitle] = useState(template.title);
  const [description, setDescription] = useState(template.description ?? "");
  const [visibility, setVisibility] = useState<"PRIVATE" | "PUBLIC">(template.visibility);
  const [flows, setFlows] = useState<LocalTemplateFlow[]>(() =>
    initialLocalFlows.length > 0 ? initialLocalFlows : [fallbackFlow]
  );
  const [selectedFlowId, setSelectedFlowId] = useState<string>(() =>
    (initialLocalFlows[0] ?? fallbackFlow).localId
  );
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewportCenter, setViewportCenter] = useState({ x: 220, y: 180 });
  const [isPublished, setIsPublished] = useState(template.isPublished);
  const [versions, setVersions] = useState(template.versions);
  const flowCounterRef = useRef(Math.max(flows.length, 1));

  const selectedFlow = useMemo(
    () => flows.find((flow) => flow.localId === selectedFlowId) ?? flows[0] ?? null,
    [flows, selectedFlowId]
  );
  const selectedFlowIndex = useMemo(
    () => flows.findIndex((flow) => flow.localId === selectedFlowId),
    [flows, selectedFlowId]
  );

  const flowState = useFlowState(
    (selectedFlow ?? fallbackFlow).flowDefinition,
    (selectedFlow ?? fallbackFlow).trigger
  );
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
    loadFlow
  } = flowState;

  const callbacks = useFlowCallbacks(
    { nodes, setNodes, edges, setEdges, selectedNodeId, setSelectedNodeId, selectedNode },
    setStatus
  );

  const {
    setTrigger,
    addNode,
    onConnect,
    updateSelectedNodeData,
    replaceSelectedAction,
    updateSelectedActionParams,
    deleteSelectedNode
  } = callbacks;

  useEffect(() => {
    if (!selectedFlow) {
      return;
    }

    loadFlow(selectedFlow.flowDefinition, selectedFlow.trigger);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFlow?.localId]);

  const isValidConnection: IsValidConnection = useCallback(
    (connection) => canCreateConnection(connection, nodes, edges),
    [edges, nodes]
  );

  const availableTokens = useMemo(() => {
    const base = ["{{event.text}}", "{{event.chatId}}", "{{vars}}"];
    const nodeTokens = nodes.flatMap((node) => {
      const meta = getNodeMeta(node.data, { label: node.id, key: node.id });
      const key = meta.key?.trim();
      if (!key) {
        return [];
      }

      return [`{{vars.${key}.body}}`, `{{vars.${key}.status}}`, `{{vars.${key}.ok}}`];
    });

    return [...base, ...nodeTokens];
  }, [nodes]);

  const onSelectionChange = useCallback(
    ({ nodes: selected }: { nodes: Node[]; edges: import("@xyflow/react").Edge[] }) => {
      setSelectedNodeId(selected[0]?.id ?? null);
    },
    [setSelectedNodeId]
  );

  function commitSelectedFlow(currentFlows = flows) {
    if (!selectedFlow) {
      return currentFlows;
    }

    const nextFlowDefinition = toFlowDefinition(nodes, edges);

    return currentFlows.map((flow, index) =>
      flow.localId === selectedFlow.localId
        ? {
            ...flow,
            trigger,
            flowDefinition: nextFlowDefinition,
            sortOrder: index
          }
        : {
            ...flow,
            sortOrder: index
          }
    );
  }

  function buildPayload() {
    const committedFlows = commitSelectedFlow();

    return {
      committedFlows,
      payload: {
        title,
        description,
        visibility,
        flows: committedFlows.map((flow) => ({
          id: flow.id,
          name: flow.name,
          trigger: flow.trigger,
          flowDefinition: flow.flowDefinition
        }))
      }
    };
  }

  async function persistDraft() {
    setIsSaving(true);
    setStatus("Saving template draft...");

    const { committedFlows, payload } = buildPayload();
    setFlows(committedFlows);

    const parsed = workflowTemplateDraftSchema.safeParse(payload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setStatus(issue?.message ?? "Template draft is invalid.");
      setIsSaving(false);
      return false;
    }

    const response = await fetch(`/api/templates/${template.id}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(parsed.data)
    });

    const json = await response.json();

    if (!response.ok) {
      const issueMessage =
        Array.isArray(json.issues) && json.issues.length > 0
          ? `${json.issues[0]?.path || "template"}: ${json.issues[0]?.message || "invalid"}`
          : null;
      setStatus(issueMessage ?? json.error ?? "Could not save template.");
      setIsSaving(false);
      return false;
    }

    setStatus("Template draft saved.");
    setIsSaving(false);
    return true;
  }

  function switchToFlow(localId: string) {
    const committedFlows = commitSelectedFlow();
    setFlows(committedFlows);
    setSelectedFlowId(localId);
    const nextFlow = committedFlows.find((flow) => flow.localId === localId);
    if (nextFlow) {
      loadFlow(nextFlow.flowDefinition, nextFlow.trigger);
      setSelectedNodeId(null);
      setStatus("");
    }
  }

  function addFlow() {
    const committedFlows = commitSelectedFlow();
    flowCounterRef.current += 1;
    const nextFlow: LocalTemplateFlow = {
      ...createStarterTemplateFlow(`Flow ${flowCounterRef.current}`),
      localId: `local-${flowCounterRef.current}`,
      sortOrder: committedFlows.length
    };
    const nextFlows = [...committedFlows, nextFlow].map((flow, index) => ({
      ...flow,
      sortOrder: index
    }));
    setFlows(nextFlows);
    setSelectedFlowId(nextFlow.localId);
    loadFlow(nextFlow.flowDefinition, nextFlow.trigger);
    setSelectedNodeId(null);
    setStatus("New template flow added.");
  }

  function removeSelectedFlow() {
    if (flows.length <= 1 || !selectedFlow) {
      setStatus("A template needs at least one flow.");
      return;
    }

    const committedFlows = commitSelectedFlow();
    const nextFlows = committedFlows
      .filter((flow) => flow.localId !== selectedFlow.localId)
      .map((flow, index) => ({ ...flow, sortOrder: index }));
    const nextSelected = nextFlows[Math.max(selectedFlowIndex - 1, 0)] ?? nextFlows[0];

    if (!nextSelected) {
      setStatus("A template needs at least one flow.");
      return;
    }

    setFlows(nextFlows);
    setSelectedFlowId(nextSelected.localId);
    loadFlow(nextSelected.flowDefinition, nextSelected.trigger);
    setSelectedNodeId(null);
    setStatus("Flow removed from template.");
  }

  function moveSelectedFlow(direction: -1 | 1) {
    if (!selectedFlow) {
      return;
    }

    const committedFlows = commitSelectedFlow();
    const index = committedFlows.findIndex((flow) => flow.localId === selectedFlow.localId);
    const targetIndex = index + direction;

    if (index < 0 || targetIndex < 0 || targetIndex >= committedFlows.length) {
      return;
    }

    const reordered = [...committedFlows];
    const current = reordered[index];
    const target = reordered[targetIndex];
    if (!current || !target) {
      return;
    }

    reordered[index] = target;
    reordered[targetIndex] = current;
    const normalized = reordered.map((flow, flowIndex) => ({ ...flow, sortOrder: flowIndex }));
    setFlows(normalized);
    setSelectedFlowId(selectedFlow.localId);
    setStatus("Flow order updated.");
  }

  function updateSelectedFlowName(name: string) {
    setFlows((current) =>
      current.map((flow) =>
        flow.localId === selectedFlowId
          ? {
              ...flow,
              name
            }
          : flow
      )
    );
  }

  async function publishTemplate() {
    setIsPublishing(true);

    const saved = await persistDraft();
    if (!saved) {
      setIsPublishing(false);
      return false;
    }

    const response = await fetch(`/api/templates/${template.id}/publish`, {
      method: "POST"
    });
    const json = await response.json();

    if (!response.ok) {
      setStatus(json.error ?? "Could not publish template.");
      setIsPublishing(false);
      return false;
    }

    setIsPublished(true);
    setVersions((current) => [
      {
        id: json.publishedVersionId as string,
        version: Number(json.version ?? current[0]?.version ?? 1),
        title,
        description: description || null,
        createdAt: new Date().toISOString()
      },
      ...current
    ]);
    setStatus("Template published.");
    setIsPublishing(false);
    return true;
  }

  async function unpublishTemplate() {
    setIsUnpublishing(true);

    const response = await fetch(`/api/templates/${template.id}/unpublish`, {
      method: "POST"
    });
    const json = await response.json();

    if (!response.ok) {
      setStatus(json.error ?? "Could not unpublish template.");
      setIsUnpublishing(false);
      return;
    }

    setVisibility("PRIVATE");
    setIsPublished(false);
    setStatus("Template unpublished.");
    setIsUnpublishing(false);
  }

  async function deleteCurrentTemplate() {
    const confirmed = window.confirm("Delete this template and all of its versions?");
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    const response = await fetch(`/api/templates/${template.id}`, {
      method: "DELETE"
    });
    const json = await response.json();

    if (!response.ok) {
      setStatus(json.error ?? "Could not delete template.");
      setIsDeleting(false);
      return;
    }

    window.location.href = "/templates";
  }

  return (
    <div className="space-y-6">
      <Card className="interactive-lift overflow-hidden">
        <CardHeader className="border-b border-border/80 bg-muted/40">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Step 2 of 2</Badge>
            <Badge variant="outline">Build flows and save</Badge>
            {isPublished ? <Badge variant="secondary">Public snapshot live</Badge> : <Badge variant="outline">Draft only</Badge>}
          </div>
          <CardTitle className="font-display">Build the template bundle</CardTitle>
          <CardDescription>
            Fine-tune the template details, build each included flow, then save or publish when the draft is ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 pt-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <label className="builder-label">
                <span>Template title</span>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} />
              </label>

              <div className="builder-label">
                <span>Draft visibility</span>
                <Select
                  value={visibility}
                  onValueChange={(value) => setVisibility(value as "PRIVATE" | "PUBLIC")}
                >
                  <SelectTrigger className="builder-field builder-field-soft">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <label className="builder-label">
              <span>Description</span>
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={persistDraft} disabled={isSaving || isPublishing}>
                {isSaving ? "Saving..." : "Save draft"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={publishTemplate}
                disabled={isPublishing || isSaving || visibility !== "PUBLIC"}
              >
                {isPublishing ? "Publishing..." : isPublished ? "Republish" : "Publish"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={unpublishTemplate}
                disabled={!isPublished || isUnpublishing}
              >
                {isUnpublishing ? "Unpublishing..." : "Unpublish"}
              </Button>
              <Button type="button" variant="destructive" onClick={deleteCurrentTemplate} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>

            {status ? (
              <Badge variant="outline" className="border border-border/80 bg-background/70 text-foreground/88">
                {status}
              </Badge>
            ) : null}
          </div>

          <div className="space-y-4 rounded-sm border border-border/85 bg-background/70 p-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Publish & install</p>
              <p className="text-sm text-muted-foreground">
                Public pages stay on the last published snapshot until you republish this draft.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Slug: {template.slug}</Badge>
              <Badge variant="outline">{flows.length} flows in draft</Badge>
            </div>

            {isPublished ? (
              <Button asChild type="button" size="sm" variant="outline">
                <Link href={`/templates/public/${template.slug}`}>Open public page</Link>
              </Button>
            ) : null}

            <div className="space-y-2 border-t border-border/80 pt-4">
              <p className="text-sm font-semibold text-foreground">Install into a bot</p>
              <TemplateInstallPanel templateId={template.id} bots={bots} signedIn onBeforeInstall={persistDraft} />
            </div>

            <div className="space-y-2 border-t border-border/80 pt-4">
              <p className="text-sm font-semibold text-foreground">Published versions</p>
              {versions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No public versions yet.</p>
              ) : (
                <div className="space-y-2">
                  {versions.slice(0, 4).map((version) => (
                    <div key={version.id} className="rounded-sm border border-border/80 bg-background/80 px-3 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">v{version.version}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(version.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{version.title}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="interactive-lift overflow-hidden">
        <CardHeader className="border-b border-border/80">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="font-display">Template flows</CardTitle>
              <CardDescription>
                Switch between flows here. Add a new one only when this template truly needs another automation.
              </CardDescription>
            </div>
            <Button type="button" onClick={addFlow}>
              Add flow
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {flows.map((flow, index) => (
              <button
                key={flow.localId}
                type="button"
                onClick={() => switchToFlow(flow.localId)}
                className={`min-w-[220px] rounded-sm border px-4 py-3 text-left transition ${
                  flow.localId === selectedFlowId
                    ? "border-primary/70 bg-primary/5 shadow-sm"
                    : "border-border/80 bg-background/70 hover:border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{flow.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{flow.trigger}</p>
                  </div>
                  <Badge variant="outline">#{index + 1}</Badge>
                </div>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-sm border border-border/85 bg-muted/35 px-3 py-3">
            <Badge variant="secondary">Selected flow</Badge>
            <Badge variant="outline">{selectedFlow?.name ?? "Flow"}</Badge>
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => moveSelectedFlow(-1)}
              disabled={selectedFlowIndex <= 0}
            >
              Move left
            </Button>
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => moveSelectedFlow(1)}
              disabled={selectedFlowIndex < 0 || selectedFlowIndex === flows.length - 1}
            >
              Move right
            </Button>
            <Button
              type="button"
              size="xs"
              variant="destructive"
              onClick={removeSelectedFlow}
              disabled={flows.length <= 1}
            >
              Remove selected flow
            </Button>
          </div>

          <FlowEditorLayout
            hasInspector={Boolean(selectedNode)}
            canvas={
              <Card className="surface-panel">
                <CardHeader>
                  <CardTitle className="text-xl">Flow builder</CardTitle>
                  <CardDescription>
                    Work on one flow at a time. Save the whole template draft whenever you want to keep progress.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <label className="builder-label">
                      <span>Flow name</span>
                      <Input value={selectedFlow?.name ?? ""} onChange={(event) => updateSelectedFlowName(event.target.value)} />
                    </label>

                    <div className="flex flex-wrap items-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => addNode("start")}
                        disabled={nodes.some((node) => node.type === "start")}
                      >
                        Add trigger
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => addNode("condition")}>
                        Add condition
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => addNode("action")}>
                        Add action
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 rounded-sm border border-border/85 bg-background/70 px-3 py-3 shadow-sm backdrop-blur-sm">
                    <Badge variant="secondary" className="border border-border/80 bg-secondary/75 text-secondary-foreground">
                      {selectedFlow?.name ?? "Flow"}
                    </Badge>
                    <Badge variant="outline" className="border border-border/80 bg-background/70 text-foreground/76">
                      Nodes: {nodes.length}
                    </Badge>
                    <Badge variant="outline" className="border border-border/80 bg-background/70 text-foreground/76">
                      Edges: {edges.length}
                    </Badge>
                  </div>

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
                </CardContent>
              </Card>
            }
            inspector={
              <FlowInspector
                selectedNode={selectedNode}
                trigger={trigger}
                selectedRule={null}
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
    </div>
  );
}
