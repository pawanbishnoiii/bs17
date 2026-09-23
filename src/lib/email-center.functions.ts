import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ---------------- shared admin guard ---------------- */

async function admin(context: { supabase: SupabaseClient; userId: string }) {
  const { data: ok } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!ok) throw new Error("Forbidden");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as SupabaseClient;
}

/* ---------------- settings ---------------- */

export type EmailConfig = {
  provider: string;
  adapter: string;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  encryption: string;
  from_email: string | null;
  from_name: string | null;
  reply_to: string | null;
  timeout_seconds: number;
  verify_ssl: boolean;
  has_password: boolean;
  has_api_key: boolean;
  last_verified_at: string | null;
  last_error: string | null;
};

export const getEmailConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EmailConfig | null> => {
    const db = await admin(context);
    const { data, error } = await db.from("email_settings").select("*").eq("id", true).maybeSingle();
    if (error) throw new Error(error.message);
    const row = (data ?? {}) as Record<string, any>;
    return {
      provider: row["provider"] ?? "lovable",
      adapter: row["adapter"] ?? "smtp",
      smtp_host: row["smtp_host"] ?? null,
      smtp_port: row["smtp_port"] ?? 587,
      smtp_user: row["smtp_user"] ?? null,
      encryption: row["encryption"] ?? "starttls",
      from_email: row["from_email"] ?? null,
      from_name: row["from_name"] ?? null,
      reply_to: row["reply_to"] ?? null,
      timeout_seconds: row["timeout_seconds"] ?? 20,
      verify_ssl: row["verify_ssl"] ?? true,
      smtp_auth: row["smtp_auth"] ?? true,
      has_password: Boolean(row["smtp_password"]),
      has_api_key: Boolean(row["api_key"]),
      last_verified_at: row["last_verified_at"] ?? null,
      last_error: row["last_error"] ?? null,
    };
  });

export const saveEmailConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        provider: z.enum(["lovable", "smtp"]).optional(),
        adapter: z.enum(["smtp", "resend", "postmark"]).optional(),
        smtp_host: z.string().max(300).nullable().optional(),
        smtp_port: z.number().int().min(1).max(65535).nullable().optional(),
        smtp_user: z.string().max(300).nullable().optional(),
        smtp_password: z.string().max(400).optional(),
        api_key: z.string().max(400).optional(),
        encryption: z.enum(["starttls", "ssl", "tls", "none"]).optional(),
        smtp_auth: z.boolean().optional(),
        from_email: z.string().max(300).nullable().optional(),
        from_name: z.string().max(200).nullable().optional(),
        reply_to: z.string().max(300).nullable().optional(),
        timeout_seconds: z.number().int().min(5).max(120).optional(),
        verify_ssl: z.boolean().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [key, value] of Object.entries(data)) {
      // Empty secret fields mean "keep the stored value".
      if ((key === "smtp_password" || key === "api_key") && !value) continue;
      patch[key] = value;
    }
    if (patch["encryption"] === "tls") patch["encryption"] = "ssl";
    const { error } = await db.from("email_settings").upsert({ id: true, ...patch } as never, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const verifyEmailConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin(context);
    const { loadConfig, verifyConnection } = await import("@/lib/email-sender.server");
    const cfg = await loadConfig(db);
    const result = await verifyConnection(cfg);
    await db
      .from("email_settings")
      .update({
        last_verified_at: result.ok ? new Date().toISOString() : null,
        last_error: result.ok ? null : `${result.code}: ${result.message}`,
      } as never)
      .eq("id", true);
    return result;
  });

export const sendEmailTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ to: z.string().email(), subject: z.string().max(200).optional(), html: z.string().max(50_000).optional() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const { loadConfig, deliver } = await import("@/lib/email-sender.server");
    const cfg = await loadConfig(db);
    const result = await deliver(cfg, {
      to: data.to,
      subject: data.subject || "Bnoy Study — test email",
      html: data.html || "<p>Ye ek test email hai. Agar ye mil gayi to aapki email settings sahi hain.</p>",
    });
    await db.from("email_logs").insert({
      to_email: data.to,
      subject: data.subject || "Bnoy Study — test email",
      event: result.ok ? "sent" : "failed",
      detail: result.ok ? "test email" : `${result.code}: ${result.detail || result.message}`,
    } as never);
    return result;
  });

/* ---------------- templates ---------------- */

export const listTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin(context);
    const { data, error } = await db.from("email_templates").select("*").order("category").order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<Record<string, any>>;
  });

export const saveTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
        name: z.string().min(2).max(120),
        category: z.enum(["transactional", "promotional"]),
        subject: z.string().min(1).max(200),
        html_body: z.string().min(1).max(100_000),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const { error } = data.id
      ? await db.from("email_templates").update(data as never).eq("id", data.id)
      : await db.from("email_templates").insert(data as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const { error } = await db.from("email_templates").delete().eq("id", data.id).eq("is_system", false);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- campaigns ---------------- */

const campaignInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2).max(160),
  subject: z.string().min(1).max(200),
  html_body: z.string().min(1).max(200_000),
  kind: z.enum(["transactional", "promotional"]),
  audience: z.enum(["all", "active", "picked"]),
  user_ids: z.array(z.string().uuid()).max(2000).default([]),
  send_at: z.string().datetime().nullable().optional(),
  action: z.enum(["draft", "schedule", "send"]),
});

export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin(context);
    const { data, error } = await db.from("email_campaigns").select("*").order("created_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<Record<string, any>>;
  });

export const saveCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => campaignInput.parse(raw))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const { render, drainQueue } = await import("@/lib/email-sender.server");

    const status = data.action === "draft" ? "draft" : data.action === "schedule" ? "scheduled" : "sending";
    const row = {
      title: data.title,
      subject: data.subject,
      html_body: data.html_body,
      kind: data.kind,
      audience: data.audience,
      user_ids: data.user_ids,
      send_at: data.action === "schedule" ? data.send_at : null,
      status,
      created_by: context.userId,
    };
    if (data.action === "schedule" && !data.send_at) throw new Error("Schedule ke liye date/time chuniye.");

    const saved = data.id
      ? await db.from("email_campaigns").update(row as never).eq("id", data.id).select("id").maybeSingle()
      : await db.from("email_campaigns").insert(row as never).select("id").maybeSingle();
    if (saved.error) throw new Error(saved.error.message);
    const campaignId = (saved.data as { id: string } | null)?.id;
    if (!campaignId) throw new Error("Campaign save nahi hui.");

    if (data.action === "draft") return { ok: true, queued: 0, campaignId };

    // Resolve recipients.
    let query = db.from("profiles").select("id,email,display_name");
    if (data.audience === "picked") query = query.in("id", data.user_ids.length ? data.user_ids : ["00000000-0000-0000-0000-000000000000"]);
    if (data.audience === "active") query = query.gte("last_seen_at", new Date(Date.now() - 30 * 864e5).toISOString());
    const { data: people, error: peopleError } = await query;
    if (peopleError) throw new Error(peopleError.message);

    let suppressed = new Set<string>();
    if (data.kind === "promotional") {
      const { data: blocks } = await db.from("email_suppressions").select("email");
      suppressed = new Set(((blocks ?? []) as Array<{ email: string }>).map((b) => b.email.toLowerCase()));
    }

    const when = data.action === "schedule" ? new Date(data.send_at!).toISOString() : new Date().toISOString();
    const rows = ((people ?? []) as Array<{ id: string; email: string | null; display_name: string | null }>)
      .filter((p) => p.email && !suppressed.has(p.email.toLowerCase()))
      .map((p) => ({
        campaign_id: campaignId,
        user_id: p.id,
        to_email: p.email!,
        subject: render(data.subject, { name: p.display_name ?? "there", email: p.email }),
        html_body: render(data.html_body, { name: p.display_name ?? "there", email: p.email }),
        kind: data.kind,
        next_attempt_at: when,
      }));
    if (rows.length === 0) throw new Error("Koi eligible recipient nahi mila.");

    const { error: queueError } = await db.from("email_queue").insert(rows as never);
    if (queueError) throw new Error(queueError.message);
    await db.from("email_campaigns").update({ queued_count: rows.length } as never).eq("id", campaignId);

    if (data.action === "send") await drainQueue(db, 100);
    return { ok: true, queued: rows.length, campaignId };
  });

export const cancelCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    await db.from("email_queue").delete().eq("campaign_id", data.id).in("status", ["pending", "retry"]);
    const { error } = await db.from("email_campaigns").update({ status: "cancelled" } as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- queue, logs, suppressions ---------------- */

export const listQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin(context);
    const { data, error } = await db
      .from("email_queue")
      .select("id,to_email,subject,status,attempts,last_error,next_attempt_at,sent_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<Record<string, any>>;
  });

export const runQueueNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin(context);
    const { drainQueue } = await import("@/lib/email-sender.server");
    return drainQueue(db, 100);
  });

export const retryFailed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin(context);
    const { error } = await db
      .from("email_queue")
      .update({ status: "retry", attempts: 0, next_attempt_at: new Date().toISOString(), last_error: null } as never)
      .eq("status", "failed");
    if (error) throw new Error(error.message);
    const { drainQueue } = await import("@/lib/email-sender.server");
    return drainQueue(db, 100);
  });

export const listEmailLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ search: z.string().max(200).optional(), event: z.string().max(40).optional() }).parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    let query = db.from("email_logs").select("*").order("created_at", { ascending: false }).limit(200);
    if (data.event && data.event !== "all") query = query.eq("event", data.event);
    if (data.search) query = query.ilike("to_email", `%${data.search}%`);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []) as Array<Record<string, any>>;
  });

export const listSuppressions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin(context);
    const { data, error } = await db.from("email_suppressions").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<Record<string, any>>;
  });

export const addSuppression = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ email: z.string().email(), reason: z.string().max(120).optional() }).parse(raw))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const { error } = await db
      .from("email_suppressions")
      .upsert({ email: data.email.toLowerCase(), reason: data.reason || "manual" } as never, { onConflict: "email" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeSuppression = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const { error } = await db.from("email_suppressions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- automations ---------------- */

export const listAutomations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin(context);
    const { data, error } = await db.from("email_automations").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<Record<string, any>>;
  });

export const saveAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(2).max(120),
        trigger_event: z.enum(["signup", "streak_broken", "target_missed", "test_completed", "inactive_7d"]),
        delay_minutes: z.number().int().min(0).max(10080),
        template_slug: z.string().min(2).max(80),
        active: z.boolean(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const { error } = data.id
      ? await db.from("email_automations").update(data as never).eq("id", data.id)
      : await db.from("email_automations").insert(data as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const { error } = await db.from("email_automations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
