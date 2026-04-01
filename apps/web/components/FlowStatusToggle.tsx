"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function FlowStatusToggle({
  ruleId,
  enabled
}: {
  ruleId: string;
  enabled: boolean;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  async function toggleStatus() {
    setIsUpdating(true);

    const response = await fetch(`/api/flows/${ruleId}/status`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ enabled: !enabled })
    });

    if (response.ok) {
      window.location.reload();
      return;
    }

    setIsUpdating(false);
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={toggleStatus} disabled={isUpdating}>
      {isUpdating ? "Updating..." : enabled ? "Disable" : "Enable"}
    </Button>
  );
}
