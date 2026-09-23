/**
 * Server-only email delivery layer.
 *
 * One `deliver()` contract with pluggable adapters, so Gmail SMTP can be swapped
 * for Resend / SES / Postmark later without touching any application code.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type EmailConfigRow = {
  provider: string;
  adapter: string;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  smtp_password: string | null;
  api_key: string | null;
  encryption: string;
  from_email: string | null;
  from_name: string | null;
  reply_to: string | null;
  timeout_seconds: number;
  verify_ssl: boolean;
};

export type SendResult = { ok: true } | { ok: false; code: string; message: string; detail: string };

export async function loadConfig(db: SupabaseClient): Promise<EmailConfigRow> {
  const { data, error } = await db.from("email_settings").select("*").eq("id", true).maybeSingle();
  if (error) throw new Error(error.message);
  const row = data as EmailConfigRow | null;
  if (!row) throw new Error("Email settings abhi save nahi hui hain.");
  return row;
}

export function missingFields(cfg: EmailConfigRow): string[] {
  if (cfg.adapter === "smtp") {
    return [
      !cfg.smtp_host && "SMTP host",
      !cfg.smtp_port && "Port",
      !cfg.smtp_user && "Username",
      !cfg.smtp_password && "Password / app password",
      !cfg.from_email && "From email",
    ].filter(Boolean) as string[];
  }
  return [!cfg.api_key && "API key", !cfg.from_email && "From email"].filter(Boolean) as string[];
}

export function friendlyError(err: unknown): SendResult {
  const e = err as { code?: string; responseCode?: number; response?: string; message?: string };
  const code = e?.code ?? (e?.responseCode ? String(e.responseCode) : "");
  const hints: Record<string, string> = {
    EAUTH: "Username ya password galat hai (Gmail par App Password use karein).",
    ECONNECTION: "Server se connection nahi bana — host aur port check karein.",
    ETIMEDOUT: "Connection timeout — host/port ya firewall block kar raha hai.",
    ESOCKET: "TLS/port mismatch — 465 par SSL/TLS, 587 par STARTTLS chuniye.",
    EDNS: "Host name resolve nahi hua — spelling check karein.",
    EENVELOPE: "From email reject ho gaya — domain verify karein.",
  };
  const detail = e?.response || e?.message || "Unknown email error";
  return { ok: false, code: code || "ERROR", message: hints[code] ?? detail, detail };
}

/** Recommended encryption for a port — used by the admin UI too. */
export function recommendedEncryption(port: number): "ssl" | "starttls" | "none" {
  if (port === 465) return "ssl";
  if (port === 587 || port === 2525 || port === 25) return "starttls";
  return "none";
}

async function smtpTransport(cfg: EmailConfigRow) {
  const nodemailer = (await import("nodemailer")).default;
  const timeout = Math.max(5, cfg.timeout_seconds ?? 20) * 1000;
  return nodemailer.createTransport({
    host: cfg.smtp_host!,
    port: cfg.smtp_port!,
    secure: cfg.encryption === "ssl" || cfg.smtp_port === 465,
    requireTLS: cfg.encryption === "starttls",
    auth: { user: cfg.smtp_user!, pass: cfg.smtp_password! },
    tls: { rejectUnauthorized: cfg.verify_ssl !== false },
    connectionTimeout: timeout,
    greetingTimeout: timeout,
    socketTimeout: timeout,
  });
}

export async function verifyConnection(cfg: EmailConfigRow): Promise<SendResult> {
  const missing = missingFields(cfg);
  if (missing.length) return { ok: false, code: "CONFIG", message: `Ye fields missing hain: ${missing.join(", ")}`, detail: "" };
  if (cfg.adapter !== "smtp") return { ok: true };
  try {
    const t = await smtpTransport(cfg);
    await t.verify();
    return { ok: true };
  } catch (err) {
    return friendlyError(err);
  }
}

export type Mail = { to: string; subject: string; html: string };

/** Adapter-agnostic single send. */
export async function deliver(cfg: EmailConfigRow, mail: Mail): Promise<SendResult> {
  const missing = missingFields(cfg);
  if (missing.length) return { ok: false, code: "CONFIG", message: `Ye fields missing hain: ${missing.join(", ")}`, detail: "" };
  const from = cfg.from_name ? `"${cfg.from_name}" <${cfg.from_email}>` : cfg.from_email!;
  try {
    if (cfg.adapter === "smtp") {
      const t = await smtpTransport(cfg);
      await t.sendMail({ from, to: mail.to, subject: mail.subject, html: mail.html, replyTo: cfg.reply_to ?? undefined });
      return { ok: true };
    }
    if (cfg.adapter === "resend") {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${cfg.api_key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, html: mail.html, reply_to: cfg.reply_to ?? undefined }),
      });
      if (!res.ok) return { ok: false, code: String(res.status), message: "Provider ne request reject ki.", detail: await res.text() };
      return { ok: true };
    }
    if (cfg.adapter === "postmark") {
      const res = await fetch("https://api.postmarkapp.com/email", {
        method: "POST",
        headers: { "X-Postmark-Server-Token": cfg.api_key!, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ From: from, To: mail.to, Subject: mail.subject, HtmlBody: mail.html, ReplyTo: cfg.reply_to ?? undefined }),
      });
      if (!res.ok) return { ok: false, code: String(res.status), message: "Provider ne request reject ki.", detail: await res.text() };
      return { ok: true };
    }
    return { ok: false, code: "ADAPTER", message: `Adapter "${cfg.adapter}" support nahi karta.`, detail: "" };
  } catch (err) {
    return friendlyError(err);
  }
}

/** Fill {{variables}} in a template body/subject. */
export function render(text: string, vars: Record<string, string | number | null | undefined>) {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key: string) => String(vars[key] ?? ""));
}

const BACKOFF_MINUTES = [1, 5, 20, 60];

/**
 * Sends everything that is due, with retry + backoff and a delivery log entry per
 * attempt. Safe to call from the admin UI and from the scheduled retry job.
 */
export async function drainQueue(db: SupabaseClient, limit = 50) {
  const cfg = await loadConfig(db);
  const { data, error } = await db
    .from("email_queue")
    .select("*")
    .in("status", ["pending", "retry"])
    .lte("next_attempt_at", new Date().toISOString())
    .order("next_attempt_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Array<{
    id: string;
    campaign_id: string | null;
    to_email: string;
    subject: string;
    html_body: string;
    kind: string;
    attempts: number;
    max_attempts: number;
  }>;

  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    if (row.kind !== "transactional") {
      const { data: blocked } = await db.from("email_suppressions").select("email").eq("email", row.to_email).maybeSingle();
      if (blocked) {
        await db.from("email_queue").update({ status: "suppressed", last_error: "Recipient unsubscribed" }).eq("id", row.id);
        await db.from("email_logs").insert({ queue_id: row.id, campaign_id: row.campaign_id, to_email: row.to_email, subject: row.subject, event: "suppressed", detail: "unsubscribed" });
        continue;
      }
    }
    const result = await deliver(cfg, { to: row.to_email, subject: row.subject, html: row.html_body });
    const attempts = row.attempts + 1;
    if (result.ok) {
      sent++;
      await db.from("email_queue").update({ status: "sent", attempts, sent_at: new Date().toISOString(), last_error: null }).eq("id", row.id);
      await db.from("email_logs").insert({ queue_id: row.id, campaign_id: row.campaign_id, to_email: row.to_email, subject: row.subject, event: "sent" });
    } else {
      failed++;
      const exhausted = attempts >= row.max_attempts;
      const wait = BACKOFF_MINUTES[Math.min(attempts - 1, BACKOFF_MINUTES.length - 1)]!;
      await db
        .from("email_queue")
        .update({
          status: exhausted ? "failed" : "retry",
          attempts,
          last_error: `${result.code}: ${result.message}`,
          next_attempt_at: new Date(Date.now() + wait * 60_000).toISOString(),
        })
        .eq("id", row.id);
      await db.from("email_logs").insert({
        queue_id: row.id,
        campaign_id: row.campaign_id,
        to_email: row.to_email,
        subject: row.subject,
        event: exhausted ? "failed" : "retry",
        detail: `${result.code}: ${result.detail || result.message}`.slice(0, 900),
      });
    }
  }

  // Roll campaign counters up so the admin list stays accurate.
  const campaigns = [...new Set(rows.map((r) => r.campaign_id).filter(Boolean))] as string[];
  for (const id of campaigns) {
    const { data: q } = await db.from("email_queue").select("status").eq("campaign_id", id);
    const list = (q ?? []) as Array<{ status: string }>;
    const done = list.every((r) => ["sent", "failed", "suppressed"].includes(r.status));
    await db
      .from("email_campaigns")
      .update({
        sent_count: list.filter((r) => r.status === "sent").length,
        failed_count: list.filter((r) => r.status === "failed").length,
        status: done ? "sent" : "sending",
      })
      .eq("id", id);
  }

  return { processed: rows.length, sent, failed };
}
