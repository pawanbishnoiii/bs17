import { supabase } from "@/integrations/supabase/client";
import type { ChapterNote } from "@/lib/notes";

const BUCKET = "chapter-pdfs";
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
  "pdf", "png", "jpg", "jpeg", "webp", "gif", "svg",
  "mp4", "webm", "mov", "m4v", "mp3", "wav", "m4a",
  "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv", "zip",
]);

export function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Human-readable reason a file cannot be uploaded, or null when it is fine. */
export function validateFile(file: File): string | null {
  if (file.size <= 0) return "File khaali hai";
  if (file.size > MAX_FILE_BYTES) return `File ${humanSize(file.size)} hai — limit 50 MB`;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(ext)) return `.${ext || "?"} format supported nahi hai`;
  return null;
}

async function currentUser() {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Aap sign in nahi hain");
  return id;
}

/**
 * Uploads through XHR so the UI can show real byte progress, then records the
 * row. If the row insert fails the stored object is removed again, so storage
 * never keeps an orphan file.
 */
export async function uploadClassFile(input: {
  file: File;
  subject_id: string | null;
  chapter_name: string | null;
  position: number;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}) {
  const problem = validateFile(input.file);
  if (problem) throw new Error(problem);

  const user = await currentUser();
  const safe = input.file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${user}/${crypto.randomUUID()}-${safe}`;
  const mime = input.file.type || "application/octet-stream";

  const baseUrl = import.meta.env["VITE_SUPABASE_URL"];
  const apikey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? "";
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (baseUrl && token) {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${baseUrl}/storage/v1/object/${BUCKET}/${path}`);
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
          : reject(new Error(uploadError(xhr.status, xhr.responseText)));
      xhr.onerror = () => reject(new Error("Network issue — upload nahi hua, dobara try karein"));
      xhr.onabort = () => reject(new Error("Upload cancel kar diya gaya"));
      input.signal?.addEventListener("abort", () => xhr.abort());
      xhr.send(input.file);
    });
  } else {
    const up = await supabase.storage.from(BUCKET).upload(path, input.file, { contentType: mime });
    if (up.error) throw new Error(up.error.message);
  }
  input.onProgress?.(100);

  const { error } = await supabase.from("chapter_notes").insert({
    user_id: user,
    subject_id: input.subject_id,
    chapter_name: input.chapter_name,
    topic: null,
    title: input.file.name,
    storage_path: path,
    file_size: input.file.size,
    mime_type: mime,
    position: input.position,
  });
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error(`Record save nahi hua: ${error.message}`);
  }
}

function uploadError(status: number, body: string) {
  if (status === 413) return "File bahut badi hai (max 50 MB)";
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

export async function fileUrl(path: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 30);
  if (error || !data) throw new Error(error?.message ?? "Link nahi bana");
  return data.signedUrl;
}

export async function downloadClassFile(note: ChapterNote) {
  const { data, error } = await supabase.storage.from(BUCKET).download(note.storage_path);
  if (error || !data) throw new Error(error?.message ?? "Download fail hua");
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = note.title;
  a.click();
  URL.revokeObjectURL(url);
}

/** Deletes the stored object first, then the row — no orphan files are left. */
export async function deleteClassFile(note: ChapterNote) {
  const removed = await supabase.storage.from(BUCKET).remove([note.storage_path]);
  if (removed.error) throw new Error(`Storage se delete nahi hui: ${removed.error.message}`);
  const { error } = await supabase.from("chapter_notes").delete().eq("id", note.id);
  if (error) throw new Error(error.message);
}
