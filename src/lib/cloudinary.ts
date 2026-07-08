/**
 * src/lib/cloudinary.ts
 *
 * Cloudinary backend integration helper.
 *
 * Responsibilities:
 *  1. Configure the Cloudinary SDK with server-side credentials.
 *  2. Expose a server-only `signUploadRequest()` function that generates a
 *     short-lived signed upload signature so clients can upload directly to
 *     Cloudinary without ever touching private API keys.
 *  3. Expose a `destroyCloudinaryAsset()` function for server-side asset deletion.
 *  4. Export upload parameter presets for avatars and documents with
 *     strict file-size and mime-type constraints.
 *
 * Security model (unsigned upload is DISABLED):
 *  - Clients call the Next.js API route `/api/cloudinary/sign`.
 *  - The API route calls `signUploadRequest()` after verifying the user session.
 *  - The client posts the file directly to Cloudinary using the returned
 *    signature, timestamp, and api_key — the api_secret never leaves the server.
 *
 * @module cloudinary
 */

import { v2 as cloudinary } from "cloudinary";

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * Configure the SDK once at module load.
 * Environment variables must be set in .env.local / deployment environment:
 *  - CLOUDINARY_CLOUD_NAME
 *  - CLOUDINARY_API_KEY
 *  - CLOUDINARY_API_SECRET
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure:     true,  // Always use HTTPS delivery URLs
});

// ─── File constraint presets ──────────────────────────────────────────────────

/** Permitted image MIME types for avatar uploads */
const AVATAR_ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp", "avif"] as const;

/** Permitted document / raw MIME types for library and notice attachments */
const DOC_ALLOWED_FORMATS = [
  "pdf",
  "doc", "docx",
  "ppt", "pptx",
  "xls", "xlsx",
  "txt",
] as const;

/** Maximum file sizes in bytes */
const MAX_SIZES = {
  /** Avatar / banner images: 5 MB */
  image: 5 * 1024 * 1024,
  /** Documents (PDFs, Office files): 50 MB */
  raw:   50 * 1024 * 1024,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type UploadPreset = "avatar" | "notice_attachment" | "library_resource" | "event_banner" | "grievance_attachment" | "meeting_attachment";

export type ResourceType = "image" | "raw" | "video";

/** Payload returned to the client for performing a direct signed upload */
export interface CloudinarySignature {
  /** UNIX timestamp used in the signature */
  timestamp: number;
  /** HMAC-SHA256 signature of the upload parameters */
  signature: string;
  /** Cloudinary API key (public — safe to expose to the client) */
  api_key: string;
  /** Cloud name for constructing the upload URL */
  cloud_name: string;
  /** Cloudinary upload folder */
  folder: string;
  /** Allowed file formats string passed to Cloudinary */
  allowed_formats: string;
  /** Maximum allowed file size in bytes */
  max_file_size: number;
  /** Resource type the upload endpoint expects */
  resource_type: ResourceType;
  /** Optional eager transformation (e.g. for avatar resizing) */
  eager?: string;
}

/** Parameters describing a signed upload request */
interface SignParams {
  folder: string;
  allowed_formats: string;
  max_file_size: number;
  resource_type: ResourceType;
  eager?: string;
  /** Optional: Cloudinary public_id — use to overwrite a specific asset */
  public_id?: string;
}

// ─── Preset configurations ────────────────────────────────────────────────────

/**
 * Resolves upload constraints for a given preset.
 * Called server-side before generating the signature.
 */
function getPresetConfig(preset: UploadPreset): SignParams {
  switch (preset) {
    case "avatar":
      return {
        folder:          "saahs/avatars",
        allowed_formats: AVATAR_ALLOWED_FORMATS.join(","),
        max_file_size:   MAX_SIZES.image,
        resource_type:   "image",
        // Auto-crop and resize to a consistent 400×400 square
        eager: "c_fill,g_face,h_400,w_400,q_auto,f_auto",
      };

    case "event_banner":
      return {
        folder:          "saahs/events",
        allowed_formats: AVATAR_ALLOWED_FORMATS.join(","),
        max_file_size:   MAX_SIZES.image,
        resource_type:   "image",
        eager: "c_fill,h_630,w_1200,q_auto,f_auto",
      };

    case "notice_attachment":
      return {
        folder:          "saahs/notices",
        allowed_formats: DOC_ALLOWED_FORMATS.join(","),
        max_file_size:   MAX_SIZES.raw,
        resource_type:   "raw",
      };

    case "library_resource":
      return {
        folder:          "saahs/library",
        allowed_formats: DOC_ALLOWED_FORMATS.join(","),
        max_file_size:   MAX_SIZES.raw,
        resource_type:   "raw",
      };

    case "grievance_attachment":
      return {
        folder:          "saahs/grievances",
        allowed_formats: [...AVATAR_ALLOWED_FORMATS, ...DOC_ALLOWED_FORMATS].join(","),
        max_file_size:   MAX_SIZES.raw,
        resource_type:   "raw",
      };

    case "meeting_attachment":
      return {
        folder:          "saahs/meetings",
        allowed_formats: DOC_ALLOWED_FORMATS.join(","),
        max_file_size:   MAX_SIZES.raw,
        resource_type:   "raw",
      };

    default:
      throw new Error(`Unknown upload preset: "${preset}"`);
  }
}

// ─── Signature generator ──────────────────────────────────────────────────────

/**
 * Generates a short-lived Cloudinary signed upload payload.
 *
 * Call this from a server-only context (Server Action or Route Handler) AFTER
 * verifying the requesting user has the appropriate role.
 *
 * @param preset     - Named upload preset controlling folder, formats, and limits.
 * @param publicId   - Optional: override the generated public_id (e.g., for avatar replacement).
 *
 * @returns A `CloudinarySignature` object that can be safely sent to the client.
 *
 * @throws Error if Cloudinary credentials are not configured.
 *
 * @example
 * ```ts
 * // In a Route Handler:
 * import { signUploadRequest } from "@/lib/cloudinary";
 *
 * const signature = await signUploadRequest("avatar", `avatars/${userId}`);
 * return NextResponse.json(signature);
 * ```
 */
export async function signUploadRequest(
  preset: UploadPreset,
  publicId?: string
): Promise<CloudinarySignature> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error(
      "Cloudinary credentials are not configured. " +
      "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }

  const config = getPresetConfig(preset);
  const timestamp = Math.round(Date.now() / 1000);

  // Build the parameter set that will be signed.
  // The signature must include EXACTLY the same keys that are sent to the
  // Cloudinary upload endpoint — any mismatch will fail validation.
  const paramsToSign: Record<string, string | number> = {
    folder:          config.folder,
    allowed_formats: config.allowed_formats,
    timestamp,
  };

  if (config.eager)    paramsToSign.eager     = config.eager;
  if (publicId)        paramsToSign.public_id = publicId;

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    timestamp,
    signature,
    api_key:         process.env.CLOUDINARY_API_KEY!,
    cloud_name:      process.env.CLOUDINARY_CLOUD_NAME!,
    folder:          config.folder,
    allowed_formats: config.allowed_formats,
    max_file_size:   config.max_file_size,
    resource_type:   config.resource_type,
    ...(config.eager ? { eager: config.eager } : {}),
  };
}

// ─── Asset destroyer ──────────────────────────────────────────────────────────

/**
 * Permanently destroys a Cloudinary asset by its public_id.
 *
 * This is a server-only operation using the private API secret.
 * Call it from Server Actions or Route Handlers when deleting DB records.
 *
 * @param publicId      - Cloudinary public_id of the asset (e.g. "saahs/library/abc123").
 * @param resourceType  - Cloudinary resource type: "image" | "raw" | "video".
 *
 * @returns The Cloudinary API response.
 *
 * @throws Error if the API call fails.
 */
export async function destroyCloudinaryAsset(
  publicId: string,
  resourceType: ResourceType = "image"
): Promise<{ result: string }> {
  if (!publicId) {
    throw new Error("destroyCloudinaryAsset: publicId is required.");
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate:    true,  // Purge from Cloudinary CDN caches immediately
  });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary destroy failed for "${publicId}": ${result.result}`);
  }

  return result;
}

// ─── Upload verification helper ───────────────────────────────────────────────

/**
 * Verifies that a Cloudinary upload notification webhook signature is authentic.
 * Use this in Route Handlers that process Cloudinary upload notifications.
 *
 * @param body        - Raw request body string.
 * @param signature   - X-Cld-Signature header value.
 * @param timestamp   - X-Cld-Timestamp header value.
 *
 * @returns true if the signature is valid and recent (within 1 hour).
 */
export function verifyCloudinaryWebhook(
  body: string,
  signature: string,
  timestamp: string
): boolean {
  const ageSeconds = Math.round(Date.now() / 1000) - parseInt(timestamp, 10);

  // Reject webhooks older than 1 hour (replay attack prevention)
  if (ageSeconds > 3600) {
    return false;
  }

  const expectedSignature = cloudinary.utils.api_sign_request(
    { body, timestamp },
    process.env.CLOUDINARY_API_SECRET!
  );

  return expectedSignature === signature;
}

// Re-export the configured cloudinary instance for advanced server-side usage
export { cloudinary };
