import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const ext = file.name.split(".").pop() || "bin";
    const filename = `${randomUUID()}.${ext}`;

    // Path relative to public folder
    const relativePath = join("uploads", filename);
    const absolutePath = join(process.cwd(), "public", relativePath);

    // Ensure directory exists
    await mkdir(join(process.cwd(), "public", "uploads"), { recursive: true });

    // Write file
    await writeFile(absolutePath, buffer);

    return NextResponse.json({ url: `/${relativePath}`, filename });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
