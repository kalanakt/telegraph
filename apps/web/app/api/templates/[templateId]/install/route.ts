import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { installTemplateForUser } from "@/lib/templates";
import { requireAppUser } from "@/lib/user";

export async function POST(req: Request, context: { params: Promise<{ templateId: string }> }) {
  try {
    const user = await requireAppUser();
    const { templateId } = await context.params;
    const result = await installTemplateForUser(user, templateId, await req.json());

    if (result.status === "not_found") {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (result.status === "forbidden") {
      return NextResponse.json({ error: "Template is not available for installation" }, { status: 403 });
    }

    if (result.status === "upgrade_required") {
      return NextResponse.json(result, { status: 409 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const message = error instanceof Error ? error.message : "Failed to install template";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
