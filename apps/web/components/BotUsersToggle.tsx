"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BotUsersToggle({
  botId,
  enabled,
}: {
  botId: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  async function toggleCaptureUsers() {
    setIsUpdating(true);
    setError("");

    const response = await fetch(`/api/bots/${botId}/settings`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        captureUsersEnabled: !enabled,
      }),
    });

    if (response.ok) {
      router.refresh();
      return;
    }

    const json = await response.json().catch(() => null);
    setError(json?.error ?? "Could not update this bot setting.");
    setIsUpdating(false);
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        size="sm"
        variant={enabled ? "secondary" : "outline"}
        disabled={isUpdating}
        onClick={toggleCaptureUsers}
      >
        {isUpdating
          ? "Updating..."
          : enabled
            ? "Turn off save users"
            : "Turn on save users"}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
