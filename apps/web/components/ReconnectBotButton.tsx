"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ReconnectBotButton({ botId }: { botId: string }) {
  const router = useRouter();
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState("");

  async function reconnectBot() {
    setIsReconnecting(true);
    setError("");

    const response = await fetch(`/api/bots/${botId}`, {
      method: "PATCH"
    });

    if (response.ok) {
      router.refresh();
      return;
    }

    const json = await response.json().catch(() => null);
    setError(json?.error ?? "Could not reconnect this bot.");
    setIsReconnecting(false);
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
      <Button type="button" size="sm" variant="outline" disabled={isReconnecting} onClick={reconnectBot}>
        {isReconnecting ? "Reconnecting..." : "Reconnect"}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
