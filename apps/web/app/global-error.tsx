"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <main className="app-shell flex min-h-[60vh] items-center justify-center">
          <div className="surface-panel flex max-w-xl flex-col gap-4 px-6 py-8 text-center md:px-8">
            <p className="text-sm font-medium text-muted-foreground">Something went wrong</p>
            <h1
              className="text-3xl font-semibold tracking-[-0.04em] text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              We couldn&apos;t load this page.
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              The error has been reported to Sentry. Please try the action again.
            </p>
            <div className="flex justify-center">
              <Button onClick={() => reset()}>Try again</Button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
