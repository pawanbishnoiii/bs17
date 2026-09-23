# Big finishing round — plan

## Important note on media storage
The published app runs on servers that have no permanent disk, so a file can't be saved inside the project folder: it would disappear on the next restart or deploy. Instead, every upload goes into the app's own storage at the path `data/media/<user>/<folder>/...`. Users see and manage that as a normal `/data/media/` folder tree inside the app. Nothing gets hosted outside the app.

## 1. Classes page as a full file manager (the study workspace)
- A top menu with Library, Online classes, Recent and Uploads, plus a bottom action bar (Upload, New folder, Add link, Sort).
- Folders are created automatically for each Subject and Chapter, and stay in sync when subjects or chapters change. Users can also make, rename, move and delete their own folders.
- A grid/list view with breadcrumbs, multi-select, rename, move, copy link, download and delete.
- Videos, images and PDFs open inside the app (video player, image gallery, PDF viewer).
- Fix: folders now show in Online classes.
- "Study media library" becomes an asset tool for managing the app. It shows only the fixed system folders and their content, and it works on its own.

## 2. Progress reconciliation and streak history
- Any finished study session is matched to today's plan tasks by subject, chapter and type, and the matching task's progress or completion updates. This works even when the session was started outside the task list.
- A one-time recovery rebuilds the past `streak_days` rows and task completion from old sessions. Streak history is then saved every day in the database, and the backup includes it.

## 3. Your plan — weekly algorithm
- The whole week is generated at once, and every day of the week can be viewed.
- Each day suggests at least 60% of the topics picked for that week, with all subjects mixed together and a numbered position for each task.
- "Next" pages go forward to new results and "Back" brings the earlier page back exactly as it was. Every page includes all subjects.
- It keeps the existing rules: the daily time budget from Average study time, a 90-minute minimum per chapter, the 1/3/7/15/30 revision days, and Sunday and month-end revision days.

## 4. SMTP fixes
- An "Authentication required: Yes/No" switch, and a single choice between None, STARTTLS and SSL/TLS.
- Fix: settings disappearing after Save. The form will reload the saved values, and the password stays hidden but kept.

## 5. Desktop layout and visuals
- The sidebar scrolls on its own and only when the pointer is over it; otherwise only the page scrolls.
- Fix the desktop background not showing, and use all the images and icons you shared earlier.
- More colourful clay palette and multicolour headings, and a wider desktop layout.
- Upgraded Welcome and Sign-in pages.

## Technical details
- Migration: `media_folders` hierarchy (system_managed and user), sync trigger on subjects/chapters, `reconcile_session_to_plan()` trigger on study_sessions update/insert, `rebuild_streak_history()` backfill, `generate_week_plan(week_start)` with the 60% coverage rule plus page positions.
- Storage: the existing private `data` bucket with prefix `media/{uid}/…`, RLS scoped to the owner, and signed URLs for viewing.
- Sidebar: `h-screen sticky overflow-y-auto overscroll-contain`, with the main content scrolling independently.
- Email settings: after the upsert, refetch the settings and load them back into the form; the encryption mode is an enum.
