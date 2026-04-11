import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateTemplateButton } from "@/components/templates/CreateTemplateButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuthUserId } from "@/lib/clerk-auth";
import { groupPublicMarketplaceTemplates } from "@/lib/template-marketplace";
import { listPublicTemplates, listUserTemplates } from "@/lib/templates";
import { requireAppUser } from "@/lib/user";

function formatTriggerLabel(trigger: string) {
  return trigger.replaceAll("_", " ");
}

function formatSetupLevel(setupLevel: string | null) {
  if (!setupLevel) {
    return null;
  }

  return setupLevel.charAt(0).toUpperCase() + setupLevel.slice(1);
}

export default async function TemplatesPage() {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await requireAppUser();
  const [myTemplates, publicTemplates] = await Promise.all([
    listUserTemplates(user.id),
    listPublicTemplates()
  ]);
  const { featuredTemplates, advancedBuiltIns, publishedByUsers } = groupPublicMarketplaceTemplates(publicTemplates);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <CreateTemplateButton />
      </div>

      <Card className="interactive-lift">
        <CardHeader>
          <CardTitle className="font-(--font-display)">My Templates</CardTitle>
          <CardDescription>Draft and published templates owned by your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {myTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No templates yet. Create one to start building reusable bundles.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Flows</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p>{template.title}</p>
                        <p className="text-xs text-muted-foreground">{template.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>{template.draftFlowCount}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{template.visibility}</Badge>
                        <Badge variant={template.isPublished ? "secondary" : "outline"}>
                          {template.isPublished ? "Published" : "Draft only"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{template.updatedAt.toLocaleString()}</TableCell>
                    <TableCell>
                      <Link className="text-sm text-primary underline" href={`/templates/${template.id}`}>
                        Edit template
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="interactive-lift">
        <CardHeader>
          <CardTitle className="font-(--font-display)">Featured Built-Ins</CardTitle>
          <CardDescription>Production-ready templates that install cleanly and only need copy edits or review.</CardDescription>
        </CardHeader>
        <CardContent>
          {featuredTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No featured built-in templates are available yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Flows</TableHead>
                  <TableHead>Setup</TableHead>
                  <TableHead>Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featuredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-2">
                          <p>{template.title}</p>
                          <Badge variant="secondary">Built-in</Badge>
                          {template.category ? <Badge variant="outline">{template.category}</Badge> : null}
                        </div>
                        <p className="text-xs text-muted-foreground">{template.description ?? "No description"}</p>
                        <p className="text-xs text-muted-foreground">
                          Triggers: {template.triggers.map(formatTriggerLabel).join(" • ")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{template.audience ?? "-"}</TableCell>
                    <TableCell>{template.flowCount}</TableCell>
                    <TableCell>{formatSetupLevel(template.setupLevel) ?? "-"}</TableCell>
                    <TableCell>
                      <Link className="text-sm text-primary underline" href={`/templates/public/${template.slug}`}>
                        View template
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="interactive-lift">
        <CardHeader>
          <CardTitle className="font-(--font-display)">Advanced Built-Ins</CardTitle>
          <CardDescription>Niche or more opinionated starter templates that usually need deeper edits before going live.</CardDescription>
        </CardHeader>
        <CardContent>
          {advancedBuiltIns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No advanced built-in templates are available yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Flows</TableHead>
                  <TableHead>Setup</TableHead>
                  <TableHead>Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advancedBuiltIns.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-2">
                          <p>{template.title}</p>
                          <Badge variant="outline">Built-in</Badge>
                          {template.category ? <Badge variant="outline">{template.category}</Badge> : null}
                        </div>
                        <p className="text-xs text-muted-foreground">{template.description ?? "No description"}</p>
                        <p className="text-xs text-muted-foreground">
                          Triggers: {template.triggers.map(formatTriggerLabel).join(" • ")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{template.audience ?? "-"}</TableCell>
                    <TableCell>{template.flowCount}</TableCell>
                    <TableCell>{formatSetupLevel(template.setupLevel) ?? "-"}</TableCell>
                    <TableCell>
                      <Link className="text-sm text-primary underline" href={`/templates/public/${template.slug}`}>
                        View template
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="interactive-lift">
        <CardHeader>
          <CardTitle className="font-(--font-display)">Community Templates</CardTitle>
          <CardDescription>Published templates created by users in your workspace community.</CardDescription>
        </CardHeader>
        <CardContent>
          {publishedByUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No user-published templates have been published yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Flows</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {publishedByUsers.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p>{template.title}</p>
                        <p className="text-xs text-muted-foreground">{template.description ?? "No description"}</p>
                        <p className="text-xs text-muted-foreground">
                          Triggers: {template.triggers.map(formatTriggerLabel).join(" • ")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{template.authorLabel}</TableCell>
                    <TableCell>{template.flowCount}</TableCell>
                    <TableCell>{template.publishedAt.toLocaleString()}</TableCell>
                    <TableCell>
                      <Link className="text-sm text-primary underline" href={`/templates/public/${template.slug}`}>
                        View template
                      </Link>
                    </TableCell>
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
