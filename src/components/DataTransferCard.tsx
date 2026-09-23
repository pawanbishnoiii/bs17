import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, Download, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  applyImport,
  allSections,
  buildExportZip,
  readImportZip,
  saveBlob,
  TRANSFER_SECTIONS,
  type ImportPreview,
  type Selection,
  type TransferMode,
} from "@/lib/portability";

/** Export everything you own to one file, or bring another export into this account. */
export function DataTransferCard() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pct, setPct] = useState(0);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mode, setMode] = useState<TransferMode>("full");
  const [exportPick, setExportPick] = useState<Selection>(allSections());
  const [importPick, setImportPick] = useState<Selection>(allSections());

  const step = (label: string, percent: number) => {
    setBusy(label);
    setPct(percent);
  };

  const exportAll = async () => {
    step("Export ban raha hai…", 2);
    try {
      const { blob, summary } = await buildExportZip(mode, exportPick, step);
      saveBlob(`bnoy-study-${mode}-${new Date().toISOString().slice(0, 10)}.zip`, blob);
      toast.success(`Export ready — ${summary.subjects} subjects, ${summary.sessions} sessions, ${summary.notes} files`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
      setPct(0);
    }
  };


  const pick = async (file: File) => {
    step("File padhi ja rahi hai…", 20);
    try {
      const next = await readImportZip(file);
      setPreview(next);
      // Pre-tick only the sections the file actually carries.
      setImportPick(
        Object.fromEntries(
          TRANSFER_SECTIONS.map((section) => [section.id, (next.summary.counts[section.id] ?? 0) > 0]),
        ) as Selection,
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
      setPct(0);
    }
  };

  const confirmImport = async () => {
    if (!preview) return;
    try {
      const result = await applyImport(
        preview,
        (label, percent) => step(`Importing ${label}…`, percent),
        importPick,
      );
      if (result.failures.length) toast.warning(`Import hua, lekin ${result.failures.length} items skip hue`);
      else
        toast.success(
          `Import complete — ${result.subjects} subjects, ${result.sessions} sessions, ${result.streakDays} streak days, ${result.notes} files`,
        );
      setPreview(null);
      void qc.invalidateQueries();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
      setPct(0);
    }
  };


  const toggle = (which: "export" | "import", id: keyof Selection) => {
    const set = which === "export" ? setExportPick : setImportPick;
    set((current) => ({ ...current, [id]: !current[id] }));
  };

  return (
    <section className="surface-card p-5">
      <h2 className="text-base font-extrabold tracking-tight">Your data</h2>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Profile, subjects, chapters, types, streaks, history, targets aur PDFs — sab ek file me. Import karte waqt aap
        choose kar sakte ho kya kya lena hai.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {(
          [
            { id: "full", label: "Full account", copy: "Profile, preferences aur complete study record", Icon: ShieldCheck },
            { id: "study", label: "Study package", copy: "Subjects, history, classes aur media only", Icon: BookOpen },
          ] as const
        ).map(({ id, label, copy, Icon }) => (
          <button
            type="button"
            key={id}
            onClick={() => setMode(id)}
            className={`min-h-20 rounded-2xl border p-3 text-left transition ${mode === id ? "border-foreground bg-secondary" : "border-border bg-panel"}`}
          >
            <span className="flex items-center gap-2 text-sm font-extrabold">
              <Icon className="size-4" />
              {label}
            </span>
            <span className="mt-1 block text-[11px] text-muted-foreground">{copy}</span>
          </button>
        ))}
      </div>

      <p className="mt-4 text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase">Export me shamil karo</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {TRANSFER_SECTIONS.map((section) => (
          <Chip
            key={section.id}
            label={section.label}
            on={exportPick[section.id]}
            onClick={() => toggle("export", section.id)}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        <Button className="gap-2" disabled={!!busy} onClick={() => void exportAll()}>
          <Download className="size-4" /> Export {mode === "full" ? "full account" : "study package"}
        </Button>
        <Button variant="outline" className="gap-2" disabled={!!busy} onClick={() => fileRef.current?.click()}>
          <Upload className="size-4" /> Import a file
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".zip,.json,application/zip,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void pick(file);
            e.target.value = "";
          }}
        />
      </div>

      {busy ? (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>{busy}</span>
            <span className="num">{Math.min(100, Math.max(0, Math.round(pct)))}%</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-foreground transition-[width] duration-300"
              style={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
            />
          </div>
        </div>
      ) : null}


      {preview ? (
        <div className="mt-4 rounded-2xl border border-border bg-panel p-4">
          <p className="text-sm font-bold">Import preview</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            <span className="font-bold capitalize">{preview.mode} import</span>
            {preview.exportedAt ? ` · Exported ${new Date(preview.exportedAt).toLocaleDateString()}` : ""}
          </p>

          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {TRANSFER_SECTIONS.map((section) => {
              const count = preview.summary.counts[section.id] ?? 0;
              return (
                <li key={section.id}>
                  <label
                    className={`flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 text-xs transition ${
                      importPick[section.id] ? "border-foreground bg-secondary" : "border-border"
                    } ${count === 0 ? "opacity-50" : ""}`}
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      <input
                        type="checkbox"
                        className="size-4 accent-current"
                        checked={!!importPick[section.id]}
                        disabled={count === 0}
                        onChange={() => toggle("import", section.id)}
                      />
                      {section.label}
                    </span>
                    <span className="num text-muted-foreground">{count}</span>
                  </label>
                </li>
              );
            })}
          </ul>

          <p className="mt-3 text-[11px] text-muted-foreground">
            Aapka current data delete nahi hoga — same naam ke subjects skip ho jayenge, streak days best value se merge
            honge.
          </p>
          <div className="mt-3 flex gap-2">
            <Button disabled={!!busy} onClick={() => void confirmImport()}>
              Import selected
            </Button>
            <Button variant="outline" disabled={!!busy} onClick={() => setPreview(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`min-h-9 rounded-full border px-3 text-[11px] font-semibold transition ${
        on ? "border-foreground bg-secondary text-foreground" : "border-border text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );
}
