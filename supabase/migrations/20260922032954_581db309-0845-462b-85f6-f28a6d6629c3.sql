CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
CREATE TABLE public.ai_messages (
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metadata jsonb DEFAULT '{}'::jsonb,
  role text DEFAULT 'user',
  user_id uuid NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_messages TO authenticated; GRANT ALL ON public.ai_messages TO service_role;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.app_events (
  created_at timestamptz DEFAULT now(),
  event text NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metadata jsonb DEFAULT '{}'::jsonb,
  path text,
  platform text,
  user_id uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_events TO authenticated; GRANT ALL ON public.app_events TO service_role;
ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.app_settings (
  accent_color text DEFAULT '#f59e0b',
  ai_enabled boolean DEFAULT false,
  android_force_update boolean DEFAULT false,
  android_latest_version text,
  android_min_version text,
  android_update_url text,
  announcement_level text DEFAULT 'info',
  avatar_upload_enabled boolean DEFAULT false,
  banner_text text,
  default_daily_goal_hours double precision DEFAULT 4,
  default_weekly_goal_hours double precision DEFAULT 26,
  email_auth_enabled boolean DEFAULT true,
  favicon_url text,
  google_auth_enabled boolean DEFAULT true,
  id boolean PRIMARY KEY,
  landing_enabled boolean DEFAULT true,
  logo_url text,
  maintenance_note text,
  manual_log_enabled boolean DEFAULT false,
  onboarding_require_subjects boolean DEFAULT true,
  one_tap_enabled boolean DEFAULT false,
  push_enabled boolean DEFAULT false,
  revision_intervals integer[] DEFAULT '{}'::integer[],
  revision_max_passes integer DEFAULT 8,
  revision_min_passes integer DEFAULT 5,
  signup_enabled boolean DEFAULT true,
  site_name text DEFAULT 'Bnoy Study',
  support_email text,
  tagline text DEFAULT 'Study smart. Track every minute.',
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.app_settings TO anon, authenticated; GRANT INSERT, UPDATE, DELETE ON public.app_settings TO authenticated; GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.avatar_presets (
  created_at timestamptz DEFAULT now(),
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  is_active boolean DEFAULT true,
  name text NOT NULL,
  sort_order integer DEFAULT 0
);
GRANT SELECT ON public.avatar_presets TO anon, authenticated; GRANT INSERT, UPDATE, DELETE ON public.avatar_presets TO authenticated; GRANT ALL ON public.avatar_presets TO service_role;
ALTER TABLE public.avatar_presets ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.chapter_learning_state (
  chapter_id uuid,
  chapter_name text NOT NULL,
  class_minutes integer DEFAULT 0,
  class_sessions integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  first_pass_completed_at timestamptz,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_recall double precision,
  last_studied_at timestamptz,
  next_review_at timestamptz DEFAULT now(),
  practice_minutes integer DEFAULT 0,
  practice_sessions integer DEFAULT 0,
  reading_minutes integer DEFAULT 0,
  reading_sessions integer DEFAULT 0,
  recall_samples integer DEFAULT 0,
  review_stage integer DEFAULT 0,
  revision_minutes integer DEFAULT 0,
  revision_sessions integer DEFAULT 0,
  subject_id uuid NOT NULL,
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapter_learning_state TO authenticated; GRANT ALL ON public.chapter_learning_state TO service_role;
ALTER TABLE public.chapter_learning_state ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.chapter_notes (
  chapter_id uuid,
  chapter_name text,
  created_at timestamptz DEFAULT now(),
  file_size integer DEFAULT 0,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mime_type text DEFAULT '',
  position integer DEFAULT 0,
  storage_path text NOT NULL,
  subject_id uuid,
  title text NOT NULL,
  topic text,
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapter_notes TO authenticated; GRANT ALL ON public.chapter_notes TO service_role;
ALTER TABLE public.chapter_notes ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.chapter_subtopics (
  chapter_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  estimated_minutes integer DEFAULT 30,
  first_pass_done boolean DEFAULT false,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapter_subtopics TO authenticated; GRANT ALL ON public.chapter_subtopics TO service_role;
ALTER TABLE public.chapter_subtopics ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.chapters (
  archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  difficulty integer DEFAULT 3,
  estimated_minutes integer DEFAULT 30,
  first_pass_done boolean DEFAULT false,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position integer DEFAULT 0,
  subject_id uuid NOT NULL,
  total_units integer DEFAULT 0,
  units_done integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapters TO authenticated; GRANT ALL ON public.chapters TO service_role;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.class_note_revision_state (
  chapter_id uuid,
  chapter_name text,
  class_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_revised_at timestamptz,
  next_review_at timestamptz DEFAULT now(),
  review_stage integer DEFAULT 0,
  revisions_done integer DEFAULT 0,
  subject_id uuid,
  target_revisions integer DEFAULT 5,
  title text NOT NULL,
  total_minutes integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_note_revision_state TO authenticated; GRANT ALL ON public.class_note_revision_state TO service_role;
ALTER TABLE public.class_note_revision_state ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.daily_study_plan_items (
  cancelled_at timestamptz,
  chapter_id uuid,
  chapter_name text,
  class_id uuid,
  completed_at timestamptz,
  completed_session_id uuid,
  created_at timestamptz DEFAULT now(),
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  next_review_at timestamptz,
  pinned boolean DEFAULT false,
  plan_date date NOT NULL,
  priority integer DEFAULT 100,
  rank_score integer DEFAULT 0,
  review_stage integer,
  scheduled_end timestamptz,
  scheduled_start timestamptz,
  session_kind text DEFAULT 'reading',
  skipped_at timestamptz,
  source text DEFAULT 'automatic',
  status text DEFAULT 'pending',
  subject_id uuid,
  subject_name text,
  subtopic_id uuid,
  target_minutes integer DEFAULT 30,
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_study_plan_items TO authenticated; GRANT ALL ON public.daily_study_plan_items TO service_role;
ALTER TABLE public.daily_study_plan_items ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.device_tokens (
  created_at timestamptz DEFAULT now(),
  device_label text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_seen_at timestamptz,
  platform text DEFAULT 'web',
  token text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_tokens TO authenticated; GRANT ALL ON public.device_tokens TO service_role;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.email_settings (
  from_email text,
  from_name text,
  id boolean PRIMARY KEY,
  provider text DEFAULT 'lovable',
  smtp_host text,
  smtp_password text,
  smtp_port integer DEFAULT 587,
  smtp_user text,
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_settings TO authenticated; GRANT ALL ON public.email_settings TO service_role;
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.export_history (
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  expires_at timestamptz,
  file_name text NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  size_bytes integer DEFAULT 0,
  status text DEFAULT 'pending',
  storage_path text,
  summary jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.export_history TO authenticated; GRANT ALL ON public.export_history TO service_role;
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.legacy_user_claims (
  claimed_at timestamptz,
  claimed_by uuid,
  created_at timestamptz DEFAULT now(),
  email text PRIMARY KEY,
  payload jsonb NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.legacy_user_claims TO authenticated; GRANT ALL ON public.legacy_user_claims TO service_role;
ALTER TABLE public.legacy_user_claims ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.motivations (
  author text,
  body text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT true,
  kind text DEFAULT 'general',
  month integer,
  title text DEFAULT ''
);
GRANT SELECT ON public.motivations TO anon, authenticated; GRANT INSERT, UPDATE, DELETE ON public.motivations TO authenticated; GRANT ALL ON public.motivations TO service_role;
ALTER TABLE public.motivations ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.notifications (
  action_path text,
  audience text DEFAULT 'all',
  body text,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text,
  kind text DEFAULT 'general',
  push_sent boolean DEFAULT false,
  read boolean DEFAULT false,
  title text NOT NULL,
  user_id uuid NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated; GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.online_classes (
  chapter_id uuid,
  chapter_name text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  duration_minutes integer,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text DEFAULT 'recorded',
  notes_taken boolean DEFAULT false,
  scheduled_at timestamptz,
  status text DEFAULT 'pending',
  subject_id uuid,
  title text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  url text,
  user_id uuid NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.online_classes TO authenticated; GRANT ALL ON public.online_classes TO service_role;
ALTER TABLE public.online_classes ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.profiles (
  age integer,
  avatar_url text,
  avg_study_hours double precision,
  bio text,
  created_at timestamptz DEFAULT now(),
  display_name text,
  email text,
  first_name text,
  gender text,
  id uuid PRIMARY KEY,
  last_name text,
  last_seen_at timestamptz,
  onboarded boolean DEFAULT false,
  onboarded_at timestamptz,
  phone text,
  sign_in_count integer DEFAULT 0,
  timezone text DEFAULT 'UTC',
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated; GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.reading_goals (
  created_at timestamptz DEFAULT now(),
  magazine_monthly_minutes integer DEFAULT 45,
  newspaper_daily_minutes integer DEFAULT 15,
  updated_at timestamptz DEFAULT now(),
  user_id uuid PRIMARY KEY
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_goals TO authenticated; GRANT ALL ON public.reading_goals TO service_role;
ALTER TABLE public.reading_goals ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.reading_logs (
  created_at timestamptz DEFAULT now(),
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  log_date date NOT NULL,
  minutes integer DEFAULT 0,
  note text,
  sittings integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_logs TO authenticated; GRANT ALL ON public.reading_logs TO service_role;
ALTER TABLE public.reading_logs ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.scheduled_emails (
  attempts integer DEFAULT 0,
  audience text DEFAULT 'all',
  body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  error text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  send_at timestamptz NOT NULL,
  sent_count integer DEFAULT 0,
  status text DEFAULT 'pending',
  subject text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  user_ids text[] DEFAULT '{}'::text[]
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_emails TO authenticated; GRANT ALL ON public.scheduled_emails TO service_role;
ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.scheduled_notifications (
  action_path text,
  audience text DEFAULT 'all',
  body text,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  error text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text,
  send_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending',
  title text NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_notifications TO authenticated; GRANT ALL ON public.scheduled_notifications TO service_role;
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.session_breaks (
  created_at timestamptz DEFAULT now(),
  duration_minutes integer,
  ended_at timestamptz,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text DEFAULT 'general',
  note text,
  session_id uuid,
  started_at timestamptz NOT NULL,
  user_id uuid NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_breaks TO authenticated; GRANT ALL ON public.session_breaks TO service_role;
ALTER TABLE public.session_breaks ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.session_outcomes (
  chapter_id uuid,
  content_completed_pct double precision,
  created_at timestamptz DEFAULT now(),
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_reread boolean DEFAULT false,
  kind text NOT NULL,
  net_focus_minutes integer,
  notes text,
  recall_rating double precision,
  revision_result text DEFAULT 'pending',
  session_id uuid NOT NULL,
  subtopic_id uuid,
  unit_label text,
  units_done integer,
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_outcomes TO authenticated; GRANT ALL ON public.session_outcomes TO service_role;
ALTER TABLE public.session_outcomes ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.study_sessions (
  auto_closed boolean DEFAULT false,
  break_minutes integer DEFAULT 0,
  break_started_at timestamptz,
  break_type text,
  category text,
  chapter text,
  chapter_id uuid,
  created_at timestamptz DEFAULT now(),
  duration_minutes integer,
  duration_seconds integer,
  ended_at timestamptz,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_running boolean DEFAULT false,
  kind text DEFAULT 'general',
  notes text,
  planned_end_at timestamptz,
  started_at timestamptz NOT NULL,
  subject_id uuid,
  subject_name text,
  subtopic_id uuid,
  topic text,
  total_break_seconds integer DEFAULT 0,
  user_id uuid NOT NULL,
  xp_earned integer DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_sessions TO authenticated; GRANT ALL ON public.study_sessions TO service_role;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.subject_catalog (
  chapters jsonb DEFAULT '{}'::jsonb,
  color text DEFAULT '#7c8cff',
  created_at timestamptz DEFAULT now(),
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT true,
  name text NOT NULL,
  notes text,
  sort_order integer DEFAULT 0,
  stream text DEFAULT 'general',
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.subject_catalog TO anon, authenticated; GRANT INSERT, UPDATE, DELETE ON public.subject_catalog TO authenticated; GRANT ALL ON public.subject_catalog TO service_role;
ALTER TABLE public.subject_catalog ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.subject_targets (
  auto_created boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  daily_chapters integer DEFAULT 0,
  daily_minutes integer DEFAULT 0,
  daily_questions integer DEFAULT 0,
  daily_topics integer DEFAULT 0,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_chapters integer DEFAULT 0,
  monthly_minutes integer DEFAULT 0,
  monthly_questions integer DEFAULT 0,
  monthly_topics integer DEFAULT 0,
  revision_day_mode text DEFAULT '',
  subject_id uuid NOT NULL,
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL,
  weekly_chapters integer DEFAULT 0,
  weekly_minutes integer DEFAULT 0,
  weekly_questions integer DEFAULT 0,
  weekly_topics integer DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subject_targets TO authenticated; GRANT ALL ON public.subject_targets TO service_role;
ALTER TABLE public.subject_targets ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.subjects (
  chapters jsonb DEFAULT '{}'::jsonb,
  color text DEFAULT '#7c8cff',
  created_at timestamptz DEFAULT now(),
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid NOT NULL,
  weekly_target_hours double precision DEFAULT 7
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated; GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.targets (
  chapter_id uuid,
  chapters jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  daily_hours double precision DEFAULT 0,
  deadline date,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT true,
  subject_id uuid,
  title text NOT NULL,
  user_id uuid NOT NULL,
  weekly_hours double precision DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.targets TO authenticated; GRANT ALL ON public.targets TO service_role;
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.test_attempts (
  chapter_id uuid,
  created_at timestamptz DEFAULT now(),
  duration_minutes integer,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questions_attempted integer DEFAULT 0,
  questions_correct integer DEFAULT 0,
  questions_total integer NOT NULL,
  scope text DEFAULT 'chapter',
  score double precision,
  session_id uuid,
  subject_id uuid,
  subtopic_id uuid,
  taken_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL,
  weak_topics text[] DEFAULT '{}'::text[]
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_attempts TO authenticated; GRANT ALL ON public.test_attempts TO service_role;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.timetable_blocks (
  chapter_id uuid,
  created_at timestamptz DEFAULT now(),
  day_of_week integer NOT NULL,
  end_time time NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text DEFAULT 'general',
  location text,
  sort_order integer DEFAULT 0,
  start_time time NOT NULL,
  subject_id uuid,
  title text NOT NULL,
  user_id uuid NOT NULL,
  week_parity text DEFAULT 'all'
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_blocks TO authenticated; GRANT ALL ON public.timetable_blocks TO service_role;
ALTER TABLE public.timetable_blocks ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.transfer_audit (
  action text NOT NULL,
  actor_user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  error text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text DEFAULT 'pending',
  summary jsonb DEFAULT '{}'::jsonb,
  target_user_id uuid NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transfer_audit TO authenticated; GRANT ALL ON public.transfer_audit TO service_role;
ALTER TABLE public.transfer_audit ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.user_revision_settings (
  created_at timestamptz DEFAULT now(),
  default_day_mode text,
  intervals integer[],
  max_passes integer,
  min_passes integer,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid,
  user_id uuid PRIMARY KEY
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_revision_settings TO authenticated; GRANT ALL ON public.user_revision_settings TO service_role;
ALTER TABLE public.user_revision_settings ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.user_roles (
  created_at timestamptz DEFAULT now(),
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role DEFAULT 'user',
  user_id uuid NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated; GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.user_settings (
  accent_style text DEFAULT 'classic',
  ai_autopilot boolean DEFAULT true,
  ai_tone text DEFAULT 'coach',
  auto_stop_hours double precision DEFAULT 8,
  background_style text DEFAULT 'clean',
  daily_goal_hours double precision DEFAULT 4,
  gender_palette_suggested boolean DEFAULT false,
  theme_mode text DEFAULT 'light',
  timer_background_effects boolean DEFAULT true,
  timer_keep_awake boolean DEFAULT true,
  timer_show_details boolean DEFAULT true,
  timer_sounds_haptics boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  user_id uuid PRIMARY KEY,
  week_starts_monday boolean DEFAULT true,
  weekly_goal_hours double precision DEFAULT 26,
  widget_layout jsonb DEFAULT '{}'::jsonb
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated; GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.user_xp (
  best_streak integer DEFAULT 0,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_streak_at timestamptz,
  level integer DEFAULT 0,
  streak integer DEFAULT 0,
  total_xp integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_xp TO authenticated; GRANT ALL ON public.user_xp TO service_role;
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_learning_state ADD CONSTRAINT chapter_learning_state_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE SET NULL;
ALTER TABLE public.chapter_learning_state ADD CONSTRAINT chapter_learning_state_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;
ALTER TABLE public.chapter_notes ADD CONSTRAINT chapter_notes_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE SET NULL;
ALTER TABLE public.chapter_notes ADD CONSTRAINT chapter_notes_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;
ALTER TABLE public.chapter_subtopics ADD CONSTRAINT chapter_subtopics_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE SET NULL;
ALTER TABLE public.chapters ADD CONSTRAINT chapters_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;
ALTER TABLE public.class_note_revision_state ADD CONSTRAINT class_note_revision_state_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE SET NULL;
ALTER TABLE public.class_note_revision_state ADD CONSTRAINT class_note_revision_state_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.online_classes(id) ON DELETE SET NULL;
ALTER TABLE public.class_note_revision_state ADD CONSTRAINT class_note_revision_state_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;
ALTER TABLE public.daily_study_plan_items ADD CONSTRAINT daily_study_plan_items_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE SET NULL;
ALTER TABLE public.daily_study_plan_items ADD CONSTRAINT daily_study_plan_items_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.online_classes(id) ON DELETE SET NULL;
ALTER TABLE public.daily_study_plan_items ADD CONSTRAINT daily_study_plan_items_completed_session_id_fkey FOREIGN KEY (completed_session_id) REFERENCES public.study_sessions(id) ON DELETE SET NULL;
ALTER TABLE public.daily_study_plan_items ADD CONSTRAINT daily_study_plan_items_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;
ALTER TABLE public.daily_study_plan_items ADD CONSTRAINT daily_study_plan_items_subtopic_id_fkey FOREIGN KEY (subtopic_id) REFERENCES public.chapter_subtopics(id) ON DELETE SET NULL;
ALTER TABLE public.online_classes ADD CONSTRAINT online_classes_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE SET NULL;
ALTER TABLE public.online_classes ADD CONSTRAINT online_classes_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;
ALTER TABLE public.session_breaks ADD CONSTRAINT session_breaks_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.study_sessions(id) ON DELETE SET NULL;
ALTER TABLE public.session_outcomes ADD CONSTRAINT session_outcomes_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE SET NULL;
ALTER TABLE public.session_outcomes ADD CONSTRAINT session_outcomes_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.study_sessions(id) ON DELETE SET NULL;
ALTER TABLE public.session_outcomes ADD CONSTRAINT session_outcomes_subtopic_id_fkey FOREIGN KEY (subtopic_id) REFERENCES public.chapter_subtopics(id) ON DELETE SET NULL;
ALTER TABLE public.study_sessions ADD CONSTRAINT study_sessions_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE SET NULL;
ALTER TABLE public.study_sessions ADD CONSTRAINT study_sessions_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;
ALTER TABLE public.study_sessions ADD CONSTRAINT study_sessions_subtopic_id_fkey FOREIGN KEY (subtopic_id) REFERENCES public.chapter_subtopics(id) ON DELETE SET NULL;
ALTER TABLE public.subject_targets ADD CONSTRAINT subject_targets_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;
ALTER TABLE public.targets ADD CONSTRAINT targets_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE SET NULL;
ALTER TABLE public.targets ADD CONSTRAINT targets_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;
ALTER TABLE public.test_attempts ADD CONSTRAINT test_attempts_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE SET NULL;
ALTER TABLE public.test_attempts ADD CONSTRAINT test_attempts_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.study_sessions(id) ON DELETE SET NULL;
ALTER TABLE public.test_attempts ADD CONSTRAINT test_attempts_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;
ALTER TABLE public.test_attempts ADD CONSTRAINT test_attempts_subtopic_id_fkey FOREIGN KEY (subtopic_id) REFERENCES public.chapter_subtopics(id) ON DELETE SET NULL;
ALTER TABLE public.timetable_blocks ADD CONSTRAINT timetable_blocks_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE SET NULL;
ALTER TABLE public.timetable_blocks ADD CONSTRAINT timetable_blocks_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;
CREATE INDEX ai_messages_user_idx ON public.ai_messages(user_id);
CREATE INDEX app_events_user_idx ON public.app_events(user_id);
CREATE INDEX chapter_learning_state_user_idx ON public.chapter_learning_state(user_id);
CREATE TRIGGER set_chapter_learning_state_updated_at BEFORE UPDATE ON public.chapter_learning_state FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX chapter_notes_user_idx ON public.chapter_notes(user_id);
CREATE TRIGGER set_chapter_notes_updated_at BEFORE UPDATE ON public.chapter_notes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX chapter_subtopics_user_idx ON public.chapter_subtopics(user_id);
CREATE TRIGGER set_chapter_subtopics_updated_at BEFORE UPDATE ON public.chapter_subtopics FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX chapters_user_idx ON public.chapters(user_id);
CREATE TRIGGER set_chapters_updated_at BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX class_note_revision_state_user_idx ON public.class_note_revision_state(user_id);
CREATE TRIGGER set_class_note_revision_state_updated_at BEFORE UPDATE ON public.class_note_revision_state FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX daily_study_plan_items_user_idx ON public.daily_study_plan_items(user_id);
CREATE TRIGGER set_daily_study_plan_items_updated_at BEFORE UPDATE ON public.daily_study_plan_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX device_tokens_user_idx ON public.device_tokens(user_id);
CREATE TRIGGER set_device_tokens_updated_at BEFORE UPDATE ON public.device_tokens FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX export_history_user_idx ON public.export_history(user_id);
CREATE TRIGGER set_export_history_updated_at BEFORE UPDATE ON public.export_history FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX notifications_user_idx ON public.notifications(user_id);
CREATE INDEX online_classes_user_idx ON public.online_classes(user_id);
CREATE TRIGGER set_online_classes_updated_at BEFORE UPDATE ON public.online_classes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX reading_goals_user_idx ON public.reading_goals(user_id);
CREATE TRIGGER set_reading_goals_updated_at BEFORE UPDATE ON public.reading_goals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX reading_logs_user_idx ON public.reading_logs(user_id);
CREATE TRIGGER set_reading_logs_updated_at BEFORE UPDATE ON public.reading_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_scheduled_emails_updated_at BEFORE UPDATE ON public.scheduled_emails FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX session_breaks_user_idx ON public.session_breaks(user_id);
CREATE INDEX session_outcomes_user_idx ON public.session_outcomes(user_id);
CREATE TRIGGER set_session_outcomes_updated_at BEFORE UPDATE ON public.session_outcomes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX study_sessions_user_idx ON public.study_sessions(user_id);
CREATE TRIGGER set_subject_catalog_updated_at BEFORE UPDATE ON public.subject_catalog FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX subject_targets_user_idx ON public.subject_targets(user_id);
CREATE TRIGGER set_subject_targets_updated_at BEFORE UPDATE ON public.subject_targets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX subjects_user_idx ON public.subjects(user_id);
CREATE INDEX targets_user_idx ON public.targets(user_id);
CREATE INDEX test_attempts_user_idx ON public.test_attempts(user_id);
CREATE TRIGGER set_test_attempts_updated_at BEFORE UPDATE ON public.test_attempts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX timetable_blocks_user_idx ON public.timetable_blocks(user_id);
CREATE TRIGGER set_user_revision_settings_updated_at BEFORE UPDATE ON public.user_revision_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX user_roles_user_idx ON public.user_roles(user_id);
CREATE INDEX user_settings_user_idx ON public.user_settings(user_id);
CREATE TRIGGER set_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX user_xp_user_idx ON public.user_xp(user_id);
CREATE TRIGGER set_user_xp_updated_at BEFORE UPDATE ON public.user_xp FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE UNIQUE INDEX subjects_user_name_key ON public.subjects(user_id, lower(name));
CREATE UNIQUE INDEX daily_plan_identity_key ON public.daily_study_plan_items(user_id, plan_date, COALESCE(subject_id,'00000000-0000-0000-0000-000000000000'::uuid), COALESCE(chapter_name,''), session_kind, COALESCE(class_id,'00000000-0000-0000-0000-000000000000'::uuid));
CREATE UNIQUE INDEX class_revision_class_key ON public.class_note_revision_state(user_id,class_id);
CREATE UNIQUE INDEX chapter_state_key ON public.chapter_learning_state(user_id,subject_id,lower(chapter_name));
CREATE UNIQUE INDEX chapter_note_position_key ON public.chapter_notes(user_id,COALESCE(subject_id,'00000000-0000-0000-0000-000000000000'::uuid),COALESCE(chapter_name,''),position);
CREATE UNIQUE INDEX user_roles_key ON public.user_roles(user_id,role);
CREATE UNIQUE INDEX reading_logs_day_kind_key ON public.reading_logs(user_id,log_date,kind);
CREATE UNIQUE INDEX subject_targets_key ON public.subject_targets(user_id,subject_id);
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid,_role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated, service_role;
CREATE POLICY app_settings_public_read ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY app_settings_admin_write ON public.app_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY avatar_presets_public_read ON public.avatar_presets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY avatar_presets_admin_write ON public.avatar_presets FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY motivations_public_read ON public.motivations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY motivations_admin_write ON public.motivations FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY subject_catalog_public_read ON public.subject_catalog FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY subject_catalog_admin_write ON public.subject_catalog FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY user_roles_read_own ON public.user_roles FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')); CREATE POLICY user_roles_admin_write ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY profiles_own ON public.profiles FOR ALL TO authenticated USING (id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY email_settings_admin ON public.email_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY scheduled_emails_admin ON public.scheduled_emails FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY scheduled_notifications_admin ON public.scheduled_notifications FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY transfer_audit_admin ON public.transfer_audit FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY export_history_admin ON public.export_history FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY legacy_user_claims_admin ON public.legacy_user_claims FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY ai_messages_own ON public.ai_messages FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY app_events_own ON public.app_events FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY chapter_learning_state_own ON public.chapter_learning_state FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY chapter_notes_own ON public.chapter_notes FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY chapter_subtopics_own ON public.chapter_subtopics FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY chapters_own ON public.chapters FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY class_note_revision_state_own ON public.class_note_revision_state FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY daily_study_plan_items_own ON public.daily_study_plan_items FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY device_tokens_own ON public.device_tokens FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY notifications_own ON public.notifications FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY online_classes_own ON public.online_classes FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY reading_goals_own ON public.reading_goals FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY reading_logs_own ON public.reading_logs FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY session_breaks_own ON public.session_breaks FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY session_outcomes_own ON public.session_outcomes FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY study_sessions_own ON public.study_sessions FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY subject_targets_own ON public.subject_targets FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY subjects_own ON public.subjects FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY targets_own ON public.targets FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY test_attempts_own ON public.test_attempts FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY timetable_blocks_own ON public.timetable_blocks FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY user_revision_settings_own ON public.user_revision_settings FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY user_settings_own ON public.user_settings FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY user_xp_own ON public.user_xp FOR ALL TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN INSERT INTO public.profiles(id,email,display_name,avatar_url) VALUES(NEW.id,NEW.email,COALESCE(NEW.raw_user_meta_data->>'full_name',NEW.raw_user_meta_data->>'name'),COALESCE(NEW.raw_user_meta_data->>'avatar_url',NEW.raw_user_meta_data->>'picture')) ON CONFLICT(id) DO NOTHING; INSERT INTO public.user_settings(user_id) VALUES(NEW.id) ON CONFLICT(user_id) DO NOTHING; INSERT INTO public.user_xp(user_id) VALUES(NEW.id) ON CONFLICT DO NOTHING; INSERT INTO public.reading_goals(user_id) VALUES(NEW.id) ON CONFLICT(user_id) DO NOTHING; RETURN NEW; END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
INSERT INTO public.app_settings(id) VALUES(true); INSERT INTO public.email_settings(id) VALUES(true);
CREATE OR REPLACE FUNCTION public.touch_last_seen() RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ UPDATE profiles SET last_seen_at=now() WHERE id=auth.uid() $$;
CREATE OR REPLACE FUNCTION public.log_reading(_kind text,_minutes integer) RETURNS public.reading_logs LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE r public.reading_logs; BEGIN INSERT INTO reading_logs(user_id,kind,log_date,minutes,sittings) VALUES(auth.uid(),_kind,CURRENT_DATE,GREATEST(_minutes,0),1) ON CONFLICT(user_id,log_date,kind) DO UPDATE SET minutes=reading_logs.minutes+EXCLUDED.minutes,sittings=reading_logs.sittings+1,updated_at=now() RETURNING * INTO r; RETURN r; END $$;
CREATE OR REPLACE FUNCTION public.undo_reading(_kind text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN UPDATE reading_logs SET sittings=GREATEST(0,sittings-1),minutes=GREATEST(0,minutes-5),updated_at=now() WHERE user_id=auth.uid() AND log_date=CURRENT_DATE AND kind=_kind; END $$;
CREATE OR REPLACE FUNCTION public.ensure_my_subject_targets() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE n integer; BEGIN INSERT INTO subject_targets(user_id,subject_id,daily_minutes,weekly_minutes,monthly_minutes,daily_topics,weekly_topics,monthly_topics,daily_chapters,weekly_chapters,monthly_chapters,daily_questions,weekly_questions,monthly_questions) SELECT auth.uid(),s.id,GREATEST(15,round(s.weekly_target_hours*60/7)),round(s.weekly_target_hours*60),round(s.weekly_target_hours*60*4.345),1,GREATEST(1,CEIL(jsonb_array_length(COALESCE(s.chapters,'[]'::jsonb))::numeric/4)),jsonb_array_length(COALESCE(s.chapters,'[]'::jsonb)),1,1,GREATEST(1,CEIL(jsonb_array_length(COALESCE(s.chapters,'[]'::jsonb))::numeric/2)),10,70,300 FROM subjects s WHERE s.user_id=auth.uid() ON CONFLICT(user_id,subject_id) DO NOTHING; GET DIAGNOSTICS n=ROW_COUNT; RETURN n; END $$;
CREATE OR REPLACE FUNCTION public.refresh_user_study_plan(p_user_id uuid,p_plan_date date DEFAULT CURRENT_DATE) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE n integer; BEGIN INSERT INTO daily_study_plan_items(user_id,plan_date,subject_id,subject_name,chapter_name,session_kind,target_minutes,priority,source,rank_score,next_review_at,review_stage) SELECT p_user_id,p_plan_date,s.id,s.name,COALESCE(cls.chapter_name,(SELECT value#>>'{}' FROM jsonb_array_elements(s.chapters) WITH ORDINALITY x(value,ord) WHERE ord=1 LIMIT 1),s.name),CASE WHEN cls.id IS NOT NULL THEN 'notes_revision' ELSE 'reading' END,COALESCE(st.daily_minutes,30),ROW_NUMBER() OVER(ORDER BY COALESCE(cls.next_review_at,now()) ASC)::integer,'adaptive',CASE WHEN cls.next_review_at<=now() THEN 500 ELSE 100 END,cls.next_review_at,cls.review_stage FROM subjects s LEFT JOIN subject_targets st ON st.user_id=p_user_id AND st.subject_id=s.id LEFT JOIN LATERAL (SELECT c.id,c.chapter_name,c.next_review_at,c.review_stage FROM class_note_revision_state c WHERE c.user_id=p_user_id AND c.subject_id=s.id AND c.revisions_done<c.target_revisions ORDER BY c.next_review_at LIMIT 1) cls ON true WHERE s.user_id=p_user_id ON CONFLICT DO NOTHING; GET DIAGNOSTICS n=ROW_COUNT; RETURN n; END $$;
CREATE OR REPLACE FUNCTION public.refresh_my_study_plan(p_plan_date date DEFAULT CURRENT_DATE) RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ SELECT public.refresh_user_study_plan(auth.uid(),p_plan_date) $$;
CREATE OR REPLACE FUNCTION public.refresh_all_daily_plans(p_plan_date date DEFAULT CURRENT_DATE) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE u record; total integer:=0; BEGIN FOR u IN SELECT id FROM profiles LOOP total:=total+public.refresh_user_study_plan(u.id,p_plan_date); END LOOP; RETURN total; END $$;
CREATE OR REPLACE FUNCTION public.schedule_my_daily_plan(p_plan_date date) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN PERFORM public.refresh_my_study_plan(p_plan_date); WITH x AS (SELECT id,target_minutes,ROW_NUMBER() OVER(ORDER BY priority,rank_score DESC) n FROM daily_study_plan_items WHERE user_id=auth.uid() AND plan_date=p_plan_date AND status='pending') UPDATE daily_study_plan_items d SET scheduled_start=(p_plan_date::timestamp+time '06:00'+((x.n-1)*interval '45 minutes')),scheduled_end=(p_plan_date::timestamp+time '06:00'+((x.n-1)*interval '45 minutes')+(x.target_minutes*interval '1 minute')) FROM x WHERE d.id=x.id; END $$;
CREATE OR REPLACE FUNCTION public.set_plan_item_status(_item_id uuid,_status text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE n integer; BEGIN IF _status NOT IN ('pending','skipped','cancelled') THEN RAISE EXCEPTION 'Invalid status'; END IF; UPDATE daily_study_plan_items SET status=_status,skipped_at=CASE WHEN _status='skipped' THEN now() ELSE NULL END,cancelled_at=CASE WHEN _status='cancelled' THEN now() ELSE NULL END WHERE id=_item_id AND user_id=auth.uid(); GET DIAGNOSTICS n=ROW_COUNT; RETURN n; END $$;
CREATE OR REPLACE FUNCTION public.complete_my_revision(p_kind text,p_minutes integer DEFAULT 15,p_state_id uuid DEFAULT NULL) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE intervals integer[]:=ARRAY[1,3,7,15,30]; st integer; BEGIN IF p_kind='class' THEN UPDATE class_note_revision_state SET revisions_done=revisions_done+1,review_stage=review_stage+1,last_revised_at=now(),total_minutes=total_minutes+GREATEST(p_minutes,0),next_review_at=now()+make_interval(days=>intervals[LEAST(review_stage+1,array_length(intervals,1))]) WHERE id=p_state_id AND user_id=auth.uid() RETURNING review_stage INTO st; ELSE UPDATE chapter_learning_state SET revision_sessions=revision_sessions+1,revision_minutes=revision_minutes+GREATEST(p_minutes,0),review_stage=review_stage+1,last_studied_at=now(),next_review_at=now()+make_interval(days=>intervals[LEAST(review_stage+1,array_length(intervals,1))]) WHERE id=p_state_id AND user_id=auth.uid() RETURNING review_stage INTO st; END IF; RETURN COALESCE(st,0)::text; END $$;
CREATE OR REPLACE FUNCTION public.chapter_pace() RETURNS TABLE(chapters_tracked bigint,chapters_completed bigint,avg_chapter_minutes numeric,avg_reading_minutes numeric,avg_revision_minutes numeric) LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ SELECT count(*),count(*) FILTER(WHERE first_pass_completed_at IS NOT NULL),COALESCE(avg(reading_minutes+revision_minutes+class_minutes+practice_minutes),0),COALESCE(avg(NULLIF(reading_minutes,0)),0),COALESCE(avg(NULLIF(revision_minutes,0)),0) FROM chapter_learning_state WHERE user_id=auth.uid() $$;
CREATE OR REPLACE FUNCTION public.close_stale_sessions() RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ UPDATE study_sessions SET is_running=false,auto_closed=true,ended_at=COALESCE(planned_end_at,started_at+interval '8 hours'),duration_minutes=GREATEST(1,round(EXTRACT(EPOCH FROM (COALESCE(planned_end_at,started_at+interval '8 hours')-started_at))/60)::integer) WHERE is_running AND started_at<now()-interval '8 hours' $$;
GRANT EXECUTE ON FUNCTION public.touch_last_seen(), public.log_reading(text,integer), public.undo_reading(text), public.ensure_my_subject_targets(), public.refresh_my_study_plan(date), public.schedule_my_daily_plan(date), public.set_plan_item_status(uuid,text), public.complete_my_revision(text,integer,uuid), public.chapter_pace() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_user_study_plan(uuid,date), public.refresh_all_daily_plans(date), public.close_stale_sessions() TO service_role;