export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      app_events: {
        Row: {
          created_at: string | null
          event: string
          id: string
          metadata: Json | null
          path: string | null
          platform: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event: string
          id?: string
          metadata?: Json | null
          path?: string | null
          platform?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event?: string
          id?: string
          metadata?: Json | null
          path?: string | null
          platform?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          accent_color: string | null
          ai_enabled: boolean | null
          android_force_update: boolean | null
          android_latest_version: string | null
          android_min_version: string | null
          android_update_url: string | null
          announcement_level: string | null
          avatar_upload_enabled: boolean | null
          banner_text: string | null
          default_daily_goal_hours: number | null
          default_weekly_goal_hours: number | null
          email_auth_enabled: boolean | null
          favicon_url: string | null
          google_auth_enabled: boolean | null
          id: boolean
          landing_enabled: boolean | null
          logo_url: string | null
          maintenance_note: string | null
          manual_log_enabled: boolean | null
          onboarding_require_subjects: boolean | null
          one_tap_enabled: boolean | null
          push_enabled: boolean | null
          revision_intervals: number[] | null
          revision_max_passes: number | null
          revision_min_passes: number | null
          signup_enabled: boolean | null
          site_name: string | null
          support_email: string | null
          tagline: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          ai_enabled?: boolean | null
          android_force_update?: boolean | null
          android_latest_version?: string | null
          android_min_version?: string | null
          android_update_url?: string | null
          announcement_level?: string | null
          avatar_upload_enabled?: boolean | null
          banner_text?: string | null
          default_daily_goal_hours?: number | null
          default_weekly_goal_hours?: number | null
          email_auth_enabled?: boolean | null
          favicon_url?: string | null
          google_auth_enabled?: boolean | null
          id: boolean
          landing_enabled?: boolean | null
          logo_url?: string | null
          maintenance_note?: string | null
          manual_log_enabled?: boolean | null
          onboarding_require_subjects?: boolean | null
          one_tap_enabled?: boolean | null
          push_enabled?: boolean | null
          revision_intervals?: number[] | null
          revision_max_passes?: number | null
          revision_min_passes?: number | null
          signup_enabled?: boolean | null
          site_name?: string | null
          support_email?: string | null
          tagline?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          ai_enabled?: boolean | null
          android_force_update?: boolean | null
          android_latest_version?: string | null
          android_min_version?: string | null
          android_update_url?: string | null
          announcement_level?: string | null
          avatar_upload_enabled?: boolean | null
          banner_text?: string | null
          default_daily_goal_hours?: number | null
          default_weekly_goal_hours?: number | null
          email_auth_enabled?: boolean | null
          favicon_url?: string | null
          google_auth_enabled?: boolean | null
          id?: boolean
          landing_enabled?: boolean | null
          logo_url?: string | null
          maintenance_note?: string | null
          manual_log_enabled?: boolean | null
          onboarding_require_subjects?: boolean | null
          one_tap_enabled?: boolean | null
          push_enabled?: boolean | null
          revision_intervals?: number[] | null
          revision_max_passes?: number | null
          revision_min_passes?: number | null
          signup_enabled?: boolean | null
          site_name?: string | null
          support_email?: string | null
          tagline?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      avatar_presets: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      chapter_learning_state: {
        Row: {
          chapter_id: string | null
          chapter_name: string
          class_minutes: number | null
          class_sessions: number | null
          created_at: string | null
          first_pass_completed_at: string | null
          id: string
          last_recall: number | null
          last_studied_at: string | null
          next_review_at: string | null
          practice_minutes: number | null
          practice_sessions: number | null
          progress_pct: number
          reading_minutes: number | null
          reading_sessions: number | null
          recall_samples: number | null
          resume_note: string | null
          resume_subtopic_id: string | null
          review_stage: number | null
          revision_minutes: number | null
          revision_sessions: number | null
          stopped_at: string | null
          subject_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          chapter_name: string
          class_minutes?: number | null
          class_sessions?: number | null
          created_at?: string | null
          first_pass_completed_at?: string | null
          id?: string
          last_recall?: number | null
          last_studied_at?: string | null
          next_review_at?: string | null
          practice_minutes?: number | null
          practice_sessions?: number | null
          progress_pct?: number
          reading_minutes?: number | null
          reading_sessions?: number | null
          recall_samples?: number | null
          resume_note?: string | null
          resume_subtopic_id?: string | null
          review_stage?: number | null
          revision_minutes?: number | null
          revision_sessions?: number | null
          stopped_at?: string | null
          subject_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          chapter_name?: string
          class_minutes?: number | null
          class_sessions?: number | null
          created_at?: string | null
          first_pass_completed_at?: string | null
          id?: string
          last_recall?: number | null
          last_studied_at?: string | null
          next_review_at?: string | null
          practice_minutes?: number | null
          practice_sessions?: number | null
          progress_pct?: number
          reading_minutes?: number | null
          reading_sessions?: number | null
          recall_samples?: number | null
          resume_note?: string | null
          resume_subtopic_id?: string | null
          review_stage?: number | null
          revision_minutes?: number | null
          revision_sessions?: number | null
          stopped_at?: string | null
          subject_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_learning_state_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_learning_state_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_notes: {
        Row: {
          chapter_id: string | null
          chapter_name: string | null
          created_at: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          position: number | null
          storage_path: string
          subject_id: string | null
          title: string
          topic: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          chapter_name?: string | null
          created_at?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          position?: number | null
          storage_path: string
          subject_id?: string | null
          title: string
          topic?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          chapter_name?: string | null
          created_at?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          position?: number | null
          storage_path?: string
          subject_id?: string | null
          title?: string
          topic?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_notes_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_notes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_subtopics: {
        Row: {
          chapter_id: string
          created_at: string | null
          estimated_minutes: number | null
          first_pass_done: boolean | null
          id: string
          name: string
          position: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chapter_id: string
          created_at?: string | null
          estimated_minutes?: number | null
          first_pass_done?: boolean | null
          id?: string
          name: string
          position?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string
          created_at?: string | null
          estimated_minutes?: number | null
          first_pass_done?: boolean | null
          id?: string
          name?: string
          position?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_subtopics_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          archived: boolean | null
          created_at: string | null
          difficulty: number | null
          estimated_minutes: number | null
          first_pass_done: boolean | null
          id: string
          name: string
          position: number | null
          subject_id: string
          total_units: number | null
          units_done: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          created_at?: string | null
          difficulty?: number | null
          estimated_minutes?: number | null
          first_pass_done?: boolean | null
          id?: string
          name: string
          position?: number | null
          subject_id: string
          total_units?: number | null
          units_done?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          archived?: boolean | null
          created_at?: string | null
          difficulty?: number | null
          estimated_minutes?: number | null
          first_pass_done?: boolean | null
          id?: string
          name?: string
          position?: number | null
          subject_id?: string
          total_units?: number | null
          units_done?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      class_folders: {
        Row: {
          chapter_id: string | null
          created_at: string
          id: string
          kind: string
          name: string
          parent_id: string | null
          position: number
          subject_id: string | null
          system_managed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          name: string
          parent_id?: string | null
          position?: number
          subject_id?: string | null
          system_managed?: boolean
          updated_at?: string
          user_id?: string
        }
        Update: {
          chapter_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          name?: string
          parent_id?: string | null
          position?: number
          subject_id?: string | null
          system_managed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_folders_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "class_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_folders_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      class_media: {
        Row: {
          chapter_id: string | null
          created_at: string
          duration_seconds: number | null
          external_url: string | null
          file_size: number | null
          folder_id: string | null
          id: string
          media_kind: string
          mime_type: string | null
          position: number
          source: string
          storage_path: string | null
          subject_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          external_url?: string | null
          file_size?: number | null
          folder_id?: string | null
          id?: string
          media_kind?: string
          mime_type?: string | null
          position?: number
          source?: string
          storage_path?: string | null
          subject_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          chapter_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          external_url?: string | null
          file_size?: number | null
          folder_id?: string | null
          id?: string
          media_kind?: string
          mime_type?: string | null
          position?: number
          source?: string
          storage_path?: string | null
          subject_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_media_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_media_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "class_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_media_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      class_note_revision_state: {
        Row: {
          chapter_id: string | null
          chapter_name: string | null
          class_id: string
          created_at: string | null
          id: string
          last_revised_at: string | null
          next_review_at: string | null
          review_stage: number | null
          revisions_done: number | null
          subject_id: string | null
          target_revisions: number | null
          title: string
          total_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          chapter_name?: string | null
          class_id: string
          created_at?: string | null
          id?: string
          last_revised_at?: string | null
          next_review_at?: string | null
          review_stage?: number | null
          revisions_done?: number | null
          subject_id?: string | null
          target_revisions?: number | null
          title: string
          total_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          chapter_name?: string | null
          class_id?: string
          created_at?: string | null
          id?: string
          last_revised_at?: string | null
          next_review_at?: string | null
          review_stage?: number | null
          revisions_done?: number | null
          subject_id?: string | null
          target_revisions?: number | null
          title?: string
          total_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_note_revision_state_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_note_revision_state_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "online_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_note_revision_state_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_config: {
        Row: {
          base_url: string
          created_at: string
          id: boolean
          token: string
        }
        Insert: {
          base_url?: string
          created_at?: string
          id?: boolean
          token: string
        }
        Update: {
          base_url?: string
          created_at?: string
          id?: boolean
          token?: string
        }
        Relationships: []
      }
      daily_study_plan_items: {
        Row: {
          cancelled_at: string | null
          chapter_id: string | null
          chapter_name: string | null
          class_id: string | null
          completed_at: string | null
          completed_session_id: string | null
          created_at: string | null
          id: string
          next_review_at: string | null
          pinned: boolean | null
          plan_date: string
          priority: number | null
          rank_score: number | null
          review_stage: number | null
          scheduled_end: string | null
          scheduled_start: string | null
          session_kind: string | null
          skipped_at: string | null
          source: string | null
          status: string | null
          subject_id: string | null
          subject_name: string | null
          subtopic_id: string | null
          target_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          chapter_id?: string | null
          chapter_name?: string | null
          class_id?: string | null
          completed_at?: string | null
          completed_session_id?: string | null
          created_at?: string | null
          id?: string
          next_review_at?: string | null
          pinned?: boolean | null
          plan_date: string
          priority?: number | null
          rank_score?: number | null
          review_stage?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          session_kind?: string | null
          skipped_at?: string | null
          source?: string | null
          status?: string | null
          subject_id?: string | null
          subject_name?: string | null
          subtopic_id?: string | null
          target_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          chapter_id?: string | null
          chapter_name?: string | null
          class_id?: string | null
          completed_at?: string | null
          completed_session_id?: string | null
          created_at?: string | null
          id?: string
          next_review_at?: string | null
          pinned?: boolean | null
          plan_date?: string
          priority?: number | null
          rank_score?: number | null
          review_stage?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          session_kind?: string | null
          skipped_at?: string | null
          source?: string | null
          status?: string | null
          subject_id?: string | null
          subject_name?: string | null
          subtopic_id?: string | null
          target_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_study_plan_items_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_study_plan_items_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "online_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_study_plan_items_completed_session_id_fkey"
            columns: ["completed_session_id"]
            isOneToOne: false
            referencedRelation: "study_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_study_plan_items_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_study_plan_items_subtopic_id_fkey"
            columns: ["subtopic_id"]
            isOneToOne: false
            referencedRelation: "chapter_subtopics"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tokens: {
        Row: {
          created_at: string | null
          device_label: string | null
          id: string
          last_seen_at: string | null
          platform: string | null
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_label?: string | null
          id?: string
          last_seen_at?: string | null
          platform?: string | null
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_label?: string | null
          id?: string
          last_seen_at?: string | null
          platform?: string | null
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_automations: {
        Row: {
          active: boolean
          conditions: Json
          created_at: string
          delay_minutes: number
          id: string
          name: string
          template_slug: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          conditions?: Json
          created_at?: string
          delay_minutes?: number
          id?: string
          name: string
          template_slug: string
          trigger_event: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          conditions?: Json
          created_at?: string
          delay_minutes?: number
          id?: string
          name?: string
          template_slug?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          audience: string
          created_at: string
          created_by: string | null
          failed_count: number
          filters: Json
          html_body: string
          id: string
          kind: string
          queued_count: number
          send_at: string | null
          sent_count: number
          status: string
          subject: string
          template_slug: string | null
          title: string
          updated_at: string
          user_ids: string[]
        }
        Insert: {
          audience?: string
          created_at?: string
          created_by?: string | null
          failed_count?: number
          filters?: Json
          html_body: string
          id?: string
          kind?: string
          queued_count?: number
          send_at?: string | null
          sent_count?: number
          status?: string
          subject: string
          template_slug?: string | null
          title: string
          updated_at?: string
          user_ids?: string[]
        }
        Update: {
          audience?: string
          created_at?: string
          created_by?: string | null
          failed_count?: number
          filters?: Json
          html_body?: string
          id?: string
          kind?: string
          queued_count?: number
          send_at?: string | null
          sent_count?: number
          status?: string
          subject?: string
          template_slug?: string | null
          title?: string
          updated_at?: string
          user_ids?: string[]
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          campaign_id: string | null
          created_at: string
          detail: string | null
          event: string
          id: string
          queue_id: string | null
          subject: string | null
          to_email: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          detail?: string | null
          event: string
          id?: string
          queue_id?: string | null
          subject?: string | null
          to_email: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          detail?: string | null
          event?: string
          id?: string
          queue_id?: string | null
          subject?: string | null
          to_email?: string
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          attempts: number
          campaign_id: string | null
          created_at: string
          html_body: string
          id: string
          kind: string
          last_error: string | null
          max_attempts: number
          next_attempt_at: string
          sent_at: string | null
          status: string
          subject: string
          to_email: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attempts?: number
          campaign_id?: string | null
          created_at?: string
          html_body: string
          id?: string
          kind?: string
          last_error?: string | null
          max_attempts?: number
          next_attempt_at?: string
          sent_at?: string | null
          status?: string
          subject: string
          to_email: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attempts?: number
          campaign_id?: string | null
          created_at?: string
          html_body?: string
          id?: string
          kind?: string
          last_error?: string | null
          max_attempts?: number
          next_attempt_at?: string
          sent_at?: string | null
          status?: string
          subject?: string
          to_email?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_settings: {
        Row: {
          adapter: string
          api_key: string | null
          encryption: string
          from_email: string | null
          from_name: string | null
          id: boolean
          last_error: string | null
          last_verified_at: string | null
          provider: string | null
          reply_to: string | null
          smtp_auth: boolean
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_user: string | null
          timeout_seconds: number
          updated_at: string | null
          verify_ssl: boolean
        }
        Insert: {
          adapter?: string
          api_key?: string | null
          encryption?: string
          from_email?: string | null
          from_name?: string | null
          id: boolean
          last_error?: string | null
          last_verified_at?: string | null
          provider?: string | null
          reply_to?: string | null
          smtp_auth?: boolean
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          timeout_seconds?: number
          updated_at?: string | null
          verify_ssl?: boolean
        }
        Update: {
          adapter?: string
          api_key?: string | null
          encryption?: string
          from_email?: string | null
          from_name?: string | null
          id?: boolean
          last_error?: string | null
          last_verified_at?: string | null
          provider?: string | null
          reply_to?: string | null
          smtp_auth?: boolean
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          timeout_seconds?: number
          updated_at?: string | null
          verify_ssl?: boolean
        }
        Relationships: []
      }
      email_suppressions: {
        Row: {
          created_at: string
          email: string
          id: string
          reason: string
          scope: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          reason?: string
          scope?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          reason?: string
          scope?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          category: string
          created_at: string
          html_body: string
          id: string
          is_system: boolean
          name: string
          slug: string
          subject: string
          updated_at: string
          variables: Json
        }
        Insert: {
          category?: string
          created_at?: string
          html_body: string
          id?: string
          is_system?: boolean
          name: string
          slug: string
          subject: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          category?: string
          created_at?: string
          html_body?: string
          id?: string
          is_system?: boolean
          name?: string
          slug?: string
          subject?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: []
      }
      error_events: {
        Row: {
          category: string
          context: string | null
          created_at: string
          detail: Json
          id: string
          message: string
          resolution_note: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          user_id: string | null
        }
        Insert: {
          category: string
          context?: string | null
          created_at?: string
          detail?: Json
          id?: string
          message: string
          resolution_note?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          context?: string | null
          created_at?: string
          detail?: Json
          id?: string
          message?: string
          resolution_note?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      export_history: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          file_name: string
          id: string
          size_bytes: number | null
          status: string | null
          storage_path: string | null
          summary: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          file_name: string
          id?: string
          size_bytes?: number | null
          status?: string | null
          storage_path?: string | null
          summary?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          file_name?: string
          id?: string
          size_bytes?: number | null
          status?: string | null
          storage_path?: string | null
          summary?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      legacy_user_claims: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string | null
          email: string
          payload: Json
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string | null
          email: string
          payload: Json
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string | null
          email?: string
          payload?: Json
        }
        Relationships: []
      }
      motivations: {
        Row: {
          author: string | null
          body: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          kind: string | null
          month: number | null
          title: string | null
        }
        Insert: {
          author?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          kind?: string | null
          month?: number | null
          title?: string | null
        }
        Update: {
          author?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          kind?: string | null
          month?: number | null
          title?: string | null
        }
        Relationships: []
      }
      notices: {
        Row: {
          body: string
          created_at: string
          done: boolean
          id: string
          pinned: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          done?: boolean
          id?: string
          pinned?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          done?: boolean
          id?: string
          pinned?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_path: string | null
          audience: string | null
          body: string | null
          created_at: string | null
          created_by: string | null
          id: string
          image_url: string | null
          kind: string | null
          push_sent: boolean | null
          read: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          action_path?: string | null
          audience?: string | null
          body?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url?: string | null
          kind?: string | null
          push_sent?: boolean | null
          read?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          action_path?: string | null
          audience?: string | null
          body?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url?: string | null
          kind?: string | null
          push_sent?: boolean | null
          read?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      oauth_settings: {
        Row: {
          google_client_id: string | null
          google_client_secret: string | null
          id: boolean
          updated_at: string
        }
        Insert: {
          google_client_id?: string | null
          google_client_secret?: string | null
          id?: boolean
          updated_at?: string
        }
        Update: {
          google_client_id?: string | null
          google_client_secret?: string | null
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      online_classes: {
        Row: {
          chapter_id: string | null
          chapter_name: string | null
          completed_at: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          mode: string | null
          notes_taken: boolean | null
          scheduled_at: string | null
          status: string | null
          subject_id: string | null
          title: string
          updated_at: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          chapter_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          mode?: string | null
          notes_taken?: boolean | null
          scheduled_at?: string | null
          status?: string | null
          subject_id?: string | null
          title: string
          updated_at?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          chapter_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          mode?: string | null
          notes_taken?: boolean | null
          scheduled_at?: string | null
          status?: string | null
          subject_id?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "online_classes_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_classes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          avg_study_hours: number | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          last_seen_at: string | null
          onboarded: boolean | null
          onboarded_at: string | null
          phone: string | null
          sign_in_count: number | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          avg_study_hours?: number | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          gender?: string | null
          id: string
          last_name?: string | null
          last_seen_at?: string | null
          onboarded?: boolean | null
          onboarded_at?: string | null
          phone?: string | null
          sign_in_count?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          avg_study_hours?: number | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          last_seen_at?: string | null
          onboarded?: boolean | null
          onboarded_at?: string | null
          phone?: string | null
          sign_in_count?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reading_goals: {
        Row: {
          created_at: string | null
          even_day_minutes: number
          magazine_monthly_minutes: number | null
          newspaper_daily_minutes: number | null
          odd_day_minutes: number
          odd_even_enabled: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          even_day_minutes?: number
          magazine_monthly_minutes?: number | null
          newspaper_daily_minutes?: number | null
          odd_day_minutes?: number
          odd_even_enabled?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          even_day_minutes?: number
          magazine_monthly_minutes?: number | null
          newspaper_daily_minutes?: number | null
          odd_day_minutes?: number
          odd_even_enabled?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reading_logs: {
        Row: {
          created_at: string | null
          id: string
          kind: string
          log_date: string
          minutes: number | null
          note: string | null
          sittings: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          kind: string
          log_date: string
          minutes?: number | null
          note?: string | null
          sittings?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          kind?: string
          log_date?: string
          minutes?: number | null
          note?: string | null
          sittings?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scheduled_emails: {
        Row: {
          attempts: number | null
          audience: string | null
          body: string
          created_at: string | null
          created_by: string | null
          error: string | null
          id: string
          send_at: string
          sent_count: number | null
          status: string | null
          subject: string
          updated_at: string | null
          user_ids: string[] | null
        }
        Insert: {
          attempts?: number | null
          audience?: string | null
          body: string
          created_at?: string | null
          created_by?: string | null
          error?: string | null
          id?: string
          send_at: string
          sent_count?: number | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_ids?: string[] | null
        }
        Update: {
          attempts?: number | null
          audience?: string | null
          body?: string
          created_at?: string | null
          created_by?: string | null
          error?: string | null
          id?: string
          send_at?: string
          sent_count?: number | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_ids?: string[] | null
        }
        Relationships: []
      }
      scheduled_notifications: {
        Row: {
          action_path: string | null
          audience: string | null
          body: string | null
          created_at: string | null
          created_by: string | null
          error: string | null
          id: string
          image_url: string | null
          send_at: string | null
          status: string | null
          title: string
        }
        Insert: {
          action_path?: string | null
          audience?: string | null
          body?: string | null
          created_at?: string | null
          created_by?: string | null
          error?: string | null
          id?: string
          image_url?: string | null
          send_at?: string | null
          status?: string | null
          title: string
        }
        Update: {
          action_path?: string | null
          audience?: string | null
          body?: string | null
          created_at?: string | null
          created_by?: string | null
          error?: string | null
          id?: string
          image_url?: string | null
          send_at?: string | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      session_breaks: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          ended_at: string | null
          id: string
          kind: string | null
          note: string | null
          session_id: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          kind?: string | null
          note?: string | null
          session_id?: string | null
          started_at: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          kind?: string | null
          note?: string | null
          session_id?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_breaks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "study_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_outcomes: {
        Row: {
          chapter_id: string | null
          content_completed_pct: number | null
          created_at: string | null
          id: string
          is_reread: boolean | null
          kind: string
          net_focus_minutes: number | null
          notes: string | null
          recall_rating: number | null
          revision_result: string | null
          session_id: string
          subtopic_id: string | null
          unit_label: string | null
          units_done: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          content_completed_pct?: number | null
          created_at?: string | null
          id?: string
          is_reread?: boolean | null
          kind: string
          net_focus_minutes?: number | null
          notes?: string | null
          recall_rating?: number | null
          revision_result?: string | null
          session_id: string
          subtopic_id?: string | null
          unit_label?: string | null
          units_done?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          content_completed_pct?: number | null
          created_at?: string | null
          id?: string
          is_reread?: boolean | null
          kind?: string
          net_focus_minutes?: number | null
          notes?: string | null
          recall_rating?: number | null
          revision_result?: string | null
          session_id?: string
          subtopic_id?: string | null
          unit_label?: string | null
          units_done?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_outcomes_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_outcomes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "study_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_outcomes_subtopic_id_fkey"
            columns: ["subtopic_id"]
            isOneToOne: false
            referencedRelation: "chapter_subtopics"
            referencedColumns: ["id"]
          },
        ]
      }
      streak_days: {
        Row: {
          created_at: string
          day: string
          goal_met: boolean
          id: string
          lifeline_used: boolean
          percent: number
          streak_after: number
          user_id: string
        }
        Insert: {
          created_at?: string
          day: string
          goal_met?: boolean
          id?: string
          lifeline_used?: boolean
          percent?: number
          streak_after?: number
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          goal_met?: boolean
          id?: string
          lifeline_used?: boolean
          percent?: number
          streak_after?: number
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          auto_closed: boolean | null
          break_minutes: number | null
          break_started_at: string | null
          break_type: string | null
          category: string | null
          chapter: string | null
          chapter_id: string | null
          created_at: string | null
          duration_minutes: number | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          is_running: boolean | null
          kind: string | null
          notes: string | null
          planned_end_at: string | null
          started_at: string
          subject_id: string | null
          subject_name: string | null
          subtopic_id: string | null
          topic: string | null
          total_break_seconds: number | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          auto_closed?: boolean | null
          break_minutes?: number | null
          break_started_at?: string | null
          break_type?: string | null
          category?: string | null
          chapter?: string | null
          chapter_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          is_running?: boolean | null
          kind?: string | null
          notes?: string | null
          planned_end_at?: string | null
          started_at: string
          subject_id?: string | null
          subject_name?: string | null
          subtopic_id?: string | null
          topic?: string | null
          total_break_seconds?: number | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          auto_closed?: boolean | null
          break_minutes?: number | null
          break_started_at?: string | null
          break_type?: string | null
          category?: string | null
          chapter?: string | null
          chapter_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          is_running?: boolean | null
          kind?: string | null
          notes?: string | null
          planned_end_at?: string | null
          started_at?: string
          subject_id?: string | null
          subject_name?: string | null
          subtopic_id?: string | null
          topic?: string | null
          total_break_seconds?: number | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_subtopic_id_fkey"
            columns: ["subtopic_id"]
            isOneToOne: false
            referencedRelation: "chapter_subtopics"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_catalog: {
        Row: {
          chapters: Json | null
          color: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          sort_order: number | null
          stream: string | null
          updated_at: string | null
        }
        Insert: {
          chapters?: Json | null
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          sort_order?: number | null
          stream?: string | null
          updated_at?: string | null
        }
        Update: {
          chapters?: Json | null
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          sort_order?: number | null
          stream?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subject_targets: {
        Row: {
          auto_created: boolean | null
          created_at: string | null
          daily_chapters: number | null
          daily_minutes: number | null
          daily_questions: number | null
          daily_topics: number | null
          id: string
          monthly_chapters: number | null
          monthly_minutes: number | null
          monthly_questions: number | null
          monthly_topics: number | null
          revision_day_mode: string | null
          subject_id: string
          updated_at: string | null
          user_id: string
          weekly_chapters: number | null
          weekly_minutes: number | null
          weekly_questions: number | null
          weekly_topics: number | null
        }
        Insert: {
          auto_created?: boolean | null
          created_at?: string | null
          daily_chapters?: number | null
          daily_minutes?: number | null
          daily_questions?: number | null
          daily_topics?: number | null
          id?: string
          monthly_chapters?: number | null
          monthly_minutes?: number | null
          monthly_questions?: number | null
          monthly_topics?: number | null
          revision_day_mode?: string | null
          subject_id: string
          updated_at?: string | null
          user_id: string
          weekly_chapters?: number | null
          weekly_minutes?: number | null
          weekly_questions?: number | null
          weekly_topics?: number | null
        }
        Update: {
          auto_created?: boolean | null
          created_at?: string | null
          daily_chapters?: number | null
          daily_minutes?: number | null
          daily_questions?: number | null
          daily_topics?: number | null
          id?: string
          monthly_chapters?: number | null
          monthly_minutes?: number | null
          monthly_questions?: number | null
          monthly_topics?: number | null
          revision_day_mode?: string | null
          subject_id?: string
          updated_at?: string | null
          user_id?: string
          weekly_chapters?: number | null
          weekly_minutes?: number | null
          weekly_questions?: number | null
          weekly_topics?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subject_targets_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          chapters: Json | null
          color: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
          weekly_target_hours: number | null
        }
        Insert: {
          chapters?: Json | null
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id: string
          weekly_target_hours?: number | null
        }
        Update: {
          chapters?: Json | null
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
          weekly_target_hours?: number | null
        }
        Relationships: []
      }
      targets: {
        Row: {
          chapter_id: string | null
          chapters: Json | null
          created_at: string | null
          daily_hours: number | null
          deadline: string | null
          id: string
          is_active: boolean | null
          subject_id: string | null
          title: string
          user_id: string
          weekly_hours: number | null
        }
        Insert: {
          chapter_id?: string | null
          chapters?: Json | null
          created_at?: string | null
          daily_hours?: number | null
          deadline?: string | null
          id?: string
          is_active?: boolean | null
          subject_id?: string | null
          title: string
          user_id: string
          weekly_hours?: number | null
        }
        Update: {
          chapter_id?: string | null
          chapters?: Json | null
          created_at?: string | null
          daily_hours?: number | null
          deadline?: string | null
          id?: string
          is_active?: boolean | null
          subject_id?: string | null
          title?: string
          user_id?: string
          weekly_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "targets_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "targets_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      test_attempts: {
        Row: {
          chapter_id: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          questions_attempted: number | null
          questions_correct: number | null
          questions_total: number
          scope: string | null
          score: number | null
          session_id: string | null
          subject_id: string | null
          subtopic_id: string | null
          taken_at: string | null
          updated_at: string | null
          user_id: string
          weak_topics: string[] | null
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          questions_attempted?: number | null
          questions_correct?: number | null
          questions_total: number
          scope?: string | null
          score?: number | null
          session_id?: string | null
          subject_id?: string | null
          subtopic_id?: string | null
          taken_at?: string | null
          updated_at?: string | null
          user_id: string
          weak_topics?: string[] | null
        }
        Update: {
          chapter_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          questions_attempted?: number | null
          questions_correct?: number | null
          questions_total?: number
          scope?: string | null
          score?: number | null
          session_id?: string | null
          subject_id?: string | null
          subtopic_id?: string | null
          taken_at?: string | null
          updated_at?: string | null
          user_id?: string
          weak_topics?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "study_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_subtopic_id_fkey"
            columns: ["subtopic_id"]
            isOneToOne: false
            referencedRelation: "chapter_subtopics"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_blocks: {
        Row: {
          chapter_id: string | null
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          kind: string | null
          location: string | null
          sort_order: number | null
          start_time: string
          subject_id: string | null
          title: string
          user_id: string
          week_parity: string | null
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          kind?: string | null
          location?: string | null
          sort_order?: number | null
          start_time: string
          subject_id?: string | null
          title: string
          user_id: string
          week_parity?: string | null
        }
        Update: {
          chapter_id?: string | null
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          kind?: string | null
          location?: string | null
          sort_order?: number | null
          start_time?: string
          subject_id?: string | null
          title?: string
          user_id?: string
          week_parity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetable_blocks_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_blocks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_audit: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string | null
          error: string | null
          id: string
          status: string | null
          summary: Json | null
          target_user_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string | null
          error?: string | null
          id?: string
          status?: string | null
          summary?: Json | null
          target_user_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string | null
          error?: string | null
          id?: string
          status?: string | null
          summary?: Json | null
          target_user_id?: string
        }
        Relationships: []
      }
      user_revision_settings: {
        Row: {
          created_at: string | null
          default_day_mode: string | null
          intervals: number[] | null
          max_passes: number | null
          min_passes: number | null
          updated_at: string | null
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          default_day_mode?: string | null
          intervals?: number[] | null
          max_passes?: number | null
          min_passes?: number | null
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          default_day_mode?: string | null
          intervals?: number[] | null
          max_passes?: number | null
          min_passes?: number | null
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          accent_style: string | null
          ai_autopilot: boolean | null
          ai_tone: string | null
          auto_stop_hours: number | null
          background_style: string | null
          daily_goal_hours: number | null
          daily_goal_percent: number
          gender_palette_suggested: boolean | null
          min_count_minutes: number
          percent_per_hour: Json
          target_mode: string
          theme_mode: string | null
          timer_background_effects: boolean | null
          timer_keep_awake: boolean | null
          timer_show_details: boolean | null
          timer_sounds_haptics: boolean | null
          updated_at: string | null
          user_id: string
          week_starts_monday: boolean | null
          weekly_goal_hours: number | null
          weekly_goal_percent: number
          weekly_growth_cap_percent: number
          weekly_growth_factor: number
          widget_layout: Json | null
        }
        Insert: {
          accent_style?: string | null
          ai_autopilot?: boolean | null
          ai_tone?: string | null
          auto_stop_hours?: number | null
          background_style?: string | null
          daily_goal_hours?: number | null
          daily_goal_percent?: number
          gender_palette_suggested?: boolean | null
          min_count_minutes?: number
          percent_per_hour?: Json
          target_mode?: string
          theme_mode?: string | null
          timer_background_effects?: boolean | null
          timer_keep_awake?: boolean | null
          timer_show_details?: boolean | null
          timer_sounds_haptics?: boolean | null
          updated_at?: string | null
          user_id: string
          week_starts_monday?: boolean | null
          weekly_goal_hours?: number | null
          weekly_goal_percent?: number
          weekly_growth_cap_percent?: number
          weekly_growth_factor?: number
          widget_layout?: Json | null
        }
        Update: {
          accent_style?: string | null
          ai_autopilot?: boolean | null
          ai_tone?: string | null
          auto_stop_hours?: number | null
          background_style?: string | null
          daily_goal_hours?: number | null
          daily_goal_percent?: number
          gender_palette_suggested?: boolean | null
          min_count_minutes?: number
          percent_per_hour?: Json
          target_mode?: string
          theme_mode?: string | null
          timer_background_effects?: boolean | null
          timer_keep_awake?: boolean | null
          timer_show_details?: boolean | null
          timer_sounds_haptics?: boolean | null
          updated_at?: string | null
          user_id?: string
          week_starts_monday?: boolean | null
          weekly_goal_hours?: number | null
          weekly_goal_percent?: number
          weekly_growth_cap_percent?: number
          weekly_growth_factor?: number
          widget_layout?: Json | null
        }
        Relationships: []
      }
      user_xp: {
        Row: {
          best_streak: number | null
          id: string
          last_streak_at: string | null
          level: number | null
          streak: number | null
          total_xp: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          best_streak?: number | null
          id?: string
          last_streak_at?: string | null
          level?: number | null
          streak?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          best_streak?: number | null
          id?: string
          last_streak_at?: string | null
          level?: number | null
          streak?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      weekly_focus: {
        Row: {
          created_at: string
          id: string
          subject_ids: string[]
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          subject_ids?: string[]
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          subject_ids?: string[]
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      chapter_pace: {
        Args: never
        Returns: {
          avg_chapter_minutes: number
          avg_reading_minutes: number
          avg_revision_minutes: number
          chapters_completed: number
          chapters_tracked: number
        }[]
      }
      close_stale_sessions: { Args: never; Returns: undefined }
      complete_my_revision: {
        Args: { p_kind: string; p_minutes?: number; p_state_id?: string }
        Returns: string
      }
      ensure_my_subject_targets: { Args: never; Returns: number }
      goal_percent_for: {
        Args: { _kind: string; _minutes: number }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_reading: {
        Args: { _kind: string; _minutes: number }
        Returns: {
          created_at: string | null
          id: string
          kind: string
          log_date: string
          minutes: number | null
          note: string | null
          sittings: number | null
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "reading_logs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rebuild_my_streak_history: { Args: never; Returns: number }
      refresh_all_daily_plans: {
        Args: { p_plan_date?: string }
        Returns: number
      }
      refresh_my_study_plan: { Args: { p_plan_date?: string }; Returns: number }
      refresh_user_study_plan: {
        Args: { p_plan_date?: string; p_user_id: string }
        Returns: number
      }
      schedule_my_daily_plan: {
        Args: { p_plan_date: string }
        Returns: undefined
      }
      set_plan_item_status: {
        Args: { _item_id: string; _status: string }
        Returns: number
      }
      snapshot_streak_day: { Args: { p_day?: string }; Returns: number }
      sync_my_class_folders: { Args: never; Returns: number }
      sync_user_class_folders: { Args: { p_user: string }; Returns: number }
      touch_last_seen: { Args: never; Returns: undefined }
      undo_reading: { Args: { _kind: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
