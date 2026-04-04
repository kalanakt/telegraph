import { redirect } from "next/navigation";
import { AddBotForm } from "@/components/AddBotForm";
import { DeleteBotButton } from "@/components/DeleteBotButton";
import { ReconnectBotButton } from "@/components/ReconnectBotButton";
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
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await requireAppUser();

  const bots = await prisma.bot.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <AddBotForm />

      <Card>
        <CardHeader>
          <CardTitle className="font-[var(--font-display)]">
            Connected Bots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bots.map((bot) => (
                <TableRow key={bot.id}>
                  <TableCell>{bot.displayName ?? "-"}</TableCell>
                  <TableCell>@{bot.username ?? "-"}</TableCell>
                  <TableCell>{statusBadge(bot.status)}</TableCell>
                  <TableCell>
                    {new Date(bot.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <ReconnectBotButton botId={bot.id} />
                      <DeleteBotButton botId={bot.id} />
                    </div>
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
