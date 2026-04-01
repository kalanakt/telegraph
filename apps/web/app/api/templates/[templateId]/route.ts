import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { deleteTemplate, getTemplateForUser, updateTemplate } from "@/lib/templates";
import { requireAppUser } from "@/lib/user";

function jsonError(error: unknown, fallback: string) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(_: Request, context: { params: Promise<{ templateId: string }> }) {
  try {
    const user = await requireAppUser();
    const { templateId } = await context.params;
    const template = await getTemplateForUser(user.id, templateId);

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ templateId: string }> }) {
  try {
    const user = await requireAppUser();
    const { templateId } = await context.params;
    const template = await updateTemplate(user.id, templateId, await req.json());

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return jsonError(error, "Failed to update template");
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ templateId: string }> }) {
  try {
    const user = await requireAppUser();
    const { templateId } = await context.params;
    const deleted = await deleteTemplate(user.id, templateId);

    if (!deleted) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
