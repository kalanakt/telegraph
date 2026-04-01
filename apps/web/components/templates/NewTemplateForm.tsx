"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createStarterTemplateFlow } from "@/lib/template-builder";

export function NewTemplateForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PRIVATE" | "PUBLIC">("PRIVATE");
  const [isCreating, setIsCreating] = useState(false);
  const [status, setStatus] = useState("");

  const titlePreview = useMemo(() => {
    const trimmed = title.trim();
    return trimmed.length > 0 ? trimmed : "Untitled template";
  }, [title]);

  async function createTemplate() {
    if (!title.trim()) {
      setStatus("Add a template title before continuing.");
      return;
    }

    setIsCreating(true);
    setStatus("Creating template...");

    const response = await fetch("/api/templates", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        title: title.trim(),
        description,
        visibility,
        flows: [createStarterTemplateFlow("Flow 1")]
      })
    });

    const json = await response.json();

    if (!response.ok || !json.template?.id) {
      const issueMessage =
        Array.isArray(json.issues) && json.issues.length > 0
          ? `${json.issues[0]?.path || "template"}: ${json.issues[0]?.message || "invalid"}`
          : null;
      setStatus(issueMessage ?? json.error ?? "Could not create template.");
      setIsCreating(false);
      return;
    }

    window.location.href = `/templates/${json.template.id}`;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
      <Card className="interactive-lift">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Step 1 of 2</Badge>
            <Badge variant="outline">Add template details</Badge>
          </div>
          <CardTitle className="font-[var(--font-display)]">Start with the template details</CardTitle>
          <CardDescription>
            Name the bundle, describe what it does, and decide whether the draft starts private or public-ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <label className="builder-label">
            <span>Template title</span>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Support onboarding bundle"
            />
          </label>

          <label className="builder-label">
            <span>Description</span>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="A short note about when to use this template and what flows it includes."
            />
          </label>

          <label className="builder-label">
            <span>Starting visibility</span>
            <select
              className="builder-field builder-field-soft"
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as "PRIVATE" | "PUBLIC")}
            >
              <option value="PRIVATE">Private draft</option>
              <option value="PUBLIC">Public-ready draft</option>
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={createTemplate} disabled={isCreating}>
              {isCreating ? "Creating..." : "Continue to flow builder"}
            </Button>
            <p className="text-sm text-muted-foreground">
              We’ll create the template and open step 2, where you build the flows and save the draft.
            </p>
          </div>

          {status ? (
            <Badge variant="outline" className="border border-border/80 bg-background/70 text-foreground/88">
              {status}
            </Badge>
          ) : null}
        </CardContent>
      </Card>

      <Card className="interactive-lift">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Preview</Badge>
            <Badge variant="outline">{visibility === "PRIVATE" ? "Private" : "Public"}</Badge>
          </div>
          <CardTitle className="font-[var(--font-display)]">{titlePreview}</CardTitle>
          <CardDescription>
            After this step, Telegraph opens a dedicated builder with one starter flow already prepared.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-sm border border-border/80 bg-background/70 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">What happens next</p>
            <div className="mt-3 space-y-3">
              <div className="rounded-sm border border-border/70 bg-background/80 px-3 py-3">
                <p className="font-medium text-foreground">Step 2</p>
                <p className="text-sm text-muted-foreground">Build your first flow in the visual editor.</p>
              </div>
              <div className="rounded-sm border border-border/70 bg-background/80 px-3 py-3">
                <p className="font-medium text-foreground">Save draft</p>
                <p className="text-sm text-muted-foreground">Keep editing privately until you are ready to publish.</p>
              </div>
              <div className="rounded-sm border border-border/70 bg-background/80 px-3 py-3">
                <p className="font-medium text-foreground">Publish later</p>
                <p className="text-sm text-muted-foreground">Public templates stay on the last published snapshot until republished.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
