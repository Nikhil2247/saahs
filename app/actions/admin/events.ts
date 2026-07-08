"use server"

import { createSupabaseServerClient } from "@/src/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { uploadToMinio } from "@/src/lib/minio"

export async function createEvent(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const event_type = formData.get("event_type") as string;
  const start_time = formData.get("start_time") as string;
  const location = formData.get("location") as string;

  const image_file = formData.get("image_file") as File;
  let image_url = null;
  if (image_file && image_file.size > 0) {
    try {
      image_url = await uploadToMinio(image_file, 'events');
    } catch (err: any) {
      return { success: false, error: `Upload failed: ${err.message}` };
    }
  }

  let category = 'Academic';
  if (['Academic', 'Cultural', 'Sports', 'Literary', 'Workshops', 'Conferences'].includes(event_type)) {
    category = event_type;
  } else {
    if (event_type === 'Workshop') category = 'Workshops';
    if (event_type === 'Seminar') category = 'Academic';
    if (event_type === 'General') category = 'Academic';
  }

  const { error } = await supabase.from("events").insert({
    title,
    description,
    category,
    schedule: new Date(start_time).toISOString(),
    venue: location,
    banner_url: image_url,
    past_archive: false
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/admin/events");
  revalidatePath("/"); // Update home page widget
  return { success: true };
}

export async function updateEvent(id: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const event_type = formData.get("event_type") as string;
  const start_time = formData.get("start_time") as string;
  const location = formData.get("location") as string;

  const image_file = formData.get("image_file") as File;
  let image_url = formData.get("image_url") as string || null;
  if (image_file && image_file.size > 0) {
    try {
      image_url = await uploadToMinio(image_file, 'events');
    } catch (err: any) {
      return { success: false, error: `Upload failed: ${err.message}` };
    }
  }

  let category = 'Academic';
  if (['Academic', 'Cultural', 'Sports', 'Literary', 'Workshops', 'Conferences'].includes(event_type)) {
    category = event_type;
  } else {
    if (event_type === 'Workshop') category = 'Workshops';
    if (event_type === 'Seminar') category = 'Academic';
    if (event_type === 'General') category = 'Academic';
  }

  const { error } = await supabase.from("events").update({
    title,
    description,
    category,
    schedule: new Date(start_time).toISOString(),
    venue: location,
    banner_url: image_url,
  }).eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/admin/events");
  revalidatePath("/");
  return { success: true };
}

export async function deleteEvent(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/admin/events");
  revalidatePath("/");
  return { success: true };
}
