# Learn Sculpt Studio migration and upgrade plan

## Goal
Rebuild the GitHub `main` app in this Lovable project, recreate its study database and storage, fix the reported login/upload/mobile issues, and deliver the requested adaptive study workflow without copying unsafe credentials or stale platform files.

## Build scope
1. **Clone the application experience**
   - Move the complete usable source into the current TanStack app while preserving its public, student, and admin pages.
   - Keep the uploaded Bnoy logo as a transparent mark with no circle/background and use it consistently before and after login.
   - Preserve the existing mobile/desktop design direction, then correct cramped cards, charts, study setup, navigation, and admin layouts.

2. **Recreate Lovable Cloud data and permissions**
   - Rebuild all 36 detected tables, relationships, defaults, indexes, roles, private-user policies, admin checks, helper functions, and initial settings represented by the source types and screenshots.
   - Create private chapter-media storage and admin branding storage with upload/read/update/delete rules.
   - Create user profiles automatically on signup while keeping roles in the separate secure roles table.
   - Recreate plan, revision, reading, analytics, class-note, target, notification, and session functions used by the app.

3. **Fix authentication and branding**
   - Use Lovable-managed Google login and email/password flows, including password reset and public callback handling.
   - Remove the conflicting external-host fallback that sends users to the broken `/~oauth/initiate` URL on unsupported hosting.
   - Make admin branding affect login, sidebar, mobile header, and favicon.
   - Add an admin OAuth setup panel that shows copyable authorized URLs and stores only the public client ID; the client secret remains in protected Cloud configuration and is never returned to the browser.

4. **Upgrade Today and study planning**
   - Convert timetable output into actionable daily tasks with automatic subject/chapter selection.
   - Show the top 5 tasks initially and reveal the full queue with See more/less.
   - Rank overdue reviews, unfinished chapters, class notes, practice, reading, timetable urgency, past pace, and skipped work; preserve partial chapter progress so the next session resumes intelligently.
   - Add a private notice board and odd-day/even-day reading targets.
   - Fix mobile Study cards and improve day/hour/week/month charts so study duration is readable per date and hour.

5. **Rebuild Classes as a working file manager**
   - Fix file uploads end-to-end and verify ownership, size/type validation, preview, download, delete, and ordering.
   - Add subject → chapter folders with the requested 3D-folder visual treatment, folder creation/rename, and clear upload progress/errors.
   - Keep class scheduling and spaced notes revisions connected to the daily plan.

6. **Upgrade admin operations**
   - Fix logo/favicon/media uploads.
   - Replace plaintext SMTP-password handling with protected secret configuration, add validation/test status, and make sender settings manageable without exposing credentials.
   - Keep user/role, notification, schedule, plan, import/export, and app-control tools secure and usable.

7. **Verification and documentation**
   - Verify sign-up, email login, Google login, logout, reset password, onboarding, daily tasks, chapter resume, analytics, odd/even goals, uploads/downloads, branding, and admin authorization on phone and desktop.
   - Update README with architecture, setup, Cloud schema, auth URLs, storage rules, SMTP setup, study algorithm, and deployment notes.
   - Maintain a migration ledger and clearly mark imported records/auth identities as pending until an actual database/user export is supplied.

## Technical details
- Use Lovable Cloud for authentication, database, storage, and server-side work.
- Enforce ownership with row-level policies; privileged admin work validates the caller's role server-side.
- Use migrations for schema/functions/storage policies and server functions for privileged app actions.
- Keep client secrets out of tables and browser responses.
- Preserve existing record IDs when a sanitized export is later supplied.

## Data limitation
The repository contains generated table types but no complete schema dump and no database/user records. The structure can be reconstructed now, but existing production users, study history, uploaded files, and live SMTP/OAuth credentials cannot be cloned from GitHub. They remain a separate import/verification step after the corresponding exports are provided.
