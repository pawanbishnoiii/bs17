CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user'
);
CREATE TABLE public.reading_logs (
    created_at timestamp with time zone DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kind text NOT NULL,
    log_date date NOT NULL,
    minutes integer DEFAULT 0,
    note text,
    sittings integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid NOT NULL
);
CREATE TABLE public.ai_messages (
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    role text DEFAULT 'user'::text,
    user_id uuid NOT NULL
);
CREATE TABLE public.app_events (
    created_at timestamp with time zone DEFAULT now(),
    event text NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    path text,
    platform text,
    user_id uuid
);
CREATE TABLE public.app_settings (
    accent_color text DEFAULT '#f59e0b'::text,
    ai_enabled boolean DEFAULT false,
    android_force_update boolean DEFAULT false,
    android_latest_version text,
    android_min_version text,
    android_update_url text,
    announcement_level text DEFAULT 'info'::text,
    avatar_upload_enabled boolean DEFAULT false,
    banner_text text,
    default_daily_goal_hours double precision DEFAULT 4,
    default_weekly_goal_hours double precision DEFAULT 26,
    email_auth_enabled boolean DEFAULT true,
    favicon_url text,
    google_auth_enabled boolean DEFAULT true,
    id boolean NOT NULL,
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
    site_name text DEFAULT 'Bnoy Study'::text,
    support_email text,
    tagline text DEFAULT 'Study smart. Track every minute.'::text,
    updated_at timestamp with time zone DEFAULT now(),
    bg_mobile_url text,
    bg_desktop_url text,
    bg_blur integer DEFAULT 0 NOT NULL,
    bg_overlay integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.avatar_presets (
    created_at timestamp with time zone DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    image_url text NOT NULL,
    is_active boolean DEFAULT true,
    name text NOT NULL,
    sort_order integer DEFAULT 0
);
CREATE TABLE public.chapter_learning_state (
    chapter_id uuid,
    chapter_name text NOT NULL,
    class_minutes integer DEFAULT 0,
    class_sessions integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    first_pass_completed_at timestamp with time zone,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    last_recall double precision,
    last_studied_at timestamp with time zone,
    next_review_at timestamp with time zone DEFAULT now(),
    practice_minutes integer DEFAULT 0,
    practice_sessions integer DEFAULT 0,
    reading_minutes integer DEFAULT 0,
    reading_sessions integer DEFAULT 0,
    recall_samples integer DEFAULT 0,
    review_stage integer DEFAULT 0,
    revision_minutes integer DEFAULT 0,
    revision_sessions integer DEFAULT 0,
    subject_id uuid NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid NOT NULL,
    resume_subtopic_id uuid,
    resume_note text,
    progress_pct double precision DEFAULT 0 NOT NULL,
    stopped_at timestamp with time zone
);
CREATE TABLE public.chapter_notes (
    chapter_id uuid,
    chapter_name text,
    created_at timestamp with time zone DEFAULT now(),
    file_size integer DEFAULT 0,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mime_type text DEFAULT ''::text,
    "position" integer DEFAULT 0,
    storage_path text NOT NULL,
    subject_id uuid,
    title text NOT NULL,
    topic text,
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid NOT NULL
);
CREATE TABLE public.chapter_subtopics (
    chapter_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    estimated_minutes integer DEFAULT 30,
    first_pass_done boolean DEFAULT false,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    "position" integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid NOT NULL
);
CREATE TABLE public.chapters (
    archived boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    difficulty integer DEFAULT 3,
    estimated_minutes integer DEFAULT 30,
    first_pass_done boolean DEFAULT false,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    "position" integer DEFAULT 0,
    subject_id uuid NOT NULL,
    total_units integer DEFAULT 0,
    units_done integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid NOT NULL
);
CREATE TABLE public.class_folders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    parent_id uuid,
    name text NOT NULL,
    kind text DEFAULT 'custom'::text NOT NULL,
    subject_id uuid,
    chapter_id uuid,
    system_managed boolean DEFAULT false NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.class_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    folder_id uuid,
    subject_id uuid,
    chapter_id uuid,
    title text NOT NULL,
    media_kind text DEFAULT 'file'::text NOT NULL,
    source text DEFAULT 'upload'::text NOT NULL,
    storage_path text,
    external_url text,
    mime_type text,
    file_size bigint,
    duration_seconds integer,
    thumbnail_url text,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.class_note_revision_state (
    chapter_id uuid,
    chapter_name text,
    class_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    last_revised_at timestamp with time zone,
    next_review_at timestamp with time zone DEFAULT now(),
    review_stage integer DEFAULT 0,
    revisions_done integer DEFAULT 0,
    subject_id uuid,
    target_revisions integer DEFAULT 5,
    title text NOT NULL,
    total_minutes integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid NOT NULL
);
CREATE TABLE public.cron_config (
    id boolean DEFAULT true NOT NULL,
    token text NOT NULL,
    base_url text DEFAULT 'https://project--88281599-6fd0-4855-b326-6fe62c2e84c1.lovable.app'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cron_config_id_check CHECK (id)
);
CREATE TABLE public.daily_study_plan_items (
    cancelled_at timestamp with time zone,
    chapter_id uuid,
    chapter_name text,
    class_id uuid,
    completed_at timestamp with time zone,
    completed_session_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    next_review_at timestamp with time zone,
    pinned boolean DEFAULT false,
    plan_date date NOT NULL,
    priority integer DEFAULT 100,
    rank_score integer DEFAULT 0,
    review_stage integer,
    scheduled_end timestamp with time zone,
    scheduled_start timestamp with time zone,
    session_kind text DEFAULT 'reading'::text,
    skipped_at timestamp with time zone,
    source text DEFAULT 'automatic'::text,
    status text DEFAULT 'pending'::text,
    subject_id uuid,
    subject_name text,
    subtopic_id uuid,
    target_minutes integer DEFAULT 30,
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid NOT NULL
);
CREATE TABLE public.device_tokens (
    created_at timestamp with time zone DEFAULT now(),
    device_label text,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    last_seen_at timestamp with time zone,
    platform text DEFAULT 'web'::text,
    token text NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid NOT NULL
);
CREATE TABLE public.email_automations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    trigger_event text NOT NULL,
    conditions jsonb DEFAULT '{}'::jsonb NOT NULL,
    delay_minutes integer DEFAULT 0 NOT NULL,
    template_slug text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.email_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    subject text NOT NULL,
    html_body text NOT NULL,
    kind text DEFAULT 'promotional'::text NOT NULL,
    audience text DEFAULT 'all'::text NOT NULL,
    user_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    filters jsonb DEFAULT '{}'::jsonb NOT NULL,
    template_slug text,
    status text DEFAULT 'draft'::text NOT NULL,
    send_at timestamp with time zone,
    queued_count integer DEFAULT 0 NOT NULL,
    sent_count integer DEFAULT 0 NOT NULL,
    failed_count integer DEFAULT 0 NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.email_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    queue_id uuid,
    campaign_id uuid,
    to_email text NOT NULL,
    subject text,
    event text NOT NULL,
    detail text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.email_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_id uuid,
    user_id uuid,
    to_email text NOT NULL,
    subject text NOT NULL,
    html_body text NOT NULL,
    kind text DEFAULT 'transactional'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    max_attempts integer DEFAULT 4 NOT NULL,
    next_attempt_at timestamp with time zone DEFAULT now() NOT NULL,
    last_error text,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.email_settings (
    from_email text,
    from_name text,
    id boolean NOT NULL,
    provider text DEFAULT 'lovable'::text,
    smtp_host text,
    smtp_password text,
    smtp_port integer DEFAULT 587,
    smtp_user text,
    updated_at timestamp with time zone DEFAULT now(),
    encryption text DEFAULT 'starttls'::text NOT NULL,
    reply_to text,
    timeout_seconds integer DEFAULT 20 NOT NULL,
    verify_ssl boolean DEFAULT true NOT NULL,
    adapter text DEFAULT 'smtp'::text NOT NULL,
    api_key text,
    last_verified_at timestamp with time zone,
    last_error text,
    smtp_auth boolean DEFAULT true NOT NULL
);
CREATE TABLE public.email_suppressions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    reason text DEFAULT 'unsubscribed'::text NOT NULL,
    scope text DEFAULT 'promotional'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.email_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    category text DEFAULT 'transactional'::text NOT NULL,
    subject text NOT NULL,
    html_body text NOT NULL,
    variables jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_system boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.error_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    category text NOT NULL,
    severity text DEFAULT 'error'::text NOT NULL,
    message text NOT NULL,
    detail jsonb DEFAULT '{}'::jsonb NOT NULL,
    context text,
    resolved boolean DEFAULT false NOT NULL,
    resolved_at timestamp with time zone,
    resolved_by uuid,
    resolution_note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.export_history (
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    expires_at timestamp with time zone,
    file_name text NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    size_bytes integer DEFAULT 0,
    status text DEFAULT 'pending'::text,
    storage_path text,
    summary jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid NOT NULL
);
CREATE TABLE public.legacy_user_claims (
    claimed_at timestamp with time zone,
    claimed_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    email text NOT NULL,
    payload jsonb NOT NULL
);
CREATE TABLE public.motivations (
    author text,
    body text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    is_active boolean DEFAULT true,
    kind text DEFAULT 'general'::text,
    month integer,
    title text DEFAULT ''::text
);
CREATE TABLE public.notices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    body text NOT NULL,
    pinned boolean DEFAULT false NOT NULL,
    done boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.notifications (
    action_path text,
    audience text DEFAULT 'all'::text,
    body text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    image_url text,
    kind text DEFAULT 'general'::text,
    push_sent boolean DEFAULT false,
    read boolean DEFAULT false,
    title text NOT NULL,
    user_id uuid NOT NULL
);
CREATE TABLE public.oauth_settings (
    id boolean DEFAULT true NOT NULL,
    google_client_id text,
    google_client_secret text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT oauth_settings_id_check CHECK (id)
);
CREATE TABLE public.online_classes (
    chapter_id uuid,
    chapter_name text,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    duration_minutes integer,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mode text DEFAULT 'recorded'::text,
    notes_taken boolean DEFAULT false,
    scheduled_at timestamp with time zone,
    status text DEFAULT 'pending'::text,
    subject_id uuid,
    title text NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    url text,
    user_id uuid NOT NULL
);
CREATE TABLE public.profiles (
    age integer,
    avatar_url text,
    avg_study_hours double precision DEFAULT 8,
    bio text,
    created_at timestamp with time zone DEFAULT now(),
    display_name text,
    email text,
    first_name text,
    gender text,
    id uuid NOT NULL,
    last_name text,
    last_seen_at timestamp with time zone,
    onboarded boolean DEFAULT false,
    onboarded_at timestamp with time zone,
    phone text,
    sign_in_count integer DEFAULT 0,
    timezone text DEFAULT 'UTC'::text,
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.reading_goals (
    created_at timestamp with time zone DEFAULT now(),
    magazine_monthly_minutes integer DEFAULT 45,
    newspaper_daily_minutes integer DEFAULT 15,
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid NOT NULL,
    odd_day_minutes integer DEFAULT 20 NOT NULL,
    even_day_minutes integer DEFAULT 20 NOT NULL,
    odd_even_enabled boolean DEFAULT false NOT NULL
);
CREATE TABLE public.scheduled_emails (
    attempts integer DEFAULT 0,
    audience text DEFAULT 'all'::text,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    error text,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    send_at timestamp with time zone NOT NULL,
    sent_count integer DEFAULT 0,
    status text DEFAULT 'pending'::text,
    subject text NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    user_ids text[] DEFAULT '{}'::text[]
);
CREATE TABLE public.scheduled_notifications (
    action_path text,
    audience text DEFAULT 'all'::text,
    body text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    error text,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    image_url text,
    send_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'pending'::text,
    title text NOT NULL
);
CREATE TABLE public.session_breaks (
    created_at timestamp with time zone DEFAULT now(),
    duration_minutes integer,
    ended_at timestamp with time zone,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kind text DEFAULT 'general'::text,
    note text,
    session_id uuid,
    started_at timestamp with time zone NOT NULL,
    user_id uuid NOT NULL
);
CREATE TABLE public.session_outcomes (
    chapter_id uuid,
    content_completed_pct double precision,
    created_at timestamp with time zone DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    is_reread boolean DEFAULT false,
    kind text NOT NULL,
    net_focus_minutes integer,
    notes text,
    recall_rating double precision,
    revision_result text DEFAULT 'pending'::text,
    session_id uuid NOT NULL,
    subtopic_id uuid,
    unit_label text,
    units_done integer,
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid NOT NULL
);
CREATE TABLE public.streak_days (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    day date NOT NULL,
    percent integer DEFAULT 0 NOT NULL,
    goal_met boolean DEFAULT false NOT NULL,
    lifeline_used boolean DEFAULT false NOT NULL,
    streak_after integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.study_sessions (
    auto_closed boolean DEFAULT false,
    break_minutes integer DEFAULT 0,
    break_started_at timestamp with time zone,
    break_type text,
    category text,
    chapter text,
    chapter_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    duration_minutes integer,
    duration_seconds integer,
    ended_at timestamp with time zone,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    is_running boolean DEFAULT false,
    kind text DEFAULT 'general'::text,
    notes text,
    planned_end_at timestamp with time zone,
    started_at timestamp with time zone NOT NULL,
    subject_id uuid,
    subject_name text,
    subtopic_id uuid,
    topic text,
    total_break_seconds integer DEFAULT 0,
    user_id uuid NOT NULL,
    xp_earned integer DEFAULT 0
);
CREATE TABLE public.subject_catalog (
    chapters jsonb DEFAULT '{}'::jsonb,
    color text DEFAULT '#7c8cff'::text,
    created_at timestamp with time zone DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    is_active boolean DEFAULT true,
    name text NOT NULL,
    notes text,
    sort_order integer DEFAULT 0,
    stream text DEFAULT 'general'::text,
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.subject_targets (
    auto_created boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    daily_chapters integer DEFAULT 0,
    daily_minutes integer DEFAULT 0,
    daily_questions integer DEFAULT 0,
    daily_topics integer DEFAULT 0,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    monthly_chapters integer DEFAULT 0,
    monthly_minutes integer DEFAULT 0,
    monthly_questions integer DEFAULT 0,
    monthly_topics integer DEFAULT 0,
    revision_day_mode text DEFAULT ''::text,
    subject_id uuid NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid NOT NULL,
    weekly_chapters integer DEFAULT 0,
    weekly_minutes integer DEFAULT 0,
    weekly_questions integer DEFAULT 0,
    weekly_topics integer DEFAULT 0
);
CREATE TABLE public.subjects (
    chapters jsonb DEFAULT '{}'::jsonb,
    color text DEFAULT '#7c8cff'::text,
    created_at timestamp with time zone DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    user_id uuid NOT NULL,
    weekly_target_hours double precision DEFAULT 7
);
CREATE TABLE public.targets (
    chapter_id uuid,
    chapters jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    daily_hours double precision DEFAULT 0,
    deadline date,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    is_active boolean DEFAULT true,
    subject_id uuid,
    title text NOT NULL,
    user_id uuid NOT NULL,
    weekly_hours double precision DEFAULT 0
);
CREATE TABLE public.test_attempts (
    chapter_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    duration_minutes integer,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    questions_attempted integer DEFAULT 0,
    questions_correct integer DEFAULT 0,
    questions_total integer NOT NULL,
    scope text DEFAULT 'chapter'::text,
    score double precision,
    session_id uuid,
    subject_id uuid,
    subtopic_id uuid,
    taken_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid NOT NULL,
    weak_topics text[] DEFAULT '{}'::text[]
);
CREATE TABLE public.timetable_blocks (
    chapter_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    day_of_week integer NOT NULL,
    end_time time without time zone NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kind text DEFAULT 'general'::text,
    location text,
    sort_order integer DEFAULT 0,
    start_time time without time zone NOT NULL,
    subject_id uuid,
    title text NOT NULL,
    user_id uuid NOT NULL,
    week_parity text DEFAULT 'all'::text
);
CREATE TABLE public.transfer_audit (
    action text NOT NULL,
    actor_user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    error text,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    status text DEFAULT 'pending'::text,
    summary jsonb DEFAULT '{}'::jsonb,
    target_user_id uuid NOT NULL
);
CREATE TABLE public.user_revision_settings (
    created_at timestamp with time zone DEFAULT now(),
    default_day_mode text,
    intervals integer[],
    max_passes integer,
    min_passes integer,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    user_id uuid NOT NULL
);
CREATE TABLE public.user_roles (
    created_at timestamp with time zone DEFAULT now(),
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role,
    user_id uuid NOT NULL
);
CREATE TABLE public.user_settings (
    accent_style text DEFAULT 'classic'::text,
    ai_autopilot boolean DEFAULT true,
    ai_tone text DEFAULT 'coach'::text,
    auto_stop_hours double precision DEFAULT 8,
    background_style text DEFAULT 'clean'::text,
    daily_goal_hours double precision DEFAULT 4,
    gender_palette_suggested boolean DEFAULT false,
    theme_mode text DEFAULT 'light'::text,
    timer_background_effects boolean DEFAULT true,
    timer_keep_awake boolean DEFAULT true,
    timer_show_details boolean DEFAULT true,
    timer_sounds_haptics boolean DEFAULT true,
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid NOT NULL,
    week_starts_monday boolean DEFAULT true,
    weekly_goal_hours double precision DEFAULT 26,
    widget_layout jsonb DEFAULT '{}'::jsonb,
    daily_goal_percent integer DEFAULT 100 NOT NULL,
    weekly_goal_percent integer DEFAULT 100 NOT NULL,
    min_count_minutes integer DEFAULT 5 NOT NULL,
    weekly_growth_factor numeric DEFAULT 2.0 NOT NULL,
    weekly_growth_cap_percent integer DEFAULT 150 NOT NULL,
    percent_per_hour jsonb DEFAULT '{"test": 20, "class": 18, "reading": 20, "practice": 20, "revision": 25, "newspaper": 20}'::jsonb NOT NULL,
    target_mode text DEFAULT 'weekly'::text NOT NULL
);
CREATE TABLE public.user_xp (
    best_streak integer DEFAULT 0,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    last_streak_at timestamp with time zone,
    level integer DEFAULT 0,
    streak integer DEFAULT 0,
    total_xp integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid NOT NULL
);
CREATE TABLE public.weekly_focus (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    week_start date NOT NULL,
    subject_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
