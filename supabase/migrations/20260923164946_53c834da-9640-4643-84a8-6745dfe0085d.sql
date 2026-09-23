ALTER TABLE public.email_settings ADD COLUMN IF NOT EXISTS smtp_auth boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.sync_user_class_folders(p_user uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
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

CREATE OR REPLACE FUNCTION public.sync_my_class_folders()
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.sync_user_class_folders(auth.uid()) $$;

CREATE OR REPLACE FUNCTION public.trg_sync_class_folders()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN PERFORM public.sync_user_class_folders(NEW.user_id); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS sync_folders_on_subject ON public.subjects;
CREATE TRIGGER sync_folders_on_subject AFTER INSERT OR UPDATE OF name ON public.subjects
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_class_folders();
DROP TRIGGER IF EXISTS sync_folders_on_chapter ON public.chapters;
CREATE TRIGGER sync_folders_on_chapter AFTER INSERT OR UPDATE OF name, archived ON public.chapters
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_class_folders();

-- Progress reconciliation: any finished session completes matching plan tasks
CREATE OR REPLACE FUNCTION public.reconcile_session_to_plan()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
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

DROP TRIGGER IF EXISTS reconcile_plan_on_session ON public.study_sessions;
CREATE TRIGGER reconcile_plan_on_session AFTER INSERT OR UPDATE OF is_running, duration_minutes ON public.study_sessions
FOR EACH ROW EXECUTE FUNCTION public.reconcile_session_to_plan();

-- Recover streak history for the calling user from all past sessions
CREATE OR REPLACE FUNCTION public.rebuild_my_streak_history()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
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

REVOKE EXECUTE ON FUNCTION public.sync_user_class_folders(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_sync_class_folders() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reconcile_session_to_plan() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_my_class_folders() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rebuild_my_streak_history() FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_my_class_folders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rebuild_my_streak_history() TO authenticated;

-- Private media path data/media/<uid>/...
DROP POLICY IF EXISTS "own media read" ON storage.objects;
DROP POLICY IF EXISTS "own media write" ON storage.objects;
DROP POLICY IF EXISTS "own media update" ON storage.objects;
DROP POLICY IF EXISTS "own media delete" ON storage.objects;
CREATE POLICY "own media read" ON storage.objects FOR SELECT TO authenticated
 USING (bucket_id='data' AND (storage.foldername(name))[1]='media' AND (storage.foldername(name))[2]=auth.uid()::text);
CREATE POLICY "own media write" ON storage.objects FOR INSERT TO authenticated
 WITH CHECK (bucket_id='data' AND (storage.foldername(name))[1]='media' AND (storage.foldername(name))[2]=auth.uid()::text);
CREATE POLICY "own media update" ON storage.objects FOR UPDATE TO authenticated
 USING (bucket_id='data' AND (storage.foldername(name))[1]='media' AND (storage.foldername(name))[2]=auth.uid()::text);
CREATE POLICY "own media delete" ON storage.objects FOR DELETE TO authenticated
 USING (bucket_id='data' AND (storage.foldername(name))[1]='media' AND (storage.foldername(name))[2]=auth.uid()::text);