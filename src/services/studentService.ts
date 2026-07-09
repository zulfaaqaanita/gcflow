import { supabase } from "../lib/supabase";

// Fetch the `students` row for the currently-logged-in student, looked
// up by their profiles.id (user.profileId). Needed because journals /
// counseling_sessions reference `students.id`, not `profiles.id`.
export async function getMyStudentRecord(profileId: string) {
  const { data, error } = await supabase
    .from("students")
    .select("id, nis, class_name")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getStudents() {
  const { data, error } = await supabase
    .from("students")
    .select(`
      *,
      profiles!students_profile_id_fkey (
        full_name
      )
    `);

  if (error) throw error;

  return data.map((student) => ({
    id: student.id,
    nis: student.nis,
    name: student.profiles?.full_name ?? "Tanpa Nama",
    kelas: student.class_name,
    // NOTE: `status` isn't inserted by seed_gcflow.sql, so this will be
    // undefined until either the column is added to the table or you
    // update this to derive the label from another field.
    label: student.status ?? "Belum Ada Label",
    avatar: "👨‍🎓",
  }));
}

// Called by a teacher/admin adding a student manually from the roster
// page. Creates a `profiles` row (approved, no login yet) + a `students`
// row. NOTE: this doesn't create a Supabase Auth account — the student
// can't log in until either someone links an Auth user to this profile
// (see insert_missing_profile.sql pattern), or you build a "claim this
// roster entry" step into the self-registration flow.
export async function createStudentRecord(input: {
  full_name: string;
  nis: string;
  class_name: string;
  school_id: string;
  email?: string;
}) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      full_name: input.full_name,
      email: input.email || null,
      role: "siswa",
      school_id: input.school_id,
      status: "approved",
    })
    .select()
    .single();

  if (profileError) throw profileError;

  const { data: student, error: studentError } = await supabase
    .from("students")
    .insert({
      profile_id: profile.id,
      nis: input.nis,
      class_name: input.class_name,
      school_id: input.school_id,
    })
    .select()
    .single();

  if (studentError) throw studentError;

  return { profile, student };
}
// Called right after createMyProfile() during self-registration, when
// the registering user is a student — creates their `students` row
// (nis, class_name) linked back to their new profile.
export async function createMyStudentRecord(input: {
  profile_id: string;
  school_id: string;
  nis: string;
  class_name: string;
}) {
  const { data, error } = await supabase
    .from("students")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}
