import { supabase } from "../lib/supabase";

// School-member management — for guru/admin reviewing who's asked to
// join their school. RLS already restricts these to staff of the same
// school (see approval_workflow_migration.sql).

export async function getPendingProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function approveProfile(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ status: "approved" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function rejectProfile(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ status: "rejected" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Lets the currently-logged-in user edit their own display name.
// Requires the "self update profile" RLS policy (see the SQL snippet
// provided alongside this fix) — without it, this call gets silently
// blocked by Postgres RLS.
export async function updateMyProfile(id: string, updates: { full_name: string }) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Uploads a profile photo to the "avatars" storage bucket and saves the
// public URL onto the caller's profiles row. Requires:
// 1. A public bucket named "avatars" in Supabase Storage.
// 2. A storage policy letting a user upload/update objects under a path
//    prefixed with their own profileId (see the SQL/dashboard steps
//    provided alongside this feature).
export async function uploadAvatar(profileId: string, file: File) {
  const fileExt = file.name.split(".").pop();
  const filePath = `${profileId}/avatar.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true, cacheControl: "3600" });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
  // Cache-bust so the new photo shows immediately instead of the browser
  // reusing a cached image at the same URL.
  const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

  const { data, error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", profileId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
// List of approved guru/teacher/principal in a school — used to populate
// the "Guru BK Utama" (counselor) dropdown when editing a student record.
export async function getTeachersInSchool(schoolId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("school_id", schoolId)
    .in("role", ["guru", "teacher", "principal"])
    .eq("status", "approved")
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data;
}
