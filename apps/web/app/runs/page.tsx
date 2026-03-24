import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isClerkConfigured } from "@/lib/auth-config";
import { getAuthUserId } from "@/lib/clerk-auth";
import { requireAppUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

function runStatusBadge(status: string) {
  if (status === "succeeded") {
    return <Badge>{status}</Badge>;
  }

  if (status.includes("fail")) {
    return <Badge variant="outline">{status}</Badge>;
  }

  return <Badge variant="secondary">{status}</Badge>;
}

export default async function RunsPage() {
  if (isClerkConfigured()) {
    const userId = await getAuthUserId();
    if (!userId) {
      redirect("/sign-in");
    }
  }

  const user = await requireAppUser();

  const runs = await prisma.workflowRun.findMany({
    where: { userId: user.id },
    include: {
      actionRuns: true,
      rule: { select: { name: true } },
      bot: { select: { username: true, displayName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 150,
  });

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="font-[var(--font-display)]">
            Recent Executions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Bot</TableHead>
                <TableHead>Rule</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action Statuses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>
                    {new Date(run.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {run.bot.username
                      ? `@${run.bot.username}`
                      : (run.bot.displayName ?? "-")}
                  </TableCell>
                  <TableCell>{run.rule.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{run.trigger}</Badge>
                  </TableCell>
                  <TableCell>{runStatusBadge(run.status)}</TableCell>
                  <TableCell>
                    {run.actionRuns
                      .map(
                        (a) =>
                          `${a.type}:${a.status}${a.lastError ? ` (${a.lastError})` : ""}`,
                      )
                      .join(", ")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
