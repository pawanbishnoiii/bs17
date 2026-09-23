import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ChevronRight,
  Copy,
  Download,
  FileText,
  FolderPlus,
  Home,
  Link2,
  Music,
  Pencil,
  Play,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Folder3D } from "@/components/ui/folder-3d";
import { Button } from "@/components/ui/button";
import { ResponsiveSheet } from "@/components/study-ui";
import {
  addUrlMedia,
  createFolder,
  deleteFolder,
  deleteMedia,
  downloadMedia,
  embedUrl,
  fetchFolders,
  fetchMedia,
  humanSize,
  mediaUrl,
  renameMedia,
  syncSystemFolders,
  uploadMedia,
  type LibraryFolder,
  type LibraryMedia,
} from "@/lib/class-library";


const GRADIENTS = [
  "linear-gradient(135deg,#ffd9c0,#ffb38a)",
  "linear-gradient(135deg,#cfe3ff,#9ec4ff)",
  "linear-gradient(135deg,#d7f6e3,#a4e6c3)",
  "linear-gradient(135deg,#e7ddff,#c4b0ff)",
  "linear-gradient(135deg,#ffe6f0,#ffb9d5)",
];

type Pending = { name: string; percent: number; error?: string };

/**
 * The study library: 3D folders for every subject, chapter and type, plus an
 * in-app player/preview for videos, PDFs, images and audio.
 */
export function ClassLibrary() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState<LibraryFolder[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [viewing, setViewing] = useState<LibraryMedia | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [newFolder, setNewFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState({ url: "", title: "" });

  const folders = useQuery({ queryKey: ["library-folders"], queryFn: fetchFolders });
  const media = useQuery({ queryKey: ["library-media"], queryFn: fetchMedia });

  const current = path.length ? path[path.length - 1]! : null;
  const currentId = current?.id ?? null;

  const children = useMemo(
    () => (folders.data ?? []).filter((f) => (f.parent_id ?? null) === currentId),
    [folders.data, currentId],
  );
  const files = useMemo(
    () => (media.data ?? []).filter((m) => (m.folder_id ?? null) === currentId),
    [media.data, currentId],
  );

  const countIn = (folderId: string) => {
    const all = folders.data ?? [];
    const ids = new Set<string>([folderId]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const f of all) {
        if (f.parent_id && ids.has(f.parent_id) && !ids.has(f.id)) {
          ids.add(f.id);
          grew = true;
        }
      }
    }
    return (media.data ?? []).filter((m) => m.folder_id && ids.has(m.folder_id)).length;
  };

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["library-folders"] });
    void qc.invalidateQueries({ queryKey: ["library-media"] });
  };

  const sync = useMutation({
    mutationFn: syncSystemFolders,
    onSuccess: () => {
      refresh();
      toast.success("Subjects, chapters aur types ke folders sync ho gaye");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addFolder = useMutation({
    mutationFn: () => createFolder({ name: folderName, parent_id: currentId }),
    onSuccess: () => {
      setNewFolder(false);
      setFolderName("");
      refresh();
      toast.success("Folder ban gaya");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeFolder = useMutation({
    mutationFn: (folder: LibraryFolder) => deleteFolder(folder),
    onSuccess: () => {
      refresh();
      toast.success("Folder hata diya");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addLink = useMutation({
    mutationFn: () => addUrlMedia({ url: link.url, title: link.title, folder_id: currentId }),
    onSuccess: () => {
      setLinkOpen(false);
      setLink({ url: "", title: "" });
      refresh();
      toast.success("Link add ho gaya");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMedia = useMutation({
    mutationFn: (item: LibraryMedia) => deleteMedia(item),
    onSuccess: () => {
      refresh();
      toast.success("File hata di");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rename = useMutation({
    mutationFn: (v: { item: LibraryMedia; title: string }) => renameMedia(v.item.id, v.title),
    onSuccess: () => {
      refresh();
      toast.success("Naam badal diya");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function copyLink(item: LibraryMedia) {
    try {
      const url = item.external_url ?? (await mediaUrl(item));
      await navigator.clipboard.writeText(url);
      toast.success("Link copy ho gaya");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }



  // Signed links expire, so fetch one only while the viewer is open.
  useEffect(() => {
    let cancelled = false;
    setViewerUrl(null);
    if (!viewing) return;
    void mediaUrl(viewing)
      .then((url) => {
        if (!cancelled) setViewerUrl(url);
      })
      .catch((error: Error) => toast.error(error.message));
    return () => {
      cancelled = true;
    };
  }, [viewing]);

  async function upload(list: FileList) {
    const items = Array.from(list);
    setPending(items.map((file) => ({ name: file.name, percent: 0 })));
    for (const [index, file] of items.entries()) {
      try {
        await uploadMedia({
          file,
          folder_id: currentId,
          subject_id: current?.subject_id ?? null,
          chapter_id: current?.chapter_id ?? null,
          onProgress: (percent) =>
            setPending((rows) => rows.map((row, i) => (i === index ? { ...row, percent } : row))),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload fail";
        setPending((rows) => rows.map((row, i) => (i === index ? { ...row, error: message } : row)));
        toast.error(`${file.name}: ${message}`);
      }
    }
    refresh();
    window.setTimeout(() => setPending([]), 2500);
  }

  return (
    <section className="surface-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold tracking-tight">Study library</h2>
          <p className="text-[11px] text-muted-foreground">
            Subjects, chapters aur types ke folders — videos, PDFs, images aur links sab andar hi khulte hain.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" disabled={sync.isPending} onClick={() => sync.mutate()}>
            <RefreshCw className={`size-4 ${sync.isPending ? "animate-spin" : ""}`} /> Sync folders
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setNewFolder(true)}>
            <FolderPlus className="size-4" /> New folder
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setLinkOpen(true)}>
            <Link2 className="size-4" /> Add link
          </Button>
          <Button className="gap-2" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> Upload
          </Button>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
              if (event.target.files?.length) void upload(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
      </div>

      {/* breadcrumb */}
      <div className="mt-4 flex flex-wrap items-center gap-1 text-xs font-semibold text-muted-foreground">
        <button type="button" className="flex items-center gap-1 hover:text-foreground" onClick={() => setPath([])}>
          <Home className="size-3.5" /> Library
        </button>
        {path.map((folder, index) => (
          <span key={folder.id} className="flex items-center gap-1">
            <ChevronRight className="size-3.5" />
            <button
              type="button"
              className="hover:text-foreground"
              onClick={() => setPath(path.slice(0, index + 1))}
            >
              {folder.name}
            </button>
          </span>
        ))}
      </div>

      {pending.length ? (
        <ul className="mt-4 grid gap-2">
          {pending.map((row) => (
            <li key={row.name} className="rounded-xl border border-border bg-panel p-3">
              <p className="flex items-center justify-between gap-2 text-xs font-semibold">
                <span className="truncate">{row.name}</span>
                <span className="num">{row.error ? "failed" : `${row.percent}%`}</span>
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full transition-[width] ${row.error ? "bg-destructive" : "bg-blue"}`}
                  style={{ width: `${row.error ? 100 : row.percent}%` }}
                />
              </div>
              {row.error ? <p className="mt-1 text-[11px] text-destructive">{row.error}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {folders.isLoading || media.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          {children.length ? (
            <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {children.map((folder, index) => (
                <div key={folder.id} className="relative">
                  <Folder3D
                    title={folder.name}
                    subtitle={folder.kind === "custom" ? "Folder" : folder.kind}
                    count={countIn(folder.id)}
                    gradient={GRADIENTS[index % GRADIENTS.length] ?? ""}
                    previews={(media.data ?? [])
                      .filter((m) => m.folder_id === folder.id)
                      .slice(0, 5)
                      .map((m) => ({ id: m.id, label: m.title, image: m.thumbnail_url }))}
                    onOpen={() => setPath([...path, folder])}
                  />
                  {!folder.system_managed ? (
                    <button
                      type="button"
                      aria-label={`Delete ${folder.name}`}
                      onClick={() => removeFolder.mutate(folder)}
                      className="absolute top-0 right-0 grid size-8 place-items-center rounded-full border border-border bg-background text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {files.length ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {files.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-2xl border border-border bg-panel">
                  <button
                    type="button"
                    onClick={() => setViewing(item)}
                    className="grid h-28 w-full place-items-center bg-secondary text-muted-foreground"
                  >
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} alt="" className="size-full object-cover" />
                    ) : item.media_kind === "video" ? (
                      <Play className="size-7" />
                    ) : item.media_kind === "audio" ? (
                      <Music className="size-7" />
                    ) : (
                      <FileText className="size-7" />
                    )}
                  </button>
                  <div className="p-3">
                    <p className="truncate text-xs font-bold" title={item.title}>
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {item.media_kind}
                      {item.file_size ? ` · ${humanSize(item.file_size)}` : ""}
                    </p>
                    <div className="mt-2 flex gap-1">
                      <button
                        type="button"
                        aria-label={`Download ${item.title}`}
                        onClick={() => void downloadMedia(item).catch((e: Error) => toast.error(e.message))}
                        className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
                      >
                        <Download className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${item.title}`}
                        onClick={() => removeMedia.mutate(item)}
                        className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {!children.length && !files.length ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Ye folder khaali hai. "Sync folders" se subjects/chapters ke folders banayein, ya file upload karein.
            </p>
          ) : null}
        </>
      )}

      <ResponsiveSheet open={newFolder} onClose={() => setNewFolder(false)} title="New folder">
        <div className="grid gap-3 p-1">
          <input
            value={folderName}
            onChange={(event) => setFolderName(event.target.value)}
            placeholder="Folder name"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand/60"
          />
          <Button disabled={addFolder.isPending} onClick={() => addFolder.mutate()}>
            Create folder
          </Button>
        </div>
      </ResponsiveSheet>

      <ResponsiveSheet open={linkOpen} onClose={() => setLinkOpen(false)} title="Add media link">
        <div className="grid gap-3 p-1">
          <input
            value={link.url}
            onChange={(event) => setLink({ ...link, url: event.target.value })}
            placeholder="https://youtube.com/watch?v=…"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand/60"
          />
          <input
            value={link.title}
            onChange={(event) => setLink({ ...link, title: event.target.value })}
            placeholder="Title (optional)"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand/60"
          />
          <Button disabled={addLink.isPending} onClick={() => addLink.mutate()}>
            Save link
          </Button>
        </div>
      </ResponsiveSheet>

      {viewing ? (
        <div
          className="fixed inset-0 z-[95] grid place-items-center bg-overlay p-4"
          role="dialog"
          aria-label={viewing.title}
          onClick={() => setViewing(null)}
        >
          <div
            className="max-h-[90svh] w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-background"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <p className="truncate text-sm font-bold">{viewing.title}</p>
              <button
                type="button"
                aria-label="Close preview"
                onClick={() => setViewing(null)}
                className="grid size-9 place-items-center rounded-lg hover:bg-secondary"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="grid max-h-[74svh] min-h-64 place-items-center overflow-auto bg-black/90">
              {!viewerUrl ? (
                <p className="p-8 text-sm text-white/70">Loading…</p>
              ) : viewing.media_kind === "image" ? (
                <img src={viewerUrl} alt={viewing.title} className="max-h-[74svh] w-auto object-contain" />
              ) : viewing.media_kind === "video" ? (
                viewing.source === "url" ? (
                  <iframe
                    src={embedUrl(viewerUrl)}
                    title={viewing.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="aspect-video h-full w-full"
                  />
                ) : (
                  <video src={viewerUrl} controls playsInline className="max-h-[74svh] w-full" />
                )
              ) : viewing.media_kind === "audio" ? (
                <audio src={viewerUrl} controls className="w-full p-8" />
              ) : viewing.media_kind === "pdf" ? (
                <iframe src={viewerUrl} title={viewing.title} className="h-[74svh] w-full bg-white" />
              ) : (
                <div className="grid gap-3 p-8 text-center">
                  <p className="text-sm text-white/80">Ye file browser me preview nahi hoti.</p>
                  <Button onClick={() => void downloadMedia(viewing).catch((e: Error) => toast.error(e.message))}>
                    Download
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
