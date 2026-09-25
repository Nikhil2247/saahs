"use server"

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin"
import { getSession } from "@/lib/auth/session"
import { uploadToMinio } from "@/src/lib/minio"
import { revalidatePath } from "next/cache"

export type GalleryCategory = "Academic" | "Cultural" | "Sports" | "Welfare" | "Conventions"

export interface GalleryEventRow {
  id: number
  title: string
  event_date: string
  category: GalleryCategory
  location: string
  description: string
  cover_image_url: string
  photo_urls: string[]
  created_at: string
}

/** Fetch all gallery events ordered by event_date desc */
export async function getGalleryEvents(): Promise<{ success: boolean; data?: GalleryEventRow[]; error?: string }> {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from("gallery_events")
    .select("*")
    .order("event_date", { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, data: data as GalleryEventRow[] }
}

/** Create a gallery event — uploads cover + photos to MinIO */
export async function createGalleryEvent(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session) return { success: false, error: "Unauthorized" }

  const supabase = createSupabaseAdminClient()

  const title = (formData.get("title") as string)?.trim()
  const event_date = formData.get("event_date") as string
  const category = formData.get("category") as GalleryCategory
  const location = (formData.get("location") as string)?.trim()
  const description = (formData.get("description") as string)?.trim() || ""

  if (!title || !event_date || !location) {
    return { success: false, error: "Title, date and location are required." }
  }

  // Upload cover image
  const coverFile = formData.get("cover_image") as File | null
  let cover_image_url = ""
  if (coverFile && coverFile.size > 0) {
    try {
      cover_image_url = await uploadToMinio(coverFile, "gallery")
    } catch (e: any) {
      return { success: false, error: `Cover upload failed: ${e.message}` }
    }
  }

  // Upload additional photos
  const photoFiles = formData.getAll("photos") as File[]
  const photo_urls: string[] = []
  for (const photo of photoFiles) {
    if (photo && photo.size > 0) {
      try {
        const url = await uploadToMinio(photo, "gallery")
        photo_urls.push(url)
      } catch (e: any) {
        // skip failed individual photos but log
        console.error("Photo upload error:", e)
      }
    }
  }

  // If no cover but we have photos, use first photo as cover
  if (!cover_image_url && photo_urls.length > 0) {
    cover_image_url = photo_urls[0]
  }

  const { error } = await supabase.from("gallery_events").insert({
    title,
    event_date,
    category,
    location,
    description,
    cover_image_url,
    photo_urls,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath("/dashboard/admin/gallery")
  revalidatePath("/gallery")
  revalidatePath("/")
  return { success: true }
}

/** Update a gallery event — re-uploads images only if new files are provided */
export async function updateGalleryEvent(id: number, formData: FormData): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session) return { success: false, error: "Unauthorized" }

  const supabase = createSupabaseAdminClient()

  const title = (formData.get("title") as string)?.trim()
  const event_date = formData.get("event_date") as string
  const category = formData.get("category") as GalleryCategory
  const location = (formData.get("location") as string)?.trim()
  const description = (formData.get("description") as string)?.trim() || ""

  // Existing URLs (kept if no new file uploaded)
  let cover_image_url = formData.get("existing_cover_url") as string || ""
  let photo_urls: string[] = JSON.parse((formData.get("existing_photo_urls") as string) || "[]")

  const coverFile = formData.get("cover_image") as File | null
  if (coverFile && coverFile.size > 0) {
    try {
      cover_image_url = await uploadToMinio(coverFile, "gallery")
    } catch (e: any) {
      return { success: false, error: `Cover upload failed: ${e.message}` }
    }
  }

  const newPhotoFiles = formData.getAll("photos") as File[]
  for (const photo of newPhotoFiles) {
    if (photo && photo.size > 0) {
      try {
        const url = await uploadToMinio(photo, "gallery")
        photo_urls.push(url)
      } catch (e: any) {
        console.error("Photo upload error:", e)
      }
    }
  }

  const { error } = await supabase.from("gallery_events").update({
    title, event_date, category, location, description,
    cover_image_url, photo_urls,
  }).eq("id", id)

  if (error) return { success: false, error: error.message }

  revalidatePath("/dashboard/admin/gallery")
  revalidatePath("/gallery")
  revalidatePath("/")
  return { success: true }
}

/** Delete a gallery event */
export async function deleteGalleryEvent(id: number): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session) return { success: false, error: "Unauthorized" }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from("gallery_events").delete().eq("id", id)

  if (error) return { success: false, error: error.message }

  revalidatePath("/dashboard/admin/gallery")
  revalidatePath("/gallery")
  revalidatePath("/")
  return { success: true }
}
