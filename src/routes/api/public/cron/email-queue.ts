import { createFileRoute } from "@tanstack/react-router";

/**
 * Scheduled email queue drain. Called hourly by the database scheduler with the
 * private token stored in cron_config, and never by the browser.
 */
export const Route = createFileRoute("/api/public/cron/email-queue")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get("x-cron-token") ?? "";
        if (!provided) return new Response("Unauthorized", { status: 401 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: cfg, error: cfgError } = await supabaseAdmin
          .from("cron_config")
          .select("token")
          .eq("id", true)
          .maybeSingle();
        if (cfgError) return new Response("Server configuration error", { status: 500 });

        const expected = (cfg as { token: string } | null)?.token ?? "";
        const { createHash, timingSafeEqual } = await import("node:crypto");
        const digest = (v: string) => createHash("sha256").update(v, "utf8").digest();
        if (!expected || !timingSafeEqual(digest(provided), digest(expected))) {
          return new Response("Unauthorized", { status: 401 });
        }

        try {
          const { drainQueue } = await import("@/lib/email-sender.server");
          const result = await drainQueue(supabaseAdmin as never, 100);
          return Response.json(result);
        } catch (err) {
          console.error("email queue drain failed", err);
          return Response.json({ error: (err as Error).message }, { status: 500 });
        }
      },
    },
  },
});
