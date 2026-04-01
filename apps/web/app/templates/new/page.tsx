import { redirect } from "next/navigation";
import { PageHeading } from "@/components/PageHeading";
import { NewTemplateForm } from "@/components/templates/NewTemplateForm";
import { getAuthUserId } from "@/lib/clerk-auth";

export default async function NewTemplatePage() {
  const authUserId = await getAuthUserId();
  if (!authUserId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Create template"
        subtitle="Start with the template details, then move into the flow builder once the bundle is defined."
      />

      <NewTemplateForm />
    </div>
  );
}
