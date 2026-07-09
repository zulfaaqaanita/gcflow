import { supabase } from "../lib/supabase";

export async function createJournal(input: {
  student_id: string;
  school_id: string;
  content: string;
  request_counseling: boolean;
}) {
  const { data, error } = await supabase
    .from("journals")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markJournalHandled(id: string) {
  const { data, error } = await supabase
    .from("journals")
    .update({ request_counseling: false })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch journals. Pass `studentId` to get only that student's journals
 * (use this for the student view). Leave it out only for admin/debug use —
 * without it this returns EVERY student's journals, which is a data leak
 * if used on a student-facing page.
 */
export async function getJournals(studentId?: string) {
  let query = supabase
    .from("journals")
    .select(`
      *,
      students!journals_student_id_fkey (
        id,
        profiles!students_profile_id_fkey (
          full_name
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (studentId) {
    query = query.eq("student_id", studentId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data.map((journal) => ({
    id: journal.id,
    student: journal.students?.profiles?.full_name ?? "Tanpa Nama",
    content: journal.content,
    requestCounseling: journal.request_counseling,
    createdAt: journal.created_at,
  }));
}
