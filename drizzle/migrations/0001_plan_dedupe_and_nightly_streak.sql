CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA cron;

CREATE OR REPLACE FUNCTION public.goal_percent_for(_kind text, _minutes numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN COALESCE(_minutes,0) < 5 THEN 0
    ELSE (COALESCE(_minutes,0) / 60.0) * CASE lower(COALESCE(_kind,''))
      WHEN 'revision' THEN 23
      WHEN 'notes_revision' THEN 23
      WHEN 'class' THEN 15
      WHEN 'live' THEN 15
      WHEN 'newspaper' THEN 24
      WHEN 'reading' THEN 20
      ELSE 20 END
  END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_user_study_plan(p_user_id uuid, p_plan_date date DEFAULT CURRENT_DATE)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
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
      user_id, plan_date, subject_id, subject_name, chapter_name,
      session_kind, target_minutes, priority, source, rank_score)
    SELECT p_user_id, p_plan_date, s.subject_id, max(sub.name), s.ch,
           GREATEST(10, LEAST(60, round(SUM(COALESCE(s.duration_minutes, 0)) * 0.4)::integer)),
           ROW_NUMBER() OVER (ORDER BY SUM(COALESCE(s.duration_minutes, 0)) DESC)::integer,
           v_mode, 600
      FROM (
        SELECT x.subject_id, x.duration_minutes,
               COALESCE(NULLIF(trim(x.chapter), ''), NULLIF(trim(x.topic), '')) AS ch
          FROM study_sessions x
         WHERE x.user_id = p_user_id AND x.is_running = false
           AND x.started_at >= v_since::timestamptz
      ) s
      LEFT JOIN subjects sub ON sub.id = s.subject_id
     WHERE s.ch IS NOT NULL
     GROUP BY s.subject_id, s.ch
    ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS n = ROW_COUNT;
    RETURN n;
  END IF;

  INSERT INTO daily_study_plan_items(
    user_id, plan_date, subject_id, subject_name, chapter_id, chapter_name,
    session_kind, target_minutes, priority, source, rank_score, next_review_at, review_stage)
  SELECT p_user_id, p_plan_date, c.subject_id, sub.name, c.chapter_id, c.chapter_name,
         'revision', GREATEST(10, LEAST(45, COALESCE(NULLIF(c.revision_minutes, 0), 20))),
         ROW_NUMBER() OVER (ORDER BY c.next_review_at)::integer,
         'adaptive', 500, c.next_review_at, c.review_stage
    FROM (
      SELECT DISTINCT ON (COALESCE(y.subject_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(y.chapter_name,'')) y.*
        FROM chapter_learning_state y
       WHERE y.user_id = p_user_id AND y.next_review_at IS NOT NULL
         AND y.next_review_at <= (p_plan_date + 1)::timestamptz
       ORDER BY COALESCE(y.subject_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(y.chapter_name,''), y.next_review_at
    ) c
    LEFT JOIN subjects sub ON sub.id = c.subject_id
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS added = ROW_COUNT; n := n + added;

  INSERT INTO daily_study_plan_items(
    user_id, plan_date, subject_id, subject_name, chapter_name, class_id,
    session_kind, target_minutes, priority, source, rank_score, next_review_at, review_stage)
  SELECT p_user_id, p_plan_date, cl.subject_id, sub.name,
         COALESCE(cl.chapter_name, cl.title), cl.class_id,
         'notes_revision', 20,
         100 + ROW_NUMBER() OVER (ORDER BY cl.next_review_at)::integer,
         'adaptive', 450, cl.next_review_at, cl.review_stage
    FROM (
      SELECT DISTINCT ON (y.class_id) y.*
        FROM class_note_revision_state y
       WHERE y.user_id = p_user_id AND y.revisions_done < y.target_revisions
         AND y.next_review_at <= (p_plan_date + 1)::timestamptz
       ORDER BY y.class_id, y.next_review_at
    ) cl
    LEFT JOIN subjects sub ON sub.id = cl.subject_id
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS added = ROW_COUNT; n := n + added;

  INSERT INTO daily_study_plan_items(
    user_id, plan_date, subject_id, subject_name, chapter_id, chapter_name,
    subtopic_id, session_kind, target_minutes, priority, source, rank_score)
  SELECT p_user_id, p_plan_date, c.subject_id, sub.name, c.chapter_id, c.chapter_name,
         c.resume_subtopic_id, 'reading', 30,
         200 + ROW_NUMBER() OVER (ORDER BY c.stopped_at DESC NULLS LAST)::integer,
         'resume', 350
    FROM (
      SELECT DISTINCT ON (COALESCE(y.subject_id,'00000000-0000-0000-0000-000000000000'::uuid), COALESCE(y.chapter_name,'')) y.*
        FROM chapter_learning_state y
       WHERE y.user_id = p_user_id AND y.first_pass_completed_at IS NULL
         AND (y.reading_minutes > 0 OR y.progress_pct > 0)
       ORDER BY COALESCE(y.subject_id,'00000000-0000-0000-0000-000000000000'::uuid), COALESCE(y.chapter_name,''), y.stopped_at DESC NULLS LAST
    ) c
    LEFT JOIN subjects sub ON sub.id = c.subject_id
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS added = ROW_COUNT; n := n + added;

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
    LEFT JOIN subjects sub ON sub.id = ch.subject_id
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS added = ROW_COUNT; n := n + added;

  RETURN n;
END
$fn$;

CREATE OR REPLACE FUNCTION public.snapshot_streak_day(p_day date DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_day date := COALESCE(p_day, (now() AT TIME ZONE 'Asia/Kolkata')::date);
  v_week_start date := v_day - ((EXTRACT(ISODOW FROM v_day)::int) - 1);
  r record;
  v_pct numeric;
  v_prev integer;
  v_used integer;
  v_lifeline boolean;
  v_after integer;
  v_rows integer := 0;
BEGIN
  FOR r IN SELECT id FROM profiles LOOP
    SELECT COALESCE(SUM(public.goal_percent_for(s.kind, s.duration_minutes)), 0)
      INTO v_pct
      FROM study_sessions s
     WHERE s.user_id = r.id AND s.is_running = false
       AND (s.started_at AT TIME ZONE 'Asia/Kolkata')::date = v_day;

    SELECT COALESCE(streak_after, 0) INTO v_prev
      FROM streak_days WHERE user_id = r.id AND day = v_day - 1;
    v_prev := COALESCE(v_prev, 0);

    SELECT COUNT(*) INTO v_used FROM streak_days
     WHERE user_id = r.id AND lifeline_used AND day >= v_week_start AND day < v_day;

    IF v_pct >= 100 THEN
      v_lifeline := false; v_after := v_prev + 1;
    ELSIF v_prev > 0 AND v_used < 2 THEN
      v_lifeline := true;  v_after := v_prev;
    ELSE
      v_lifeline := false; v_after := 0;
    END IF;

    INSERT INTO streak_days(user_id, day, percent, goal_met, lifeline_used, streak_after)
    VALUES (r.id, v_day, LEAST(100, round(v_pct))::int, v_pct >= 100, v_lifeline, v_after)
    ON CONFLICT (user_id, day) DO UPDATE
      SET percent = EXCLUDED.percent, goal_met = EXCLUDED.goal_met,
          lifeline_used = EXCLUDED.lifeline_used, streak_after = EXCLUDED.streak_after;
    v_rows := v_rows + 1;
  END LOOP;
  RETURN v_rows;
END
$fn$;

REVOKE ALL ON FUNCTION public.snapshot_streak_day(date) FROM anon, authenticated;

SELECT cron.unschedule('nightly-streak-snapshot')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'nightly-streak-snapshot');
SELECT cron.schedule('nightly-streak-snapshot', '29 18 * * *', $$SELECT public.snapshot_streak_day();$$);