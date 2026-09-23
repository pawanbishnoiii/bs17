import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Clock3, History, Pencil, Search, Settings2, X } from "lucide-react";
import {
  addChapters,
  addChapterSubtopics,
  currentBlock,
  fetchBlocks,
  fetchChapters,
  fetchChapterSubtopics,
  fetchRunningSession,
  fetchSessions,
  fetchSubjects,
  fmtHM,
  localTimeToIsoToday,
  relativeTime,
  renameChapter,
  renameChapterSubtopic,
  renumberChapter,
  renumberChapterSubtopic,
  startSession,
  startOfToday,
  type ChapterRow,
  type ChapterSubtopicRow,
} from "@/lib/study";
import { SubjectsManager } from "@/components/SubjectsManager";
import { ActivityArtwork, PageHeader, ResponsiveSheet, type ActivityKind } from "@/components/study-ui";
import { Button } from "@/components/ui/button";
import { DailyPlanCard } from "@/components/DailyPlanCard";
import { fetchChapterPace, fetchPlan, fetchSubjectTargets, localDateKey, type PlanItem } from "@/lib/plan";
import learningPath from "@/assets/chronodeck-learning-path.png";

const SESSION_KINDS = [
  { k: "reading", l: "Reading", d: "Books, notes and articles", tint: "bg-yellow" },
  { k: "revision", l: "Revision", d: "Recall and review", tint: "bg-lavender" },
  { k: "class", l: "Online class", d: "Live or recorded lessons", tint: "bg-blue" },
  { k: "practice", l: "Test / Practice", d: "Problems and papers", tint: "bg-mint" },
] as const;

const STEPS = [
  { n: 1, label: "Subject" },
  { n: 2, label: "Chapter / topic" },
  { n: 3, label: "Session" },
] as const;

const stepMotion = {
  initial: { opacity: 0, x: 24, filter: "blur(4px)" },
  animate: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit: { opacity: 0, x: -24, filter: "blur(4px)" },
  transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const },
};

export const Route = createFileRoute("/_authenticated/study")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    block?: string | undefined;
    plan?: string | undefined;
    date?: string | undefined;
    kind?: string | undefined;
  } => ({
    block: typeof search["block"] === "string" ? search["block"] : undefined,
    plan: typeof search["plan"] === "string" ? search["plan"] : undefined,
    date: typeof search["date"] === "string" ? search["date"] : undefined,
    kind: typeof search["kind"] === "string" ? search["kind"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Study Mode — Bnoy Study" },
      {
        name: "description",
        content: "Pick a subject, choose a chapter and start the distraction-free focus timer in three guided steps.",
      },
      { property: "og:title", content: "Study Mode — Bnoy Study" },
      {
        property: "og:description",
        content: "Set up your study session in three steps and start the clean full-screen focus timer.",
      },
    ],
  }),
  component: StudySetupPage,
});

function StudySetupPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/study" });
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    subject_id: "",
    subject_name: "",
    topic: "",
    chapter: "",
    kind: "reading",
    planned_end_at: "",
  });
  const [subjectSheet, setSubjectSheet] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [subtopicId, setSubtopicId] = useState("");
  const [chapterSheet, setChapterSheet] = useState(false);
  const [chapterDraft, setChapterDraft] = useState("");
  const [typeSheet, setTypeSheet] = useState(false);
  const [typeChapterId, setTypeChapterId] = useState("");
  const [typeDraft, setTypeDraft] = useState("");
  const [editChapter, setEditChapter] = useState<{ id: string; name: string; position: number } | null>(null);
  const [editSubtopic, setEditSubtopic] = useState<{ id: string; name: string; position: number } | null>(null);

  const running = useQuery({ queryKey: ["running"], queryFn: fetchRunningSession });
  const subjects = useQuery({ queryKey: ["subjects"], queryFn: fetchSubjects });
  const blocks = useQuery({ queryKey: ["blocks"], queryFn: fetchBlocks });
  const recent = useQuery({
    queryKey: ["sessions", "study-recent"],
    queryFn: () => fetchSessions(new Date(startOfToday().getTime() - 13 * 864e5).toISOString()),
  });
  const activePlanDate = search.date ?? localDateKey();
  const plan = useQuery({ queryKey: ["plan", activePlanDate], queryFn: () => fetchPlan(activePlanDate) });
  const subjectTargets = useQuery({ queryKey: ["subject-targets"], queryFn: fetchSubjectTargets });
  const pace = useQuery({ queryKey: ["chapter-pace"], queryFn: fetchChapterPace });
  const activeSubject = (subjects.data ?? []).find((s) => s.id === form.subject_id);

  const chapters = useQuery({
    queryKey: ["chapters", form.subject_id],
    queryFn: () => fetchChapters(form.subject_id),
    enabled: !!form.subject_id,
  });
  const subtopics = useQuery({
    queryKey: ["chapter_subtopics", chapterId],
    queryFn: () => fetchChapterSubtopics(chapterId),
    enabled: !!chapterId,
  });
  const hasSubtopics = (subtopics.data ?? []).length > 0;
  const selectedSubtopic = (subtopics.data ?? []).find((s) => s.id === subtopicId);

  const subjectChosen = !!(form.subject_id || form.subject_name.trim());
  const focusChosen = !!chapterId && (subtopics.isLoading ? false : !hasSubtopics || !!subtopicId);

  // The timer lives on its own page — a live session always belongs there.
  useEffect(() => {
    if (running.data) navigate({ to: "/timer" });
  }, [running.data, navigate]);

  /** Auto-fill subject + kind from the timetable block covering now, or the one picked by URL — straight to step 3. */
  useEffect(() => {
    if (running.data || form.subject_id || form.subject_name || !blocks.data) return;
    const selected = search.block ? blocks.data.find((b) => b.id === search.block) : null;
    const b = selected || currentBlock(blocks.data);
    if (b) {
      setForm((f) => ({
        ...f,
        subject_id: b.subject_id ?? "",
        subject_name: b.subject_id ? "" : b.title,
        kind: b.kind === "class" ? "class" : "reading",
        topic: f.topic || b.title,
        planned_end_at: b.end_time,
      }));
      setStep(3);
    }
  }, [blocks.data, running.data, form.subject_id, form.subject_name, search.block]);

  const choosePlanItem = (item: PlanItem) => {
    const end = new Date(Date.now() + item.target_minutes * 60_000);
    setForm((current) => ({
      ...current,
      subject_id: item.subject_id ?? "",
      subject_name: item.subject_name ?? "",
      chapter: item.chapter_name ?? "",
      topic: "",
      kind: item.session_kind === "notes_revision" ? "revision" : item.session_kind,
      planned_end_at: end.toTimeString().slice(0, 5),
    }));
    setChapterId(item.chapter_id ?? "");
    setSubtopicId(item.subtopic_id ?? "");
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Plan rows without a chapter id: select the chapter by name once chapters load.
  useEffect(() => {
    if (chapterId || !form.chapter || !chapters.data) return;
    const hit = chapters.data.find((c) => c.name.trim().toLowerCase() === form.chapter.trim().toLowerCase());
    if (hit) setChapterId(hit.id);
  }, [chapters.data, form.chapter, chapterId]);

  useEffect(() => {
    if (!search.plan || !plan.data) return;
    const item = plan.data.find((row) => row.id === search.plan);
    if (item) choosePlanItem(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.plan, plan.data]);

  const addChaptersMutation = useMutation({
    mutationFn: (names: string[]) => addChapters(form.subject_id, names),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["chapters", form.subject_id] });
      setChapterSheet(false);
      setChapterDraft("");
      toast.success("Chapter(s) added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addTypesMutation = useMutation({
    mutationFn: ({ chapterId: cid, names }: { chapterId: string; names: string[] }) => addChapterSubtopics(cid, names),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ["chapter_subtopics", vars.chapterId] });
      setTypeSheet(false);
      setTypeChapterId("");
      setTypeDraft("");
      toast.success("Type(s) added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveChapterMutation = useMutation({
    mutationFn: async (input: { id: string; name: string; position: number }) => {
      await renameChapter(input.id, input.name);
      await renumberChapter(input.id, input.position);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["chapters", form.subject_id] });
      setEditChapter(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveSubtopicMutation = useMutation({
    mutationFn: async (input: { id: string; name: string; position: number }) => {
      await renameChapterSubtopic(input.id, input.name);
      await renumberChapterSubtopic(input.id, input.position);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["chapter_subtopics", chapterId] });
      setEditSubtopic(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const start = useMutation({
    mutationFn: async () => {
      const subj = (subjects.data ?? []).find((s) => s.id === form.subject_id);
      const plannedEnd = form.planned_end_at ? localTimeToIsoToday(form.planned_end_at) : null;
      const fallbackTopic = selectedSubtopic ? `${selectedSubtopic.position}. ${selectedSubtopic.name}` : null;
      return startSession({
        subject_id: subj?.id ?? null,
        subject_name: subj?.name ?? (form.subject_name.trim() || "Study"),
        topic: form.topic.trim() || fallbackTopic,
        chapter: form.chapter.trim() || null,
        kind: form.kind,
        planned_end_at: plannedEnd,
      });
    },
    onSuccess: (session) => {
      // Seed the cache before navigating so the timer page opens with the live
      // session already in hand instead of bouncing back here.
      qc.setQueryData(["running"], session);
      void qc.invalidateQueries({ queryKey: ["sessions", "8w"] });
      void qc.invalidateQueries({ queryKey: ["sessions", "study-recent"] });
      toast.success("Study mode on");

      navigate({ to: "/timer" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const visibleSubjects = (subjects.data ?? []).filter((subject) =>
    subject.name.toLowerCase().includes(subjectSearch.toLowerCase()),
  );

  const goNext = () => {
    if ("vibrate" in navigator) navigator.vibrate(10);
    if (step === 1 && subjectChosen) setStep(2);
    else if (step === 2 && focusChosen) setStep(3);
  };

  const hapticSelect = () => {
    if ("vibrate" in navigator) navigator.vibrate(8);
  };

  return (
    <div className="app-page text-foreground">
      <motion.div
        initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full"
      >
        <section className="relative overflow-hidden rounded-[36px] bg-blue-soft p-6 sm:p-8">
          <div className="relative z-10 max-w-2xl">
            <PageHeader
              eyebrow="Study launcher"
              title="What are we focusing on?"
              description="Three quick steps — subject, chapter and session — then the timer takes over."
            />
          </div>
          <img
            src={learningPath}
            alt="Student building a learning path with books"
            width={1200}
            height={1200}
            className="absolute -right-8 -bottom-24 hidden size-72 object-contain md:block"
          />
        </section>

        <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid min-w-0 gap-6">
            <section className="surface-card p-5 sm:p-6">
              {/* Progress rail — steps unlock in order, finished steps can be revisited */}
              <div className="flex items-center gap-2" role="tablist" aria-label="Setup steps">
                {STEPS.map((s) => {
                  const done = step > s.n;
                  const on = step === s.n;
                  return (
                    <button
                      key={s.n}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => done && setStep(s.n)}
                      className={`flex min-w-0 flex-1 items-center gap-2 rounded-2xl border px-2.5 py-2 text-left text-[11px] font-bold transition sm:px-3 sm:text-xs ${
                        on
                          ? "border-foreground bg-secondary"
                          : done
                            ? "border-border bg-panel text-muted-foreground"
                            : "border-border/60 bg-background text-muted-foreground/70"
                      }`}
                    >
                      <span
                        className={`num grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-extrabold ${
                          on ? "bg-foreground text-background" : done ? "bg-foreground/15 text-foreground" : "bg-muted"
                        }`}
                      >
                        {done ? <Check className="size-3" /> : s.n}
                      </span>
                      <span className="min-w-0 truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {step === 1 ? (
                  <motion.div key="step-1" {...stepMotion} className="mt-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold sm:text-xl">1. Pick a subject</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Your saved subjects and syllabus stay connected.
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSubjectSheet(true)}>
                        Manage subjects
                      </Button>
                    </div>
                    {subjectChosen ? (
                      <div className="mt-4 flex items-center gap-3 rounded-[22px] border-2 border-foreground bg-lavender-soft p-4">
                        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-panel text-lg font-extrabold">
                          {(activeSubject?.name ?? form.subject_name).slice(0, 1).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-extrabold">{activeSubject?.name ?? form.subject_name}</span>
                          <span className="text-xs text-muted-foreground">Selected subject</span>
                        </span>
                        <Button variant="outline" size="sm" onClick={() => { setForm({ ...form, subject_id: "", subject_name: "", chapter: "", topic: "" }); setChapterId(""); setSubtopicId(""); }}>Change</Button>
                      </div>
                    ) : <><label className="relative mt-4 block">
                      <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                      <span className="sr-only">Search subjects</span>
                      <input
                        value={subjectSearch}
                        onChange={(e) => setSubjectSearch(e.target.value)}
                        placeholder="Search subjects"
                        className="field-control pl-11"
                      />
                    </label>
                    <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
                      {subjects.isLoading ? (
                        <div className="contents">
                          {[0, 1, 2].map((i) => (
                            <span key={i} className="h-24 animate-pulse rounded-[22px] bg-muted" />
                          ))}
                        </div>
                      ) : null}
                      {!subjects.isLoading && (subjects.data ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No subjects yet. Add one to connect your session to the syllabus.
                        </p>
                      ) : null}
                      {visibleSubjects.map((x) => {
                        const on = form.subject_id === x.id;
                        return (
                          <motion.button
                            key={x.id}
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { hapticSelect(); setForm({ ...form, subject_id: x.id, subject_name: x.name, chapter: "" }); setChapterId(""); setSubtopicId(""); }}
                            aria-pressed={on}
                            className={`flex min-h-24 items-center gap-3 rounded-[22px] border-2 p-4 text-left transition ${
                              on
                                ? "border-foreground bg-lavender-soft text-foreground"
                                : "border-border bg-panel text-foreground hover:bg-secondary"
                            }`}
                          >
                            <span
                              className="grid size-11 shrink-0 place-items-center rounded-2xl text-lg font-extrabold"
                              style={{ background: x.color }}
                            >
                              {x.name.slice(0, 1).toUpperCase()}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-bold">{x.name}</span>
                              <span className="mt-1 block text-xs text-muted-foreground">{x.chapters.length} chapters</span>
                            </span>
                            {on ? <Check className="ml-auto size-5 shrink-0" /> : null}
                          </motion.button>
                        );
                      })}
                    </div></>}
                  </motion.div>
                ) : null}

                {step === 2 ? (
                  <motion.div key="step-2" {...stepMotion} className="mt-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold sm:text-xl">2. Chapter or topic</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Pick a chapter of {activeSubject?.name ?? "the subject"} — and a type, if it has any.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" disabled={!activeSubject} onClick={() => setChapterSheet(true)}>
                          + New chapter / topic
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!activeSubject || (chapters.data ?? []).length === 0}
                          onClick={() => setTypeSheet(true)}
                        >
                          + Add type
                        </Button>
                      </div>
                    </div>

                    {!activeSubject ? null : chapters.isLoading ? (
                      <div className="mt-4 grid gap-2">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="h-12 animate-pulse rounded-2xl bg-muted" />
                        ))}
                      </div>
                    ) : (chapters.data ?? []).length === 0 ? (
                      <p className="mt-4 text-xs text-muted-foreground">
                        No chapters yet for this subject — add one with "+ New chapter / topic".
                      </p>
                    ) : (
                      <div className="mt-4 grid gap-2">
                        {(chapters.data ?? []).map((c: ChapterRow) => {
                          const on = chapterId === c.id;
                          const editing = editChapter?.id === c.id;
                          return (
                            <div
                              key={c.id}
                              className={`rounded-2xl border-2 px-3 py-2.5 transition ${
                                on ? "border-foreground bg-lavender-soft" : "border-border bg-panel"
                              }`}
                            >
                              {editing ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min={1}
                                    value={editChapter.position}
                                    onChange={(e) => setEditChapter({ ...editChapter, position: Number(e.target.value) })}
                                    className="field-control w-16 px-2 py-1 text-sm"
                                  />
                                  <input
                                    value={editChapter.name}
                                    onChange={(e) => setEditChapter({ ...editChapter, name: e.target.value })}
                                    className="field-control flex-1 px-2 py-1 text-sm"
                                  />
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    disabled={saveChapterMutation.isPending}
                                    onClick={() => saveChapterMutation.mutate(editChapter)}
                                  >
                                    <Check className="size-4" />
                                  </Button>
                                  <Button type="button" size="icon" variant="ghost" onClick={() => setEditChapter(null)}>
                                    <X className="size-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      hapticSelect();
                                      setChapterId(c.id);
                                      setSubtopicId("");
                                      setForm({ ...form, chapter: c.name, topic: form.topic || c.name });
                                    }}
                                    aria-pressed={on}
                                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                  >
                                    <span className="num grid size-7 shrink-0 place-items-center rounded-full bg-foreground/10 text-xs font-extrabold">
                                      {c.position}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{c.name}</span>
                                    {on ? <Check className="size-4 shrink-0" /> : null}
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`Rename ${c.name}`}
                                    onClick={() => setEditChapter({ id: c.id, name: c.name, position: c.position })}
                                    className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                  >
                                    <Pencil className="size-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {chapterId ? (
                      subtopics.isLoading ? (
                        <div className="mt-5 grid gap-2">
                          {[0, 1].map((i) => (
                            <span key={i} className="h-11 animate-pulse rounded-2xl bg-muted" />
                          ))}
                        </div>
                      ) : hasSubtopics ? (
                        <div className="mt-5">
                          <p className="text-sm font-semibold">Pick a type</p>
                          <div className="mt-2 grid gap-2">
                            {(subtopics.data ?? []).map((s: ChapterSubtopicRow) => {
                              const on = subtopicId === s.id;
                              const editing = editSubtopic?.id === s.id;
                              return (
                                <div
                                  key={s.id}
                                  className={`rounded-2xl border-2 px-3 py-2 transition ${
                                    on ? "border-foreground bg-lavender-soft" : "border-border bg-secondary/40"
                                  }`}
                                >
                                  {editing ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        min={1}
                                        value={editSubtopic.position}
                                        onChange={(e) => setEditSubtopic({ ...editSubtopic, position: Number(e.target.value) })}
                                        className="field-control w-16 px-2 py-1 text-sm"
                                      />
                                      <input
                                        value={editSubtopic.name}
                                        onChange={(e) => setEditSubtopic({ ...editSubtopic, name: e.target.value })}
                                        className="field-control flex-1 px-2 py-1 text-sm"
                                      />
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        disabled={saveSubtopicMutation.isPending}
                                        onClick={() => saveSubtopicMutation.mutate(editSubtopic)}
                                      >
                                        <Check className="size-4" />
                                      </Button>
                                      <Button type="button" size="icon" variant="ghost" onClick={() => setEditSubtopic(null)}>
                                        <X className="size-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => { hapticSelect(); setSubtopicId(s.id); }}
                                        aria-pressed={on}
                                        className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-semibold"
                                      >
                                        {on ? <Check className="size-3.5 shrink-0" /> : null}
                                        <span className="min-w-0 truncate">{s.position}. {s.name}</span>
                                      </button>
                                      <button
                                        type="button"
                                        aria-label={`Rename ${s.name}`}
                                        onClick={() => setEditSubtopic({ id: s.id, name: s.name, position: s.position })}
                                        className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                      >
                                        <Pencil className="size-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null
                    ) : null}

                    <label className="mt-5 block text-sm font-semibold" htmlFor="study-topic">
                      Topic or notes <span className="font-normal text-muted-foreground">(optional)</span>
                    </label>
                    <input
                      id="study-topic"
                      value={form.topic}
                      onChange={(e) => setForm({ ...form, topic: e.target.value })}
                      placeholder="e.g. Fundamental Rights — revision"
                      className="field-control mt-2"
                    />
                  </motion.div>
                ) : null}

                {step === 3 ? (
                  <motion.div key="step-3" {...stepMotion} className="mt-5">
                    <div className="flex items-center gap-2">
                      <Settings2 className="size-5" />
                      <h2 className="text-lg font-bold sm:text-xl">3. Session</h2>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Activity kind and planned end — then start.</p>

                    <div className={`mt-4 grid gap-3 ${form.kind ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4"}`}>
                      {SESSION_KINDS.filter((o) => !form.kind || o.k === form.kind).map((o) => {
                        const on = form.kind === o.k;
                        return (
                          <motion.button
                            key={o.k}
                            type="button"
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { hapticSelect(); setForm({ ...form, kind: o.k }); }}
                            aria-pressed={on}
                            className={`min-w-0 overflow-hidden rounded-[24px] border-2 p-3 text-left transition ${
                              on ? "border-foreground shadow-md" : "border-transparent bg-secondary hover:border-border"
                            }`}
                          >
                            <ActivityArtwork kind={o.k as ActivityKind} className={`h-24 rounded-[18px] ${o.tint}`} />
                            <span className="mt-3 flex items-center justify-between gap-2 text-sm font-bold">
                              {o.l}
                              {on ? <Button variant="outline" size="sm" onClick={(event) => { event.stopPropagation(); setForm({ ...form, kind: "" }); }}>Change</Button> : null}
                            </span>
                            <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{o.d}</span>
                          </motion.button>
                        );
                      })}
                    </div>

                    <label className="mt-5 block text-sm font-semibold" htmlFor="study-end">
                      Planned end <span className="font-normal text-muted-foreground">(optional)</span>
                    </label>
                    <input
                      id="study-end"
                      type="time"
                      value={form.planned_end_at}
                      onChange={(e) => setForm({ ...form, planned_end_at: e.target.value })}
                      className="field-control mt-2 max-w-xs"
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* Step navigation */}
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
                <Button
                  variant="outline"
                  disabled={step === 1}
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  className="gap-2"
                >
                  <ArrowLeft className="size-4" /> Back
                </Button>
                {step < 3 ? (
                  <Button
                    onClick={goNext}
                    disabled={step === 1 ? !subjectChosen : !focusChosen}
                    className="gap-2"
                  >
                    Next <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button onClick={() => start.mutate()} disabled={start.isPending || !form.kind || !focusChosen} className="gap-2">
                    <Clock3 className="size-4" />
                    {start.isPending ? "Starting…" : "Start timer"}
                  </Button>
                )}
              </div>
            </section>
          </div>

          <aside className="sticky top-24 rounded-[30px] bg-dark-card p-6 text-white shadow-xl">
            <p className="text-xs font-bold text-white/60">Session summary</p>
            <h2 className="mt-3 text-2xl font-extrabold">{activeSubject?.name || form.subject_name || "Open study"}</h2>
            <p className="mt-1 text-sm text-white/65">{form.chapter || form.topic || "Whole subject session"}</p>
            <dl className="mt-6 grid gap-3 text-sm">
              <div className="flex justify-between gap-3 border-b border-white/10 pb-3">
                <dt className="text-white/60">Activity</dt>
                <dd className="font-semibold">{SESSION_KINDS.find((x) => x.k === form.kind)?.l}</dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-white/10 pb-3">
                <dt className="text-white/60">Planned end</dt>
                <dd className="font-semibold">{form.planned_end_at || "Open-ended"}</dd>
              </div>
            </dl>
            <Button variant="ghost" onClick={() => navigate({ to: "/today" })} className="mt-4 w-full text-primary-foreground/70 hover:text-primary-foreground">Back to home</Button>
          </aside>
        </div>

        <div className="mt-6">
          <DailyPlanCard sessions={recent.data ?? []} title="Today's plan" onStart={choosePlanItem} />
        </div>

        <section className="surface-card mt-6 overflow-hidden p-5 sm:p-6">
          <p className="section-label">Your natural pace</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="col-span-2 rounded-2xl bg-lavender-soft p-4">
              <p className="text-3xl font-extrabold">{fmtHM(pace.data?.avg_chapter_minutes ?? 0)}</p>
              <p className="mt-1 text-sm font-semibold">average to finish a chapter</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Reading, revisions, classes and practice together. Your plan duration is a minimum focus target, not a
                fixed chapter limit.
              </p>
            </div>
            <div className="rounded-2xl bg-yellow p-4">
              <p className="text-2xl font-extrabold">{fmtHM(pace.data?.avg_reading_minutes ?? 0)}</p>
              <p className="mt-1 text-xs font-semibold">average reading sitting</p>
            </div>
            <div className="rounded-2xl bg-mint p-4">
              <p className="text-2xl font-extrabold">{fmtHM(pace.data?.avg_revision_minutes ?? 0)}</p>
              <p className="mt-1 text-xs font-semibold">average revision sitting</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Based on {pace.data?.chapters_completed ?? 0} completed of {pace.data?.chapters_tracked ?? 0} tracked
            chapters.
          </p>
        </section>

        {subjectTargets.data?.length ? (
          <section className="surface-card mt-6 p-5 sm:p-6">
            <h2 className="text-xl font-bold">Subject targets</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
              {subjectTargets.data.map((target) => {
                const subject = (subjects.data ?? []).find((row) => row.id === target.subject_id);
                return (
                  <div key={target.id} className="rounded-2xl bg-secondary p-4">
                    <p className="font-bold">{subject?.name ?? "Subject"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {fmtHM(target.daily_minutes)} daily · {target.weekly_topics} topics/week ·{" "}
                      {target.weekly_questions} questions/week
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Session history — what got recorded from this page */}
        <div className="surface-card mt-6 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-2xl bg-primary/12 text-primary">
              <History className="size-4.5" />
            </span>
            <h2 className="text-base font-extrabold tracking-tight">Session history</h2>
            <span className="ml-auto text-[11px] font-semibold text-muted-foreground">last 14 days</span>
          </div>

          {recent.isLoading ? (
            <div className="mt-4 grid gap-2">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-14 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : (recent.data ?? []).length === 0 ? (
            <p className="mt-4 text-xs text-muted-foreground">Abhi koi session nahi — upar se ek session start karo.</p>
          ) : (
            <ul className="mt-4 grid gap-2">
              {(recent.data ?? []).slice(0, 6).map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-2xl border-2 border-border bg-secondary/40 px-3.5 py-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {s.subject_name || "Study"}
                      {s.chapter ? <span className="text-muted-foreground"> · {s.chapter}</span> : null}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {s.kind} · {relativeTime(s.started_at)}
                      {s.topic ? ` · ${s.topic}` : ""}
                    </span>
                  </span>
                  <span className="num shrink-0 rounded-full bg-background px-3 py-1 text-[11px] font-bold">
                    {s.is_running ? "live" : fmtHM(s.duration_minutes ?? 0)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>

      <ResponsiveSheet
        open={subjectSheet}
        onClose={() => setSubjectSheet(false)}
        title="Manage subjects"
        description="Add subjects and keep chapter lists up to date."
      >
        <SubjectsManager
          selectedId={form.subject_id}
          onSelect={(s) => {
            setForm((f) => ({ ...f, subject_id: s.id, subject_name: s.name, chapter: "" }));
            setChapterId("");
            setSubtopicId("");
            setSubjectSheet(false);
            setStep(2);
          }}
        />
        <Button type="button" variant="outline" onClick={() => setSubjectSheet(false)} className="mt-4 w-full">
          Done
        </Button>
      </ResponsiveSheet>
    </div>
  );
}
