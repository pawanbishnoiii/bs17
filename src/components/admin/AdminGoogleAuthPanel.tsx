import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Copy } from "lucide-react";
import { getOAuthSettings, updateOAuthSettings } from "@/lib/admin.functions";

const SUPABASE_URL = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-background p-2">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className="truncate font-mono text-xs">{value}</p>
      </div>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            toast.error("Copy nahi ho paya — manually select karein.");
          }
        }}
        aria-label={`Copy ${label}`}
        className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}

/** Admin: Google sign-in credentials + the redirect URLs to paste into Google Cloud. */
export function AdminGoogleAuthPanel() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["oauth-settings"], queryFn: () => getOAuthSettings() });
  const [clientId, setClientId] = useState("");
  const [secret, setSecret] = useState("");

  useEffect(() => {
    if (q.data) setClientId(q.data.google_client_id ?? "");
  }, [q.data]);

  const save = useMutation({
    mutationFn: () =>
      updateOAuthSettings({
        data: { google_client_id: clientId, google_client_secret: secret || undefined },
      }),
    onSuccess: async () => {
      setSecret("");
      await qc.invalidateQueries({ queryKey: ["oauth-settings"] });
      toast.success("Google credentials saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const redirects = [
    ["Backend callback (Google Cloud)", `${SUPABASE_URL ?? ""}/auth/v1/callback`],
    ["App callback", `${origin}/auth/callback`],
    ["Authorized JavaScript origin", origin],
  ] as const;

  return (
    <section className="rounded-3xl border border-border bg-panel p-4 sm:p-5">
      <h2 className="text-base font-bold tracking-tight">Google sign-in</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Google Cloud Console → Credentials → OAuth client me ye URLs paste karein, phir client ID / secret yahan save karein.
      </p>

      <div className="mt-4 space-y-2">
        {redirects.map(([label, value]) => (
          <CopyRow key={label} label={label} value={value} />
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs text-muted-foreground">Google client ID</label>
          <input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="1234567890-abc.apps.googleusercontent.com"
            className="input mt-1"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-muted-foreground">
            Google client secret {q.data?.has_secret ? "(saved — khali chhodne par purana rahega)" : ""}
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={q.data?.has_secret ? "••••••••••••" : "GOCSPX-…"}
            className="input mt-1"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => save.mutate()}
        disabled={save.isPending}
        className="mt-4 h-11 w-full rounded-full bg-brand text-sm font-semibold text-brand-foreground disabled:opacity-50 sm:w-48"
      >
        {save.isPending ? "Saving…" : "Save credentials"}
      </button>
    </section>
  );
}
