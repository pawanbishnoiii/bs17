import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Eye, FolderPlus, RefreshCw, Trash2, Upload } from "lucide-react";
import { Folder3D } from "@/components/ui/folder-3d";
import { ResponsiveSheet } from "@/components/study-ui";
import { Button } from "@/components/ui/button";
import { fetchNotes, groupByChapter, mediaKind, type ChapterNote } from "@/lib/notes";
import {
  deleteClassFile,
  downloadClassFile,
  fileUrl,
  humanSize,
  uploadClassFile,
  validateFile,
} from "@/lib/class-files";
import { fetchSubjects } from "@/lib/study";

type Pending = { name: string; percent: number; error?: string; file: File };

const GRADIENTS = [
  "linear-gradient(135deg,#ffd9c0,#ffb38a)",
  "linear-gradient(135deg,#cfe3ff,#9ec4ff)",
  "linear-gradient(135deg,#d7f6e3,#a4e6c3)",
  "linear-gradient(135deg,#e7ddff,#c4b0ff)",
  "linear-gradient(135deg,#ffe6f0,#ffb9d5)",
];

/** Folder-style file manager for class material: upload, preview, download, delete. */
export function ClassFolders() {
  const qc = useQueryClient();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ subject_id: "", chapter_name: "" });

  const notes = useQuery({ queryKey: ["chapter-notes"], queryFn: fetchNotes });
  const subjects = useQuery({ queryKey: ["subjects"], queryFn: fetchSubjects });

  const subjectName = (id: string | null) =>
    (subjects.data ?? []).find((s) => s.id === id)?.name ?? "General";

  const folders = useMemo(() => groupByChapter(notes.data ?? []), [notes.data]);
  const active = folders.find((f) => f.key === openKey) ?? null;

  const refresh = () => void qc.invalidateQueries({ queryKey: ["chapter-notes"] });

  return (
    <section className="clay-card-vibrant p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold tracking-tight">Class folders</h2>
          <p className="text-[11px] text-muted-foreground">
            Har chapter ka apna folder — notes, PDFs, images aur recordings ek jagah.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setCreating(true)}>
          <FolderPlus className="size-4" /> New folder
        </Button>
      </div>

      {notes.isLoading ? (
        <p className="mt-5 text-sm text-muted-foreground">Loading…</p>
      ) : folders.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">
          Abhi koi folder nahi. "New folder" se subject aur chapter chunkar pehli file upload karein.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 min-[380px]:gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {folders.map((folder, i) => (
            <Folder3D
              key={folder.key}
              title={folder.chapter_name ?? "General"}
              subtitle={subjectName(folder.subject_id)}
              count={folder.notes.length}
              gradient={GRADIENTS[i % GRADIENTS.length] ?? ""}
              previews={folder.notes.slice(0, 5).map((n) => ({ id: n.id, label: n.title }))}
              onOpen={() => setOpenKey(folder.key)}
            />
          ))}
        </div>
      )}

      {creating ? (
        <ResponsiveSheet open title="New class folder" onClose={() => setCreating(false)}>
          <div className="grid gap-3">
            <label className="block text-xs font-bold text-muted-foreground">
              Subject
              <select
                className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                value={draft.subject_id}
                onChange={(e) => setDraft({ ...draft, subject_id: e.target.value, chapter_name: "" })}
              >
                <option value="">No subject</option>
                {(subjects.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold text-muted-foreground">
              Chapter
              <input
                list="folder-chapters"
                className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                value={draft.chapter_name}
                onChange={(e) => setDraft({ ...draft, chapter_name: e.target.value })}
                placeholder="Fundamental Rights"
              />
              <datalist id="folder-chapters">
                {((subjects.data ?? []).find((s) => s.id === draft.subject_id)?.chapters ?? []).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <FolderUploader
              subject_id={draft.subject_id || null}
              chapter_name={draft.chapter_name.trim() || null}
              startPosition={1}
              onDone={() => {
                refresh();
                setCreating(false);
              }}
            />
          </div>
        </ResponsiveSheet>
      ) : null}

      {active ? (
        <ResponsiveSheet
          open
          title={`${subjectName(active.subject_id)} · ${active.chapter_name ?? "General"}`}
          onClose={() => setOpenKey(null)}
        >
          <div className="grid gap-3">
            <FolderUploader
              subject_id={active.subject_id}
              chapter_name={active.chapter_name}
              startPosition={active.notes.length + 1}
              onDone={refresh}
            />
            <ul className="grid gap-2">
              {active.notes.map((note) => (
                <FileRow key={note.id} note={note} onChanged={refresh} />
              ))}
            </ul>
          </div>
        </ResponsiveSheet>
      ) : null}
    </section>
  );
}

function FolderUploader({
  subject_id,
  chapter_name,
  startPosition,
  onDone,
}: {
  subject_id: string | null;
  chapter_name: string | null;
  startPosition: number;
  onDone: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<Pending[]>([]);
  const [busy, setBusy] = useState(false);

  async function send(files: File[], offset = 0) {
    setBusy(true);
    let position = startPosition + offset;
    for (const file of files) {
      const problem = validateFile(file);
      if (problem) {
        setQueue((q) => upsert(q, { name: file.name, percent: 0, error: problem, file }));
        continue;
      }
      setQueue((q) => upsert(q, { name: file.name, percent: 0, file }));
      try {
        await uploadClassFile({
          file,
          subject_id,
          chapter_name,
          position: position++,
          onProgress: (percent) => setQueue((q) => upsert(q, { name: file.name, percent, file })),
        });
        setQueue((q) => q.filter((row) => row.name !== file.name));
        toast.success(`${file.name} upload ho gayi`);
        onDone();
      } catch (e) {
        setQueue((q) => upsert(q, { name: file.name, percent: 0, error: (e as Error).message, file }));
      }
    }
    setBusy(false);
  }

  return (
    <div className="rounded-2xl border border-dashed border-border p-3">
      <input
        ref={ref}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          void send([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        className="w-full gap-2"
        onClick={() => ref.current?.click()}
      >
        <Upload className="size-4" /> {busy ? "Uploading…" : "Upload files"}
      </Button>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        PDF, image, video, audio, Office files · max 50 MB each
      </p>

      {queue.length ? (
        <ul className="mt-3 space-y-2">
          {queue.map((row) => (
            <li key={row.name} className="rounded-xl border border-border bg-panel p-2.5">
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-xs font-bold">{row.name}</span>
                {row.error ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[11px] font-bold"
                    onClick={() => void send([row.file])}
                  >
                    <RefreshCw className="size-3" /> Retry
                  </button>
                ) : (
                  <span className="text-[11px] font-bold tabular-nums">{row.percent}%</span>
                )}
              </div>
              {row.error ? (
                <p className="mt-1 text-[11px] font-semibold text-destructive">{row.error}</p>
              ) : (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand transition-[width] duration-200"
                    style={{ width: `${row.percent}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function upsert(queue: Pending[], row: Pending) {
  const next = queue.filter((item) => item.name !== row.name);
  return [...next, row];
}

function FileRow({ note, onChanged }: { note: ChapterNote; onChanged: () => void }) {
  const remove = useMutation({
    mutationFn: () => deleteClassFile(note),
    onSuccess: () => {
      toast.success("File hata di");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <li className="flex items-center gap-2 rounded-2xl border border-border bg-panel p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-background text-[9px] font-bold uppercase">
        {mediaKind(note.mime_type, note.title).slice(0, 3)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{note.title}</span>
        <span className="block text-[11px] font-semibold text-muted-foreground">
          {humanSize(note.file_size)}
        </span>
      </span>
      <button
        type="button"
        aria-label="Preview file"
        className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground"
        onClick={async () => {
          try {
            window.open(await fileUrl(note.storage_path), "_blank", "noopener");
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      >
        <Eye className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Download file"
        className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground"
        onClick={async () => {
          try {
            await downloadClassFile(note);
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      >
        <Download className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Delete file"
        disabled={remove.isPending}
        className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:text-destructive"
        onClick={() => remove.mutate()}
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}
