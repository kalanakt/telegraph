"use client";

import { useState } from "react";
import { ANALYTICS_CONSENT_COOKIE } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function setConsent(value: "granted" | "denied") {
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=${value}; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax${
    window.location.protocol === "https:" ? "; Secure" : ""
  }`;
}

export function AnalyticsConsentBanner() {
  const [pending, setPending] = useState<"granted" | "denied" | null>(null);

  function choose(value: "granted" | "denied") {
    setPending(value);
    setConsent(value);
    window.location.reload();
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 px-4">
      <Card className="mx-auto max-w-3xl border-border/80 shadow-2xl">
        <CardHeader>
          <CardTitle className="font-(--font-display)">Analytics preferences</CardTitle>
          <CardDescription>
            Telegraph keeps analytics disabled by default. If you opt in, we will load Contentsquare only after
            consent so we can study product usage and improve the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button type="button" disabled={pending !== null} onClick={() => choose("granted")}>
            {pending === "granted" ? "Saving..." : "Allow analytics"}
          </Button>
          <Button type="button" variant="outline" disabled={pending !== null} onClick={() => choose("denied")}>
            {pending === "denied" ? "Saving..." : "Keep disabled"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
