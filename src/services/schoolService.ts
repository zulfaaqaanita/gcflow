import { supabase } from "../lib/supabase";

export async function getSchools() {
  const { data, error } = await supabase
    .from("schools")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createSchool(name: string) {
  const { data, error } = await supabase
    .from("schools")
    .insert({ name })
    .select()
    .single();

  if (error) throw error;
  return data;
}
