import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteFlowButton } from "@/components/DeleteFlowButton";
import { FlowStatusToggle } from "@/components/FlowStatusToggle";
import { FlowBuilderStudio } from "@/components/flow-builder";
import { Badge } from "@/components/ui/badge";
import {
  Card,
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
import { coerceFlowDefinition } from "@/lib/flow-builder";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/user";
import type { TriggerType } from "@telegram-builder/shared";

export default async function FlowsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; installed?: string }>;
}) {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await requireAppUser();
  const params = await searchParams;

  const [bots, rules] = await Promise.all([
    prisma.bot.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.workflowRule.findMany({
      where: { userId: user.id },
      include: { bot: true, webhookEndpoint: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const flowRules = rules
    .map((rule) => {
      const flowDefinition = coerceFlowDefinition(rule.flowDefinition);
      if (!flowDefinition) {
        return null;
      }

      const actionCount = flowDefinition.nodes.filter(
        (node) => node.type === "action",
      ).length;
      const conditionCount = flowDefinition.nodes.filter(
        (node) => node.type === "condition",
      ).length;

      return {
        id: rule.id,
        botId: rule.botId,
        name: rule.name,
        trigger: rule.trigger as TriggerType,
        enabled: rule.enabled,
        flowDefinition,
        webhookEndpoint: rule.webhookEndpoint,
        actionCount,
        conditionCount,
        botLabel: rule.bot.username
          ? `@${rule.bot.username}`
          : (rule.bot.displayName ?? "-"),
      };
    })
    .filter((rule): rule is NonNullable<typeof rule> => Boolean(rule));

  return (
    <div className="space-y-6">
      {params.installed === "1" ? (
        <Card className="interactive-lift">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">
              Template installed successfully. Imported flows start disabled so
              you can review and enable them intentionally.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="app-breakout">
        <FlowBuilderStudio
          bots={bots.map((bot) => ({
            id: bot.id,
            label: `${bot.displayName ?? bot.username ?? bot.id} (${bot.status})`,
          }))}
          rules={flowRules.map((rule) => ({
            id: rule.id,
            botId: rule.botId,
            name: rule.name,
            trigger: rule.trigger as TriggerType,
            flowDefinition: rule.flowDefinition,
            webhookEndpoint: rule.webhookEndpoint
              ? {
                  endpointId: rule.webhookEndpoint.endpointId,
                  signatureHeaderName: rule.webhookEndpoint.signatureHeaderName,
                  enabled: rule.webhookEndpoint.enabled,
                }
              : null,
          }))}
          initialRuleId={params.edit}
        />
      </div>

      <Card className="interactive-lift">
        <CardHeader>
          <CardTitle className="font-(--font-display)">Active Flows</CardTitle>
          <CardDescription>
            Recent saved flows for your connected bots.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flow</TableHead>
                <TableHead>Bot</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Edit</TableHead>
                <TableHead>Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flowRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>{rule.name}</TableCell>
                  <TableCell>{rule.botLabel}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{rule.trigger}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={rule.enabled ? "secondary" : "outline"}>
                        {rule.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <FlowStatusToggle
                        ruleId={rule.id}
                        enabled={rule.enabled}
                      />
                    </div>
                  </TableCell>
                  <TableCell>{rule.conditionCount}</TableCell>
                  <TableCell>{rule.actionCount}</TableCell>
                  <TableCell>
                    <Link
                      className="text-sm text-primary underline"
                      href={`/flows?edit=${rule.id}`}
                    >
                      Edit flow
                    </Link>
                  </TableCell>
                  <TableCell>
                    <DeleteFlowButton ruleId={rule.id} />
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
