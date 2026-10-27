import {
  Barbell,
  Books,
  CheckCircle,
  Code,
  Funnel,
  MagnifyingGlass,
  Shuffle,
  Target,
  Trash,
  Trophy,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TASKS,
  TASK_MAP,
  TOPICS,
  computeStats,
  computeTopicStats,
  getCodeTaskCount,
  getWeakTopics,
  pickTrainingTasks,
} from "../../lib/practice";
import {
  emptyProgress,
  loadProgress,
  recordAttempt,
  resetAllProgress,
  resetTaskProgress,
  saveProgress,
  type PracticeProgress,
} from "../../lib/practice/storage";
import type { Difficulty, Task, TopicId } from "../../lib/practice/types";
import { TOPIC_MAP } from "../../lib/practice/topics";
import { TaskDetail } from "./TaskDetail";
import {
  DifficultyBadge,
  ProgressBar,
  StatusMark,
  TopicBadge,
} from "./ui";

type StatusFilter = "all" | "todo" | "solved" | "failed";
type KindFilter = "all" | "choice" | "code";
type TopicFilter = TopicId | "all";
type DifficultyFilter = Difficulty | "all";

interface TrainingState {
  ids: string[];
  index: number;
  results: Record<string, boolean>;
  finished: boolean;
}

const PAGE_SIZE = 30;

export function PracticeApp() {
  const [progress, setProgress] = useState<PracticeProgress>(emptyProgress);
  const progressRef = useRef<PracticeProgress>(emptyProgress());

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [topic, setTopic] = useState<TopicFilter>("all");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [kind, setKind] = useState<KindFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [training, setTraining] = useState<TrainingState | null>(null);

  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loaded = loadProgress();
    progressRef.current = loaded;
    setProgress(loaded);

    const id = new URLSearchParams(window.location.search).get("task");
    if (id && TASK_MAP[id]) {
      setSelectedId(id);
      const index = TASKS.findIndex((task) => task.id === id);
      if (index >= PAGE_SIZE) setVisibleCount(index + 1);
    }
  }, []);

  const stats = useMemo(() => computeStats(progress), [progress]);
  const topicStats = useMemo(() => computeTopicStats(progress), [progress]);
  const weakTopics = useMemo(() => getWeakTopics(progress, 3), [progress]);
  const codeTaskCount = useMemo(() => getCodeTaskCount(), []);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return TASKS.filter((task) => {
      if (topic !== "all" && task.topic !== topic) return false;
      if (difficulty !== "all" && task.difficulty !== difficulty) return false;
      if (kind !== "all" && task.kind !== kind) return false;

      const taskStatus = progress.tasks[task.id]?.status;
      if (statusFilter === "todo" && taskStatus) return false;
      if (statusFilter === "solved" && taskStatus !== "solved") return false;
      if (statusFilter === "failed" && taskStatus !== "failed") return false;

      if (query) {
        const haystack = [
          task.title,
          task.prompt,
          TOPIC_MAP[task.topic].label,
          ...(task.tags ?? []),
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [topic, difficulty, kind, statusFilter, search, progress]);

  const visibleTasks = filteredTasks.slice(0, visibleCount);
  const taskNumbers = useMemo(
    () => new Map(TASKS.map((task, index) => [task.id, index + 1])),
    [],
  );

  const selectTask = useCallback((id: string | null) => {
    setSelectedId(id);

    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("task", id);
    else url.searchParams.delete("task");
    window.history.replaceState({}, "", url);
  }, []);

  const commitProgress = useCallback((next: PracticeProgress) => {
    progressRef.current = next;
    setProgress(next);
    saveProgress(next);
  }, []);

  const handleResult = useCallback(
    (taskId: string, solved: boolean) => {
      commitProgress(recordAttempt(progressRef.current, taskId, solved));

      setTraining((current) => {
        if (!current || current.finished) return current;

        const previous = current.results[taskId] === true;
        return {
          ...current,
          results: { ...current.results, [taskId]: previous || solved },
        };
      });
    },
    [commitProgress],
  );

  const handleResetTask = useCallback(
    (taskId: string) => {
      commitProgress(resetTaskProgress(progressRef.current, taskId));
    },
    [commitProgress],
  );

  function handleSelect(id: string) {
    if (training && !training.finished) setTraining(null);
    selectTask(id);
  }

  function startTraining() {
    const tasks = pickTrainingTasks(progressRef.current, 10);
    if (tasks.length === 0) return;

    setTraining({
      ids: tasks.map((task) => task.id),
      index: 0,
      results: {},
      finished: false,
    });

    setTopic("all");
    setDifficulty("all");
    setKind("all");
    setStatusFilter("all");
    setSearch("");
    selectTask(tasks[0].id);
  }

  function handleTrainingNext() {
    if (!training) return;

    const nextIndex = training.index + 1;
    if (nextIndex >= training.ids.length) {
      setTraining({ ...training, finished: true });
      return;
    }

    setTraining({ ...training, index: nextIndex });
    selectTask(training.ids[nextIndex]);
  }

  function openRandomTask() {
    const pool = filteredTasks.length > 0 ? filteredTasks : TASKS;
    const candidates = pool.filter((task) => task.id !== selectedId);
    const source = candidates.length > 0 ? candidates : pool;
    const task = source[Math.floor(Math.random() * source.length)];
    if (!task) return;
    if (training && !training.finished) setTraining(null);
    selectTask(task.id);
  }

  function moveInList(direction: number) {
    if (filteredTasks.length === 0) return;

    const currentId = training && !training.finished
      ? training.ids[training.index]
      : selectedId;
    const index = filteredTasks.findIndex((task) => task.id === currentId);

    if (index === -1) {
      selectTask(filteredTasks[0].id);
      return;
    }

    const nextIndex =
      (index + direction + filteredTasks.length) % filteredTasks.length;
    selectTask(filteredTasks[nextIndex].id);
  }

  function resetFilters() {
    setTopic("all");
    setDifficulty("all");
    setKind("all");
    setStatusFilter("all");
    setSearch("");
  }

  function handleResetAll() {
    if (!window.confirm("Сбросить весь прогресс практикума? Это нельзя отменить.")) {
      return;
    }

    commitProgress(resetAllProgress());
    setTraining(null);
  }

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [topic, difficulty, kind, statusFilter, search]);

  useEffect(() => {
    if (!selectedId) return;

    const index = filteredTasks.findIndex((task) => task.id === selectedId);
    if (index >= 0 && index >= visibleCount) {
      setVisibleCount(index + 1);
    }
  }, [selectedId, filteredTasks, visibleCount]);

  const trainingTask =
    training && !training.finished
      ? TASK_MAP[training.ids[training.index]]
      : null;
  const detailTask: Task | undefined = trainingTask ?? TASK_MAP[selectedId ?? ""];
  const detailStatus = detailTask ? progress.tasks[detailTask.id] : undefined;
  const trainingMeta =
    training && !training.finished
      ? { current: training.index + 1, total: training.ids.length }
      : undefined;

  useEffect(() => {
    if (!detailTask) return;
    if (!window.matchMedia("(max-width: 1023px)").matches) return;

    const frame = window.requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [detailTask?.id]);

  const trainingSolved = training
    ? training.ids.filter((id) => training.results[id]).length
    : 0;
  const trainingTotal = training?.ids.length ?? 0;

  return (
    <div>
      <section className="border-[3px] border-border bg-surface p-5 sm:p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 border-2 border-border bg-pale-yellow-bg px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-pale-yellow-text">
              <Barbell size={14} weight="bold" />
              Банк задач · {TASKS.length}
            </div>
            <h1 className="mt-3 font-mono text-3xl font-extrabold uppercase tracking-tight text-text sm:text-4xl lg:text-5xl">
              Практикум
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-text-secondary sm:text-[15px]">
              Задачи на базовый JavaScript в формате «что выведет код»: hoisting,
              замыкания, this, event loop, Map/Set, Big O, приведение типов и
              промисы. Плюс задачи с кодом, тесты для которых выполняются прямо
              в браузере. Без регистрации и подписки.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={startTraining}
                className="inline-flex items-center gap-2 border-[3px] border-border bg-accent px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_var(--color-border)] active:translate-x-0 active:translate-y-0 active:shadow-none"
              >
                <Target size={16} weight="bold" />
                Тренировка на 10 задач
              </button>
              <button
                type="button"
                onClick={openRandomTask}
                className="inline-flex items-center gap-2 border-[3px] border-border bg-surface px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-text transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_var(--color-border)] active:translate-x-0 active:translate-y-0 active:shadow-none"
              >
                <Shuffle size={16} weight="bold" />
                Случайная задача
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="border-2 border-border bg-canvas p-3">
              <div className="font-mono text-2xl font-extrabold text-text">
                {stats.solved}
                <span className="text-sm text-text-tertiary">/{stats.total}</span>
              </div>
              <div className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                Решено
              </div>
            </div>
            <div className="border-2 border-border bg-canvas p-3">
              <div className="font-mono text-2xl font-extrabold text-text">
                {stats.accuracy}%
              </div>
              <div className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                Точность
              </div>
            </div>
            <div className="border-2 border-border bg-canvas p-3">
              <div className="font-mono text-2xl font-extrabold text-text">
                {codeTaskCount}
              </div>
              <div className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                С кодом
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:items-start">
        <div className="min-w-0 space-y-3">
          <div className="border-[3px] border-border bg-surface p-3 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                  <MagnifyingGlass size={16} weight="bold" />
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Поиск: замыкание, Map, event loop..."
                  className="h-10 w-full border-2 border-border bg-canvas pl-9 pr-3 font-mono text-xs font-medium text-text outline-none placeholder:text-text-tertiary focus:border-accent"
                  aria-label="Поиск задач"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <select
                  value={topic}
                  onChange={(event) => setTopic(event.target.value as TopicFilter)}
                  className="h-10 max-w-full border-2 border-border bg-canvas px-2 font-mono text-[10px] font-bold uppercase tracking-wider text-text outline-none focus:border-accent"
                  aria-label="Тема"
                >
                  <option value="all">Все темы</option>
                  {TOPICS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>

                <select
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(event.target.value as DifficultyFilter)
                  }
                  className="h-10 border-2 border-border bg-canvas px-2 font-mono text-[10px] font-bold uppercase tracking-wider text-text outline-none focus:border-accent"
                  aria-label="Сложность"
                >
                  <option value="all">Любая сложность</option>
                  <option value="junior">Junior</option>
                  <option value="middle">Middle</option>
                  <option value="senior">Senior</option>
                </select>

                <select
                  value={kind}
                  onChange={(event) => setKind(event.target.value as KindFilter)}
                  className="h-10 border-2 border-border bg-canvas px-2 font-mono text-[10px] font-bold uppercase tracking-wider text-text outline-none focus:border-accent"
                  aria-label="Тип задачи"
                >
                  <option value="all">Все типы</option>
                  <option value="choice">Выбор ответа</option>
                  <option value="code">Код</option>
                </select>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Funnel size={13} weight="bold" className="text-text-tertiary" />
              {(
                [
                  ["all", "Все"],
                  ["todo", "Не решено"],
                  ["solved", "Решено"],
                  ["failed", "С ошибкой"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={`border-2 border-border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    statusFilter === value
                      ? "bg-text text-canvas"
                      : "bg-canvas text-text-secondary hover:bg-surface-alt hover:text-text"
                  }`}
                >
                  {label}
                </button>
              ))}
              <span className="ml-auto font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                Найдено: {filteredTasks.length}
              </span>
            </div>
          </div>

          <div className="border-[3px] border-border bg-surface">
            {visibleTasks.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center border-2 border-border bg-surface-alt text-text-tertiary">
                  <Books size={24} weight="bold" />
                </div>
                <p className="mt-3 font-mono text-sm font-bold uppercase tracking-wider text-text">
                  Ничего не найдено
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Попробуй изменить фильтры или запрос.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 border-2 border-border bg-canvas px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-text transition-colors hover:bg-surface-alt"
                >
                  Сбросить фильтры
                </button>
              </div>
            ) : (
              <ul className="divide-y-2 divide-border">
                {visibleTasks.map((task) => {
                  const taskStatus = progress.tasks[task.id]?.status;
                  const active = detailTask?.id === task.id;

                  return (
                    <li key={task.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(task.id)}
                        className={`flex w-full items-center gap-2.5 border-l-[6px] px-3 py-2.5 text-left transition-colors ${
                          active
                            ? "border-l-accent bg-pale-yellow-bg"
                            : "border-l-transparent bg-surface hover:bg-surface-alt"
                        }`}
                      >
                        <StatusMark status={taskStatus} size={16} />
                        <span className="w-9 shrink-0 font-mono text-[10px] font-bold text-text-tertiary">
                          #{String(taskNumbers.get(task.id) ?? 0).padStart(3, "0")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-mono text-[12.5px] font-bold uppercase tracking-tight text-text">
                            {task.title}
                          </span>
                          <span className="mt-1 flex flex-wrap gap-1">
                            <TopicBadge topic={task.topic} short />
                            <DifficultyBadge difficulty={task.difficulty} />
                          </span>
                        </span>
                        {task.kind === "code" && (
                          <Code
                            size={16}
                            weight="bold"
                            className="shrink-0 text-text-tertiary"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {visibleCount < filteredTasks.length && (
              <div className="border-t-2 border-border p-3">
                <button
                  type="button"
                  onClick={() => setVisibleCount((value) => value + PAGE_SIZE)}
                  className="w-full border-2 border-border bg-canvas px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-text-secondary transition-colors hover:bg-surface-alt hover:text-text"
                >
                  Показать ещё {Math.min(PAGE_SIZE, filteredTasks.length - visibleCount)}
                </button>
              </div>
            )}
          </div>
        </div>

        <div ref={detailRef} className="min-w-0 scroll-mt-20 lg:sticky lg:top-20">
          {training?.finished ? (
            <div className="border-[3px] border-border bg-pale-yellow-bg p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center border-2 border-border bg-pale-yellow-text text-canvas">
                  <Trophy size={22} weight="bold" />
                </div>
                <div>
                  <h2 className="font-mono text-xl font-extrabold uppercase tracking-tight text-text">
                    Тренировка завершена
                  </h2>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                    {trainingSolved} из {trainingTotal} решено
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <ProgressBar value={trainingSolved} total={trainingTotal} />
              </div>

              <p className="mt-4 text-sm font-medium leading-relaxed text-text-secondary">
                {trainingSolved === trainingTotal
                  ? "Отлично: все задачи сета решены. Запускай новый сет — вопросы соберутся заново."
                  : "Разбери ошибки по ссылкам ниже и вернись к тренировке. Задачи, которые не были решены, попадут в следующий сет первыми."}
              </p>

              {training.ids.filter((id) => !training.results[id]).length > 0 && (
                <div className="mt-4">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                    Разобрать ошибки
                  </div>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {training.ids
                      .filter((id) => !training.results[id])
                      .map((id) => {
                        const task = TASK_MAP[id];
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              setTraining(null);
                              selectTask(id);
                            }}
                            className="flex items-center gap-2 border-2 border-border bg-surface px-3 py-2 text-left font-mono text-[11px] font-bold uppercase tracking-wide text-text transition-colors hover:bg-surface-alt"
                          >
                            <StatusMark status="failed" size={14} />
                            {task.title}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={startTraining}
                  className="inline-flex items-center gap-2 border-2 border-border bg-accent px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_var(--color-border)]"
                >
                  <Target size={14} weight="bold" />
                  Ещё тренировка
                </button>
                <button
                  type="button"
                  onClick={() => setTraining(null)}
                  className="border-2 border-border bg-surface px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-text-secondary transition-colors hover:bg-surface-alt hover:text-text"
                >
                  К списку
                </button>
              </div>
            </div>
          ) : detailTask ? (
            <div className="space-y-3">
              {training && !training.finished && (
                <div className="border-[3px] border-border bg-pale-yellow-bg p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-pale-yellow-text">
                      Тренировка · {training.index + 1} / {training.ids.length}
                    </span>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                      Решено: {trainingSolved}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTraining(null)}
                      className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-secondary underline hover:text-text"
                    >
                      Выйти
                    </button>
                  </div>
                  <ProgressBar
                    value={training.index}
                    total={training.ids.length}
                    className="mt-2"
                  />
                </div>
              )}

              <TaskDetail
                key={detailTask.id}
                task={detailTask}
                status={detailStatus}
                training={trainingMeta}
                onResult={(solved) => handleResult(detailTask.id, solved)}
                onNext={
                  training && !training.finished ? handleTrainingNext : () => moveInList(1)
                }
                onPrev={() => {
                  if (training && !training.finished) setTraining(null);
                  moveInList(-1);
                }}
                onRandom={openRandomTask}
                onResetTask={() => handleResetTask(detailTask.id)}
              />
            </div>
          ) : (
            <div className="border-[3px] border-border bg-surface p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center border-2 border-border bg-accent text-canvas">
                  <CheckCircle size={22} weight="bold" />
                </div>
                <div>
                  <h2 className="font-mono text-xl font-extrabold uppercase tracking-tight text-text">
                    Твой прогресс
                  </h2>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                    Прогресс хранится в localStorage
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="border-2 border-border bg-canvas p-3">
                  <div className="font-mono text-xl font-extrabold text-text">
                    {stats.solved}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                    Решено
                  </div>
                </div>
                <div className="border-2 border-border bg-canvas p-3">
                  <div className="font-mono text-xl font-extrabold text-text">
                    {stats.failed}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                    С ошибкой
                  </div>
                </div>
                <div className="border-2 border-border bg-canvas p-3">
                  <div className="font-mono text-xl font-extrabold text-text">
                    {stats.todo}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                    Осталось
                  </div>
                </div>
                <div className="border-2 border-border bg-canvas p-3">
                  <div className="font-mono text-xl font-extrabold text-text">
                    {stats.accuracy}%
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                    Точность
                  </div>
                </div>
              </div>

              {stats.attempted > 0 && weakTopics.length > 0 && (
                <div className="mt-5">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                    Слабые темы
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {weakTopics.map((topicId) => (
                      <button
                        key={topicId}
                        type="button"
                        onClick={() => setTopic(topicId)}
                        className="border-2 border-border bg-pale-red-bg px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-pale-red-text transition-colors hover:bg-pale-red-bg-hover"
                      >
                        {TOPIC_MAP[topicId].label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                    Прогресс по темам
                  </div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                    {stats.total} задач
                  </span>
                </div>
                <div className="mt-2 space-y-2">
                  {TOPICS.map((item) => {
                    const itemStats = topicStats[item.id];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTopic(item.id)}
                        className="group w-full border-2 border-border bg-canvas p-2.5 text-left transition-colors hover:bg-surface-alt"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-bold uppercase tracking-wide text-text">
                            {item.label}
                          </span>
                          <span className="shrink-0 font-mono text-[10px] font-bold text-text-tertiary">
                            {itemStats.solved}/{itemStats.total}
                          </span>
                        </div>
                        <ProgressBar
                          value={itemStats.solved}
                          total={itemStats.total}
                          className="mt-1.5"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2 border-t-2 border-border pt-4">
                <button
                  type="button"
                  onClick={startTraining}
                  className="inline-flex items-center gap-2 border-2 border-border bg-accent px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_var(--color-border)]"
                >
                  <Target size={14} weight="bold" />
                  Начать тренировку
                </button>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="ml-auto inline-flex items-center gap-1.5 border-2 border-border bg-surface px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-text-secondary transition-colors hover:bg-pale-red-bg hover:text-pale-red-text"
                >
                  <Trash size={13} weight="bold" />
                  Сбросить прогресс
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
