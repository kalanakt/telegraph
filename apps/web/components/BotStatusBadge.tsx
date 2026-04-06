import { Badge } from "@/components/ui/badge";

export function BotStatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return <Badge>active</Badge>;
  }

  return <Badge variant="secondary">{status}</Badge>;
}
