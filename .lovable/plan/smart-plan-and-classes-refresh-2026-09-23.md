# Smart Plan and Classes Refresh

## What will change
- Show eight “Your plan” tasks per page, with Previous and Next controls that reveal the next eight without expanding one long list.
- Keep tasks balanced across all subjects, then prioritize overdue revisions, unfinished work, and scheduled syllabus coverage.
- Use the 1, 3, 7, 15, and 30-day revision ladder, include Sunday revision work, and suggest chapter/type tasks from the weekly syllabus.
- Preserve the existing week/month summary with chapter/type time totals and upcoming review dates.
- Refresh the app background, headings, accent colors, and key study surfaces with a vibrant multicolor clay style that remains readable in light and dark modes.
- Reorganize the Classes page so class revisions, saved classes, folders, media upload/link actions, and previews are clearer and easier to use on phones.

## Technical details
- Update the plan page size and add stable client-side pagination that resets safely after regenerate, skip, cancel, or completion changes.
- Improve plan ranking/grouping without hiding any subject; keep database-generated review dates as the source of truth.
- Verify the backend plan function uses normalized chapters/subtopics, configured review intervals, Sunday rules, and bounded per-subject distribution; add a migration only where gaps exist.
- Reuse existing Button and semantic color tokens; add new global tokens/utilities only for the requested visual direction.
- Validate the final result in the live phone and desktop views, including plan controls and Classes media interactions.
