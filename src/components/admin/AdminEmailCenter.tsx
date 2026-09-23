import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Mail,
  Plug,
  RefreshCw,
  Send,
  ShieldOff,
  Trash2,
  Zap,
} from "lucide-react";
import {
  addSuppression,
  cancelCampaign,
  deleteAutomation,
  deleteTemplate,
  getEmailConfig,
  listAutomations,
  listCampaigns,
  listEmailLogs,
  listQueue,
  listSuppressions,
  listTemplates,
  removeSuppression,
  retryFailed,
  runQueueNow,
  saveAutomation,
  saveCampaign,
  saveEmailConfig,
  saveTemplate,
  sendEmailTest,
  verifyEmailConnection,
} from "@/lib/email-center.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const PANEL = "rounded-3xl border border-border bg-panel p-5";
const FIELD = "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm";

function recommendedEncryption(port: number) {
  if (port === 465) return "ssl";
  if (port === 587 || port === 2525 || port === 25) return "starttls";
  return "none";
}

/* ================================ Settings ================================ */

function SettingsTab() {
  const qc = useQueryClient();
  const load = useServerFn(getEmailConfig);
  const save = useServerFn(saveEmailConfig);
  const verify = useServerFn(verifyEmailConnection);
  const test = useServerFn(sendEmailTest);

  const config = useQuery({ queryKey: ["email-config"], queryFn: () => load({ data: {} as never }) });
  const [form, setForm] = useState<Record<string, any> | null>(null);
  const [secret, setSecret] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [testTo, setTestTo] = useState("");

  const row = form ?? config.data ?? null;
  const set = (patch: Record<string, any>) => setForm({ ...(row ?? {}), ...patch });

  const saving = useMutation({
    mutationFn: async () => {
      if (!row) return;
      await save({
        data: {
          provider: row["provider"] === "lovable" ? "lovable" : "smtp",
          adapter: row["adapter"] ?? "smtp",
          smtp_host: row["smtp_host"] || null,
          smtp_port: Number(row["smtp_port"]) || 587,
          smtp_user: row["smtp_user"] || null,
          smtp_password: secret || undefined,
          api_key: apiKey || undefined,
          encryption: row["encryption"] ?? "starttls",
          from_email: row["from_email"] || null,
          from_name: row["from_name"] || null,
          reply_to: row["reply_to"] || null,
          timeout_seconds: Number(row["timeout_seconds"]) || 20,
          verify_ssl: row["verify_ssl"] !== false,
        } as never,
      });
    },
    onSuccess: () => {
      setSecret("");
      setApiKey("");
      toast.success("Email settings saved");
      qc.invalidateQueries({ queryKey: ["email-config"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verifying = useMutation({
    mutationFn: () => verify({ data: {} as never }),
    onSuccess: (r: any) => {
      if (r?.ok) toast.success("Connection working");
      else toast.error(r?.message ?? "Connection failed");
      qc.invalidateQueries({ queryKey: ["email-config"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testing = useMutation({
    mutationFn: () => test({ data: { to: testTo } }),
    onSuccess: (r: any) => (r?.ok ? toast.success(`Test email sent to ${testTo}`) : toast.error(r?.message ?? "Send failed")),
    onError: (e: Error) => toast.error(e.message),
  });

  if (config.isLoading || !row) return <div className={PANEL}>Loading…</div>;
  const adapter = row["adapter"] ?? "smtp";
  const port = Number(row["smtp_port"]) || 587;
  const advised = recommendedEncryption(port);

  return (
    <div className="space-y-4">
      <div className={PANEL}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
            <Plug className="size-4" /> Delivery provider
          </h2>
          {row["last_verified_at"] ? (
            <Badge className="gap-1 bg-emerald-500/15 text-emerald-600">
              <CheckCircle2 className="size-3" /> Verified
            </Badge>
          ) : row["last_error"] ? (
            <Badge className="gap-1 bg-destructive/15 text-destructive">
              <AlertTriangle className="size-3" /> {String(row["last_error"]).slice(0, 60)}
            </Badge>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Adapter</Label>
            <select
              className={FIELD}
              value={adapter}
              onChange={(e) => set({ adapter: e.target.value, provider: e.target.value === "smtp" ? "smtp" : "smtp" })}
            >
              <option value="smtp">Custom SMTP (Gmail, Zoho, own server)</option>
              <option value="resend">Resend API</option>
              <option value="postmark">Postmark API</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Adapter badalne par baaki app ka koi code nahi badalta.
            </p>
          </div>
          <div>
            <Label>From name</Label>
            <Input className="mt-1" value={row["from_name"] ?? ""} onChange={(e) => set({ from_name: e.target.value })} />
          </div>
          <div>
            <Label>From email</Label>
            <Input className="mt-1" value={row["from_email"] ?? ""} onChange={(e) => set({ from_email: e.target.value })} />
          </div>
          <div>
            <Label>Reply-to</Label>
            <Input className="mt-1" value={row["reply_to"] ?? ""} onChange={(e) => set({ reply_to: e.target.value })} />
          </div>
        </div>

        {adapter === "smtp" ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>SMTP host</Label>
              <Input className="mt-1" placeholder="smtp.gmail.com" value={row["smtp_host"] ?? ""} onChange={(e) => set({ smtp_host: e.target.value })} />
            </div>
            <div>
              <Label>Port</Label>
              <Input
                className="mt-1"
                type="number"
                value={port}
                onChange={(e) => {
                  const p = Number(e.target.value);
                  set({ smtp_port: p, encryption: recommendedEncryption(p) });
                }}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Is port ke liye recommended: {advised === "ssl" ? "SSL/TLS" : advised === "starttls" ? "STARTTLS" : "None"}
              </p>
            </div>
            <div>
              <Label>Encryption</Label>
              <select className={FIELD} value={row["encryption"] ?? "starttls"} onChange={(e) => set({ encryption: e.target.value })}>
                <option value="starttls">STARTTLS (587)</option>
                <option value="ssl">SSL / TLS (465)</option>
                <option value="tls">TLS (implicit, 465)</option>
                <option value="none">None</option>
              </select>
            </div>
            <div>
              <Label>Username</Label>
              <Input className="mt-1" value={row["smtp_user"] ?? ""} onChange={(e) => set({ smtp_user: e.target.value })} />
            </div>
            <div>
              <Label>App password</Label>
              <Input
                className="mt-1"
                type="password"
                placeholder={row["has_password"] ? "•••••••• (saved)" : "Gmail App Password"}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">Password kabhi wapas dikhaya nahi jaata.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Timeout (sec)</Label>
                <Input
                  className="mt-1"
                  type="number"
                  value={row["timeout_seconds"] ?? 20}
                  onChange={(e) => set({ timeout_seconds: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-end gap-2">
                <Switch checked={row["verify_ssl"] !== false} onCheckedChange={(v) => set({ verify_ssl: v })} />
                <span className="pb-2 text-sm">Verify SSL</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <Label>API key</Label>
            <Input
              className="mt-1"
              type="password"
              placeholder={row["has_api_key"] ? "•••••••• (saved)" : "Provider API key"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => saving.mutate()} disabled={saving.isPending}>
            {saving.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Save settings
          </Button>
          <Button variant="outline" onClick={() => verifying.mutate()} disabled={verifying.isPending}>
            {verifying.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />} Test connection
          </Button>
        </div>
      </div>

      <div className={PANEL}>
        <h2 className="font-heading text-lg font-bold">Send a test email</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input className="max-w-xs" placeholder="you@example.com" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
          <Button variant="outline" onClick={() => testing.mutate()} disabled={!testTo || testing.isPending}>
            {testing.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send test
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ================================ Composer ================================ */

const VARIABLES = ["{{name}}", "{{email}}"];

function ComposeTab() {
  const qc = useQueryClient();
  const send = useServerFn(saveCampaign);
  const templatesFn = useServerFn(listTemplates);
  const templates = useQuery({ queryKey: ["email-templates"], queryFn: () => templatesFn({ data: {} as never }) });

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("<p>Hi {{name}},</p>\n<p></p>");
  const [kind, setKind] = useState<"transactional" | "promotional">("promotional");
  const [audience, setAudience] = useState<"all" | "active" | "picked">("all");
  const [userIds, setUserIds] = useState("");
  const [sendAt, setSendAt] = useState("");

  const run = useMutation({
    mutationFn: (action: "draft" | "schedule" | "send") =>
      send({
        data: {
          title: title || subject,
          subject,
          html_body: html,
          kind,
          audience,
          user_ids: userIds
            .split(/[\s,]+/)
            .map((s) => s.trim())
            .filter(Boolean),
          send_at: action === "schedule" && sendAt ? new Date(sendAt).toISOString() : null,
          action,
        } as never,
      }),
    onSuccess: (r: any) => {
      toast.success(r?.queued ? `${r.queued} recipients queued` : "Draft saved");
      qc.invalidateQueries({ queryKey: ["email-campaigns"] });
      qc.invalidateQueries({ queryKey: ["email-queue"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className={PANEL}>
      <h2 className="font-heading text-lg font-bold">Compose email</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Internal title</Label>
          <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Subject</Label>
          <Input className="mt-1" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div>
          <Label>Start from template</Label>
          <select
            className={FIELD}
            onChange={(e) => {
              const t = (templates.data ?? []).find((x) => x["id"] === e.target.value);
              if (t) {
                setSubject(String(t["subject"]));
                setHtml(String(t["html_body"]));
                setKind(t["category"] === "transactional" ? "transactional" : "promotional");
              }
            }}
            value=""
          >
            <option value="">— none —</option>
            {(templates.data ?? []).map((t) => (
              <option key={String(t["id"])} value={String(t["id"])}>
                {String(t["name"])}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Type</Label>
          <select className={FIELD} value={kind} onChange={(e) => setKind(e.target.value as never)}>
            <option value="transactional">Transactional (account / study)</option>
            <option value="promotional">Promotional (respects unsubscribes)</option>
          </select>
        </div>
        <div>
          <Label>Recipients</Label>
          <select className={FIELD} value={audience} onChange={(e) => setAudience(e.target.value as never)}>
            <option value="all">All users</option>
            <option value="active">Active in last 30 days</option>
            <option value="picked">Specific user ids</option>
          </select>
        </div>
        <div>
          <Label>Schedule for</Label>
          <Input className="mt-1" type="datetime-local" value={sendAt} onChange={(e) => setSendAt(e.target.value)} />
        </div>
      </div>

      {audience === "picked" ? (
        <div className="mt-4">
          <Label>User ids (comma or space separated)</Label>
          <Textarea className="mt-1" rows={2} value={userIds} onChange={(e) => setUserIds(e.target.value)} />
        </div>
      ) : null}

      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>HTML body</Label>
          <div className="flex gap-1">
            {VARIABLES.map((v) => (
              <button
                key={v}
                type="button"
                className="rounded-lg border border-border px-2 py-1 text-xs"
                onClick={() => setHtml((h) => h + v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <Textarea className="mt-1 font-mono text-xs" rows={10} value={html} onChange={(e) => setHtml(e.target.value)} />
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-background p-4">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Preview</p>
        <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => run.mutate("draft")} disabled={!subject || run.isPending}>
          Save draft
        </Button>
        <Button variant="outline" onClick={() => run.mutate("schedule")} disabled={!subject || !sendAt || run.isPending}>
          Schedule
        </Button>
        <Button onClick={() => run.mutate("send")} disabled={!subject || run.isPending}>
          {run.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send now
        </Button>
      </div>
    </div>
  );
}

/* ================================ Campaigns =============================== */

function CampaignsTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(listCampaigns);
  const cancelFn = useServerFn(cancelCampaign);
  const campaigns = useQuery({ queryKey: ["email-campaigns"], queryFn: () => listFn({ data: {} as never }) });
  const cancel = useMutation({
    mutationFn: (id: string) => cancelFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Campaign cancelled");
      qc.invalidateQueries({ queryKey: ["email-campaigns"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className={PANEL}>
      <h2 className="font-heading text-lg font-bold">Campaigns</h2>
      <div className="mt-3 space-y-2">
        {(campaigns.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Abhi koi campaign nahi.</p> : null}
        {(campaigns.data ?? []).map((c) => (
          <div key={String(c["id"])} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{String(c["title"])}</p>
              <p className="text-xs text-muted-foreground">
                {String(c["kind"])} · {String(c["audience"])} · queued {c["queued_count"] ?? 0} · sent {c["sent_count"] ?? 0} · failed{" "}
                {c["failed_count"] ?? 0}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{String(c["status"])}</Badge>
              {["draft", "scheduled", "sending"].includes(String(c["status"])) ? (
                <Button size="sm" variant="ghost" onClick={() => cancel.mutate(String(c["id"]))}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================ Templates =============================== */

function TemplatesTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(listTemplates);
  const saveFn = useServerFn(saveTemplate);
  const delFn = useServerFn(deleteTemplate);
  const templates = useQuery({ queryKey: ["email-templates"], queryFn: () => listFn({ data: {} as never }) });
  const [edit, setEdit] = useState<Record<string, any> | null>(null);

  const save = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          id: edit?.["id"],
          slug: String(edit?.["slug"] ?? ""),
          name: String(edit?.["name"] ?? ""),
          category: edit?.["category"] === "transactional" ? "transactional" : "promotional",
          subject: String(edit?.["subject"] ?? ""),
          html_body: String(edit?.["html_body"] ?? ""),
        } as never,
      }),
    onSuccess: () => {
      toast.success("Template saved");
      setEdit(null);
      qc.invalidateQueries({ queryKey: ["email-templates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Template deleted");
      qc.invalidateQueries({ queryKey: ["email-templates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className={PANEL}>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">Templates</h2>
          <Button size="sm" variant="outline" onClick={() => setEdit({ category: "transactional" })}>
            New template
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          {(templates.data ?? []).map((t) => (
            <div key={String(t["id"])} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{String(t["name"])}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {String(t["slug"])} · {String(t["category"])} · {String(t["subject"])}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setEdit(t)}>
                  Edit
                </Button>
                {!t["is_system"] ? (
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate(String(t["id"]))}>
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {edit ? (
        <div className={PANEL}>
          <h3 className="font-heading font-bold">{edit["id"] ? "Edit template" : "New template"}</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input className="mt-1" value={edit["name"] ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                className="mt-1"
                disabled={Boolean(edit["is_system"])}
                value={edit["slug"] ?? ""}
                onChange={(e) => setEdit({ ...edit, slug: e.target.value })}
              />
            </div>
            <div>
              <Label>Category</Label>
              <select className={FIELD} value={edit["category"] ?? "transactional"} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>
                <option value="transactional">Transactional</option>
                <option value="promotional">Promotional</option>
              </select>
            </div>
            <div>
              <Label>Subject</Label>
              <Input className="mt-1" value={edit["subject"] ?? ""} onChange={(e) => setEdit({ ...edit, subject: e.target.value })} />
            </div>
          </div>
          <div className="mt-3">
            <Label>HTML body</Label>
            <Textarea
              className="mt-1 font-mono text-xs"
              rows={10}
              value={edit["html_body"] ?? ""}
              onChange={(e) => setEdit({ ...edit, html_body: e.target.value })}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              Save
            </Button>
            <Button variant="ghost" onClick={() => setEdit(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ============================== Queue + logs ============================== */

function DeliveryTab() {
  const qc = useQueryClient();
  const queueFn = useServerFn(listQueue);
  const logsFn = useServerFn(listEmailLogs);
  const runFn = useServerFn(runQueueNow);
  const retryFn = useServerFn(retryFailed);
  const [search, setSearch] = useState("");
  const [event, setEvent] = useState("all");

  const queue = useQuery({ queryKey: ["email-queue"], queryFn: () => queueFn({ data: {} as never }) });
  const logs = useQuery({ queryKey: ["email-logs", search, event], queryFn: () => logsFn({ data: { search, event } }) });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["email-queue"] });
    qc.invalidateQueries({ queryKey: ["email-logs"] });
    qc.invalidateQueries({ queryKey: ["email-campaigns"] });
  };
  const run = useMutation({
    mutationFn: () => runFn({ data: {} as never }),
    onSuccess: (r: any) => {
      toast.success(`Processed ${r?.processed ?? 0} · sent ${r?.sent ?? 0} · failed ${r?.failed ?? 0}`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const retry = useMutation({
    mutationFn: () => retryFn({ data: {} as never }),
    onSuccess: () => {
      toast.success("Failed emails requeued");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const counts = useMemo(() => {
    const list = queue.data ?? [];
    const by = (s: string) => list.filter((r) => r["status"] === s).length;
    return { pending: by("pending") + by("retry"), sent: by("sent"), failed: by("failed"), suppressed: by("suppressed") };
  }, [queue.data]);

  return (
    <div className="space-y-4">
      <div className={PANEL}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-bold">Queue</h2>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => run.mutate()} disabled={run.isPending}>
              {run.isPending ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />} Process now
            </Button>
            <Button size="sm" variant="outline" onClick={() => retry.mutate()} disabled={retry.isPending}>
              <RefreshCw className="size-4" /> Retry failed
            </Button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Waiting", counts.pending],
            ["Sent", counts.sent],
            ["Failed", counts.failed],
            ["Suppressed", counts.suppressed],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-border p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-heading text-xl font-bold">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Queue apne aap har ghante retry hoti hai; failed emails 4 attempts tak backoff ke saath dubara try hote hain.
        </p>
      </div>

      <div className={PANEL}>
        <h2 className="font-heading text-lg font-bold">Delivery logs</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input className="max-w-xs" placeholder="Search recipient" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="rounded-xl border border-border bg-background px-3 text-sm" value={event} onChange={(e) => setEvent(e.target.value)}>
            <option value="all">All events</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="retry">Retry</option>
            <option value="bounced">Bounced</option>
            <option value="suppressed">Suppressed</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
        </div>
        <div className="mt-3 max-h-[420px] space-y-2 overflow-auto">
          {(logs.data ?? []).map((l) => (
            <div key={String(l["id"])} className="rounded-2xl border border-border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{String(l["to_email"])}</span>
                <Badge variant="outline">{String(l["event"])}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{String(l["subject"] ?? "")}</p>
              {l["detail"] ? <p className="mt-1 text-xs text-destructive">{String(l["detail"])}</p> : null}
            </div>
          ))}
          {(logs.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Koi log nahi mila.</p> : null}
        </div>
      </div>
    </div>
  );
}

/* ====================== Automations + suppressions ======================= */

function AutomationsTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAutomations);
  const saveFn = useServerFn(saveAutomation);
  const delFn = useServerFn(deleteAutomation);
  const supListFn = useServerFn(listSuppressions);
  const supAddFn = useServerFn(addSuppression);
  const supDelFn = useServerFn(removeSuppression);
  const templatesFn = useServerFn(listTemplates);

  const rows = useQuery({ queryKey: ["email-automations"], queryFn: () => listFn({ data: {} as never }) });
  const templates = useQuery({ queryKey: ["email-templates"], queryFn: () => templatesFn({ data: {} as never }) });
  const sup = useQuery({ queryKey: ["email-suppressions"], queryFn: () => supListFn({ data: {} as never }) });

  const [draft, setDraft] = useState({ name: "", trigger_event: "signup", delay_minutes: 0, template_slug: "welcome", active: true });
  const [supEmail, setSupEmail] = useState("");

  const save = useMutation({
    mutationFn: () => saveFn({ data: draft as never }),
    onSuccess: () => {
      toast.success("Automation saved");
      qc.invalidateQueries({ queryKey: ["email-automations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-automations"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: (row: Record<string, any>) =>
      saveFn({
        data: {
          id: row["id"],
          name: row["name"],
          trigger_event: row["trigger_event"],
          delay_minutes: row["delay_minutes"] ?? 0,
          template_slug: row["template_slug"],
          active: !row["active"],
        } as never,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-automations"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const addSup = useMutation({
    mutationFn: () => supAddFn({ data: { email: supEmail, reason: "manual" } }),
    onSuccess: () => {
      setSupEmail("");
      qc.invalidateQueries({ queryKey: ["email-suppressions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const delSup = useMutation({
    mutationFn: (id: string) => supDelFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-suppressions"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className={PANEL}>
        <h2 className="font-heading text-lg font-bold">Automations</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <Label>Name</Label>
            <Input className="mt-1" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div>
            <Label>Trigger</Label>
            <select className={FIELD} value={draft.trigger_event} onChange={(e) => setDraft({ ...draft, trigger_event: e.target.value })}>
              <option value="signup">New signup</option>
              <option value="streak_broken">Streak broken</option>
              <option value="target_missed">Target missed</option>
              <option value="test_completed">Test completed</option>
              <option value="inactive_7d">Inactive 7 days</option>
            </select>
          </div>
          <div>
            <Label>Delay (minutes)</Label>
            <Input className="mt-1" type="number" value={draft.delay_minutes} onChange={(e) => setDraft({ ...draft, delay_minutes: Number(e.target.value) })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Template</Label>
            <select className={FIELD} value={draft.template_slug} onChange={(e) => setDraft({ ...draft, template_slug: e.target.value })}>
              {(templates.data ?? []).map((t) => (
                <option key={String(t["slug"])} value={String(t["slug"])}>
                  {String(t["name"])}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={() => save.mutate()} disabled={!draft.name || save.isPending}>
              Add automation
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {(rows.data ?? []).map((r) => (
            <div key={String(r["id"])} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border p-3">
              <div>
                <p className="text-sm font-semibold">{String(r["name"])}</p>
                <p className="text-xs text-muted-foreground">
                  {String(r["trigger_event"])} → {String(r["template_slug"])} · +{r["delay_minutes"] ?? 0} min
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={Boolean(r["active"])} onCheckedChange={() => toggle.mutate(r)} />
                <Button size="sm" variant="ghost" onClick={() => remove.mutate(String(r["id"]))}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={PANEL}>
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
          <ShieldOff className="size-4" /> Unsubscribes & suppressions
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Ye addresses promotional emails nahi paate; account/study emails phir bhi jaate hain.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input className="max-w-xs" placeholder="email@example.com" value={supEmail} onChange={(e) => setSupEmail(e.target.value)} />
          <Button variant="outline" onClick={() => addSup.mutate()} disabled={!supEmail || addSup.isPending}>
            Suppress
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          {(sup.data ?? []).map((s) => (
            <div key={String(s["id"])} className="flex items-center justify-between rounded-2xl border border-border p-3 text-sm">
              <span>
                {String(s["email"])} <span className="text-xs text-muted-foreground">({String(s["reason"])})</span>
              </span>
              <Button size="sm" variant="ghost" onClick={() => delSup.mutate(String(s["id"]))}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================== Shell ================================= */

export function AdminEmailCenter() {
  return (
    <Tabs defaultValue="settings" className="w-full">
      <TabsList className="flex w-full flex-wrap justify-start">
        <TabsTrigger value="settings">
          <Mail className="mr-1 size-4" /> SMTP
        </TabsTrigger>
        <TabsTrigger value="compose">Compose</TabsTrigger>
        <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        <TabsTrigger value="templates">Templates</TabsTrigger>
        <TabsTrigger value="delivery">Queue & logs</TabsTrigger>
        <TabsTrigger value="automations">Automations</TabsTrigger>
      </TabsList>
      <TabsContent value="settings" className="mt-4">
        <SettingsTab />
      </TabsContent>
      <TabsContent value="compose" className="mt-4">
        <ComposeTab />
      </TabsContent>
      <TabsContent value="campaigns" className="mt-4">
        <CampaignsTab />
      </TabsContent>
      <TabsContent value="templates" className="mt-4">
        <TemplatesTab />
      </TabsContent>
      <TabsContent value="delivery" className="mt-4">
        <DeliveryTab />
      </TabsContent>
      <TabsContent value="automations" className="mt-4">
        <AutomationsTab />
      </TabsContent>
    </Tabs>
  );
}
