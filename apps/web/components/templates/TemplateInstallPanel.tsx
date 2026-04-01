"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BotOption = {
  id: string;
  label: string;
};

type Props = {
  templateId: string;
  bots: BotOption[];
  signedIn: boolean;
  onBeforeInstall?: () => Promise<boolean>;
};

export function TemplateInstallPanel({ templateId, bots, signedIn, onBeforeInstall }: Props) {
  const [botId, setBotId] = useState(bots[0]?.id ?? "");
  const [isInstalling, setIsInstalling] = useState(false);
  const [status, setStatus] = useState("");
  const [upgradeDetails, setUpgradeDetails] = useState<{
    templateFlowCount: number;
    remainingRuleCapacity: number;
  } | null>(null);

  const canInstall = useMemo(() => signedIn && bots.length > 0 && botId.length > 0, [botId, bots.length, signedIn]);

  async function installTemplate() {
    if (!canInstall) {
      return;
    }

    setUpgradeDetails(null);
    setIsInstalling(true);

    if (onBeforeInstall) {
      const ready = await onBeforeInstall();
      if (!ready) {
        setIsInstalling(false);
        return;
      }
    }

    const response = await fetch(`/api/templates/${templateId}/install`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ botId })
    });

    const json = await response.json();

    if (response.status === 409 && json.upgradeRequired) {
      setUpgradeDetails({
        templateFlowCount: Number(json.templateFlowCount ?? 0),
        remainingRuleCapacity: Number(json.remainingRuleCapacity ?? 0)
      });
      setStatus("This template needs more flow capacity than your current plan allows.");
      setIsInstalling(false);
      return;
    }

    if (!response.ok) {
      setStatus(json.error ?? "Could not install template.");
      setIsInstalling(false);
      return;
    }

    const nextRuleId = typeof json.firstRuleId === "string" ? json.firstRuleId : "";
    const params = new URLSearchParams({
      installed: "1"
    });

    if (nextRuleId) {
      params.set("edit", nextRuleId);
    }

    window.location.href = `/flows?${params.toString()}`;
  }

  if (!signedIn) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Sign in to install this template into one of your bots.
        </p>
        <Button asChild type="button" size="sm">
          <Link href="/sign-in">Sign in to install</Link>
        </Button>
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Add a bot first, then come back to install this template.
        </p>
        <Button asChild type="button" size="sm" variant="outline">
          <Link href="/bots">Go to bots</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="builder-label">
        <span>Target bot</span>
        <Select
          value={botId}
          onValueChange={setBotId}
        >
          <SelectTrigger className="builder-field builder-field-soft">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {bots.map((bot) => (
              <SelectItem key={bot.id} value={bot.id}>
                {bot.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="button" onClick={installTemplate} disabled={!canInstall || isInstalling}>
        {isInstalling ? "Installing..." : "Install template"}
      </Button>

      {status ? (
        <Badge variant="outline" className="border border-border/80 bg-background/70 text-foreground/88">
          {status}
        </Badge>
      ) : null}

      {upgradeDetails ? (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Template flows: {upgradeDetails.templateFlowCount}. Remaining capacity on this bot:{" "}
            {upgradeDetails.remainingRuleCapacity}.
          </p>
          <Button asChild type="button" size="sm" variant="outline">
            <Link href="/pricing">Upgrade plan</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
