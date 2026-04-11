import { NextRequest, NextResponse } from "next/server";
import { areMediaUploadsEnabled, listMediaLibrary, type MediaLibraryKind } from "@/lib/s3";
import { requireAppUser } from "@/lib/user";

function parseKind(value: string | null): MediaLibraryKind | undefined {
  if (value === "image" || value === "video" || value === "document") {
    return value;
  }
  return undefined;
}

export async function GET(req: NextRequest) {
  try {
    await requireAppUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!areMediaUploadsEnabled()) {
    return NextResponse.json({
      items: [],
      uploadsEnabled: false,
    });
  }

  const kind = parseKind(req.nextUrl.searchParams.get("kind"));
  const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? "100");
  const limit = Number.isFinite(limitParam) ? limitParam : 100;

  try {
    const items = await listMediaLibrary({ kind, limit });
    return NextResponse.json({
      items,
      uploadsEnabled: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
