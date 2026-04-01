import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/user";
import { unpublishTemplate } from "@/lib/templates";

export async function POST(_: Request, context: { params: Promise<{ templateId: string }> }) {
  try {
    const user = await requireAppUser();
    const { templateId } = await context.params;
    const unpublished = await unpublishTemplate(user.id, templateId);

    if (!unpublished) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ unpublished: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
