"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BotActionsMenu({
  botId,
  showViewLink = false,
}: {
  botId: string;
  showViewLink?: boolean;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  async function reconnectBot() {
    setIsReconnecting(true);
    setError("");

    const response = await fetch(`/api/bots/${botId}`, {
      method: "PATCH",
    });

    if (response.ok) {
      setIsOpen(false);
      router.refresh();
      return;
    }

    const json = await response.json().catch(() => null);
    setError(json?.error ?? "Could not reconnect this bot.");
    setIsReconnecting(false);
  }

  async function deleteBot() {
    const confirmed = window.confirm(
      "Delete this bot connection and remove its stored credentials?",
    );
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError("");

    const response = await fetch(`/api/bots/${botId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setIsOpen(false);
      router.push("/bots");
      router.refresh();
      return;
    }

    const json = await response.json().catch(() => null);
    setError(json?.error ?? "Could not delete this bot.");
    setIsDeleting(false);
  }

  return (
    <div className="relative" ref={rootRef}>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label="Open bot actions"
        aria-expanded={isOpen}
        onClick={() => {
          setError("");
          setIsOpen((current) => !current);
        }}
      >
        <MoreHorizontal />
      </Button>

      {isOpen ? (
        <div
          className={cn(
            "absolute right-0 top-full z-20 mt-2 min-w-52 border border-border bg-background p-2 shadow-sm",
          )}
        >
          <div className="flex flex-col gap-1">
            {showViewLink ? (
              <Link
                className="px-3 py-2 text-sm text-foreground transition hover:bg-muted"
                href={`/bots/${botId}`}
                onClick={() => setIsOpen(false)}
              >
                Open bot
              </Link>
            ) : null}
            <button
              type="button"
              className="px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isReconnecting || isDeleting}
              onClick={reconnectBot}
            >
              {isReconnecting ? "Reconnecting..." : "Reconnect webhook"}
            </button>
            <button
              type="button"
              className="px-3 py-2 text-left text-sm text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isReconnecting || isDeleting}
              onClick={deleteBot}
            >
              {isDeleting ? "Deleting..." : "Delete bot"}
            </button>
          </div>
          {error ? (
            <p className="px-3 pt-2 text-xs text-destructive">{error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
