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

  // Accept any image format
  if (!file.type.startsWith("image/")) {
    return {
      success: false,
      error: `"${file.name}" is not an image. Please upload a JPG, PNG, HEIC, or any other image format.`,
    };
  }

  // 1 MB limit
  const MAX_SIZE_BYTES = 1 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      success: false,
      error: `File is too large (${sizeMB} MB). Maximum allowed size is 1 MB. Please compress or resize the image and try again.`,
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

