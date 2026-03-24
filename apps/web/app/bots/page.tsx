import { redirect } from "next/navigation";
import { AddBotForm } from "@/components/AddBotForm";
import { PageHeading } from "@/components/PageHeading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isClerkConfigured } from "@/lib/auth-config";
import { getAuthUserId } from "@/lib/clerk-auth";
import { requireAppUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

function statusBadge(status: string) {
  if (status === "active") {
    return <Badge>active</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}

export default async function BotsPage() {
  if (isClerkConfigured()) {
    const userId = await getAuthUserId();
    if (!userId) {
      redirect("/sign-in");
    }
  }

  const user = await requireAppUser();

  const bots = await prisma.bot.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-5">
      <PageHeading
        title="Bots"
        subtitle="Connect and monitor Telegram bots. Each bot gets its own webhook endpoint and workflow set."
      />

      <AddBotForm />

      <Card>
        <CardHeader>
          <CardTitle className="font-[var(--font-display)]">Connected Bots</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bots.map((bot) => (
                <TableRow key={bot.id}>
                  <TableCell>{bot.displayName ?? "-"}</TableCell>
                  <TableCell>@{bot.username ?? "-"}</TableCell>
                  <TableCell>{statusBadge(bot.status)}</TableCell>
                  <TableCell>{new Date(bot.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
