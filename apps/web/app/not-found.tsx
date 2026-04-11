import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="surface-panel mx-auto mt-10 max-w-2xl space-y-3 p-8 text-center">
      <p className="text-sm text-muted-foreground">404</p>
      <h1 className="font-display text-3xl font-semibold">
        Page not found
      </h1>
      <p className="mx-auto max-w-[55ch] text-sm text-muted-foreground">
        The link you opened does not exist or has moved. Use the homepage to continue.
      </p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
