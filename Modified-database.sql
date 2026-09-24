CREATE FUNCTION public.close_stale_sessions() RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ UPDATE study_sessions SET is_running=false,auto_closed=true,ended_at=COALESCE(planned_end_at,started_at+interval '8 hours'),duration_minutes=GREATEST(1,round(EXTRACT(EPOCH FROM (COALESCE(planned_end_at,started_at+interval '8 hours')-started_at))/60)::integer) WHERE is_running AND started_at<now()-interval '8 hours' $$;
CREATE FUNCTION public.complete_my_revision(p_kind text, p_minutes integer DEFAULT 15, p_state_id uuid DEFAULT NULL::uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ DECLARE intervals integer[]:=ARRAY[1,3,7,15,30]; st integer; BEGIN IF p_kind='class' THEN UPDATE class_note_revision_state SET revisions_done=revisions_done+1,review_stage=review_stage+1,last_revised_at=now(),total_minutes=total_minutes+GREATEST(p_minutes,0),next_review_at=now()+make_interval(days=>intervals[LEAST(review_stage+1,array_length(intervals,1))]) WHERE id=p_state_id AND user_id=auth.uid() RETURNING review_stage INTO st; ELSE UPDATE chapter_learning_state SET revision_sessions=revision_sessions+1,revision_minutes=revision_minutes+GREATEST(p_minutes,0),review_stage=review_stage+1,last_studied_at=now(),next_review_at=now()+make_interval(days=>intervals[LEAST(review_stage+1,array_length(intervals,1))]) WHERE id=p_state_id AND user_id=auth.uid() RETURNING review_stage INTO st; END IF; RETURN COALESCE(st,0)::text; END $$;
CREATE FUNCTION public.ensure_my_subject_targets() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ DECLARE n integer; BEGIN INSERT INTO subject_targets(user_id,subject_id,daily_minutes,weekly_minutes,monthly_minutes,daily_topics,weekly_topics,monthly_topics,daily_chapters,weekly_chapters,monthly_chapters,daily_questions,weekly_questions,monthly_questions) SELECT auth.uid(),s.id,GREATEST(15,round(s.weekly_target_hours*60/7)),round(s.weekly_target_hours*60),round(s.weekly_target_hours*60*4.345),1,GREATEST(1,CEIL(jsonb_array_length(COALESCE(s.chapters,'[]'::jsonb))::numeric/4)),jsonb_array_length(COALESCE(s.chapters,'[]'::jsonb)),1,1,GREATEST(1,CEIL(jsonb_array_length(COALESCE(s.chapters,'[]'::jsonb))::numeric/2)),10,70,300 FROM subjects s WHERE s.user_id=auth.uid() ON CONFLICT(user_id,subject_id) DO NOTHING; GET DIAGNOSTICS n=ROW_COUNT; RETURN n; END $$;
CREATE FUNCTION public.goal_percent_for(_kind text, _minutes numeric) RETURNS numeric
    LANGUAGE sql IMMUTABLE
    AS $$
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
CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ BEGIN INSERT INTO public.profiles(id,email,display_name,avatar_url) VALUES(NEW.id,NEW.email,COALESCE(NEW.raw_user_meta_data->>'full_name',NEW.raw_user_meta_data->>'name'),COALESCE(NEW.raw_user_meta_data->>'avatar_url',NEW.raw_user_meta_data->>'picture')) ON CONFLICT(id) DO NOTHING; INSERT INTO public.user_settings(user_id) VALUES(NEW.id) ON CONFLICT(user_id) DO NOTHING; INSERT INTO public.user_xp(user_id) VALUES(NEW.id) ON CONFLICT DO NOTHING; INSERT INTO public.reading_goals(user_id) VALUES(NEW.id) ON CONFLICT(user_id) DO NOTHING; RETURN NEW; END $$;
CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;
CREATE FUNCTION public.log_reading(_kind text, _minutes integer) RETURNS public.reading_logs
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ DECLARE r public.reading_logs; BEGIN INSERT INTO reading_logs(user_id,kind,log_date,minutes,sittings) VALUES(auth.uid(),_kind,CURRENT_DATE,GREATEST(_minutes,0),1) ON CONFLICT(user_id,log_date,kind) DO UPDATE SET minutes=reading_logs.minutes+EXCLUDED.minutes,sittings=reading_logs.sittings+1,updated_at=now() RETURNING * INTO r; RETURN r; END $$;
CREATE FUNCTION public.rebuild_my_streak_history() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE u uuid := auth.uid(); d date; v_end date := (now() AT TIME ZONE 'Asia/Kolkata')::date - 1;
  v_pct numeric; v_prev integer := 0; v_used integer; v_after integer; v_life boolean; n integer := 0;
BEGIN
  IF u IS NULL THEN RETURN 0; END IF;
  SELECT min((started_at AT TIME ZONE 'Asia/Kolkata')::date) INTO d FROM study_sessions WHERE user_id=u;
  IF d IS NULL THEN RETURN 0; END IF;
  WHILE d <= v_end LOOP
    SELECT COALESCE(SUM(goal_percent_for(kind,duration_minutes)),0) INTO v_pct FROM study_sessions
     WHERE user_id=u AND is_running=false AND (started_at AT TIME ZONE 'Asia/Kolkata')::date=d;
    SELECT count(*) INTO v_used FROM streak_days WHERE user_id=u AND lifeline_used
      AND day >= d - (EXTRACT(ISODOW FROM d)::int - 1) AND day < d;
    IF v_pct >= 100 THEN v_life:=false; v_after:=v_prev+1;
    ELSIF v_prev>0 AND v_used<2 THEN v_life:=true; v_after:=v_prev;
    ELSE v_life:=false; v_after:=0; END IF;
    INSERT INTO streak_days(user_id,day,percent,goal_met,lifeline_used,streak_after)
    VALUES(u,d,LEAST(100,round(v_pct))::int,v_pct>=100,v_life,v_after)
    ON CONFLICT(user_id,day) DO UPDATE SET percent=EXCLUDED.percent,goal_met=EXCLUDED.goal_met,lifeline_used=EXCLUDED.lifeline_used,streak_after=EXCLUDED.streak_after;
    v_prev := v_after; n := n+1; d := d+1;
  END LOOP;
  UPDATE user_xp SET streak=v_prev, best_streak=GREATEST(COALESCE(best_streak,0),(SELECT max(streak_after) FROM streak_days WHERE user_id=u)) WHERE user_id=u;
  RETURN n;
END $$;
CREATE FUNCTION public.reconcile_session_to_plan() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_day date; v_ch text;
BEGIN
  IF NEW.is_running THEN RETURN NEW; END IF;
  v_day := (NEW.started_at AT TIME ZONE 'Asia/Kolkata')::date;
  v_ch := lower(trim(COALESCE(NULLIF(NEW.chapter,''), NEW.topic, '')));
  UPDATE daily_study_plan_items p
     SET completed_at = now(), completed_session_id = NEW.id
   WHERE p.user_id = NEW.user_id AND p.plan_date = v_day AND p.completed_at IS NULL AND p.status = 'pending'
     AND (p.subject_id IS NULL OR p.subject_id = NEW.subject_id)
     AND ((p.chapter_id IS NOT NULL AND p.chapter_id = NEW.chapter_id) OR (v_ch <> '' AND lower(trim(COALESCE(p.chapter_name,''))) = v_ch))
     AND (SELECT COALESCE(SUM(s.duration_minutes),0) FROM study_sessions s
           WHERE s.user_id = NEW.user_id AND s.is_running = false
             AND (s.started_at AT TIME ZONE 'Asia/Kolkata')::date = v_day
             AND (s.subject_id = p.subject_id OR p.subject_id IS NULL)
             AND ((p.chapter_id IS NOT NULL AND s.chapter_id = p.chapter_id)
                  OR lower(trim(COALESCE(NULLIF(s.chapter,''), s.topic, ''))) = lower(trim(COALESCE(p.chapter_name,'')))))
         >= GREATEST(1, p.target_minutes * 0.8);
  RETURN NEW;
END $$;
CREATE FUNCTION public.refresh_user_study_plan(p_user_id uuid, p_plan_date date DEFAULT CURRENT_DATE) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
  INSERT INTO daily_study_plan_items(user_id, plan_date, subject_id, subject_name, chapter_name, class_id, session_kind, target_minutes, priority, source, rank_score, next_review_at, review_stage)
  SELECT p_user_id, p_plan_date, cl.subject_id, sub.name, COALESCE(cl.chapter_name, cl.title), cl.class_id, 'notes_revision', 20,
         100 + ROW_NUMBER() OVER (ORDER BY cl.next_review_at)::int, 'adaptive', 450, cl.next_review_at, cl.review_stage
    FROM (SELECT DISTINCT ON (y.class_id) y.* FROM class_note_revision_state y
           WHERE y.user_id = p_user_id AND y.revisions_done < y.target_revisions AND y.next_review_at < (p_plan_date + 1)::timestamptz
           ORDER BY y.class_id, y.next_review_at) cl
    LEFT JOIN subjects sub ON sub.id = cl.subject_id ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS added = ROW_COUNT; n := n + added;
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
  INSERT INTO daily_study_plan_items(user_id, plan_date, subject_id, subject_name, chapter_id, chapter_name, session_kind, target_minutes, priority, source, rank_score)
  SELECT p_user_id, p_plan_date, q.subject_id, q.sname, q.id, q.name, 'reading', q.mins, 300 + q.ord::int, 'adaptive', 200
    FROM (
      SELECT r.*, SUM(r.mins) OVER (ORDER BY r.ord) AS cum FROM (
        SELECT b.id, b.name, b.subject_id, b.sname, b.mins,
               ROW_NUMBER() OVER (ORDER BY b.seq * CASE WHEN b.subject_id = ANY(v_main) THEN 0.67 WHEN cardinality(v_main) > 0 THEN 1.5 ELSE 1 END, b.subject_id) ord
          FROM (
            SELECT x.id, x.name, x.subject_id, sub.name sname,
                   GREATEST(90, COALESCE(x.estimated_minutes,0)) mins,
                   ROW_NUMBER() OVER (PARTITION BY x.subject_id ORDER BY x.position, x.created_at) seq
              FROM chapters x LEFT JOIN subjects sub ON sub.id = x.subject_id
             WHERE x.user_id = p_user_id AND x.archived = false AND x.first_pass_done = false
               AND NOT EXISTS (SELECT 1 FROM chapter_learning_state s WHERE s.user_id = p_user_id AND s.chapter_id = x.id AND (s.progress_pct > 0 OR s.first_pass_completed_at IS NOT NULL))
          ) b
      ) r
    ) q
   WHERE q.cum - q.mins < GREATEST(90, v_budget - v_used)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS added = ROW_COUNT; n := n + added;
  RETURN n;
END $$;
CREATE FUNCTION public.refresh_all_daily_plans(p_plan_date date DEFAULT CURRENT_DATE) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ DECLARE u record; total integer:=0; BEGIN FOR u IN SELECT id FROM profiles LOOP total:=total+public.refresh_user_study_plan(u.id,p_plan_date); END LOOP; RETURN total; END $$;
CREATE FUNCTION public.refresh_my_study_plan(p_plan_date date DEFAULT CURRENT_DATE) RETURNS integer
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ SELECT public.refresh_user_study_plan(auth.uid(),p_plan_date) $$;
CREATE FUNCTION public.schedule_my_daily_plan(p_plan_date date) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ BEGIN PERFORM public.refresh_my_study_plan(p_plan_date); WITH x AS (SELECT id,target_minutes,ROW_NUMBER() OVER(ORDER BY priority,rank_score DESC) n FROM daily_study_plan_items WHERE user_id=auth.uid() AND plan_date=p_plan_date AND status='pending') UPDATE daily_study_plan_items d SET scheduled_start=(p_plan_date::timestamp+time '06:00'+((x.n-1)*interval '45 minutes')),scheduled_end=(p_plan_date::timestamp+time '06:00'+((x.n-1)*interval '45 minutes')+(x.target_minutes*interval '1 minute')) FROM x WHERE d.id=x.id; END $$;
CREATE FUNCTION public.set_plan_item_status(_item_id uuid, _status text) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ DECLARE n integer; BEGIN IF _status NOT IN ('pending','skipped','cancelled') THEN RAISE EXCEPTION 'Invalid status'; END IF; UPDATE daily_study_plan_items SET status=_status,skipped_at=CASE WHEN _status='skipped' THEN now() ELSE NULL END,cancelled_at=CASE WHEN _status='cancelled' THEN now() ELSE NULL END WHERE id=_item_id AND user_id=auth.uid(); GET DIAGNOSTICS n=ROW_COUNT; RETURN n; END $$;
CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
CREATE FUNCTION public.snapshot_streak_day(p_day date DEFAULT NULL::date) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;
CREATE FUNCTION public.sync_user_class_folders(p_user uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE n integer := 0; k integer;
BEGIN
  INSERT INTO class_folders(user_id,name,kind,subject_id,system_managed,position)
  SELECT p_user, s.name, 'subject', s.id, true, (ROW_NUMBER() OVER (ORDER BY s.created_at))::int
    FROM subjects s WHERE s.user_id=p_user
     AND NOT EXISTS (SELECT 1 FROM class_folders f WHERE f.user_id=p_user AND f.kind='subject' AND f.subject_id=s.id);
  GET DIAGNOSTICS k=ROW_COUNT; n:=n+k;
  UPDATE class_folders f SET name=s.name FROM subjects s
   WHERE f.user_id=p_user AND f.kind='subject' AND f.subject_id=s.id AND f.name<>s.name;
  INSERT INTO class_folders(user_id,parent_id,name,kind,subject_id,chapter_id,system_managed,position)
  SELECT p_user, sf.id, c.name, 'chapter', c.subject_id, c.id, true, COALESCE(c.position,0)
    FROM chapters c JOIN class_folders sf ON sf.user_id=p_user AND sf.kind='subject' AND sf.subject_id=c.subject_id
   WHERE c.user_id=p_user AND COALESCE(c.archived,false)=false
     AND NOT EXISTS (SELECT 1 FROM class_folders f WHERE f.user_id=p_user AND f.kind='chapter' AND f.chapter_id=c.id);
  GET DIAGNOSTICS k=ROW_COUNT; n:=n+k;
  UPDATE class_folders f SET name=c.name FROM chapters c
   WHERE f.user_id=p_user AND f.kind='chapter' AND f.chapter_id=c.id AND f.name<>c.name;
  RETURN n;
END $$;
CREATE FUNCTION public.sync_my_class_folders() RETURNS integer
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ SELECT public.sync_user_class_folders(auth.uid()) $$;
CREATE FUNCTION public.touch_last_seen() RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ UPDATE profiles SET last_seen_at=now() WHERE id=auth.uid() $$;
CREATE FUNCTION public.trg_sync_class_folders() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN PERFORM public.sync_user_class_folders(NEW.user_id); RETURN NEW; END $$;
CREATE FUNCTION public.undo_reading(_kind text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ BEGIN UPDATE reading_logs SET sittings=GREATEST(0,sittings-1),minutes=GREATEST(0,minutes-5),updated_at=now() WHERE user_id=auth.uid() AND log_date=CURRENT_DATE AND kind=_kind; END $$;
CREATE FUNCTION public.chapter_pace() RETURNS TABLE(chapters_tracked bigint, chapters_completed bigint, avg_chapter_minutes numeric, avg_reading_minutes numeric, avg_revision_minutes numeric)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ SELECT count(*),count(*) FILTER(WHERE first_pass_completed_at IS NOT NULL),COALESCE(avg(reading_minutes+revision_minutes+class_minutes+practice_minutes),0),COALESCE(avg(NULLIF(reading_minutes,0)),0),COALESCE(avg(NULLIF(revision_minutes,0)),0) FROM chapter_learning_state WHERE user_id=auth.uid() $$;
ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT ai_messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_events
    ADD CONSTRAINT app_events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.avatar_presets
    ADD CONSTRAINT avatar_presets_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.chapter_learning_state
    ADD CONSTRAINT chapter_learning_state_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.chapter_notes
    ADD CONSTRAINT chapter_notes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.chapter_subtopics
    ADD CONSTRAINT chapter_subtopics_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT chapters_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.class_folders
    ADD CONSTRAINT class_folders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.class_media
    ADD CONSTRAINT class_media_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.class_note_revision_state
    ADD CONSTRAINT class_note_revision_state_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cron_config
    ADD CONSTRAINT cron_config_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.daily_study_plan_items
    ADD CONSTRAINT daily_study_plan_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.email_automations
    ADD CONSTRAINT email_automations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.email_campaigns
    ADD CONSTRAINT email_campaigns_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.email_queue
    ADD CONSTRAINT email_queue_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.email_settings
    ADD CONSTRAINT email_settings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.email_suppressions
    ADD CONSTRAINT email_suppressions_email_key UNIQUE (email);
ALTER TABLE ONLY public.email_suppressions
    ADD CONSTRAINT email_suppressions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.error_events
    ADD CONSTRAINT error_events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.export_history
    ADD CONSTRAINT export_history_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.legacy_user_claims
    ADD CONSTRAINT legacy_user_claims_pkey PRIMARY KEY (email);
ALTER TABLE ONLY public.motivations
    ADD CONSTRAINT motivations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notices
    ADD CONSTRAINT notices_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.oauth_settings
    ADD CONSTRAINT oauth_settings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.online_classes
    ADD CONSTRAINT online_classes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.reading_goals
    ADD CONSTRAINT reading_goals_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY public.reading_logs
    ADD CONSTRAINT reading_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.scheduled_emails
    ADD CONSTRAINT scheduled_emails_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.scheduled_notifications
    ADD CONSTRAINT scheduled_notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.session_breaks
    ADD CONSTRAINT session_breaks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.session_outcomes
    ADD CONSTRAINT session_outcomes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.streak_days
    ADD CONSTRAINT streak_days_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.streak_days
    ADD CONSTRAINT streak_days_user_id_day_key UNIQUE (user_id, day);
ALTER TABLE ONLY public.study_sessions
    ADD CONSTRAINT study_sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.subject_catalog
    ADD CONSTRAINT subject_catalog_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.subject_targets
    ADD CONSTRAINT subject_targets_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.targets
    ADD CONSTRAINT targets_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.test_attempts
    ADD CONSTRAINT test_attempts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.timetable_blocks
    ADD CONSTRAINT timetable_blocks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.transfer_audit
    ADD CONSTRAINT transfer_audit_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_revision_settings
    ADD CONSTRAINT user_revision_settings_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY public.user_xp
    ADD CONSTRAINT user_xp_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.weekly_focus
    ADD CONSTRAINT weekly_focus_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.weekly_focus
    ADD CONSTRAINT weekly_focus_user_id_week_start_key UNIQUE (user_id, week_start);
CREATE INDEX ai_messages_user_idx ON public.ai_messages USING btree (user_id);
CREATE INDEX app_events_user_idx ON public.app_events USING btree (user_id);
CREATE INDEX chapter_learning_state_user_idx ON public.chapter_learning_state USING btree (user_id);
CREATE UNIQUE INDEX chapter_note_position_key ON public.chapter_notes USING btree (user_id, COALESCE(subject_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(chapter_name, ''::text), "position");
CREATE INDEX chapter_notes_user_idx ON public.chapter_notes USING btree (user_id);
CREATE UNIQUE INDEX chapter_state_key ON public.chapter_learning_state USING btree (user_id, subject_id, lower(chapter_name));
