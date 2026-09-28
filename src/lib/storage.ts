/**
 * Storage abstraction layer.
 *
 * The app talks to `uploadFile()` / `deleteFile()` only — it never imports
 * a specific storage SDK directly outside this file. Today the only
 * implemented provider is Vercel Blob (zero-config on Vercel: just add the
 * Blob store to your project and `BLOB_READ_WRITE_TOKEN` is injected
 * automatically). To move to S3, Cloudinary, R2, or anything else later,
 * add a case below and flip `STORAGE_PROVIDER` in env — nothing calling
 * this module needs to change.
 */

export type UploadResult = { url: string; pathname: string };

const PROVIDER = process.env.STORAGE_PROVIDER || "vercel-blob";

export async function uploadFile(file: File): Promise<UploadResult> {
  switch (PROVIDER) {
    case "vercel-blob":
      return uploadToVercelBlob(file);
    // case "s3":
    //   return uploadToS3(file);
    // case "cloudinary":
    //   return uploadToCloudinary(file);
    default:
      throw new Error(`Unknown STORAGE_PROVIDER: ${PROVIDER}`);
  }
}

export async function deleteFile(url: string): Promise<void> {
  switch (PROVIDER) {
    case "vercel-blob":
      return deleteFromVercelBlob(url);
    default:
      throw new Error(`Unknown STORAGE_PROVIDER: ${PROVIDER}`);
  }
}

// ---------------- Vercel Blob ----------------

async function uploadToVercelBlob(file: File): Promise<UploadResult> {
  const { put } = await import("@vercel/blob");
  const ext = file.name.split(".").pop() || "jpg";
  const key = `listings/${crypto.randomUUID()}.${ext}`;

  const blob = await put(key, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type || undefined,
  });

  return { url: blob.url, pathname: blob.pathname };
}

async function deleteFromVercelBlob(url: string): Promise<void> {
  const { del } = await import("@vercel/blob");
  await del(url);
}

// ---------------- Validation shared by every provider ----------------

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Only JPG, PNG, WebP, AVIF or GIF images are allowed.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Images must be under 8MB.";
  }
  return null;
}
