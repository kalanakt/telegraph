import Link from "next/link";
import { redirect } from "next/navigation";
import { AddBotForm } from "@/components/AddBotForm";
import { BotActionsMenu } from "@/components/BotActionsMenu";
import { BotStatusBadge } from "@/components/BotStatusBadge";
import { PageHeading } from "@/components/PageHeading";
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

export default async function BotsPage() {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await requireAppUser();

  const bots = await prisma.bot.findMany({
    where: { userId: user.id },
    include: {
      _count: {
        select: {
          botUsers: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <PageHeading
        title="Bots"
        subtitle="Connect bots, manage webhook health, and open each bot's saved users section."
      />
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
                <TableHead>Saved users</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bots.map((bot) => (
                <TableRow key={bot.id}>
                  <TableCell>
                    <Link className="text-sm text-primary underline" href={`/bots/${bot.id}`}>
                      {bot.displayName ?? bot.username ?? bot.id}
                    </Link>
                  </TableCell>
                  <TableCell>{bot.username ? `@${bot.username}` : "-"}</TableCell>
                  <TableCell>
                    <BotStatusBadge status={bot.status} />
                  </TableCell>
                  <TableCell>{bot._count.botUsers}</TableCell>
                  <TableCell>
                    {new Date(bot.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <BotActionsMenu botId={bot.id} showViewLink />
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
