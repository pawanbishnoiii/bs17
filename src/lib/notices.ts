import { supabase } from "@/integrations/supabase/client";

/** One private note on the student's own Today notice board. */
export type Notice = {
  id: string;
  body: string;
  pinned: boolean;
  done: boolean;
  created_at: string;
};

const COLUMNS = "id, body, pinned, done, created_at";

export async function fetchNotices(): Promise<Notice[]> {
  const { data, error } = await supabase
    .from("notices")
    .select(COLUMNS)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Notice[];
}

export async function addNotice(body: string) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not signed in");
  const text = body.trim();
  if (!text) throw new Error("Notice khaali nahi ho sakta");
  const { error } = await supabase.from("notices").insert({ user_id: uid, body: text });
  if (error) throw error;
}

export async function updateNotice(id: string, patch: Partial<Pick<Notice, "body" | "pinned" | "done">>) {
  const { error } = await supabase.from("notices").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteNotice(id: string) {
  const { error } = await supabase.from("notices").delete().eq("id", id);
  if (error) throw error;
}
