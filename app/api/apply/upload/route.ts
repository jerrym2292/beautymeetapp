import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// NOTE: This endpoint is intentionally unauthenticated to support provider applications.
// It should only accept small image/PDF uploads.
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Basic validation
    const maxBytes = 8 * 1024 * 1024; // 8MB
    if (file.size > maxBytes) {
      return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 });
    }

    const allowed = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ]);
    if (file.type && !allowed.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop() || "bin";
    const filename = `${randomUUID()}.${ext}`;

    const relativePath = join("uploads", "applications", filename);
    const absolutePath = join(process.cwd(), "public", relativePath);

    await mkdir(join(process.cwd(), "public", "uploads", "applications"), {
      recursive: true,
    });

    await writeFile(absolutePath, buffer);

    return NextResponse.json({ url: `/${relativePath}`, filename });
  } catch (error) {
    console.error("Apply upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
