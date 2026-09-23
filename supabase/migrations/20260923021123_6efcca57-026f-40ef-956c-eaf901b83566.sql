CREATE TABLE IF NOT EXISTS public.oauth_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  google_client_id text,
  google_client_secret text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.oauth_settings TO service_role;
ALTER TABLE public.oauth_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.oauth_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;