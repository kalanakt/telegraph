"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DeleteBotButton({ botId }: { botId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteBot() {
    const confirmed = window.confirm("Disconnect this bot and remove its stored credentials?");
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    const response = await fetch(`/api/bots/${botId}`, {
      method: "DELETE"
    });

    if (response.ok) {
      window.location.reload();
      return;
    }

    setIsDeleting(false);
  }

  return (
    <Button type="button" size="sm" variant="destructive" disabled={isDeleting} onClick={deleteBot}>
      {isDeleting ? "Disconnecting..." : "Disconnect"}
    </Button>
  );
}
