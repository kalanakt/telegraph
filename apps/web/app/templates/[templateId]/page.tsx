import { notFound, redirect } from "next/navigation";
import { TemplateBuilderStudio } from "@/components/templates/TemplateBuilderStudio";
import { getAuthUserId } from "@/lib/clerk-auth";
import { prisma } from "@/lib/prisma";
import { getTemplateForUser } from "@/lib/templates";
import { requireAppUser } from "@/lib/user";

export default async function TemplateEditorPage({
  params
}: {
  params: Promise<{ templateId: string }>;
}) {
  const authUserId = await getAuthUserId();
  if (!authUserId) {
    redirect("/sign-in");
  }

  const user = await requireAppUser();
  const { templateId } = await params;

  const [template, bots] = await Promise.all([
    getTemplateForUser(user.id, templateId),
    prisma.bot.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    })
  ]);

  if (!template) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <TemplateBuilderStudio
        template={{
          id: template.id,
          title: template.title,
          slug: template.slug,
          description: template.description,
          visibility: template.visibility,
          isPublished: template.isPublished,
          draftFlows: template.draftFlows.map((flow) => ({
            id: flow.id,
            name: flow.name,
            trigger: flow.trigger,
            flowDefinition: flow.flowDefinition,
            sortOrder: flow.sortOrder
          })),
          versions: template.versions.map((version) => ({
            id: version.id,
            version: version.version,
            title: version.title,
            description: version.description,
            createdAt: version.createdAt.toISOString()
          }))
        }}
        bots={bots.map((bot) => ({
          id: bot.id,
          label: `${bot.displayName ?? bot.username ?? bot.id} (${bot.status})`
        }))}
      />
    </div>
  );
}
