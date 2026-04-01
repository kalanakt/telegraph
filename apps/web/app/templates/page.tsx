import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeading } from "@/components/PageHeading";
import { CreateTemplateButton } from "@/components/templates/CreateTemplateButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuthUserId } from "@/lib/clerk-auth";
import { listPublicTemplates, listUserTemplates } from "@/lib/templates";
import { requireAppUser } from "@/lib/user";

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

  return (
    <div className="space-y-6">
      <PageHeading
        title="Templates"
        subtitle="Bundle multiple flows into reusable templates, publish them, and install them into bots."
        action={<CreateTemplateButton />}
      />

      <Card className="interactive-lift">
        <CardHeader>
          <CardTitle className="font-[var(--font-display)]">My Templates</CardTitle>
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
          <CardTitle className="font-[var(--font-display)]">Public Marketplace</CardTitle>
          <CardDescription>Published templates that anyone can browse and install.</CardDescription>
        </CardHeader>
        <CardContent>
          {publicTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No public templates have been published yet.</p>
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
                {publicTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p>{template.title}</p>
                        <p className="text-xs text-muted-foreground">{template.description ?? "No description"}</p>
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
