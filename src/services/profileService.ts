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
