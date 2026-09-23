import { supabase } from "@/integrations/supabase/client";

/** Categories the admin error monitor groups failures by. */
export type ErrorCategory = "upload" | "email" | "auth" | "storage" | "plan" | "other";

export type ErrorEvent = {
  id: string;
  user_id: string | null;
  category: string;
  severity: string;
  message: string;
  detail: Record<string, unknown>;
  context: string | null;
  resolved: boolean;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
};

const COLUMNS =
  "id, user_id, category, severity, message, detail, context, resolved, resolved_at, resolution_note, created_at";

/**
 * Records a failure so admins can see it later. Logging must never break the
 * feature that failed, so every error here is swallowed.
 */
export async function logErrorEvent(input: {
  category: ErrorCategory;
  message: string;
  context?: string;
  severity?: "warning" | "error" | "critical";
  detail?: Record<string, unknown>;
}) {
  try {
    const { data } = await supabase.auth.getUser();
    await supabase.from("error_events").insert({
      user_id: data.user?.id ?? null,
      category: input.category,
      severity: input.severity ?? "error",
      message: input.message.slice(0, 500),
      context: input.context ?? null,
      detail: {
        ...(input.detail ?? {}),
        at: new Date().toISOString(),
        agent: typeof navigator === "undefined" ? null : navigator.userAgent,
      },
    });
  } catch {
    /* monitoring must stay silent */
  }
}

export async function fetchErrorEvents(opts: {
  search?: string;
  category?: string;
  status?: "all" | "open" | "resolved";
}): Promise<ErrorEvent[]> {
  let q = supabase.from("error_events").select(COLUMNS).order("created_at", { ascending: false }).limit(300);
  if (opts.category && opts.category !== "all") q = q.eq("category", opts.category);
  if (opts.status === "open") q = q.eq("resolved", false);
  if (opts.status === "resolved") q = q.eq("resolved", true);
  const term = (opts.search ?? "").trim();
  if (term) q = q.or(`message.ilike.%${term}%,context.ilike.%${term}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as ErrorEvent[];
}

export async function resolveErrorEvent(id: string, resolved: boolean, note?: string) {
  const { data } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("error_events")
    .update({
      resolved,
      resolved_at: resolved ? new Date().toISOString() : null,
      resolved_by: resolved ? (data.user?.id ?? null) : null,
      resolution_note: note?.trim() || null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteErrorEvent(id: string) {
  const { error } = await supabase.from("error_events").delete().eq("id", id);
  if (error) throw error;
}
