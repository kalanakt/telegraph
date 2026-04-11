import { redirect } from "next/navigation";
import { NewTemplateForm } from "@/components/templates/NewTemplateForm";
import { getAuthUserId } from "@/lib/clerk-auth";

export default async function NewTemplatePage() {
  const authUserId = await getAuthUserId();
  if (!authUserId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <NewTemplateForm />
    </div>
  );
}
