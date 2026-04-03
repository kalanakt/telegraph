import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_MIME_TYPES, areMediaUploadsEnabled, maxSizeForMime, uploadMedia } from "@/lib/s3";
import { requireAppUser } from "@/lib/user";

export async function POST(req: NextRequest) {
  if (!areMediaUploadsEnabled()) {
    return NextResponse.json({ error: "Media uploads are disabled" }, { status: 503 });
  }

  try {
    await requireAppUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "A 'file' field is required" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 415 });
  }

  const maxBytes = maxSizeForMime(file.type);
  if (file.size > maxBytes) {
    const limitMB = maxBytes / (1024 * 1024);
    const category = file.type.split("/")[0];
    return NextResponse.json(
      { error: `${category} files must be under ${limitMB} MB (Telegram limit)` },
      { status: 413 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, key } = await uploadMedia(buffer, file.name, file.type);

    return NextResponse.json({
      url,
      key,
      contentType: file.type,
      size: file.size,
      filename: file.name
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
