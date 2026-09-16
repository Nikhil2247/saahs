/**
 * app/actions/uploads.ts
 *
 * Server Actions — file uploads via MinIO (the only upload backend used by
 * this app; Cloudinary has been removed).
 */

"use server";

import { getSession } from "@/lib/auth/session";
import { uploadToMinio } from "@/src/lib/minio";
import type { ActionResult } from "@/app/actions/auth";

/** Uploads the onboarding ID card image for the current signed-in user. */
export async function uploadIdCardImage(file: File): Promise<ActionResult<{ url: string }>> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "You must be signed in to upload a file." };
  }

  if (!file || file.size === 0) {
    return { success: false, error: "No file selected. Please choose an image." };
  }

  // Accept any common image format. Some mobile browsers (notably iOS Safari
  // for HEIC/HEIF photos) don't set a reliable `file.type`, so fall back to
  // the file extension when the MIME type is missing or generic.
  const IMAGE_EXTENSION_RE =
    /\.(jpe?g|jfif|pjpeg|pjp|png|gif|webp|bmp|heic|heif|avif|tiff?|svg|ico)$/i;
  const looksLikeImage =
    file.type.startsWith("image/") ||
    ((file.type === "" || file.type === "application/octet-stream") &&
      IMAGE_EXTENSION_RE.test(file.name));

  if (!looksLikeImage) {
    return {
      success: false,
      error: `"${file.name}" is not a supported image. Please upload a JPG, JPEG, PNG, GIF, WEBP, BMP, HEIC, HEIF, AVIF, TIFF, or SVG file.`,
    };
  }

  // 1 MB limit
  const MAX_SIZE_BYTES = 1 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      success: false,
      error: `"${file.name}" is too large (${sizeMB} MB). Maximum allowed size is 1 MB. Please compress or resize the image and try again.`,
    };
  }

  try {
    const url = await uploadToMinio(file, "id_cards");
    return { success: true, data: { url } };
  } catch (err) {
    console.error("[uploads/id_card] Upload failed:", err);
    return { success: false, error: "Upload failed. Please check your connection and try again." };
  }
}

