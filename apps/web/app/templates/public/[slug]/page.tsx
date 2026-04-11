import { notFound } from "next/navigation";
import { TemplateInstallPanel } from "@/components/templates/TemplateInstallPanel";
import { Badge } from "@/components/ui/badge";
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
    <div className="public-page">
      <section className="public-hero-surface">
        <div className="grid gap-4">
          <Badge variant="secondary" className="w-fit rounded-lg">
            {template.source === "builtin" ? "Built by Telegraph" : `Published by ${template.authorLabel}`}
          </Badge>
          <h1 className="public-display max-w-[12ch]">{template.title}</h1>
          <p className="public-body">
            Public installs clone these flows into your bot as disabled drafts
            for review before anything goes live.
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="public-card">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="public-kicker">Template snapshot</p>
              <h2 className="font-display text-[1.55rem] font-semibold text-foreground">
                Review the flow pack before you install it.
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Public installs clone these flows into your bot as disabled drafts for review.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-lg">
                {template.source === "builtin" ? "Built-in" : "Published"}
              </Badge>
              <Badge variant="outline" className="rounded-lg">Version {template.version}</Badge>
              <Badge variant="outline" className="rounded-lg">{template.flows.length} flows</Badge>
              {template.category ? <Badge variant="outline" className="rounded-lg">{template.category}</Badge> : null}
              {template.audience ? <Badge variant="outline" className="rounded-lg">{template.audience}</Badge> : null}
              {template.setupLevel ? <Badge variant="outline" className="rounded-lg">{formatSetupLevel(template.setupLevel)}</Badge> : null}
              {template.featured ? <Badge variant="outline" className="rounded-lg">Featured</Badge> : null}
              {template.source === "user" ? (
                <Badge variant="outline" className="rounded-lg">
                  {new Date(template.publishedAt).toLocaleString()}
                </Badge>
              ) : null}
            </div>

            <p className="text-sm text-muted-foreground">
              {template.description ?? "No description provided for this template."}
            </p>

            {template.source === "builtin" ? (
              <div className="rounded-lg border border-border/80 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                {template.featured
                  ? "This built-in template is meant to work immediately after install. Review the copy, then enable each imported flow intentionally."
                  : "This built-in template is more specialized. Review every action and message before enabling it in a live bot."}
              </div>
            ) : null}

            <div className="space-y-3">
              {template.flows.map((flow, index) => (
                <div key={flow.id} className="rounded-lg border border-border/80 bg-background/70 px-4 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{flow.name}</p>
                      <p className="text-xs text-muted-foreground">{flow.trigger}</p>
                    </div>
                    <Badge variant="outline" className="rounded-lg">#{index + 1}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="public-band h-fit">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="public-kicker">Install</p>
              <h2 className="font-display text-[1.4rem] font-semibold text-foreground">
                Add it to your bot as a draft.
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
              Installing creates normal flows in your selected bot. They start disabled so you can review them first.
              </p>
            </div>
            <TemplateInstallPanel templateId={template.id} bots={bots} signedIn={Boolean(authUserId)} />
          </div>
        </section>
      </div>
    </div>
  );
}
