"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CreateTemplateButton() {
  return (
    <Button asChild type="button">
      <Link href="/templates/new">Create template</Link>
    </Button>
  );
}
