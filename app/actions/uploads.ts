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
    return { success: false, error: "No file provided." };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "Only JPEG, PNG or WebP images are allowed." };
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { success: false, error: "File size must be less than 5MB." };
  }

  try {
    const url = await uploadToMinio(file, "id_cards");
    return { success: true, data: { url } };
  } catch (err) {
    console.error("[uploads/id_card] Upload failed:", err);
    return { success: false, error: "Failed to upload ID card. Please try again." };
  }
}
