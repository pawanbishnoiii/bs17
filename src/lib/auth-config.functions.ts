import { createServerFn } from "@tanstack/react-start";

/**
 * Public Google Web Client ID for the native One Tap prompt.
 *
 * The client ID is a *public* OAuth identifier (it ships in the One Tap
 * request anyway), so returning it to the browser is safe. It comes from the
 * admin-managed settings row, falling back to the server secret store.
 */
export const getGoogleClientId = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await (supabaseAdmin as any)
    .from("oauth_settings")
    .select("google_client_id")
    .eq("id", true)
    .maybeSingle();
  const stored = (data?.google_client_id ?? "").trim();
  if (stored) return { clientId: stored };
  const id = (process.env["GOOGLE_OAUTH_CLIENT_ID"] ?? "").trim();
  return { clientId: id || null };
});
