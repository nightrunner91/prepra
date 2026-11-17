import {
  ArrowLeft,
  Books,
  Shuffle,
  Target,
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
import type { Task, TopicId } from "../../lib/practice/types";
import { TOPIC_MAP } from "../../lib/practice/topics";
import { TaskDetail } from "./TaskDetail";
import { TaskTile } from "./TaskTile";
import { Toolbar } from "./Toolbar";
import type {
  DifficultyFilter,
  KindFilter,
  StatusFilter,
  TopicFilter,
} from "./Toolbar";
import { TopicsProgress } from "./TopicsProgress";
import { ProgressBar, StatusMark } from "./ui";

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

  /** Позиция списка, к которой возвращаемся после закрытия задачи. */
  const listScrollRef = useRef(0);

  const syncUrl = useCallback(
    (id: string | null, mode: "push" | "replace") => {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      if (id) url.searchParams.set("task", id);
      else url.searchParams.delete("task");
      window.history[mode === "push" ? "pushState" : "replaceState"](
        {},
        "",
        url,
      );
    },
    [],
  );

  const selectTask = useCallback(
    (id: string | null, mode: "push" | "replace" = "push") => {
      setSelectedId(id);
      syncUrl(id, mode);
    },
    [syncUrl],
  );

  useEffect(() => {
    const loaded = loadProgress();
    progressRef.current = loaded;
    setProgress(loaded);

    const params = new URLSearchParams(window.location.search);

    const topicParam = params.get("topic");
    if (topicParam && TOPICS.some((item) => item.id === topicParam)) {
      setTopic(topicParam as TopicFilter);
    }

    const statusParam = params.get("status");
    if (
      statusParam === "failed" ||
      statusParam === "solved" ||
      statusParam === "todo"
    ) {
      setStatusFilter(statusParam);
    }

    const id = params.get("task");
    if (id && TASK_MAP[id]) {
      setSelectedId(id);
    }

    const mode = params.get("mode");
    const random = params.get("random") === "1";

    if (mode === "training") {
      startTraining();
    } else if (random) {
      const pool = topicParam
        ? TASKS.filter((task) => task.topic === topicParam)
        : TASKS;
      const source = pool.length > 0 ? pool : TASKS;
      const task = source[Math.floor(Math.random() * source.length)];
      if (task) selectTask(task.id, "replace");
    }

    if (mode || random) {
      const url = new URL(window.location.href);
      url.searchParams.delete("mode");
      url.searchParams.delete("random");
      window.history.replaceState({}, "", url);
    }
  }, []);

  useEffect(() => {
    function handlePopState() {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("task");
      setSelectedId(id && TASK_MAP[id] ? id : null);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
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

  function rememberListScroll() {
    if (!selectedId) listScrollRef.current = window.scrollY;
  }

  function openTask(id: string) {
    rememberListScroll();
    if (training && !training.finished) setTraining(null);
    selectTask(id, "push");
  }

  function closeTask() {
    if (training && !training.finished) setTraining(null);
    selectTask(null, "replace");
  }

  function startTraining() {
    const tasks = pickTrainingTasks(progressRef.current, 10);
    if (tasks.length === 0) return;

    rememberListScroll();

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
    selectTask(tasks[0].id, "replace");
  }

  function handleTrainingNext() {
    if (!training) return;

    const nextIndex = training.index + 1;
    if (nextIndex >= training.ids.length) {
      setTraining({ ...training, finished: true });
      return;
    }

    setTraining({ ...training, index: nextIndex });
    selectTask(training.ids[nextIndex], "replace");
  }

  function openRandomTask() {
    const pool = filteredTasks.length > 0 ? filteredTasks : TASKS;
    const candidates = pool.filter((task) => task.id !== selectedId);
    const source = candidates.length > 0 ? candidates : pool;
    const task = source[Math.floor(Math.random() * source.length)];
    if (!task) return;
    rememberListScroll();
    if (training && !training.finished) setTraining(null);
    selectTask(task.id, "replace");
  }

  function moveInList(direction: number) {
    if (filteredTasks.length === 0) return;

    const currentId =
      training && !training.finished
        ? training.ids[training.index]
        : selectedId;
    const index = filteredTasks.findIndex((task) => task.id === currentId);

    if (index === -1) {
      selectTask(filteredTasks[0].id, "replace");
      return;
    }

    const nextIndex =
      (index + direction + filteredTasks.length) % filteredTasks.length;
    selectTask(filteredTasks[nextIndex].id, "replace");
  }

  function resetFilters() {
    setTopic("all");
    setDifficulty("all");
    setKind("all");
    setStatusFilter("all");
    setSearch("");
  }

  function applyTopicFilter(next: TopicId) {
    setTopic(next);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function handleResetAll() {
    if (
      !window.confirm("Сбросить весь прогресс практикума? Это нельзя отменить.")
    ) {
      return;
    }

    commitProgress(resetAllProgress());
    setTraining(null);
  }

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [topic, difficulty, kind, statusFilter, search]);

  useEffect(() => {
    if (selectedId) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    if (listScrollRef.current > 0) {
      const top = listScrollRef.current;
      listScrollRef.current = 0;
      window.scrollTo({ top, behavior: "auto" });
    }
  }, [selectedId]);

  const trainingTask =
    training && !training.finished
      ? TASK_MAP[training.ids[training.index]]
      : null;
  const detailTask: Task | undefined =
    trainingTask ?? TASK_MAP[selectedId ?? ""];
  const detailStatus = detailTask ? progress.tasks[detailTask.id] : undefined;
  const trainingMeta =
    training && !training.finished
      ? { current: training.index + 1, total: training.ids.length }
      : undefined;

  const trainingSolved = training
    ? training.ids.filter((id) => training.results[id]).length
    : 0;
  const trainingTotal = training?.ids.length ?? 0;

  return (
    <div>
      <header className="page-head">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <h1 className="page-title">Практикум</h1>
            <p className="page-lede">
              Задачи на базовый JavaScript в формате «что выведет код»:
              hoisting, замыкания, this, event loop, Map/Set, Big O, приведение
              типов и промисы. Без регистрации и подписки.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="chip">
                Решено {stats.solved} / {stats.total}
              </span>
              <span className="chip">Точность {stats.accuracy}%</span>
              <span className="chip">{codeTaskCount} задач с кодом</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={startTraining}
              className="btn btn-primary btn-md"
            >
              <Target size={16} weight="bold" />
              Тренировка на 10
            </button>
            <button
              type="button"
              onClick={openRandomTask}
              className="btn btn-secondary btn-md"
            >
              <Shuffle size={16} weight="bold" />
              Случайная
            </button>
          </div>
        </div>
      </header>

      {training?.finished ? (
        <div className="mx-auto max-w-3xl">
          <div className="panel bg-pale-yellow-bg p-5 sm:p-6">
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
                            selectTask(id, "replace");
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
                className="btn btn-primary btn-md"
              >
                <Target size={14} weight="bold" />
                Ещё тренировка
              </button>
              <button
                type="button"
                onClick={() => selectTask(null, "replace")}
                className="btn btn-secondary btn-md"
              >
                К списку
              </button>
            </div>
          </div>
        </div>
      ) : detailTask ? (
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={closeTask}
              className="btn btn-secondary btn-sm"
            >
              <ArrowLeft size={14} weight="bold" />
              Все задачи
            </button>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Задача {taskNumbers.get(detailTask.id)} из {TASKS.length}
            </span>
          </div>

          {training && !training.finished && (
            <div className="panel mb-3 flex flex-wrap items-center gap-3 bg-pale-yellow-bg p-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-pale-yellow-text">
                Тренировка · {training.index + 1} / {training.ids.length}
              </span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                Решено: {trainingSolved}
              </span>
              <button
                type="button"
                onClick={() => setTraining(null)}
                className="ml-auto font-mono text-[10px] font-bold uppercase tracking-wider text-text-secondary underline decoration-2 underline-offset-2 transition-colors hover:text-text"
              >
                Выйти
              </button>
              <ProgressBar
                value={training.index}
                total={training.ids.length}
                className="w-full"
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
              training && !training.finished
                ? handleTrainingNext
                : () => moveInList(1)
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
        <>
          <Toolbar
            search={search}
            onSearch={setSearch}
            topic={topic}
            onTopic={setTopic}
            difficulty={difficulty}
            onDifficulty={setDifficulty}
            kind={kind}
            onKind={setKind}
            status={statusFilter}
            onStatus={setStatusFilter}
            onReset={resetFilters}
            found={filteredTasks.length}
          />

          {visibleTasks.length === 0 ? (
            <div className="panel mt-6 p-8 text-center">
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
                className="btn btn-secondary btn-sm mt-4"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleTasks.map((task) => (
                  <TaskTile
                    key={task.id}
                    task={task}
                    number={taskNumbers.get(task.id) ?? 0}
                    status={progress.tasks[task.id]?.status}
                    onOpen={() => openTask(task.id)}
                  />
                ))}
              </div>

              {visibleCount < filteredTasks.length && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((value) => value + PAGE_SIZE)}
                    className="btn btn-secondary btn-md"
                  >
                    Показать ещё{" "}
                    {Math.min(PAGE_SIZE, filteredTasks.length - visibleCount)}
                  </button>
                </div>
              )}
            </>
          )}

          <TopicsProgress
            topicStats={topicStats}
            solved={stats.solved}
            total={stats.total}
            weakTopics={stats.attempted > 0 ? weakTopics : []}
            onSelectTopic={applyTopicFilter}
            onResetAll={handleResetAll}
          />
        </>
      )}
    </div>
  );
}
