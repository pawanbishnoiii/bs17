-- 1. Storage policies: every user owns files under their own uid/ prefix
DO $$
DECLARE b text;
BEGIN
  FOREACH b IN ARRAY ARRAY['data','class-media','chapter-pdfs','brand','branding'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_own_select');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_own_insert');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_own_update');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_own_delete');
    EXECUTE format($p$CREATE POLICY %I ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = %L AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')))$p$, b || '_own_select', b);
    EXECUTE format($p$CREATE POLICY %I ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = %L AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')))$p$, b || '_own_insert', b);
    EXECUTE format($p$CREATE POLICY %I ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = %L AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')))$p$, b || '_own_update', b);
    EXECUTE format($p$CREATE POLICY %I ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = %L AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')))$p$, b || '_own_delete', b);
  END LOOP;
END $$;

-- 2. Class file manager: folder tree (subject > chapter > type) + media items
CREATE TABLE IF NOT EXISTS public.class_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  parent_id uuid REFERENCES public.class_folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'custom',
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
  chapter_id uuid REFERENCES public.chapters(id) ON DELETE CASCADE,
  system_managed boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_folders TO authenticated;
GRANT ALL ON public.class_folders TO service_role;
ALTER TABLE public.class_folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS class_folders_own ON public.class_folders;
CREATE POLICY class_folders_own ON public.class_folders FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.class_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  folder_id uuid REFERENCES public.class_folders(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  chapter_id uuid REFERENCES public.chapters(id) ON DELETE SET NULL,
  title text NOT NULL,
  media_kind text NOT NULL DEFAULT 'file',
  source text NOT NULL DEFAULT 'upload',
  storage_path text,
  external_url text,
  mime_type text,
  file_size bigint,
  duration_seconds integer,
  thumbnail_url text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_media TO authenticated;
GRANT ALL ON public.class_media TO service_role;
ALTER TABLE public.class_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS class_media_own ON public.class_media;
CREATE POLICY class_media_own ON public.class_media FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS class_media_folder_idx ON public.class_media(user_id, folder_id);

-- 3. Admin error monitor
CREATE TABLE IF NOT EXISTS public.error_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  category text NOT NULL,
  severity text NOT NULL DEFAULT 'error',
  message text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  context text,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.error_events TO authenticated;
GRANT ALL ON public.error_events TO service_role;
ALTER TABLE public.error_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS error_events_insert ON public.error_events;
CREATE POLICY error_events_insert ON public.error_events FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
DROP POLICY IF EXISTS error_events_admin_read ON public.error_events;
CREATE POLICY error_events_admin_read ON public.error_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS error_events_admin_update ON public.error_events;
CREATE POLICY error_events_admin_update ON public.error_events FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS error_events_admin_delete ON public.error_events;
CREATE POLICY error_events_admin_delete ON public.error_events FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS error_events_created_idx ON public.error_events(created_at DESC);

-- 4. Target mode (weekly / monthly) chosen during onboarding
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS target_mode text NOT NULL DEFAULT 'weekly';

-- 5. Daily streak snapshot, written nightly at 23:59
CREATE TABLE IF NOT EXISTS public.streak_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  day date NOT NULL,
  percent integer NOT NULL DEFAULT 0,
  goal_met boolean NOT NULL DEFAULT false,
  lifeline_used boolean NOT NULL DEFAULT false,
  streak_after integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);
GRANT SELECT ON public.streak_days TO authenticated;
GRANT ALL ON public.streak_days TO service_role;
ALTER TABLE public.streak_days ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS streak_days_own ON public.streak_days;
CREATE POLICY streak_days_own ON public.streak_days FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));