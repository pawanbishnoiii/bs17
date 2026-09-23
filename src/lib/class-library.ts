import { supabase } from "@/integrations/supabase/client";
import { logErrorEvent } from "@/lib/error-log";
import { fetchSubjects } from "@/lib/study";

export const LIBRARY_BUCKET = "class-media";
export const MAX_MEDIA_BYTES = 200 * 1024 * 1024;

/** A folder in the study library: subject > chapter > type, plus custom ones. */
export type LibraryFolder = {
  id: string;
  parent_id: string | null;
  name: string;
  kind: string;
  subject_id: string | null;
  chapter_id: string | null;
  system_managed: boolean;
  position: number;
};

export type LibraryMedia = {
  id: string;
  folder_id: string | null;
  subject_id: string | null;
  chapter_id: string | null;
  title: string;
  media_kind: string;
  source: string;
  storage_path: string | null;
  external_url: string | null;
  mime_type: string | null;
  file_size: number | null;
  thumbnail_url: string | null;
  position: number;
  created_at: string;
};

const FOLDER_COLUMNS =
  "id, parent_id, name, kind, subject_id, chapter_id, system_managed, position";
const MEDIA_COLUMNS =
  "id, folder_id, subject_id, chapter_id, title, media_kind, source, storage_path, external_url, mime_type, file_size, thumbnail_url, position, created_at";

const ALLOWED_EXTENSIONS = new Set([
  "pdf", "png", "jpg", "jpeg", "webp", "gif", "svg", "avif", "heic",
  "mp4", "webm", "mov", "m4v", "mkv", "mp3", "wav", "m4a", "ogg",
  "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv", "zip",
]);

export function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Human-readable reason a file cannot be uploaded, or null when it is fine. */
export function validateMediaFile(file: File): string | null {
  if (file.size <= 0) return "File khaali hai";
  if (file.size > MAX_MEDIA_BYTES) return `File ${humanSize(file.size)} hai — limit 200 MB`;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(ext)) return `.${ext || "?"} format supported nahi hai`;
  return null;
}

export function kindFromMime(mime: string | null, title = "") {
  const lower = title.toLowerCase();
  if (mime === "application/pdf" || lower.endsWith(".pdf")) return "pdf" as const;
  if (mime?.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg|avif)$/.test(lower)) return "image" as const;
  if (mime?.startsWith("video/") || /\.(mp4|webm|mov|m4v|mkv)$/.test(lower)) return "video" as const;
  if (mime?.startsWith("audio/") || /\.(mp3|wav|m4a|ogg)$/.test(lower)) return "audio" as const;
  return "document" as const;
}

/** Guesses what a pasted link points at, so the right player/preview is used. */
export function kindFromUrl(url: string) {
  const lower = url.split("?")[0]?.toLowerCase() ?? "";
  if (/youtube\.com|youtu\.be|vimeo\.com/.test(url)) return "video" as const;
  if (lower.endsWith(".pdf")) return "pdf" as const;
  if (/\.(png|jpe?g|webp|gif|svg|avif)$/.test(lower)) return "image" as const;
  if (/\.(mp4|webm|mov|m4v)$/.test(lower)) return "video" as const;
  if (/\.(mp3|wav|m4a|ogg)$/.test(lower)) return "audio" as const;
  return "link" as const;
}

/** YouTube/Vimeo links need their embed form to play inside the app. */
export function embedUrl(url: string) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

async function uid() {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Aap sign in nahi hain");
  return id;
}

export async function fetchFolders(): Promise<LibraryFolder[]> {
  const { data, error } = await supabase
    .from("class_folders")
    .select(FOLDER_COLUMNS)
    .order("position", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as LibraryFolder[];
}

export async function fetchMedia(): Promise<LibraryMedia[]> {
  const { data, error } = await supabase
    .from("class_media")
    .select(MEDIA_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as LibraryMedia[];
}

/**
 * Keeps one system folder per subject and per chapter/type, so the library
 * always mirrors what the student actually studies. System folders cannot be
 * deleted by hand.
 */
export async function syncSystemFolders() {
  const user = await uid();
  const [subjects, existing] = await Promise.all([fetchSubjects(), fetchFolders()]);

  const bySubject = new Map(existing.filter((f) => f.kind === "subject").map((f) => [f.subject_id, f]));
  const byChapter = new Map(existing.filter((f) => f.kind === "chapter").map((f) => [f.chapter_id, f]));

  for (const [index, subject] of subjects.entries()) {
    let subjectFolder = bySubject.get(subject.id) ?? null;
    if (!subjectFolder) {
      const { data, error } = await supabase
        .from("class_folders")
        .insert({
          user_id: user,
          name: subject.name,
          kind: "subject",
          subject_id: subject.id,
          system_managed: true,
          position: index,
        })
        .select(FOLDER_COLUMNS)
        .single();
      if (error) throw error;
      subjectFolder = data as unknown as LibraryFolder;
    } else if (subjectFolder.name !== subject.name) {
      await supabase.from("class_folders").update({ name: subject.name }).eq("id", subjectFolder.id);
    }

    const chapters = await fetchChapters(subject.id);
    for (const [ci, chapter] of chapters.entries()) {
      let chapterFolder = byChapter.get(chapter.id) ?? null;
      if (!chapterFolder) {
        const { data, error } = await supabase
          .from("class_folders")
          .insert({
            user_id: user,
            parent_id: subjectFolder.id,
            name: chapter.name,
            kind: "chapter",
            subject_id: subject.id,
            chapter_id: chapter.id,
            system_managed: true,
            position: ci,
          })
          .select(FOLDER_COLUMNS)
          .single();
        if (error) throw error;
        chapterFolder = data as unknown as LibraryFolder;
      } else if (chapterFolder.name !== chapter.name || chapterFolder.parent_id !== subjectFolder.id) {
        await supabase
          .from("class_folders")
          .update({ name: chapter.name, parent_id: subjectFolder.id })
          .eq("id", chapterFolder.id);
      }

      const types = await fetchChapterSubtopics(chapter.id);
      for (const [ti, type] of types.entries()) {
        const key = `${chapter.id}:${type.name.toLowerCase()}`;
        if (byType.has(key)) continue;
        await supabase.from("class_folders").insert({
          user_id: user,
          parent_id: chapterFolder.id,
          name: `${type.position || ti + 1}. ${type.name}`,
          kind: "type",
          subject_id: subject.id,
          chapter_id: chapter.id,
          system_managed: true,
          position: type.position || ti + 1,
        });
      }
    }
  }
}

export async function createFolder(input: { name: string; parent_id: string | null }) {
  const user = await uid();
  const name = input.name.trim();
  if (!name) throw new Error("Folder ka naam likhein");
  const { error } = await supabase.from("class_folders").insert({
    user_id: user,
    name,
    parent_id: input.parent_id,
    kind: "custom",
    system_managed: false,
  });
  if (error) throw error;
}

export async function renameFolder(id: string, name: string) {
  const { error } = await supabase.from("class_folders").update({ name: name.trim() }).eq("id", id);
  if (error) throw error;
}

export async function deleteFolder(folder: LibraryFolder) {
  if (folder.system_managed)
    throw new Error("Ye folder subject/chapter se bana hai — delete nahi hoga");
  const { error } = await supabase.from("class_folders").delete().eq("id", folder.id);
  if (error) throw error;
}

/** Uploads through XHR so real byte progress can be shown, then saves the row. */
export async function uploadMedia(input: {
  file: File;
  folder_id: string | null;
  subject_id?: string | null;
  chapter_id?: string | null;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}) {
  const problem = validateMediaFile(input.file);
  if (problem) {
    void logErrorEvent({ category: "upload", message: problem, context: input.file.name });
    throw new Error(problem);
  }

  const user = await uid();
  const safe = input.file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${user}/${crypto.randomUUID()}-${safe}`;
  const mime = input.file.type || "application/octet-stream";
  const baseUrl = import.meta.env["VITE_SUPABASE_URL"];
  const apikey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? "";
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  try {
    if (baseUrl && token) {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${baseUrl}/storage/v1/object/${LIBRARY_BUCKET}/${path}`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("apikey", apikey);
        xhr.setRequestHeader("x-upsert", "false");
        xhr.setRequestHeader("content-type", mime);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) input.onProgress?.(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(uploadErrorText(xhr.status, xhr.responseText)));
        xhr.onerror = () => reject(new Error("Network issue — upload nahi hua, dobara try karein"));
        xhr.onabort = () => reject(new Error("Upload cancel kar diya gaya"));
        input.signal?.addEventListener("abort", () => xhr.abort());
        xhr.send(input.file);
      });
    } else {
      const up = await supabase.storage
        .from(LIBRARY_BUCKET)
        .upload(path, input.file, { contentType: mime });
      if (up.error) throw new Error(up.error.message);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload fail hua";
    void logErrorEvent({
      category: "upload",
      message,
      context: input.file.name,
      detail: { size: input.file.size, mime },
    });
    throw new Error(message);
  }

  input.onProgress?.(100);

  const { error } = await supabase.from("class_media").insert({
    user_id: user,
    folder_id: input.folder_id,
    subject_id: input.subject_id ?? null,
    chapter_id: input.chapter_id ?? null,
    title: input.file.name,
    media_kind: kindFromMime(mime, input.file.name),
    source: "upload",
    storage_path: path,
    mime_type: mime,
    file_size: input.file.size,
  });
  if (error) {
    // Roll the stored object back so storage never keeps an orphan file.
    await supabase.storage.from(LIBRARY_BUCKET).remove([path]);
    void logErrorEvent({ category: "upload", message: error.message, context: input.file.name });
    throw new Error(`Record save nahi hua: ${error.message}`);
  }
}

function uploadErrorText(status: number, body: string) {
  if (status === 404) return "Storage bucket nahi mila — admin se sync karwayein";
  if (status === 413) return "File bahut badi hai (max 200 MB)";
  if (status === 403 || status === 401) return "Permission nahi mili — dobara sign in karke try karein";
  if (status === 409) return "Isi naam se file pehle se hai";
  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string };
    if (parsed.message || parsed.error) return parsed.message ?? parsed.error ?? "Upload fail";
  } catch {
    /* body is not JSON */
  }
  return `Upload fail hua (${status})`;
}

/** Saves a video/image/pdf that lives on another site, no upload needed. */
export async function addUrlMedia(input: {
  url: string;
  title: string;
  folder_id: string | null;
}) {
  const user = await uid();
  const url = input.url.trim();
  if (!/^https?:\/\//i.test(url)) throw new Error("Poora link daalein (https://…)");
  const { error } = await supabase.from("class_media").insert({
    user_id: user,
    folder_id: input.folder_id,
    title: input.title.trim() || url,
    media_kind: kindFromUrl(url),
    source: "url",
    external_url: url,
  });
  if (error) throw error;
}

export async function renameMedia(id: string, title: string) {
  const { error } = await supabase.from("class_media").update({ title: title.trim() }).eq("id", id);
  if (error) throw error;
}

export async function moveMedia(id: string, folder_id: string | null) {
  const { error } = await supabase.from("class_media").update({ folder_id }).eq("id", id);
  if (error) throw error;
}

export async function deleteMedia(item: LibraryMedia) {
  if (item.storage_path) {
    const removed = await supabase.storage.from(LIBRARY_BUCKET).remove([item.storage_path]);
    if (removed.error) throw new Error(`Storage se delete nahi hui: ${removed.error.message}`);
  }
  const { error } = await supabase.from("class_media").delete().eq("id", item.id);
  if (error) throw error;
}

/** A временный signed link for private files (30 minutes). */
export async function mediaUrl(item: LibraryMedia) {
  if (item.external_url) return item.external_url;
  if (!item.storage_path) throw new Error("Is item ka koi file nahi hai");
  const { data, error } = await supabase.storage
    .from(LIBRARY_BUCKET)
    .createSignedUrl(item.storage_path, 60 * 30);
  if (error || !data) throw new Error(error?.message ?? "Link nahi bana");
  return data.signedUrl;
}

export async function downloadMedia(item: LibraryMedia) {
  const url = await mediaUrl(item);
  const a = document.createElement("a");
  a.href = url;
  a.download = item.title;
  a.target = "_blank";
  a.rel = "noreferrer";
  a.click();
}
