
REVOKE EXECUTE ON FUNCTION public.chapter_pace() FROM anon;
REVOKE EXECUTE ON FUNCTION public.close_stale_sessions() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.complete_my_revision(text, integer, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.ensure_my_subject_targets() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_reading(text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_all_daily_plans(date) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_my_study_plan(date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_user_study_plan(uuid, date) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.schedule_my_daily_plan(date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_plan_item_status(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_last_seen() FROM anon;
REVOKE EXECUTE ON FUNCTION public.undo_reading(text) FROM anon;
