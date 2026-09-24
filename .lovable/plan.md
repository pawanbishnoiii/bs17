# Study OS completion round

## Goal
Background, mobile layouts, syllabus planning, Classes/Notes, and progress insights ko ek consistent production pass mein complete karna.

## 1. Global background and readability
- Ek hi fixed, non-repeating background layer har public, sign-in, and signed-in page par use hogi.
- Phone/desktop image validation: supported image format, size limit, aspect guidance, failed-image fallback, and admin upload errors.
- Browser-cached setting + preloaded image; plain readable page first, then smooth fade. Blur canvas ko edge-to-edge cover karega without white gaps.
- Admin Branding mein live phone/desktop preview, blur and overlay preview, reset controls, and matching saved values.
- Page/card translucency and contrast tune karunga so background visible ho but text readable rahe.

## 2. Mobile layout audit
- Today, Study, Targets, Classes, Welcome, Sign-in, and shared navigation ko narrow phones par check/fix karunga.
- Multi-control headers grid/min-width rules follow karenge; no right gap, horizontal clipping, overlapping buttons, or cut text.
- Study selection flow ko compact and compulsory rakhunga: subject + chapter + activity type, quick chapter add, then one-tap start.

## 3. Automatic syllabus target and planning
- “Main subjects this week” Today se Targets page par move hoga.
- User focus percentage 0–100% set kar sakega; chosen main subjects ko that share milega, remaining subjects ko rest.
- Weekly/monthly mode ke saath explicit start/end dates show hongi.
- Plan automatically selected period ke incomplete chapters distribute karega, all subjects mix karega, and all tasks numbered honge.
- Separate Regenerate button/remove-manual-refresh behavior: changing targets/focus automatically future pending rows rebuild karega; completed/pinned history safe rahegi.
- Existing 90-minute chapter minimum and daily Average study time budget preserve honge.
- Revisions 1, 3, 7, 15, 30 days par extra suggestions hongi; incomplete revisions carry forward; Sundays and month-end revision emphasis remain.
- PostgreSQL nested window calculation rewrite karke `window functions are not allowed in window definitions` error remove karunga.

## 4. Student progress insights
- Daily topic coverage percentage, completed/total tasks, study minutes, and recent streak history show karunga.
- Missed chapters/revisions ke liye clear next-action recommendations dikhengi.
- Existing session reconciliation improve karunga so plan ke bahar se studied matching chapter bhi progress/completion update kare.
- Daily streak rebuild ke baad visible streak/XP automatically refresh hoga.

## 5. Classes and Chapter Notes
- File manager polish: reliable multi-select, selection-safe preview, move destination, sorting, rename folders/files, retry failed uploads, and compact phone action bar.
- Chapter Notes upload/storage mismatch fix karunga; empty/filtered states, preview, ordering, download, and delete verify karunga.
- System subject/chapter folders automatically sync rahenge; Study media library system folders par focused rahegi.

## 6. Media location — selected local-folder mode
- Upload bytes authenticated server endpoints se `/data/media/<user>/...` mein write/read/delete honge; database mein file bytes store nahi honge.
- Database sirf folder/file metadata and ownership reference rakhega.
- Important limitation accepted: deployed server ka local disk permanent nahi hai. Restart/deploy par `/data/media` files delete ho sakti hain; this mode cannot provide durable production storage.

## 7. Visual finish and verification
- Welcome and Sign-in ko richer colourful clay direction, transparent logo, and background-aware contrast ke saath finish karunga.
- Existing clay artwork/icons ko key Today, Study, Targets, and Classes states mein apply karunga without clutter.
- Database migration, focused tests, current error logs, desktop viewport, and narrow-phone viewport verify karunga.
- Existing unrelated roadmap items (Google/Vercel hosting mismatch, shopping-cart scope, README) is round mein change nahi honge unless directly required by these fixes.

## Technical details
- Add focus percentage and planning period fields with authenticated ownership policies/grants.
- Replace nested `ROW_NUMBER() OVER (ORDER BY ROW_NUMBER() OVER (...))` with staged CTE ranking.
- Add authenticated media server routes with strict path normalization, size/type validation, and traversal protection.
- Keep route metadata intact and update only if a changed content page is missing required tags.
