import { supabase } from "../lib/supabase";

// The `announcements` table only stores title/category/content/published_at —
// icon and color are UI-only, so we derive them here from category.
const CATEGORY_STYLES: Record<string, { color: string; icon: string }> = {
  BK: { color: "bg-blue-100 text-blue-600", icon: "🧠" },
  Sekolah: { color: "bg-yellow-100 text-yellow-600", icon: "🏫" },
  Akademik: { color: "bg-green-100 text-green-600", icon: "📚" },
};
const DEFAULT_STYLE = { color: "bg-slate-100 text-slate-600", icon: "📌" };

export async function getAnnouncements() {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("published_at", { ascending: false });

  if (error) throw error;

  return data.map((a) => {
    const style = CATEGORY_STYLES[a.category] ?? DEFAULT_STYLE;
    return {
      id: a.id,
      title: a.title,
      tag: a.category,
      desc: a.content,
      date: a.published_at
        ? new Date(a.published_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "",
      color: style.color,
      icon: style.icon,
    };
  });
}

export async function createAnnouncement(input: {
  title: string;
  category: string;
  content: string;
  published_by: string; // profiles.id of the author
  school_id: string; // required — RLS insert policy checks school_id = my_school_id()
}) {
  const { data, error } = await supabase
    .from("announcements")
    .insert({ ...input, published_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAnnouncement(
  id: string,
  input: Partial<{ title: string; category: string; content: string }>
) {
  const { data, error } = await supabase
    .from("announcements")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAnnouncement(id: string) {
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw error;
}
