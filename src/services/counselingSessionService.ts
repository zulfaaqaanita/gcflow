import { supabase } from "../lib/supabase";

// NOTE: the `!fkey_name` hints below are guesses based on Postgres/Supabase's
// default constraint naming convention (`<table>_<column>_fkey`). If you get
// an error like "Could not find a relationship" when running this, open
// Supabase Studio > Database > Tables > counseling_sessions and check the
// actual foreign key constraint names, then update the hints here.

export async function getCounselingSessions() {
  const { data, error } = await supabase
    .from("counseling_sessions")
    .select(`
      id,
      session_date,
      location,
      notes,
      status,
      student_id,
      counselor_id,
      students!counseling_sessions_student_id_fkey (
        id,
        class_name,
        profiles!students_profile_id_fkey ( full_name )
      ),
      counselor:profiles!counseling_sessions_counselor_id_fkey ( full_name )
    `)
    .order("session_date", { ascending: true });

  if (error) throw error;

  return data;
}

// Get sessions for one specific student (use this once real auth gives you
// the logged-in student's `students.id`).
export async function getCounselingSessionsForStudent(studentId: string) {
  const { data, error } = await supabase
    .from("counseling_sessions")
    .select(`
      id,
      session_date,
      location,
      notes,
      status,
      counselor:profiles!counseling_sessions_counselor_id_fkey ( full_name )
    `)
    .eq("student_id", studentId)
    .order("session_date", { ascending: true });

  if (error) throw error;

  return data;
}

export async function createCounselingSession(input: {
  student_id: string;
  counselor_id: string;
  school_id: string;
  session_date: string; // ISO timestamp
  location: string;
  notes: string;
}) {
  const { data, error } = await supabase
    .from("counseling_sessions")
    .insert({ ...input, status: "scheduled" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCounselingSessionStatus(
  id: string,
  status: "scheduled" | "completed" | "cancelled"
) {
  const { data, error } = await supabase
    .from("counseling_sessions")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function rescheduleCounselingSession(
  id: string,
  sessionDate: string,
  location?: string
) {
  const { data, error } = await supabase
    .from("counseling_sessions")
    .update({ session_date: sessionDate, ...(location ? { location } : {}) })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}
