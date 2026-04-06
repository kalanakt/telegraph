"use client";

import { CopyPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  tokens: string[];
};

function insertIntoActiveField(token: string) {
  const active = document.activeElement;
  if (!(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)) {
    return false;
  }

  const start = active.selectionStart ?? active.value.length;
  const end = active.selectionEnd ?? active.value.length;
  const nextValue = `${active.value.slice(0, start)}${token}${active.value.slice(end)}`;
  active.value = nextValue;
  active.dispatchEvent(new Event("input", { bubbles: true }));
  const cursor = start + token.length;
  active.setSelectionRange(cursor, cursor);
  active.focus();
  return true;
}

export function TokenBrowser({ tokens }: Props) {
  const uniqueTokens = Array.from(new Set(tokens)).slice(0, 24);

  if (uniqueTokens.length === 0) {
    return null;
  }

  return (
    <div className="builder-section">
      <p className="builder-kicker">Tokens</p>
      <div className="flex flex-wrap gap-2">
        {uniqueTokens.map((token) => (
          <Button
            key={token}
            type="button"
            size="sm"
            variant="outline"
            onClick={async () => {
              if (insertIntoActiveField(token)) {
                return;
              }

              try {
                await navigator.clipboard.writeText(token);
              } catch {
                // noop
              }
            }}
          >
            <CopyPlus className="h-3.5 w-3.5" />
            <span className="max-w-[220px] truncate">{token}</span>
          </Button>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Click a token to insert it into the focused field, or copy it if no field is focused.
      </p>
    </div>
  );
}
