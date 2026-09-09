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
