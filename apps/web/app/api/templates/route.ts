import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createTemplate, listUserTemplates } from "@/lib/templates";
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

export async function GET() {
  try {
    const user = await requireAppUser();
    const templates = await listUserTemplates(user.id);
    return NextResponse.json({ templates });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAppUser();
    const template = await createTemplate(user.id, await req.json());
    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return jsonError(error, "Failed to create template");
  }
}
