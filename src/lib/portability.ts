import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";
import { downloadNoteBlob, restoreNote, type ChapterNote } from "@/lib/notes";

/**
 * Personal data transfer: one ZIP holding a JSON manifest of every table the
 * signed-in user owns plus the actual PDF files, so another account can
 * import the same study setup and history.
 */

type Row = Record<string, unknown>;

/** Tables copied as-is (subject/chapter links are remapped on import). */
const SIMPLE_TABLES = [
  "user_settings",
  "subject_targets",
  "targets",
  "timetable_blocks",
  "reading_logs",
  "reading_goals",
  "online_classes",
  "chapter_learning_state",
  "test_attempts",
  "daily_study_plan_items",
  "class_note_revision_state",
  "user_xp",
] as const;

/** Every part of an export the user can include or leave out. */
export const TRANSFER_SECTIONS = [
  { id: "profile", label: "Profile & preferences", keys: ["profile", "user_settings", "reading_goals", "user_xp"] },
  { id: "subjects", label: "Subjects", keys: ["subjects"] },
  { id: "chapters", label: "Chapters", keys: ["chapters"] },
  { id: "subtopics", label: "Topics & types", keys: ["chapter_subtopics"] },
  { id: "sessions", label: "Study history", keys: ["study_sessions", "session_breaks", "session_outcomes"] },
  { id: "streaks", label: "Streak history", keys: ["streak_days"] },
  { id: "plan", label: "Daily plan & revisions", keys: ["daily_study_plan_items", "chapter_learning_state", "class_note_revision_state"] },
  { id: "targets", label: "Targets & timetable", keys: ["subject_targets", "targets", "timetable_blocks"] },
  { id: "classes", label: "Online classes & tests", keys: ["online_classes", "test_attempts"] },
  { id: "reading", label: "Reading logs", keys: ["reading_logs"] },
  { id: "notes", label: "Notes & PDFs", keys: ["chapter_notes"] },
] as const;

export type SectionId = (typeof TRANSFER_SECTIONS)[number]["id"];
export type Selection = Record<SectionId, boolean>;

export function allSections(value = true): Selection {
  return Object.fromEntries(TRANSFER_SECTIONS.map((section) => [section.id, value])) as Selection;
}

const SECTION_OF = new Map<string, SectionId>();
for (const section of TRANSFER_SECTIONS) {
  for (const key of section.keys) SECTION_OF.set(key, section.id);
}

/** Is this manifest key part of a selected section? Unknown keys are allowed. */
function enabled(selection: Selection, key: string) {
  const section = SECTION_OF.get(key);
  return section ? selection[section] !== false : true;
}

export type TransferMode = "full" | "study";
const VALID_FORMATS = new Set(["bnoy-study-user-export", "chronodeck-user-export"]);

async function currentUser() {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) throw new Error("Not signed in");
  return user;
}

async function readAll(table: string): Promise<Row[]> {
  const { data, error } = await supabase.from(table as never).select("*");
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data ?? []) as Row[];
}

async function readSafe(table: string): Promise<Row[]> {
  try {
    return await readAll(table);
  } catch {
    return [];
  }
}

export type ExportSummary = {
  subjects: number;
  chapters: number;
  sessions: number;
  notes: number;
  /** Row count per section id, for a precise preview. */
  counts: Partial<Record<SectionId, number>>;
};

/** Progress callback shared by export and import: a label plus 0–100 percent. */
export type ProgressFn = (label: string, percent: number) => void;

/** Build the ZIP and hand it back with a short summary for the UI. */
export async function buildExportZip(
  mode: TransferMode = "full",
  selection: Selection = allSections(),
  onProgress?: ProgressFn,
): Promise<{ blob: Blob; summary: ExportSummary }> {
  const user = await currentUser();
  const keep = (key: string) => enabled(selection, key);
  onProgress?.("Starting export", 2);


  const manifest: Record<string, unknown> = {
    format: "bnoy-study-user-export",
    version: 3,
    transfer_mode: mode,
    exported_at: new Date().toISOString(),
    source_email: user.email ?? null,
    sections: selection,
  };

  if (mode === "full" && keep("profile")) {
    onProgress?.("Profile", 6);
    const profile = await readAll("profiles");
    manifest["profile"] = profile[0] ?? null;
  }

  onProgress?.("Subjects", 12);
  const subjects = keep("subjects") ? await readAll("subjects") : [];
  onProgress?.("Chapters", 18);
  const chapters = keep("chapters") ? await readAll("chapters") : [];
  onProgress?.("Topics & types", 24);
  const subtopics = keep("chapter_subtopics") ? await readAll("chapter_subtopics") : [];
  onProgress?.("Study history", 32);
  const sessions = keep("study_sessions") ? await readAll("study_sessions") : [];
  const breaks = keep("session_breaks") ? await readAll("session_breaks") : [];
  const outcomes = keep("session_outcomes") ? await readAll("session_outcomes") : [];
  onProgress?.("Streaks", 40);
  const streaks = keep("streak_days") ? await readSafe("streak_days") : [];
  const notes = keep("chapter_notes") ? ((await readAll("chapter_notes")) as unknown as ChapterNote[]) : [];

  manifest["subjects"] = subjects;
  manifest["chapters"] = chapters;
  manifest["chapter_subtopics"] = subtopics;
  manifest["study_sessions"] = sessions;
  manifest["session_breaks"] = breaks;
  manifest["session_outcomes"] = outcomes;
  manifest["streak_days"] = streaks;
  manifest["chapter_notes"] = notes;

  onProgress?.("Targets, plan & classes", 48);
  for (const table of SIMPLE_TABLES) {
    if (mode === "study" && ["user_settings", "reading_goals", "user_xp"].includes(table)) continue;
    manifest[table] = keep(table) ? await readAll(table) : [];
  }

  const zip = new JSZip();
  const folder = zip.folder("media");
  let done = 0;
  for (const note of notes) {
    try {
      const blob = await downloadNoteBlob(note.storage_path);
      const extension = note.title.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "bin";
      folder?.file(`${note.id}.${extension}`, blob);
    } catch {
      // A missing file should not break the whole export.
    }
    done += 1;
    onProgress?.(`Files ${done}/${notes.length}`, 55 + Math.round((done / Math.max(notes.length, 1)) * 30));
  }
  zip.file("data.json", JSON.stringify(manifest, null, 2));

  const blob = await zip.generateAsync({ type: "blob" }, (meta) =>
    onProgress?.("Packing file", 88 + Math.round((meta.percent / 100) * 11)),
  );
  onProgress?.("Done", 100);
  return {

    blob,
    summary: {
      subjects: subjects.length,
      chapters: chapters.length,
      sessions: sessions.length,
      notes: notes.length,
      counts: countSections(manifest),
    },
  };
}

/** Count the rows each section contributes, so the preview is never guesswork. */
function countSections(manifest: Record<string, unknown>): Partial<Record<SectionId, number>> {
  const counts: Partial<Record<SectionId, number>> = {};
  for (const section of TRANSFER_SECTIONS) {
    let total = 0;
    for (const key of section.keys) {
      const value = manifest[key];
      if (Array.isArray(value)) total += value.length;
      else if (key === "profile" && value && typeof value === "object") total += 1;
    }
    counts[section.id] = total;
  }
  return counts;
}

export function saveBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type ImportPreview = {
  zip: JSZip | null;
  manifest: Record<string, unknown>;
  summary: ExportSummary;
  exportedAt: string | null;
  mode: TransferMode;
};

/** Read the uploaded ZIP and describe what it would add, before writing. */
export async function readImportZip(file: File): Promise<ImportPreview> {
  let zip: JSZip | null = null;
  let manifest: Record<string, unknown>;
  if (file.name.toLowerCase().endsWith(".json") || file.type === "application/json") {
    manifest = JSON.parse(await file.text()) as Record<string, unknown>;
  } else {
    zip = await JSZip.loadAsync(file);
    const entry = zip.file("data.json");
    if (!entry) throw new Error("Ye Bnoy Study export file nahi lag rahi");
    manifest = JSON.parse(await entry.async("string")) as Record<string, unknown>;
  }
  if (!VALID_FORMATS.has(String(manifest["format"] ?? ""))) throw new Error("Ye valid Bnoy Study export nahi hai");
  const version = Number(manifest["version"] ?? 1);
  if (!Number.isFinite(version) || version < 1 || version > 3) throw new Error("Is export version ko app support nahi karti");
  const list = (key: string) => (Array.isArray(manifest[key]) ? (manifest[key] as Row[]) : []);
  return {
    zip,
    manifest,
    exportedAt: typeof manifest["exported_at"] === "string" ? manifest["exported_at"] : null,
    mode: manifest["transfer_mode"] === "study" ? "study" : "full",
    summary: {
      subjects: list("subjects").length,
      chapters: list("chapters").length,
      sessions: list("study_sessions").length,
      notes: list("chapter_notes").length,
      counts: countSections(manifest),
    },
  };
}

function strip(row: Row, userId: string, extra: Row = {}): Row {
  const { id: _id, user_id: _u, created_at: _c, updated_at: _up, ...rest } = row;
  return { ...rest, ...extra, user_id: userId };
}

async function insertMapped(
  table: string,
  rows: Row[],
  userId: string,
  map: (row: Row) => Row | null,
): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const row of rows) {
    const mapped = map(row);
    if (!mapped) continue;
    const { data, error } = await supabase
      .from(table as never)
      .insert(strip(mapped, userId) as never)
      .select("id")
      .maybeSingle();
    if (error) continue; // skip a row rather than abort the whole import
    const newId = (data as Row | null)?.["id"];
    const oldId = row["id"];
    if (typeof newId === "string" && typeof oldId === "string") ids.set(oldId, newId);
  }
  return ids;
}

/** Write an uploaded export into the signed-in account. Existing data stays. */
export async function applyImport(
  preview: ImportPreview,
  onProgress?: ProgressFn,
  selection: Selection = allSections(),
) {
  const user = await currentUser();
  const uid = user.id;
  const list = (key: string) => (Array.isArray(preview.manifest[key]) ? (preview.manifest[key] as Row[]) : []);
  const str = (value: unknown) => (typeof value === "string" ? value : null);
  const failures: string[] = [];
  const keep = (key: string) => enabled(selection, key);

  if (keep("profile") && preview.mode === "full" && preview.manifest["profile"] && typeof preview.manifest["profile"] === "object") {
    onProgress?.("Profile and preferences", 5);
    const row = preview.manifest["profile"] as Row;
    const allowed = ["first_name", "last_name", "display_name", "bio", "phone", "gender", "age", "timezone", "avatar_url", "avg_study_hours"];
    const patch = Object.fromEntries(allowed.filter((key) => key in row).map((key) => [key, row[key]]));
    const { error } = await supabase.from("profiles").update(patch as never).eq("id", uid);
    if (error) failures.push(`Profile: ${error.message}`);
  }

  onProgress?.("Subjects", 15);
  const existingSubjects = await readAll("subjects");
  const byName = new Map(existingSubjects.map((s) => [String(s["name"]).toLowerCase(), String(s["id"])]));
  const subjectMap = new Map<string, string>();
  for (const row of list("subjects")) {
    const name = String(row["name"] ?? "").trim();
    if (!name) continue;
    const dupe = byName.get(name.toLowerCase());
    if (dupe) {
      subjectMap.set(String(row["id"]), dupe);
      continue;
    }
    // Subjects left out of the import still map onto same-named subjects the
    // account already has, so chapters and history keep their links.
    if (!keep("subjects")) continue;
    const { data, error } = await supabase
      .from("subjects")
      .insert(strip(row, uid) as never)
      .select("id")
      .maybeSingle();
    if (!error && data) subjectMap.set(String(row["id"]), String((data as Row)["id"]));
  }

  onProgress?.("Chapters", 30);
  const chapterMap = keep("chapters")
    ? await insertMapped("chapters", list("chapters"), uid, (row) => {
        const subject = subjectMap.get(String(row["subject_id"]));
        if (!subject) return null;
        return { ...row, subject_id: subject };
      })
    : new Map<string, string>();

  onProgress?.("Topics & types", 42);
  const subtopicMap = keep("chapter_subtopics")
    ? await insertMapped("chapter_subtopics", list("chapter_subtopics"), uid, (row) => {
        const chapter = chapterMap.get(String(row["chapter_id"]));
        if (!chapter) return null;
        return { ...row, chapter_id: chapter };
      })
    : new Map<string, string>();

  onProgress?.("Study history", 55);
  const sessionMap = keep("study_sessions")
    ? await insertMapped("study_sessions", list("study_sessions"), uid, (row) => ({
        ...row,
        subject_id: subjectMap.get(String(row["subject_id"])) ?? null,
        chapter_id: chapterMap.get(String(row["chapter_id"])) ?? null,
        subtopic_id: subtopicMap.get(String(row["subtopic_id"])) ?? null,
      }))
    : new Map<string, string>();

  if (keep("session_breaks")) {
    for (const row of list("session_breaks")) {
      const session = sessionMap.get(String(row["session_id"])) ?? null;
      await supabase.from("session_breaks").insert(strip(row, uid, { session_id: session }) as never);
    }
  }
  if (keep("session_outcomes")) {
    for (const row of list("session_outcomes")) {
      const session = sessionMap.get(String(row["session_id"]));
      if (!session) continue;
      await supabase.from("session_outcomes").insert(
        strip(row, uid, {
          session_id: session,
          chapter_id: chapterMap.get(String(row["chapter_id"])) ?? null,
          subtopic_id: subtopicMap.get(String(row["subtopic_id"])) ?? null,
        }) as never,
      );
    }
  }

  // Streaks are day-keyed, so the best of the two records wins per day.
  let streakDays = 0;
  if (keep("streak_days")) {
    onProgress?.("Streaks", 68);
    for (const row of list("streak_days")) {
      const { error } = await supabase
        .from("streak_days")
        .upsert(strip(row, uid) as never, { onConflict: "user_id,day" });
      if (error) failures.push(`Streaks: ${error.message}`);
      else streakDays += 1;
    }
  }

  onProgress?.("Targets, plan & classes", 78);
  for (const table of SIMPLE_TABLES) {
    if (!keep(table)) continue;
    for (const row of list(table)) {
      const extra: Row = {};
      if ("subject_id" in row) extra["subject_id"] = subjectMap.get(String(row["subject_id"])) ?? null;
      if ("chapter_id" in row) extra["chapter_id"] = chapterMap.get(String(row["chapter_id"])) ?? null;
      if (table === "user_settings" || table === "reading_goals") {
        const { error } = await supabase.from(table).upsert(strip(row, uid, extra) as never, { onConflict: "user_id" });
        if (error) failures.push(`${table}: ${error.message}`);
      } else {
        const { error } = await supabase.from(table as never).insert(strip(row, uid, extra) as never);
        if (error) failures.push(`${table}: ${error.message}`);
      }
    }
  }

  onProgress?.("Files & notes", 90);
  let restored = 0;
  if (keep("chapter_notes")) {
    for (const row of list("chapter_notes")) {
      const id = String(row["id"]);
      const file = preview.zip?.file(new RegExp(`^(media/${id}\\.[^/]+|pdfs/${id}\\.pdf)$`, "i"))[0];
      if (!file) continue;
      const blob = await file.async("blob");
      try {
        const mimeType = str(row["mime_type"]);
        await restoreNote({
          blob,
          title: String(row["title"] ?? "notes.pdf"),
          subject_id: subjectMap.get(String(row["subject_id"])) ?? null,
          chapter_name: str(row["chapter_name"]),
          topic: str(row["topic"]),
          position: Number(row["position"]) || restored + 1,
          ...(mimeType ? { mime_type: mimeType } : {}),
        });
        restored += 1;
      } catch (error) {
        failures.push(`${String(row["title"] ?? "Media")}: ${error instanceof Error ? error.message : "restore failed"}`);
      }
    }
  }

  onProgress?.("Done", 100);
  return {
    subjects: subjectMap.size,
    chapters: chapterMap.size,
    sessions: sessionMap.size,
    notes: restored,
    streakDays,
    failures,
  };
}
