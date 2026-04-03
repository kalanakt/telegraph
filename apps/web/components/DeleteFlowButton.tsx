"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DeleteFlowButton({ ruleId }: { ruleId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteFlow() {
    const confirmed = window.confirm("Delete this flow and its related run history references?");
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    const response = await fetch(`/api/flows/${ruleId}`, {
      method: "DELETE"
    });

    if (response.ok) {
      window.location.reload();
      return;
    }

    setIsDeleting(false);
  }

  return (
    <Button type="button" size="sm" variant="destructive" disabled={isDeleting} onClick={deleteFlow}>
      {isDeleting ? "Deleting..." : "Delete"}
    </Button>
  );
}
