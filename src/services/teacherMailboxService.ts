import { supabase } from "../lib/supabase";

export async function getTeacherMailbox() {
  const { data, error } = await supabase
    .from("journals")
    .select(`
      id,
      content,
      request_counseling,
      created_at,
      students!journals_student_id_fkey (
        id,
        nis,
        class_name,
        profile_id,
        profiles!students_profile_id_fkey (
          full_name
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}
