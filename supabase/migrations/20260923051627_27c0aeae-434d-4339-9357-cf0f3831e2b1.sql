-- ===== email settings upgrade =====
ALTER TABLE public.email_settings
  ADD COLUMN IF NOT EXISTS encryption text NOT NULL DEFAULT 'starttls',
  ADD COLUMN IF NOT EXISTS reply_to text,
  ADD COLUMN IF NOT EXISTS timeout_seconds integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS verify_ssl boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS adapter text NOT NULL DEFAULT 'smtp',
  ADD COLUMN IF NOT EXISTS api_key text,
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text;

-- ===== templates =====
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'transactional',
  subject text NOT NULL,
  html_body text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage templates" ON public.email_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER set_email_templates_updated_at BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== campaigns =====
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text NOT NULL,
  html_body text NOT NULL,
  kind text NOT NULL DEFAULT 'promotional',
  audience text NOT NULL DEFAULT 'all',
  user_ids uuid[] NOT NULL DEFAULT '{}',
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  template_slug text,
  status text NOT NULL DEFAULT 'draft',
  send_at timestamptz,
  queued_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_campaigns TO authenticated;
GRANT ALL ON public.email_campaigns TO service_role;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage campaigns" ON public.email_campaigns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER set_email_campaigns_updated_at BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== queue =====
CREATE TABLE IF NOT EXISTS public.email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  user_id uuid,
  to_email text NOT NULL,
  subject text NOT NULL,
  html_body text NOT NULL,
  kind text NOT NULL DEFAULT 'transactional',
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 4,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_queue_pending_idx ON public.email_queue (status, next_attempt_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_queue TO authenticated;
GRANT ALL ON public.email_queue TO service_role;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage queue" ON public.email_queue FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER set_email_queue_updated_at BEFORE UPDATE ON public.email_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== logs =====
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid,
  campaign_id uuid,
  to_email text NOT NULL,
  subject text,
  event text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_logs_created_idx ON public.email_logs (created_at DESC);
GRANT SELECT, INSERT ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read logs" ON public.email_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- ===== suppressions =====
CREATE TABLE IF NOT EXISTS public.email_suppressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  reason text NOT NULL DEFAULT 'unsubscribed',
  scope text NOT NULL DEFAULT 'promotional',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.email_suppressions TO authenticated;
GRANT ALL ON public.email_suppressions TO service_role;
ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage suppressions" ON public.email_suppressions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ===== automations =====
CREATE TABLE IF NOT EXISTS public.email_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_event text NOT NULL,
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  delay_minutes integer NOT NULL DEFAULT 0,
  template_slug text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_automations TO authenticated;
GRANT ALL ON public.email_automations TO service_role;
ALTER TABLE public.email_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage automations" ON public.email_automations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER set_email_automations_updated_at BEFORE UPDATE ON public.email_automations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== starter templates =====
INSERT INTO public.email_templates (slug,name,category,subject,html_body,variables,is_system) VALUES
 ('otp','OTP code','transactional','Your verification code','<p>Hi {{name}},</p><p>Your code is <b>{{code}}</b>. It expires in 10 minutes.</p>','["name","code"]',true),
 ('welcome','Welcome','transactional','Welcome to {{site}}','<p>Hi {{name}},</p><p>Welcome to {{site}} — set your weekly target and start your first session today.</p>','["name","site"]',true),
 ('password-reset','Password reset','transactional','Reset your password','<p>Hi {{name}},</p><p><a href="{{link}}">Reset your password</a>. Link valid for 1 hour.</p>','["name","link"]',true),
 ('test-results','Test results','transactional','Your test result','<p>Hi {{name}},</p><p>You scored <b>{{score}}</b> in {{test}}.</p>','["name","score","test"]',true),
 ('target-alert','Target alert','transactional','You are behind your target','<p>Hi {{name}},</p><p>Your goal is at {{percent}}% today. A 30 minute revision will bring it back on track.</p>','["name","percent"]',true),
 ('system-notice','System notification','transactional','{{title}}','<p>{{body}}</p>','["title","body"]',true),
 ('offer','Offer','promotional','{{title}}','<p>Hi {{name}},</p><p>{{body}}</p>','["name","title","body"]',true)
ON CONFLICT (slug) DO NOTHING;

-- ===== cron token store =====
CREATE TABLE IF NOT EXISTS public.cron_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  token text NOT NULL,
  base_url text NOT NULL DEFAULT 'https://project--95aed49a-b932-4c50-a784-c98f54307279.lovable.app',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.cron_config TO service_role;
ALTER TABLE public.cron_config ENABLE ROW LEVEL SECURITY;

-- ===== scheduled jobs =====
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule('streak-snapshot-2359-ist', '29 18 * * *', $$SELECT public.snapshot_streak_day();$$);
SELECT cron.schedule('daily-plan-refresh-ist', '0 19 * * *', $$SELECT public.refresh_all_daily_plans((now() AT TIME ZONE 'Asia/Kolkata')::date + 1);$$);
SELECT cron.schedule('close-stale-sessions', '15 * * * *', $$SELECT public.close_stale_sessions();$$);
SELECT cron.schedule('email-queue-retry', '35 * * * *', $$
  SELECT net.http_post(
    url := (SELECT base_url FROM public.cron_config WHERE id) || '/api/public/cron/email-queue',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-token',(SELECT token FROM public.cron_config WHERE id)),
    body := '{}'::jsonb
  ) WHERE EXISTS (
    SELECT 1 FROM public.cron_config WHERE id
  ) AND EXISTS (
    SELECT 1 FROM public.email_queue WHERE status IN ('pending','retry') AND next_attempt_at <= now()
  );
$$);