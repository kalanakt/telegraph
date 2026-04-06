"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { AlertTriangle, LoaderCircle, Upload, X } from "lucide-react";
import { isActionAllowedForTrigger, type ActionPayload, type TriggerType } from "@telegram-builder/shared";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createActionTemplate, getActionPresets, getActionTypeOptions, migrateLegacyActionData } from "@/lib/flow-builder";
import {
  asString,
  getInlineKeyboard,
  getReplyKeyboard,
  getReplyMarkupKind,
  updateInlineKeyboard,
  updateReplyKeyboard,
} from "../utils";
import { CORE_COMPOSER_METHODS, type ActionEditorData } from "../types";

type Props = {
  action: ActionEditorData;
  trigger: TriggerType;
  onReplace: (next: ActionEditorData) => void;
  onUpdateParams: (partial: Record<string, unknown>) => void;
};

type UploadableParam = "photo" | "video" | "document";
type UploadState = {
  field: UploadableParam;
  filename: string;
} | null;

const NO_PARSE_MODE = "__none__";
const MESSAGE_CLONE_METHODS = new Set(["telegram.copyMessage", "telegram.forwardMessage"]);
const CHAT_MEMBER_METHODS = new Set(["telegram.banChatMember", "telegram.getChatMember"]);

function normalizeActionNodeData(data: unknown): ActionEditorData {
  const normalized = migrateLegacyActionData(data);
  return { type: normalized.type, params: normalized.params as Record<string, unknown> };
}

function getUploadConfig(actionType: ActionPayload["type"]): {
  field: UploadableParam;
  label: string;
  accept?: string;
} | null {
  switch (actionType) {
    case "telegram.sendPhoto":
      return { field: "photo", label: "Photo URL / File ID", accept: "image/*" };
    case "telegram.sendVideo":
      return { field: "video", label: "Video URL / File ID", accept: "video/*" };
    case "telegram.sendDocument":
      return { field: "document", label: "Document URL / File ID" };
    default:
      return null;
  }
}

export function ActionInspector({ action, trigger, onReplace, onUpdateParams }: Props) {
  const params = action.params;
  const isCompatible = isActionAllowedForTrigger(action.type as ActionPayload["type"], trigger);
  const isCoreComposer = CORE_COMPOSER_METHODS.has(action.type);
  const actionTypeOptions = useMemo(() => getActionTypeOptions(trigger), [trigger]);
  const presets = useMemo(() => getActionPresets(action.type as ActionPayload["type"]), [action.type]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, typeof actionTypeOptions>();
    for (const item of actionTypeOptions) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [actionTypeOptions]);

  const inlineKeyboard = getInlineKeyboard(params);
  const replyKeyboard = getReplyKeyboard(params);
  const replyMarkupKind = getReplyMarkupKind(params);
  const uploadConfig = getUploadConfig(action.type);
  const authObject =
    typeof params.auth === "object" && params.auth !== null ? (params.auth as Record<string, unknown> & { type?: string }) : null;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleUploadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !uploadConfig) {
      return;
    }

    setUploadError(null);
    setUploadState({ field: uploadConfig.field, filename: file.name });

    try {
      const formData = new FormData();
      formData.set("file", file);

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { error?: string; url?: string; key?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Upload failed");
      }

      const resolvedUrl = payload.key
        ? new URL(`/api/media/public/${payload.key}`, window.location.origin).toString()
        : payload.url;

      onUpdateParams({ [uploadConfig.field]: resolvedUrl });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadState(null);
    }
  }

  return (
    <>
      <div className="builder-section">
        <p className="builder-kicker">Trigger context</p>
        <p className="text-xs text-foreground/70">
          Selected trigger: <span className="font-semibold">{trigger}</span>
        </p>
        {!isCompatible ? (
          <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-amber-900">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <p className="text-xs">
              This action is not compatible with the current trigger. Update trigger or action before saving.
            </p>
          </div>
        ) : null}
      </div>

      <div className="builder-label">
        <span>Action type</span>
        <Select
          value={action.type}
          onValueChange={(value) => {
            const template = createActionTemplate(value as ActionPayload["type"]);
            onReplace(normalizeActionNodeData(template));
          }}
        >
          <SelectTrigger className="builder-field">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from(categoryMap.entries()).map(([category, items]) => (
              <SelectGroup key={category}>
                <SelectLabel>{category}</SelectLabel>
                {items.map((item) => (
                  <SelectItem key={item.actionType} value={item.actionType}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {presets.length > 0 ? (
        <div className="builder-section">
          <p className="builder-kicker">Presets</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.id}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onReplace(normalizeActionNodeData(preset.action))}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {isCoreComposer ? (
        <>
          <div className="builder-section">
            <p className="builder-kicker">Content</p>

            <label className="builder-label">
              <span>Chat ID</span>
              <Input
                value={asString(params.chat_id)}
                onChange={(e) => onUpdateParams({ chat_id: e.target.value })}
              />
            </label>

            {action.type === "telegram.sendMessage" ? (
              <label className="builder-label mt-2">
                <span>Text</span>
                <Textarea
                  rows={4}
                  value={asString(params.text)}
                  onChange={(e) => onUpdateParams({ text: e.target.value })}
                />
              </label>
            ) : null}

            {action.type === "telegram.sendPhoto" ? (
              <>
                <label className="builder-label mt-2">
                  <span>Caption</span>
                  <Textarea
                    rows={3}
                    value={asString(params.caption)}
                    onChange={(e) => onUpdateParams({ caption: e.target.value })}
                  />
                </label>
              </>
            ) : null}

            {action.type === "telegram.sendVideo" ? (
              <>
                <label className="builder-label mt-2">
                  <span>Caption</span>
                  <Textarea
                    rows={3}
                    value={asString(params.caption)}
                    onChange={(e) => onUpdateParams({ caption: e.target.value })}
                  />
                </label>
              </>
            ) : null}

            {action.type === "telegram.sendDocument" ? (
              <>
                <label className="builder-label mt-2">
                  <span>Caption</span>
                  <Textarea
                    rows={3}
                    value={asString(params.caption)}
                    onChange={(e) => onUpdateParams({ caption: e.target.value })}
                  />
                </label>
              </>
            ) : null}

            {uploadConfig ? (
              <div className="mt-2 space-y-2 rounded-md border border-border/80 bg-background/65 p-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={uploadConfig.accept}
                  onChange={handleUploadFile}
                />
                <label className="builder-label">
                  <span>{uploadConfig.label}</span>
                  <Input
                    value={asString(params[uploadConfig.field])}
                    onChange={(e) => onUpdateParams({ [uploadConfig.field]: e.target.value })}
                    placeholder="https://... or Telegram file_id"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadState !== null}
                  >
                    {uploadState?.field === uploadConfig.field ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Upload to S3
                  </Button>
                  {asString(params[uploadConfig.field]) ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onUpdateParams({ [uploadConfig.field]: "" })}
                    >
                      <X className="h-4 w-4" />
                      Clear
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs text-foreground/70">
                  Upload to S3, or paste a direct file URL / Telegram `file_id`. The URL must return the raw media (not an HTML page or “preview” link).
                </p>
                {uploadState?.field === uploadConfig.field ? (
                  <p className="text-xs text-foreground/70">Uploading {uploadState.filename}...</p>
                ) : null}
                {uploadError ? (
                  <p className="text-xs text-destructive">{uploadError}</p>
                ) : null}
              </div>
            ) : null}

            <div className="builder-label mt-2">
              <span>Parse mode</span>
              <Select
                value={asString(params.parse_mode) || NO_PARSE_MODE}
                onValueChange={(value) => {
                  if (value === NO_PARSE_MODE) {
                    const { parse_mode: _omit, ...rest } = params;
                    onReplace({ ...action, params: rest });
                    return;
                  }
                  onUpdateParams({ parse_mode: value });
                }}
              >
                <SelectTrigger className="builder-field">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARSE_MODE}>None</SelectItem>
                  <SelectItem value="Markdown">Markdown</SelectItem>
                  <SelectItem value="MarkdownV2">MarkdownV2</SelectItem>
                  <SelectItem value="HTML">HTML</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="builder-section">
            <p className="builder-kicker">Buttons</p>
            <div className="builder-label">
              <span>Keyboard type</span>
              <Select
                value={replyMarkupKind}
                onValueChange={(value) => {
                  const kind = value as "none" | "inline" | "reply";
                  if (kind === "none") {
                    const { reply_markup: _omit, ...rest } = params;
                    onReplace({ ...action, params: rest });
                    return;
                  }
                  if (kind === "inline") {
                    onUpdateParams({ reply_markup: { inline_keyboard: [[{ text: "Button", callback_data: "action" }]] } });
                    return;
                  }
                  onUpdateParams({ reply_markup: { keyboard: [[{ text: "Button" }]], resize_keyboard: true } });
                }}
              >
                <SelectTrigger className="builder-field">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="inline">Inline keyboard</SelectItem>
                  <SelectItem value="reply">Reply keyboard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {replyMarkupKind === "inline" ? (
              <div className="mt-3 space-y-2">
                {inlineKeyboard.map((row, rowIndex) => (
                  <div key={`inline-row-${rowIndex}`} className="space-y-2 rounded-md border border-border/80 bg-background/65 p-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-foreground/72">Row {rowIndex + 1}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const nextRows = inlineKeyboard.filter((_, i) => i !== rowIndex);
                          onUpdateParams({
                            reply_markup: {
                              inline_keyboard: nextRows.length > 0 ? nextRows : [[{ text: "Button", callback_data: "action" }]],
                            },
                          });
                        }}
                      >
                        Remove row
                      </Button>
                    </div>

                    {row.map((button, buttonIndex) => (
                      <div key={`inline-btn-${rowIndex}-${buttonIndex}`} className="grid gap-2 md:grid-cols-3">
                        <Input
                          value={button.text}
                          onChange={(e) => {
                            const nextRows = updateInlineKeyboard(inlineKeyboard, rowIndex, buttonIndex, { text: e.target.value });
                            onUpdateParams({ reply_markup: { inline_keyboard: nextRows } });
                          }}
                          placeholder="Button text"
                        />
                        <Select
                          value={button.url ? "url" : "callback_data"}
                          onValueChange={(mode) => {
                            const nextRows = updateInlineKeyboard(
                              inlineKeyboard,
                              rowIndex,
                              buttonIndex,
                              mode === "url"
                                ? { url: "https://", callback_data: undefined }
                                : { callback_data: "action", url: undefined },
                            );
                            onUpdateParams({ reply_markup: { inline_keyboard: nextRows } });
                          }}
                        >
                          <SelectTrigger className="builder-field">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="callback_data">callback_data</SelectItem>
                            <SelectItem value="url">url</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={button.url ?? button.callback_data ?? ""}
                          onChange={(e) => {
                            const nextRows = updateInlineKeyboard(
                              inlineKeyboard,
                              rowIndex,
                              buttonIndex,
                              button.url ? { url: e.target.value } : { callback_data: e.target.value },
                            );
                            onUpdateParams({ reply_markup: { inline_keyboard: nextRows } });
                          }}
                          placeholder={button.url ? "https://example.com" : "action_id"}
                        />
                      </div>
                    ))}

                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const nextRows = inlineKeyboard.map((row, i) =>
                          i === rowIndex ? [...row, { text: "Button", callback_data: "action" }] : row,
                        );
                        onUpdateParams({ reply_markup: { inline_keyboard: nextRows } });
                      }}
                    >
                      Add button
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onUpdateParams({ reply_markup: { inline_keyboard: [...inlineKeyboard, [{ text: "Button", callback_data: "action" }]] } });
                  }}
                >
                  Add row
                </Button>
              </div>
            ) : null}

            {replyMarkupKind === "reply" ? (
              <div className="mt-3 space-y-2">
                {replyKeyboard.map((row, rowIndex) => (
                  <div key={`reply-row-${rowIndex}`} className="space-y-2 rounded-md border border-border/80 bg-background/65 p-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-foreground/72">Row {rowIndex + 1}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const nextRows = replyKeyboard.filter((_, i) => i !== rowIndex);
                          onUpdateParams({
                            reply_markup: {
                              keyboard: nextRows.length > 0 ? nextRows : [[{ text: "Button" }]],
                              resize_keyboard: true,
                            },
                          });
                        }}
                      >
                        Remove row
                      </Button>
                    </div>
                    {row.map((button, buttonIndex) => (
                      <Input
                        key={`reply-btn-${rowIndex}-${buttonIndex}`}
                        value={button.text}
                        onChange={(e) => {
                          const nextRows = updateReplyKeyboard(replyKeyboard, rowIndex, buttonIndex, { text: e.target.value });
                          onUpdateParams({ reply_markup: { keyboard: nextRows, resize_keyboard: true } });
                        }}
                        placeholder="Reply button text"
                      />
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const nextRows = replyKeyboard.map((row, i) =>
                          i === rowIndex ? [...row, { text: "Button" }] : row,
                        );
                        onUpdateParams({ reply_markup: { keyboard: nextRows, resize_keyboard: true } });
                      }}
                    >
                      Add button
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onUpdateParams({ reply_markup: { keyboard: [...replyKeyboard, [{ text: "Button" }]], resize_keyboard: true } });
                  }}
                >
                  Add row
                </Button>
              </div>
            ) : null}
          </div>

          <div className="builder-section">
            <p className="builder-kicker">Advanced params</p>
            <label className="builder-label">
              <span>Raw params JSON (optional fine-tuning)</span>
              <Textarea
                rows={5}
                value={JSON.stringify(action.params, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value) as Record<string, unknown>;
                    onReplace({ ...action, params: parsed });
                  } catch {
                    // ignore parse errors while typing
                  }
                }}
              />
            </label>
          </div>
        </>
      ) : action.type === "webhook.send" || action.type === "http.request" ? (
        <>
          <div className="builder-section">
            <p className="builder-kicker">Request</p>

            {action.type === "http.request" ? (
              <label className="builder-label">
                <span>Method</span>
                <Select
                  value={asString(params.method) || "POST"}
                  onValueChange={(value) => onUpdateParams({ method: value })}
                >
                  <SelectTrigger className="builder-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            ) : null}

            <label className="builder-label mt-2">
              <span>URL</span>
              <Input
                value={asString(params.url)}
                onChange={(e) => onUpdateParams({ url: e.target.value })}
                placeholder="https://api.example.com/resource"
              />
            </label>

            <label className="builder-label mt-2">
              <span>Headers JSON</span>
              <Textarea
                rows={4}
                value={JSON.stringify((params.headers as Record<string, string> | undefined) ?? {}, null, 2)}
                onChange={(e) => {
                  try {
                    onUpdateParams({ headers: JSON.parse(e.target.value) as Record<string, string> });
                  } catch {
                    // ignore parse errors while typing
                  }
                }}
              />
            </label>

            <label className="builder-label mt-2">
              <span>Query params JSON</span>
              <Textarea
                rows={3}
                value={JSON.stringify((params.query as Record<string, string> | undefined) ?? {}, null, 2)}
                onChange={(e) => {
                  try {
                    onUpdateParams({ query: JSON.parse(e.target.value) as Record<string, string> });
                  } catch {
                    // ignore parse errors while typing
                  }
                }}
              />
            </label>

            {action.type === "http.request" ? (
              <label className="builder-label mt-2">
                <span>Body mode</span>
                <Select
                  value={asString(params.body_mode) || "json"}
                  onValueChange={(value) => onUpdateParams({ body_mode: value })}
                >
                  <SelectTrigger className="builder-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">json</SelectItem>
                    <SelectItem value="text">text</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            ) : null}

            <label className="builder-label mt-2">
              <span>Body</span>
              <Textarea
                rows={6}
                value={
                  typeof params.body === "string"
                    ? params.body
                    : JSON.stringify(params.body ?? (action.type === "webhook.send" ? {} : {}), null, 2)
                }
                onChange={(e) => {
                  if (action.type === "http.request" && asString(params.body_mode) === "text") {
                    onUpdateParams({ body: e.target.value });
                    return;
                  }

                  try {
                    onUpdateParams({ body: JSON.parse(e.target.value) as Record<string, unknown> });
                  } catch {
                    // ignore parse errors while typing
                  }
                }}
              />
            </label>

            <label className="builder-label mt-2">
              <span>Auth type</span>
              <Select
                value={typeof params.auth === "object" && params.auth && "type" in params.auth ? String(params.auth.type) : "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    onUpdateParams({ auth: { type: "none" } });
                    return;
                  }
                  if (value === "bearer") {
                    onUpdateParams({ auth: { type: "bearer", token: "" } });
                    return;
                  }
                  if (value === "basic") {
                    onUpdateParams({ auth: { type: "basic", username: "", password: "" } });
                    return;
                  }
                  if (value === "api_key_header") {
                    onUpdateParams({ auth: { type: "api_key_header", header: "x-api-key", value: "" } });
                    return;
                  }
                  onUpdateParams({ auth: { type: "api_key_query", key: "api_key", value: "" } });
                }}
              >
                <SelectTrigger className="builder-field">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">none</SelectItem>
                  <SelectItem value="bearer">bearer</SelectItem>
                  <SelectItem value="basic">basic</SelectItem>
                  <SelectItem value="api_key_header">api key header</SelectItem>
                  <SelectItem value="api_key_query">api key query</SelectItem>
                </SelectContent>
              </Select>
            </label>

            {authObject?.type && authObject.type !== "none" ? (
              <div className="mt-2 grid gap-2">
                {authObject.type === "bearer" ? (
                  <Input
                    value={asString(authObject.token)}
                    onChange={(e) => onUpdateParams({ auth: { ...authObject, token: e.target.value } })}
                    placeholder="Bearer token"
                  />
                ) : null}
                {authObject.type === "basic" ? (
                  <>
                    <Input
                      value={asString(authObject.username)}
                      onChange={(e) => onUpdateParams({ auth: { ...authObject, username: e.target.value } })}
                      placeholder="Username"
                    />
                    <Input
                      value={asString(authObject.password)}
                      onChange={(e) => onUpdateParams({ auth: { ...authObject, password: e.target.value } })}
                      placeholder="Password"
                    />
                  </>
                ) : null}
                {authObject.type === "api_key_header" ? (
                  <>
                    <Input
                      value={asString(authObject.header)}
                      onChange={(e) => onUpdateParams({ auth: { ...authObject, header: e.target.value } })}
                      placeholder="Header name"
                    />
                    <Input
                      value={asString(authObject.value)}
                      onChange={(e) => onUpdateParams({ auth: { ...authObject, value: e.target.value } })}
                      placeholder="Header value"
                    />
                  </>
                ) : null}
                {authObject.type === "api_key_query" ? (
                  <>
                    <Input
                      value={asString(authObject.key)}
                      onChange={(e) => onUpdateParams({ auth: { ...authObject, key: e.target.value } })}
                      placeholder="Query key"
                    />
                    <Input
                      value={asString(authObject.value)}
                      onChange={(e) => onUpdateParams({ auth: { ...authObject, value: e.target.value } })}
                      placeholder="Query value"
                    />
                  </>
                ) : null}
              </div>
            ) : null}

            <label className="builder-label mt-2">
              <span>Response body format</span>
              <Select
                value={asString(params.response_body_format) || "auto"}
                onValueChange={(value) => onUpdateParams({ response_body_format: value })}
              >
                <SelectTrigger className="builder-field">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">auto</SelectItem>
                  <SelectItem value="json">json</SelectItem>
                  <SelectItem value="text">text</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>

          <div className="builder-section">
            <p className="builder-kicker">Runtime output</p>
            <p className="text-xs text-foreground/70">
              Downstream nodes can reference <code className="rounded-sm bg-secondary/70 px-0.5">{`{{vars.${action.type === "http.request" ? "action_id" : "action_id"}.body}}`}</code> after this action runs.
            </p>
          </div>

          <div className="builder-section">
            <p className="builder-kicker">Advanced params</p>
            <Textarea
              rows={10}
              value={JSON.stringify(action.params, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value) as Record<string, unknown>;
                  onReplace({ ...action, params: parsed });
                } catch {
                  // ignore parse errors while typing
                }
              }}
            />
          </div>
        </>
      ) : MESSAGE_CLONE_METHODS.has(action.type) ? (
        <div className="builder-section">
          <p className="builder-kicker">Message source</p>
          <label className="builder-label">
            <span>Target chat ID</span>
            <Input value={asString(params.chat_id)} onChange={(e) => onUpdateParams({ chat_id: e.target.value })} />
          </label>
          <label className="builder-label mt-2">
            <span>From chat ID</span>
            <Input value={asString(params.from_chat_id)} onChange={(e) => onUpdateParams({ from_chat_id: e.target.value })} />
          </label>
          <label className="builder-label mt-2">
            <span>Message ID</span>
            <Input value={asString(params.message_id)} onChange={(e) => onUpdateParams({ message_id: Number(e.target.value || 0) })} />
          </label>
          <label className="builder-label mt-2">
            <span>Optional caption</span>
            <Textarea rows={3} value={asString(params.caption)} onChange={(e) => onUpdateParams({ caption: e.target.value })} />
          </label>
        </div>
      ) : action.type === "telegram.sendChatAction" ? (
        <div className="builder-section">
          <p className="builder-kicker">Chat action</p>
          <label className="builder-label">
            <span>Chat ID</span>
            <Input value={asString(params.chat_id)} onChange={(e) => onUpdateParams({ chat_id: e.target.value })} />
          </label>
          <label className="builder-label mt-2">
            <span>Action</span>
            <Select value={asString(params.action) || "typing"} onValueChange={(value) => onUpdateParams({ action: value })}>
              <SelectTrigger className="builder-field">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["typing","upload_photo","record_video","upload_video","record_voice","upload_voice","upload_document","choose_sticker","find_location"].map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
      ) : CHAT_MEMBER_METHODS.has(action.type) ? (
        <div className="builder-section">
          <p className="builder-kicker">Chat member</p>
          <label className="builder-label">
            <span>Chat ID</span>
            <Input value={asString(params.chat_id)} onChange={(e) => onUpdateParams({ chat_id: e.target.value })} />
          </label>
          <label className="builder-label mt-2">
            <span>User ID</span>
            <Input value={asString(params.user_id)} onChange={(e) => onUpdateParams({ user_id: e.target.value })} />
          </label>
        </div>
      ) : action.type === "telegram.restrictChatMember" ? (
        <div className="builder-section">
          <p className="builder-kicker">Restrict member</p>
          <label className="builder-label">
            <span>Chat ID</span>
            <Input value={asString(params.chat_id)} onChange={(e) => onUpdateParams({ chat_id: e.target.value })} />
          </label>
          <label className="builder-label mt-2">
            <span>User ID</span>
            <Input value={asString(params.user_id)} onChange={(e) => onUpdateParams({ user_id: e.target.value })} />
          </label>
          <label className="builder-label mt-2">
            <span>Permissions JSON</span>
            <Textarea
              rows={5}
              value={JSON.stringify(params.permissions ?? {}, null, 2)}
              onChange={(e) => {
                try {
                  onUpdateParams({ permissions: JSON.parse(e.target.value) });
                } catch {
                  // noop
                }
              }}
            />
          </label>
        </div>
      ) : action.type === "telegram.setMyCommands" ? (
        <div className="builder-section">
          <p className="builder-kicker">Commands</p>
          <Textarea
            rows={8}
            value={JSON.stringify(params.commands ?? [{ command: "start", description: "Start the bot" }], null, 2)}
            onChange={(e) => {
              try {
                onUpdateParams({ commands: JSON.parse(e.target.value) });
              } catch {
                // noop
              }
            }}
          />
        </div>
      ) : action.type === "telegram.sendMediaGroup" ? (
        <div className="builder-section">
          <p className="builder-kicker">Media group</p>
          <label className="builder-label">
            <span>Chat ID</span>
            <Input value={asString(params.chat_id)} onChange={(e) => onUpdateParams({ chat_id: e.target.value })} />
          </label>
          <label className="builder-label mt-2">
            <span>Media JSON</span>
            <Textarea
              rows={8}
              value={JSON.stringify(params.media ?? [], null, 2)}
              onChange={(e) => {
                try {
                  onUpdateParams({ media: JSON.parse(e.target.value) });
                } catch {
                  // noop
                }
              }}
            />
          </label>
        </div>
      ) : action.type === "telegram.createChatInviteLink" || action.type === "telegram.editChatInviteLink" ? (
        <div className="builder-section">
          <p className="builder-kicker">Invite link</p>
          <label className="builder-label">
            <span>Chat ID</span>
            <Input value={asString(params.chat_id)} onChange={(e) => onUpdateParams({ chat_id: e.target.value })} />
          </label>
          {action.type === "telegram.editChatInviteLink" ? (
            <label className="builder-label mt-2">
              <span>Invite link</span>
              <Input value={asString(params.invite_link)} onChange={(e) => onUpdateParams({ invite_link: e.target.value })} />
            </label>
          ) : null}
          <label className="builder-label mt-2">
            <span>Name</span>
            <Input value={asString(params.name)} onChange={(e) => onUpdateParams({ name: e.target.value })} />
          </label>
          <label className="builder-label mt-2">
            <span>Member limit</span>
            <Input value={asString(params.member_limit)} onChange={(e) => onUpdateParams({ member_limit: Number(e.target.value || 0) })} />
          </label>
        </div>
      ) : (
        <div className="builder-section">
          <p className="builder-kicker">Advanced params</p>
          <p className="mb-2 text-xs text-foreground/70">
            This method uses JSON editor mode. Core rich composer is available for sendMessage / sendPhoto / sendVideo / sendDocument.
          </p>
          <Textarea
            rows={10}
            value={JSON.stringify(action.params, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value) as Record<string, unknown>;
                onReplace({ ...action, params: parsed });
              } catch {
                // ignore parse errors while typing
              }
            }}
          />
        </div>
      )}
    </>
  );
}
