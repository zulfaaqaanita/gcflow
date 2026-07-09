import { supabase } from "../lib/supabase";

export type AppRole = "siswa" | "guru";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export type MyProfile = {
  id: string; // profiles.id — used everywhere else in the app as "profileId"
  full_name: string;
  email: string;
  role: AppRole;
  rawRole: string;
  school_id: string;
  status: ApprovalStatus;
};

// Seed/legacy data uses English role names ('student', 'teacher',
// 'principal') while the app's UI logic checks for 'siswa' / 'guru'.
function normalizeRole(dbRole: string): AppRole | null {
  if (dbRole === "siswa" || dbRole === "student") return "siswa";
  if (dbRole === "guru" || dbRole === "teacher" || dbRole === "principal") return "guru";
  return null;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// Creates the Supabase Auth account only. Returns the session if one was
// issued immediately (project has "Confirm email" OFF), or null if the
// user still needs to confirm via email first.
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return { user: data.user, session: data.session };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// Returns the caller's profile regardless of approval status — the app
// decides what to render (dashboard vs "pending approval" screen) based
// on `status`. Returns null only if there's no session, no matching
// profiles row, or the role isn't recognized.
export async function getMyProfile(): Promise<MyProfile | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, school_id, status")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const role = normalizeRole(data.role);
  if (!role) return null;

  return { ...data, role, rawRole: data.role, status: data.status as ApprovalStatus };
}

// Insert the `profiles` row for the currently-authenticated user.
// `status` defaults to 'pending' (self-registration into an existing
// school) — pass 'approved' explicitly for the "new school" bootstrap
// flow, where the signer-upper IS the first admin.
export async function createMyProfile(input: {
  full_name: string;
  school_id: string;
  role: "guru" | "siswa";
  status?: ApprovalStatus;
}) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Tidak ada sesi login aktif.");

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      user_id: userData.user.id,
      email: userData.user.email,
      full_name: input.full_name,
      role: input.role,
      school_id: input.school_id,
      status: input.status ?? "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
