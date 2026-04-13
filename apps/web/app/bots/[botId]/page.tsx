import { notFound, redirect } from "next/navigation";
import { BotActionsMenu } from "@/components/BotActionsMenu";
import { BotStatusBadge } from "@/components/BotStatusBadge";
import { CryptoPayConnectionCard } from "@/components/CryptoPayConnectionCard";
import { BotUsersToggle } from "@/components/BotUsersToggle";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAuthUserId } from "@/lib/clerk-auth";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/user";

function formatFullName(botUser: {
  firstName: string | null;
  lastName: string | null;
}) {
  const parts = [botUser.firstName, botUser.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "-";
}

export default async function BotDetailPage({
  params,
}: {
  params: Promise<{ botId: string }>;
}) {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await requireAppUser();
  const { botId } = await params;

  const bot = await prisma.bot.findFirst({
    where: {
      id: botId,
      userId: user.id,
    },
    include: {
      botUsers: {
        orderBy: {
          lastSeenAt: "desc",
        },
      },
      _count: {
        select: {
          botUsers: true,
        },
      },
    },
  });

  if (!bot) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card className="interactive-lift">
        <CardHeader>
          <CardTitle className="font-display">
            Bot overview
          </CardTitle>
          <CardDescription>
            Bot-specific settings and saved-user capture for this connection.
          </CardDescription>
          <CardAction>
            <div className="flex items-center gap-2">
              <BotStatusBadge status={bot.status} />
              <BotActionsMenu botId={bot.id} />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">
              Username
            </p>
            <p className="text-sm">{bot.username ? `@${bot.username}` : "-"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">
              Created
            </p>
            <p className="text-sm">{new Date(bot.createdAt).toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">
              Saved users
            </p>
            <p className="text-sm">{bot._count.botUsers}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase text-muted-foreground">
                Save users
              </p>
              <Badge variant={bot.captureUsersEnabled ? "secondary" : "outline"}>
                {bot.captureUsersEnabled ? "On" : "Off"}
              </Badge>
            </div>
            <BotUsersToggle
              botId={bot.id}
              enabled={bot.captureUsersEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <CryptoPayConnectionCard
        botId={bot.id}
        connected={Boolean(bot.encryptedCryptoPayToken)}
        appId={bot.cryptoPayAppId}
        appName={bot.cryptoPayAppName}
        customWebhookUrl={bot.cryptoPayCustomWebhookUrl}
        useTestnet={bot.cryptoPayUseTestnet}
        connectedAt={bot.cryptoPayConnectedAt?.toISOString() ?? null}
      />

      <Card className="interactive-lift">
        <CardHeader>
          <CardTitle className="font-display">Users</CardTitle>
          <CardDescription>
            Saved users are unique to this bot and start collecting only after
            save-users is turned on.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bot.botUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No saved users yet. Turn on save users and wait for people to
              interact with this bot.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Telegram ID</TableHead>
                  <TableHead>Full name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>First seen</TableHead>
                  <TableHead>Last seen</TableHead>
                  <TableHead>Total interactions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bot.botUsers.map((botUser) => (
                  <TableRow key={botUser.id}>
                    <TableCell>{botUser.telegramUserId.toString()}</TableCell>
                    <TableCell>{formatFullName(botUser)}</TableCell>
                    <TableCell>
                      {botUser.username ? `@${botUser.username}` : "-"}
                    </TableCell>
                    <TableCell>{botUser.languageCode ?? "-"}</TableCell>
                    <TableCell>
                      {new Date(botUser.firstSeenAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(botUser.lastSeenAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{botUser.interactionCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
