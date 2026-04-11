"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Copy, ExternalLink, FileImage, FileText, Film, LoaderCircle, RefreshCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type MediaKind = "image" | "video" | "document";

type MediaLibraryItem = {
  key: string;
  url: string;
  proxyPath: string;
  filename: string;
  contentType: string;
  size: number;
  lastModified: string;
  kind: MediaKind;
};

type UploadResponse = {
  url?: string;
  key?: string;
  error?: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(kind: MediaKind) {
  switch (kind) {
    case "image":
      return FileImage;
    case "video":
      return Film;
    default:
      return FileText;
  }
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export function MediaLibraryBrowser({
  kind,
  compact = false,
  onSelect,
}: {
  kind?: MediaKind;
  compact?: boolean;
  onSelect?: (url: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadsEnabled, setUploadsEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<{ filename: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const search = new URLSearchParams();
      if (kind) {
        search.set("kind", kind);
      }

      const response = await fetch(`/api/media/files?${search.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json()) as {
        items?: MediaLibraryItem[];
        uploadsEnabled?: boolean;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load files");
      }

      setItems(payload.items ?? []);
      setUploadsEnabled(payload.uploadsEnabled ?? true);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (!copiedKey) return undefined;
    const timer = window.setTimeout(() => setCopiedKey(null), 1400);
    return () => window.clearTimeout(timer);
  }, [copiedKey]);

  const heading = useMemo(() => {
    if (kind === "image") return "Images";
    if (kind === "video") return "Videos";
    if (kind === "document") return "Documents";
    return "Uploaded files";
  }, [kind]);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setUploadState({ filename: file.name });
    setError(null);

    try {
      const formData = new FormData();
      formData.set("file", file);

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as UploadResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? "Upload failed");
      }

      await loadItems();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Upload failed");
    } finally {
      setUploadState(null);
    }
  }

  return (
    <Card className={cn(compact ? "border-border/70 bg-background/70" : "interactive-lift")}>
      <CardHeader className={compact ? "border-b border-border/60" : undefined}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="font-(--font-display)">{heading}</CardTitle>
            <CardDescription>
              Reuse uploaded assets in message actions instead of pasting fresh URLs every time.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={
                kind === "image"
                  ? "image/*"
                  : kind === "video"
                    ? "video/*"
                    : kind === "document"
                      ? ".pdf,.zip,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                      : undefined
              }
              onChange={handleUpload}
            />
            <Button type="button" size="sm" variant="outline" onClick={() => void loadItems()} disabled={loading}>
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Refresh
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={!uploadsEnabled || uploadState !== null}
            >
              {uploadState ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploadState ? "Uploading..." : "Upload file"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("space-y-4", compact ? "pt-4" : "")}>
        {!uploadsEnabled ? (
          <p className="text-sm text-muted-foreground">
            Media uploads are disabled in this environment. Turn on S3-backed uploads to populate the library.
          </p>
        ) : null}

        {uploadState ? (
          <p className="text-sm text-muted-foreground">Uploading {uploadState.filename}...</p>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {!loading && items.length === 0 ? (
          <div className="border border-dashed border-border/80 bg-background/70 p-5 text-sm text-muted-foreground">
            No files yet. Upload one here or from an action editor and it will show up in this library.
          </div>
        ) : null}

        <div className={cn("grid gap-3", compact ? "max-h-80 overflow-y-auto" : "md:grid-cols-2 xl:grid-cols-3")}>
          {items.map((item) => {
            const Icon = getFileIcon(item.kind);
            const absoluteProxyUrl =
              typeof window === "undefined" ? item.proxyPath : new URL(item.proxyPath, window.location.origin).toString();

            return (
              <article key={item.key} className="border border-border/80 bg-background/80">
                {item.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.proxyPath}
                    alt={item.filename}
                    className="h-40 w-full border-b border-border/70 object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center border-b border-border/70 bg-muted/40">
                    <Icon className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div className="space-y-3 p-4">
                  <div className="space-y-1">
                    <p className="truncate text-sm font-semibold">{item.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.contentType} · {formatBytes(item.size)} · {dateFormatter.format(new Date(item.lastModified))}
                    </p>
                  </div>

                  {!compact ? (
                    <Input value={absoluteProxyUrl} readOnly className="text-xs" />
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {onSelect ? (
                      <Button type="button" size="sm" onClick={() => onSelect(absoluteProxyUrl)}>
                        Use file
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await copyText(absoluteProxyUrl);
                        setCopiedKey(item.key);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      {copiedKey === item.key ? "Copied" : "Copy URL"}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" asChild>
                      <a href={item.proxyPath} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </a>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
