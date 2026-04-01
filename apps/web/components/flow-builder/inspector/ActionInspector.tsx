"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { AlertTriangle, LoaderCircle, Upload, X } from "lucide-react";
import { isActionAllowedForTrigger, type ActionPayload, type TriggerType } from "@telegram-builder/shared";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createActionTemplate, getActionTypeOptions, migrateLegacyActionData } from "@/lib/flow-builder";
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
  const actionTypeOptions = useMemo(() => getActionTypeOptions(), []);

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

      <label className="builder-label">
        <span>Action type</span>
        <select
          className="builder-field"
          value={action.type}
          onChange={(e) => {
            const template = createActionTemplate(e.target.value as ActionPayload["type"]);
            onReplace(normalizeActionNodeData(template));
          }}
        >
          {Array.from(categoryMap.entries()).map(([category, items]) => (
            <optgroup key={category} label={category}>
              {items.map((item) => (
                <option key={item.actionType} value={item.actionType}>
                  {item.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

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
              <div className="mt-2 space-y-2 rounded-md border border-border/80 bg-white/60 p-3">
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

            <label className="builder-label mt-2">
              <span>Parse mode</span>
              <select
                className="builder-field"
                value={asString(params.parse_mode)}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  if (!nextValue) {
                    const { parse_mode: _omit, ...rest } = params;
                    onReplace({ ...action, params: rest });
                    return;
                  }
                  onUpdateParams({ parse_mode: nextValue });
                }}
              >
                <option value="">None</option>
                <option value="Markdown">Markdown</option>
                <option value="MarkdownV2">MarkdownV2</option>
                <option value="HTML">HTML</option>
              </select>
            </label>
          </div>

          <div className="builder-section">
            <p className="builder-kicker">Buttons</p>
            <label className="builder-label">
              <span>Keyboard type</span>
              <select
                className="builder-field"
                value={replyMarkupKind}
                onChange={(e) => {
                  const kind = e.target.value as "none" | "inline" | "reply";
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
                <option value="none">None</option>
                <option value="inline">Inline keyboard</option>
                <option value="reply">Reply keyboard</option>
              </select>
            </label>

            {replyMarkupKind === "inline" ? (
              <div className="mt-3 space-y-2">
                {inlineKeyboard.map((row, rowIndex) => (
                  <div key={`inline-row-${rowIndex}`} className="space-y-2 rounded-md border border-border/80 bg-white/60 p-2">
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
                        <select
                          className="builder-field"
                          value={button.url ? "url" : "callback_data"}
                          onChange={(e) => {
                            const mode = e.target.value;
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
                          <option value="callback_data">callback_data</option>
                          <option value="url">url</option>
                        </select>
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
                  <div key={`reply-row-${rowIndex}`} className="space-y-2 rounded-md border border-border/80 bg-white/60 p-2">
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
