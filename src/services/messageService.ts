import { supabase } from "../lib/supabase";

export async function getUnreadMessageCount(profileId: string) {
  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", profileId)
    .eq("is_read", false);

  if (error) throw error;
  return count ?? 0;
}

export async function getMessages() {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(full_name),
      receiver:profiles!messages_receiver_id_fkey(full_name)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map((msg) => ({
    id: msg.id,
    sender: msg.sender?.full_name ?? "-",
    receiver: msg.receiver?.full_name ?? "-",
    message: msg.message,
    isRead: msg.is_read,
    createdAt: msg.created_at,
  }));
}

// Conversation between two people (identified by their `profiles.id`),
// in both directions, oldest first — good for a chat-style thread.
export async function getConversation(profileIdA: string, profileIdB: string) {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      id,
      message,
      is_read,
      created_at,
      sender_id,
      receiver_id,
      sender:profiles!messages_sender_id_fkey(full_name),
      receiver:profiles!messages_receiver_id_fkey(full_name)
    `)
    .or(
      `and(sender_id.eq.${profileIdA},receiver_id.eq.${profileIdB}),and(sender_id.eq.${profileIdB},receiver_id.eq.${profileIdA})`
    )
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data;
}

export async function sendMessage(input: {
  sender_id: string; // profiles.id of whoever is sending
  receiver_id: string; // profiles.id of the recipient
  message: string;
  school_id: string; // required — RLS insert policy checks school_id = my_school_id()
}) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ ...input, is_read: false })
    .select()
    .single();

  if (error) throw error;
  return data;
}
