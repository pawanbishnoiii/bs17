ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS bg_mobile_url text,
  ADD COLUMN IF NOT EXISTS bg_desktop_url text,
  ADD COLUMN IF NOT EXISTS bg_blur integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bg_overlay integer NOT NULL DEFAULT 0;