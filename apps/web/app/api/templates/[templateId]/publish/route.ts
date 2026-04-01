import { NextResponse } from "next/server";
import { publishTemplate } from "@/lib/templates";
import { requireAppUser } from "@/lib/user";

export async function POST(_: Request, context: { params: Promise<{ templateId: string }> }) {
  try {
    const user = await requireAppUser();
    const { templateId } = await context.params;
    const result = await publishTemplate(user.id, templateId);

    if (!result) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ published: true, ...result });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : "Failed to publish template";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
