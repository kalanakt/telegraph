import { NextResponse } from "next/server";
import { listPublicTemplates } from "@/lib/templates";

export async function GET() {
  const templates = await listPublicTemplates();
  return NextResponse.json({ templates });
}
