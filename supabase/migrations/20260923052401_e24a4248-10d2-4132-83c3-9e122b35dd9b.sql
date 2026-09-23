-- System-only maintenance routines
REVOKE ALL ON FUNCTION public.snapshot_streak_day(date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_all_daily_plans(date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_user_study_plan(uuid, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.close_stale_sessions() FROM PUBLIC;

-- Signed-in user routines: drop the implicit public grant, grant explicitly
REVOKE ALL ON FUNCTION public.refresh_my_study_plan(date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.schedule_my_daily_plan(date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_my_revision(text, integer, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ensure_my_subject_targets() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_reading(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.undo_reading(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.touch_last_seen() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chapter_pace() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_plan_item_status(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.goal_percent_for(text, numeric) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.refresh_my_study_plan(date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.schedule_my_daily_plan(date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.complete_my_revision(text, integer, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_my_subject_targets() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_reading(text, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.undo_reading(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.touch_last_seen() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.chapter_pace() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_plan_item_status(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.goal_percent_for(text, numeric) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.snapshot_streak_day(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_all_daily_plans(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_user_study_plan(uuid, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.close_stale_sessions() TO service_role;

-- Trigger helpers never need API access
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;