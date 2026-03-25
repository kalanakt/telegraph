import Link from "next/link";
import { redirect } from "next/navigation";
import { FlowBuilderStudio } from "@/components/flow-builder";
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
import { coerceFlowDefinition } from "@/lib/flow-builder";
import { requireAppUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export default async function RulesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  if (isClerkConfigured()) {
    const userId = await getAuthUserId();
    if (!userId) {
      redirect("/sign-in");
    }
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
      include: { bot: true },
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
        trigger: rule.trigger,
        flowDefinition,
        actionCount,
        conditionCount,
        botLabel: rule.bot.username
          ? `@${rule.bot.username}`
          : (rule.bot.displayName ?? "-"),
      };
    })
    .filter((rule): rule is NonNullable<typeof rule> => Boolean(rule));

  return (
    <div className="space-y-5">
      <FlowBuilderStudio
        bots={bots.map((bot) => ({
          id: bot.id,
          label: `${bot.displayName ?? bot.username ?? bot.id} (${bot.status})`,
        }))}
        rules={flowRules.map((rule) => ({
          id: rule.id,
          botId: rule.botId,
          name: rule.name,
          trigger: rule.trigger,
          flowDefinition: rule.flowDefinition,
        }))}
        initialRuleId={params.edit}
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-[var(--font-display)]">
            Active Builders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Builder</TableHead>
                <TableHead>Bot</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Edit</TableHead>
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
                  <TableCell>{rule.conditionCount}</TableCell>
                  <TableCell>{rule.actionCount}</TableCell>
                  <TableCell>
                    <Link
                      className="text-sm text-primary underline"
                      href={`/builder?edit=${rule.id}`}
                    >
                      Edit Builder
                    </Link>
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
