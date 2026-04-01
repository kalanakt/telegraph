import { notFound } from "next/navigation";
import { PageHeading } from "@/components/PageHeading";
import { TemplateInstallPanel } from "@/components/templates/TemplateInstallPanel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthUserId } from "@/lib/clerk-auth";
import { prisma } from "@/lib/prisma";
import { getPublicTemplateBySlug } from "@/lib/templates";
import { requireAppUser } from "@/lib/user";

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
        subtitle={`Published by ${template.authorLabel}`}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="interactive-lift">
          <CardHeader>
            <CardTitle className="font-[var(--font-display)]">Template Snapshot</CardTitle>
            <CardDescription>
              Public installs clone these flows into your bot as disabled drafts for review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Version {template.version}</Badge>
              <Badge variant="outline">{template.flows.length} flows</Badge>
              <Badge variant="outline">{new Date(template.publishedAt).toLocaleString()}</Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              {template.description ?? "No description provided for this template."}
            </p>

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
            <CardTitle className="font-[var(--font-display)]">Install</CardTitle>
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
