import { notFound } from "next/navigation";
import { PageHeading } from "@/components/PageHeading";
import { TemplateInstallPanel } from "@/components/templates/TemplateInstallPanel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthUserId } from "@/lib/clerk-auth";
import { prisma } from "@/lib/prisma";
import { getPublicTemplateBySlug } from "@/lib/templates";
import { requireAppUser } from "@/lib/user";

function formatSetupLevel(setupLevel: string | null) {
  if (!setupLevel) {
    return null;
  }

  return setupLevel.charAt(0).toUpperCase() + setupLevel.slice(1);
}

export default async function PublicTemplatePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = await getPublicTemplateBySlug(slug);

  if (!template) {
    notFound();
  }

  const authUserId = await getAuthUserId();
  let bots: Array<{ id: string; label: string }> = [];

  if (authUserId) {
    const user = await requireAppUser();
    const ownedBots = await prisma.bot.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    });
    bots = ownedBots.map((bot) => ({
      id: bot.id,
      label: `${bot.displayName ?? bot.username ?? bot.id} (${bot.status})`
    }));
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title={template.title}
        subtitle={template.source === "builtin" ? "Built by Telegraph" : `Published by ${template.authorLabel}`}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="interactive-lift">
          <CardHeader>
            <CardTitle className="font-(--font-display)">Template Snapshot</CardTitle>
            <CardDescription>
              Public installs clone these flows into your bot as disabled drafts for review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{template.source === "builtin" ? "Built-in" : "Published"}</Badge>
              <Badge variant="outline">Version {template.version}</Badge>
              <Badge variant="outline">{template.flows.length} flows</Badge>
              {template.category ? <Badge variant="outline">{template.category}</Badge> : null}
              {template.audience ? <Badge variant="outline">{template.audience}</Badge> : null}
              {template.setupLevel ? <Badge variant="outline">{formatSetupLevel(template.setupLevel)}</Badge> : null}
              {template.featured ? <Badge variant="outline">Featured</Badge> : null}
              {template.source === "user" ? (
                <Badge variant="outline">{new Date(template.publishedAt).toLocaleString()}</Badge>
              ) : null}
            </div>

            <p className="text-sm text-muted-foreground">
              {template.description ?? "No description provided for this template."}
            </p>

            {template.source === "builtin" ? (
              <div className="rounded-sm border border-border/80 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                {template.featured
                  ? "This built-in template is meant to work immediately after install. Review the copy, then enable each imported flow intentionally."
                  : "This built-in template is more specialized. Review every action and message before enabling it in a live bot."}
              </div>
            ) : null}

            <div className="space-y-3">
              {template.flows.map((flow, index) => (
                <div key={flow.id} className="rounded-sm border border-border/80 bg-background/70 px-4 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{flow.name}</p>
                      <p className="text-xs text-muted-foreground">{flow.trigger}</p>
                    </div>
                    <Badge variant="outline">#{index + 1}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="interactive-lift">
          <CardHeader>
            <CardTitle className="font-(--font-display)">Install</CardTitle>
            <CardDescription>
              Installing creates normal flows in your selected bot. They start disabled so you can review them first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TemplateInstallPanel templateId={template.id} bots={bots} signedIn={Boolean(authUserId)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
