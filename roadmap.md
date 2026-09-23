# Roadmap

## Done
- Recreated all 36 backend tables, policies, grants, helper functions.
- Ported the full app from the GitHub repo; recovered all 35 assets locally.
- Transparent orange "B" logo on login, sidebar and header.
- Top 5 tasks with "See more" / "See less" on the plan board.
- Chapter-resume planning algorithm (Sunday weekly revision, month-end revision, resume unfinished chapters).
- Private notice board on Today.
- Odd / even date newspaper reading targets.
- Class folders with upload / download / delete (private storage buckets).
- Admin branding uploads (logo, favicon) via the private brand bucket.
- Study page cards: two per row on phones.
- Graph shows hours studied per day (week = per day, month = per date).

## Open
- Google sign-in on the external Vercel deployment (`/~oauth/initiate` 404) — needs the app to be served from Lovable hosting or a matching OAuth route on Vercel.
- Admin panel for Google client ID / secret + copyable authorized redirect URLs.
- SMTP settings: make fully manageable and testable from admin.
- README rewrite.
- Shopping carts (item 8) — scope unclear for a study app; needs the user's intent.

## Current
- [ ] Paginate Your plan in balanced groups of 8 with Previous/Next.
- [ ] Verify and complete 1/3/7/15/30, Sunday revision, and weekly syllabus scheduling.
- [ ] Refresh global background and vibrant multicolor clay typography.
- [ ] Reorganize and verify the Classes page on phone and desktop.

## New request (23 Sep)
- [ ] Plan day length = profile "Average study time" (default 8h, editable).
- [ ] Minimum time per chapter (confirm 1h30m) ; all subjects mixed in tasks.
- [ ] Week/month plan built from total chapter count; one main task per chapter; revisions on 1/3/7/15/30 only, carried over if not done.
- [ ] Weekly main subjects picker (60% main / 40% rest), week calendar date picker, different each week.
- [ ] Progress shows studied chapters even when not started from a task ("not started" bug).
- [ ] Start task -> study page with subject + chapter preselected, summary filled, one-tap start.
- [ ] Quick "add chapter" on study page.
- [ ] Streak target grows 15-20% per week; streaks in export; auto-rebuild streak history from sessions.
- [ ] Use uploaded icons + mobile/desktop backgrounds; admin uploads dynamic backgrounds.
- [ ] Media storage location (user wants /data/media on host) — blocked on user decision.
- [ ] SMTP: TLS / STARTTLS / SSL options, Gmail + custom mail presets.
- [ ] Vibrant multicolor clay font in more places; UI polish Today/Study.
- [ ] Classes page -> study workspace with own bottom nav, auto folders, media viewer.
