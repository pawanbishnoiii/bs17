import { createFileRoute } from "@tanstack/react-router";

/**
 * Safety net for deployments outside Lovable hosting (e.g. Vercel).
 *
 * The Lovable auth broker sends the browser to `/~oauth/initiate?...`, which
 * only exists on Lovable-hosted origins. Instead of a 404 we forward the
 * visitor straight to the backend's own Google authorize endpoint, so the
 * sign-in flow completes on any host.
 */
export const Route = createFileRoute("/~oauth/initiate")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const incoming = new URL(request.url);
        const provider = incoming.searchParams.get("provider") ?? "google";
        const redirect =
          incoming.searchParams.get("redirect_uri") ?? `${incoming.origin}/auth/callback`;

        const base = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
        if (!base) return new Response("Auth is not configured", { status: 500 });

        const target = new URL(`${base}/auth/v1/authorize`);
        target.searchParams.set("provider", provider);
        target.searchParams.set("redirect_to", `${new URL(redirect).origin}/auth/callback`);

        return new Response(null, { status: 302, headers: { Location: target.toString() } });
      },
    },
  },
});
