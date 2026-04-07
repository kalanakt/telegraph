"use client";

import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AddBotForm() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setStatus("Connecting bot...");

    const res = await fetch("/api/bots", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token })
    });

    const json = await res.json();
    if (!res.ok) {
      setStatus(json.error ?? "Could not connect this bot token.");
      setIsSaving(false);
      return;
    }

    setStatus("Bot connected and webhook configured.");
    setToken("");
    setIsSaving(false);
    window.location.reload();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-(--font-display) text-xl">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Connect Telegram Bot
        </CardTitle>
        <CardDescription>
          Add your BotFather token. We validate with `getMe` and auto-configure webhook routing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="123456:ABC-..."
            required
          />
          <Button className="w-full sm:w-auto" disabled={isSaving} type="submit">
            {isSaving ? "Connecting..." : "Connect Bot"}
          </Button>
          {status ? <Badge variant="secondary">{status}</Badge> : null}
        </form>
      </CardContent>
    </Card>
  );
}
