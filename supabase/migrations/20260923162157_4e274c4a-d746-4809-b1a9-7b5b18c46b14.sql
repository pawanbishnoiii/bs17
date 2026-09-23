ALTER TABLE public.profiles ALTER COLUMN avg_study_hours SET DEFAULT 8;
UPDATE public.profiles SET avg_study_hours = 8 WHERE avg_study_hours IS NULL OR avg_study_hours = 0;

CREATE TABLE IF NOT EXISTS public.weekly_focus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  subject_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_focus TO authenticated;
GRANT ALL ON public.weekly_focus TO service_role;
ALTER TABLE public.weekly_focus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own weekly focus" ON public.weekly_focus FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER set_weekly_focus_updated_at BEFORE UPDATE ON public.weekly_focus FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.refresh_user_study_plan(p_user_id uuid, p_plan_date date DEFAULT CURRENT_DATE)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  n integer := 0; added integer := 0;
  v_dow integer := EXTRACT(ISODOW FROM p_plan_date);
  v_last_day date := (date_trunc('month', p_plan_date::timestamp) + interval '1 month - 1 day')::date;
  v_mode text; v_since date;
  v_budget integer; v_used integer;
  v_week date := p_plan_date - (EXTRACT(ISODOW FROM p_plan_date)::int - 1);
  v_main uuid[];
BEGIN
  SELECT GREATEST(60, round(COALESCE(NULLIF(avg_study_hours,0), 8) * 60))::int INTO v_budget FROM profiles WHERE id = p_user_id;
  v_budget := COALESCE(v_budget, 480);
  SELECT subject_ids INTO v_main FROM weekly_focus WHERE user_id = p_user_id AND week_start = v_week;
  v_main := COALESCE(v_main, '{}');

  IF v_dow = 7 THEN v_mode := 'weekly_revision'; v_since := p_plan_date - 6;
  ELSIF p_plan_date >= v_last_day - 1 THEN v_mode := 'monthly_revision'; v_since := date_trunc('month', p_plan_date::timestamp)::date;
  ELSE v_mode := 'adaptive'; END IF;

  DELETE FROM daily_study_plan_items WHERE user_id = p_user_id AND plan_date = p_plan_date
     AND completed_at IS NULL AND pinned = false AND status = 'pending';

  IF v_mode <> 'adaptive' THEN
    INSERT INTO daily_study_plan_items(user_id, plan_date, subject_id, subject_name, chapter_name, session_kind, target_minutes, priority, source, rank_score)
    SELECT p_user_id, p_plan_date, s.subject_id, max(sub.name), s.ch, 'revision',
           GREATEST(20, LEAST(90, round(SUM(COALESCE(s.duration_minutes,0))*0.4)::int)),
           ROW_NUMBER() OVER (ORDER BY SUM(COALESCE(s.duration_minutes,0)) DESC)::int, v_mode, 600
      FROM (SELECT x.subject_id, x.duration_minutes, COALESCE(NULLIF(trim(x.chapter),''), NULLIF(trim(x.topic),'')) ch
              FROM study_sessions x WHERE x.user_id = p_user_id AND x.is_running = false AND x.started_at >= v_since::timestamptz) s
      LEFT JOIN subjects sub ON sub.id = s.subject_id
     WHERE s.ch IS NOT NULL GROUP BY s.subject_id, s.ch ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS n = ROW_COUNT; RETURN n;
  END IF;

  -- 1. due chapter revisions (1/3/7/15/30 ladder); overdue ones stay until done
  INSERT INTO daily_study_plan_items(user_id, plan_date, subject_id, subject_name, chapter_id, chapter_name, session_kind, target_minutes, priority, source, rank_score, next_review_at, review_stage)
  SELECT p_user_id, p_plan_date, c.subject_id, sub.name, c.chapter_id, c.chapter_name, 'revision',
         GREATEST(15, LEAST(45, COALESCE(NULLIF(c.revision_minutes,0),20))),
         ROW_NUMBER() OVER (ORDER BY c.next_review_at)::int, 'adaptive', 500, c.next_review_at, c.review_stage
    FROM (SELECT DISTINCT ON (y.subject_id, COALESCE(y.chapter_name,'')) y.* FROM chapter_learning_state y
           WHERE y.user_id = p_user_id AND y.next_review_at IS NOT NULL AND y.review_stage < 5
             AND y.next_review_at < (p_plan_date + 1)::timestamptz
           ORDER BY y.subject_id, COALESCE(y.chapter_name,''), y.next_review_at) c
    LEFT JOIN subjects sub ON sub.id = c.subject_id ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS added = ROW_COUNT; n := n + added;

  -- 2. class notes revisions
  INSERT INTO daily_study_plan_items(user_id, plan_date, subject_id, subject_name, chapter_name, class_id, session_kind, target_minutes, priority, source, rank_score, next_review_at, review_stage)
  SELECT p_user_id, p_plan_date, cl.subject_id, sub.name, COALESCE(cl.chapter_name, cl.title), cl.class_id, 'notes_revision', 20,
         100 + ROW_NUMBER() OVER (ORDER BY cl.next_review_at)::int, 'adaptive', 450, cl.next_review_at, cl.review_stage
    FROM (SELECT DISTINCT ON (y.class_id) y.* FROM class_note_revision_state y
           WHERE y.user_id = p_user_id AND y.revisions_done < y.target_revisions AND y.next_review_at < (p_plan_date + 1)::timestamptz
           ORDER BY y.class_id, y.next_review_at) cl
    LEFT JOIN subjects sub ON sub.id = cl.subject_id ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS added = ROW_COUNT; n := n + added;

  -- 3. resume unfinished chapters
  INSERT INTO daily_study_plan_items(user_id, plan_date, subject_id, subject_name, chapter_id, chapter_name, subtopic_id, session_kind, target_minutes, priority, source, rank_score)
  SELECT p_user_id, p_plan_date, c.subject_id, sub.name, c.chapter_id, c.chapter_name, c.resume_subtopic_id, 'reading',
         GREATEST(90, round(90 * (1 - COALESCE(c.progress_pct,0)/100.0))::int),
         200 + ROW_NUMBER() OVER (ORDER BY c.stopped_at DESC NULLS LAST)::int, 'resume', 350
    FROM (SELECT DISTINCT ON (y.subject_id, COALESCE(y.chapter_name,'')) y.* FROM chapter_learning_state y
           WHERE y.user_id = p_user_id AND y.first_pass_completed_at IS NULL AND (y.reading_minutes > 0 OR y.progress_pct > 0)
           ORDER BY y.subject_id, COALESCE(y.chapter_name,''), y.stopped_at DESC NULLS LAST) c
    LEFT JOIN subjects sub ON sub.id = c.subject_id ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS added = ROW_COUNT; n := n + added;

  SELECT COALESCE(SUM(target_minutes),0) INTO v_used FROM daily_study_plan_items
   WHERE user_id = p_user_id AND plan_date = p_plan_date AND status = 'pending';

  -- 4. new chapters across all subjects, main subjects weighted ~60%, min 90 min each, until day budget is full
  INSERT INTO daily_study_plan_items(user_id, plan_date, subject_id, subject_name, chapter_id, chapter_name, session_kind, target_minutes, priority, source, rank_score)
  SELECT p_user_id, p_plan_date, q.subject_id, q.sname, q.id, q.name, 'reading', q.mins, 300 + q.ord::int, 'adaptive', 200
    FROM (
      SELECT r.*, SUM(r.mins) OVER (ORDER BY r.ord) AS cum FROM (
        SELECT x.id, x.name, x.subject_id, sub.name sname,
               GREATEST(90, COALESCE(x.estimated_minutes,0)) mins,
               ROW_NUMBER() OVER (ORDER BY
                 ROW_NUMBER() OVER (PARTITION BY x.subject_id ORDER BY x.position, x.created_at)
                   * CASE WHEN x.subject_id = ANY(v_main) THEN 0.67 WHEN cardinality(v_main) > 0 THEN 1.5 ELSE 1 END,
                 x.subject_id) ord
          FROM chapters x LEFT JOIN subjects sub ON sub.id = x.subject_id
         WHERE x.user_id = p_user_id AND x.archived = false AND x.first_pass_done = false
           AND NOT EXISTS (SELECT 1 FROM chapter_learning_state s WHERE s.user_id = p_user_id AND s.chapter_id = x.id AND (s.progress_pct > 0 OR s.first_pass_completed_at IS NOT NULL))
      ) r
    ) q
   WHERE q.cum - q.mins < GREATEST(90, v_budget - v_used)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS added = ROW_COUNT; n := n + added;
  RETURN n;
END $function$;