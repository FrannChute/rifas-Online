import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const storageRoot = path.join(process.cwd(), "storage");

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "receipt";
}

export async function savePrivateUpload(file: File, folder: string) {
  const bytes = Buffer.from(await file.arrayBuffer());

  if (bytes.length === 0) {
    throw new Error("El comprobante esta vacio.");
  }

  const safeFolder = sanitizeFilename(folder);
  const safeName = sanitizeFilename(file.name);
  const storageKey = `${safeFolder}/${randomBytes(12).toString("hex")}-${safeName}`;
  const fullPath = path.join(storageRoot, storageKey);

  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, bytes);

  return {
    storageKey,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: bytes.length,
  };
}
