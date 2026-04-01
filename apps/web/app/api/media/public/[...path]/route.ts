import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";
import { downloadMedia } from "@/lib/s3";

function joinPath(path: string[] | undefined): string {
  if (!path || path.length === 0) return "";
  return path.join("/");
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path } = await ctx.params;
  const key = joinPath(path);

  if (!key || key.includes("..") || !key.startsWith("media/")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { body, contentType, contentLength } = await downloadMedia(key);
    if (!body) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const stream =
      body instanceof Readable ? (Readable.toWeb(body) as unknown as ReadableStream) : (body as ReadableStream);

    const headers = new Headers();
    headers.set("content-type", contentType ?? "application/octet-stream");
    headers.set("cache-control", "public, max-age=31536000, immutable");
    if (typeof contentLength === "number") {
      headers.set("content-length", String(contentLength));
    }

    return new NextResponse(stream as unknown as BodyInit, { status: 200, headers });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

