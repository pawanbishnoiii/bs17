
-- 1. Storage policies -------------------------------------------------------
CREATE POLICY "own chapter files read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'chapter-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own chapter files insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chapter-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own chapter files update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'chapter-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'chapter-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own chapter files delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chapter-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "branding readable" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'branding');
CREATE POLICY "branding admin insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "branding admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "branding admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'));

-- 2. Notice board -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  body text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notices TO authenticated;
GRANT ALL ON public.notices TO service_role;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own notices" ON public.notices;
CREATE POLICY "own notices" ON public.notices FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS set_notices_updated_at ON public.notices;
CREATE TRIGGER set_notices_updated_at BEFORE UPDATE ON public.notices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS notices_user_idx ON public.notices(user_id, created_at DESC);

-- 3. Odd / even day reading targets ----------------------------------------
ALTER TABLE public.reading_goals
  ADD COLUMN IF NOT EXISTS odd_day_minutes integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS even_day_minutes integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS odd_even_enabled boolean NOT NULL DEFAULT false;

-- 4. Percent based goals ----------------------------------------------------
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS daily_goal_percent integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS weekly_goal_percent integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS min_count_minutes integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS weekly_growth_factor numeric NOT NULL DEFAULT 2.0,
  ADD COLUMN IF NOT EXISTS weekly_growth_cap_percent integer NOT NULL DEFAULT 150,
  ADD COLUMN IF NOT EXISTS percent_per_hour jsonb NOT NULL DEFAULT
    '{"revision":25,"reading":20,"class":18,"newspaper":20,"practice":20,"test":20}'::jsonb;

-- 5. Resume where you left off ---------------------------------------------
ALTER TABLE public.chapter_learning_state
  ADD COLUMN IF NOT EXISTS resume_subtopic_id uuid,
  ADD COLUMN IF NOT EXISTS resume_note text,
  ADD COLUMN IF NOT EXISTS progress_pct double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stopped_at timestamptz;

-- 6. Chapter / topic based task builder ------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_user_study_plan(p_user_id uuid, p_plan_date date DEFAULT CURRENT_DATE)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
DECLARE
  n integer := 0;
  added integer := 0;
  v_dow integer := EXTRACT(ISODOW FROM p_plan_date);
  v_last_day date := (date_trunc('month', p_plan_date::timestamp) + interval '1 month - 1 day')::date;
  v_mode text;
  v_since date;
BEGIN
  IF v_dow = 7 THEN
    v_mode := 'weekly_revision'; v_since := p_plan_date - 6;
  ELSIF p_plan_date >= v_last_day - 1 THEN
    v_mode := 'monthly_revision'; v_since := date_trunc('month', p_plan_date::timestamp)::date;
  ELSE
    v_mode := 'adaptive'; v_since := NULL;
  END IF;

  DELETE FROM daily_study_plan_items
   WHERE user_id = p_user_id AND plan_date = p_plan_date
     AND completed_at IS NULL AND pinned = false AND status = 'pending';

  IF v_mode <> 'adaptive' THEN
    INSERT INTO daily_study_plan_items(
      user_id, plan_date, subject_id, subject_name, chapter_id, chapter_name,
      session_kind, target_minutes, priority, source, rank_score)
    SELECT p_user_id, p_plan_date, s.subject_id, sub.name, s.chapter_id,
           COALESCE(NULLIF(trim(s.chapter), ''), NULLIF(trim(s.topic), '')),
           'revision',
           GREATEST(10, LEAST(60, round(SUM(COALESCE(s.duration_minutes, 0)) * 0.4)::integer)),
           ROW_NUMBER() OVER (ORDER BY SUM(COALESCE(s.duration_minutes, 0)) DESC)::integer,
           v_mode, 600
      FROM study_sessions s
      LEFT JOIN subjects sub ON sub.id = s.subject_id
     WHERE s.user_id = p_user_id
       AND s.is_running = false
       AND s.started_at >= v_since::timestamptz
       AND COALESCE(NULLIF(trim(s.chapter), ''), NULLIF(trim(s.topic), '')) IS NOT NULL
     GROUP BY s.subject_id, sub.name, s.chapter_id,
              COALESCE(NULLIF(trim(s.chapter), ''), NULLIF(trim(s.topic), ''));
    GET DIAGNOSTICS n = ROW_COUNT;
    RETURN n;
  END IF;

  -- a) spaced revisions that are due
  INSERT INTO daily_study_plan_items(
    user_id, plan_date, subject_id, subject_name, chapter_id, chapter_name,
    session_kind, target_minutes, priority, source, rank_score, next_review_at, review_stage)
  SELECT p_user_id, p_plan_date, c.subject_id, sub.name, c.chapter_id, c.chapter_name,
         'revision', GREATEST(10, LEAST(45, COALESCE(NULLIF(c.revision_minutes, 0), 20))),
         ROW_NUMBER() OVER (ORDER BY c.next_review_at)::integer,
         'adaptive', 500, c.next_review_at, c.review_stage
    FROM chapter_learning_state c
    LEFT JOIN subjects sub ON sub.id = c.subject_id
   WHERE c.user_id = p_user_id
     AND c.next_review_at IS NOT NULL
     AND c.next_review_at <= (p_plan_date + 1)::timestamptz;
  GET DIAGNOSTICS added = ROW_COUNT; n := n + added;

  -- b) class notes whose revision is due
  INSERT INTO daily_study_plan_items(
    user_id, plan_date, subject_id, subject_name, chapter_name, class_id,
    session_kind, target_minutes, priority, source, rank_score, next_review_at, review_stage)
  SELECT p_user_id, p_plan_date, cl.subject_id, sub.name,
         COALESCE(cl.chapter_name, cl.title), cl.class_id,
         'notes_revision', 20,
         100 + ROW_NUMBER() OVER (ORDER BY cl.next_review_at)::integer,
         'adaptive', 450, cl.next_review_at, cl.review_stage
    FROM class_note_revision_state cl
    LEFT JOIN subjects sub ON sub.id = cl.subject_id
   WHERE cl.user_id = p_user_id
     AND cl.revisions_done < cl.target_revisions
     AND cl.next_review_at <= (p_plan_date + 1)::timestamptz;
  GET DIAGNOSTICS added = ROW_COUNT; n := n + added;

  -- c) unfinished chapters, resumed from where the student stopped
  INSERT INTO daily_study_plan_items(
    user_id, plan_date, subject_id, subject_name, chapter_id, chapter_name,
    subtopic_id, session_kind, target_minutes, priority, source, rank_score)
  SELECT p_user_id, p_plan_date, c.subject_id, sub.name, c.chapter_id, c.chapter_name,
         c.resume_subtopic_id, 'reading', 30,
         200 + ROW_NUMBER() OVER (ORDER BY c.stopped_at DESC NULLS LAST)::integer,
         'resume', 350
    FROM chapter_learning_state c
    LEFT JOIN subjects sub ON sub.id = c.subject_id
   WHERE c.user_id = p_user_id
     AND c.first_pass_completed_at IS NULL
     AND (c.reading_minutes > 0 OR c.progress_pct > 0)
   ORDER BY c.stopped_at DESC NULLS LAST
   LIMIT 3;
  GET DIAGNOSTICS added = ROW_COUNT; n := n + added;

  -- d) the next brand new chapter per subject
  INSERT INTO daily_study_plan_items(
    user_id, plan_date, subject_id, subject_name, chapter_id, chapter_name,
    session_kind, target_minutes, priority, source, rank_score)
  SELECT p_user_id, p_plan_date, ch.subject_id, sub.name, ch.id, ch.name,
         'reading', COALESCE(NULLIF(ch.estimated_minutes, 0), 30),
         300 + ROW_NUMBER() OVER (ORDER BY ch.position)::integer,
         'adaptive', 200
    FROM (
      SELECT DISTINCT ON (x.subject_id) x.*
        FROM chapters x
       WHERE x.user_id = p_user_id AND x.archived = false AND x.first_pass_done = false
         AND NOT EXISTS (
           SELECT 1 FROM chapter_learning_state s
            WHERE s.user_id = p_user_id AND s.chapter_id = x.id
              AND s.first_pass_completed_at IS NULL AND s.progress_pct > 0)
       ORDER BY x.subject_id, x.position, x.created_at
    ) ch
    LEFT JOIN subjects sub ON sub.id = ch.subject_id;
  GET DIAGNOSTICS added = ROW_COUNT; n := n + added;

  RETURN n;
END $fn$;
