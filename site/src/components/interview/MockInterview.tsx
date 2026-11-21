import { Microphone } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PRESETS } from "../../lib/mock-interview/presets";
import { questionInStacks, selectQuestions } from "../../lib/mock-interview/selection";
import {
  appendHistory,
  clearActiveSession,
  countAnswers,
  loadActiveSession,
  loadHistory,
  saveActiveSession,
} from "../../lib/mock-interview/storage";
import type {
  AnswerStatus,
  InterviewConfig,
  InterviewHistoryEntry,
  InterviewPreset,
  InterviewSession,
  MockInterviewQuestion,
} from "../../lib/mock-interview/types";
import { withBase } from "../../lib/urls";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { ActiveView } from "./ActiveView";
import { ResultsView } from "./ResultsView";
import { StartView } from "./StartView";

type Phase = "start" | "active" | "results";

interface ConfirmRequest {
  title: string;
  description: string;
  confirmLabel: string;
  action: () => void;
}

const INDEX_URL = withBase("/mock-interview-index.json");

function configFromPreset(preset: InterviewPreset): InterviewConfig {
  return {
    presetId: preset.id,
    sections: preset.sections,
    stacks: preset.stacks,
    count: preset.count,
    mainSection: preset.mainSection ?? null,
  };
}

interface MockInterviewProps {
  questionCount: number;
  sectionCount: number;
}

export function MockInterview({
  questionCount,
  sectionCount,
}: MockInterviewProps) {
  const [phase, setPhase] = useState<Phase>("start");
  const [index, setIndex] = useState<MockInterviewQuestion[] | null>(null);
  const [indexLoading, setIndexLoading] = useState(false);
  const [indexError, setIndexError] = useState(false);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [history, setHistory] = useState<InterviewHistoryEntry[]>([]);
  const [lastResult, setLastResult] = useState<{
    entry: InterviewHistoryEntry;
    questions: MockInterviewQuestion[];
  } | null>(null);
  /** Прямой переход с главной (?preset=…): запускаем без экрана выбора. */
  const [autoStartPending, setAutoStartPending] = useState(false);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedStack, setSelectedStack] = useState<string>("");
  const [length, setLength] = useState(30);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(0);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(
    null,
  );

  const lockRef = useRef(false);
  const pendingRetakeRef = useRef<InterviewConfig | null>(null);
  const autoStartRef = useRef<InterviewConfig | null>(null);

  useEffect(() => {
    const stored = loadActiveSession();
    const active =
      stored && stored.currentIndex < stored.questions.length ? stored : null;

    if (stored && !active) clearActiveSession();
    setSession(active);
    setHistory(loadHistory());

    const params = new URLSearchParams(window.location.search);
    if (params.get("resume") === "1" && active) {
      setPhase("active");
    }

    // ?preset=… приходит с главной: стартуем сразу, без экрана выбора.
    const presetId = params.get("preset");
    const preset = presetId
      ? PRESETS.find((item) => item.id === presetId)
      : undefined;
    if (preset && !active) {
      autoStartRef.current = configFromPreset(preset);
      setAutoStartPending(true);
    }

    if (params.has("preset") || params.has("resume")) {
      const url = new URL(window.location.href);
      ["preset", "resume"].forEach((key) => url.searchParams.delete(key));
      window.history.replaceState({}, "", url);
    }

    setReady(true);
  }, []);

  const startWithIndex = useCallback(
    (data: MockInterviewQuestion[], config: InterviewConfig) => {
      const result = selectQuestions(
        data,
        config.sections,
        config.stacks,
        config.count,
        config.mainSection,
      );
      if (result.questions.length === 0) return;

      const next: InterviewSession = {
        version: 1,
        config,
        questions: result.questions,
        answers: {},
        currentIndex: 0,
        startedAt: Date.now(),
      };
      saveActiveSession(next);
      setSession(next);
      setLastResult(null);
      setFlipped(false);
      setPhase("active");
    },
    [],
  );

  useEffect(() => {
    if (!ready || phase !== "start" || index || indexLoading) return;
    setIndexLoading(true);
    setIndexError(false);
    fetch(INDEX_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Interview index: ${res.status}`);
        return res.json();
      })
      .then((data: MockInterviewQuestion[]) => {
        setIndex(data);
        const retake = pendingRetakeRef.current;
        if (retake) {
          pendingRetakeRef.current = null;
          startWithIndex(data, retake);
          return;
        }
        const auto = autoStartRef.current;
        if (auto) {
          autoStartRef.current = null;
          setAutoStartPending(false);
          startWithIndex(data, auto);
        }
      })
      .catch(() => {
        autoStartRef.current = null;
        setAutoStartPending(false);
        setIndexError(true);
      })
      .finally(() => setIndexLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, phase, index, indexLoading]);

  useEffect(() => {
    if (phase !== "active") return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const finishInterview = useCallback((final: InterviewSession) => {
    const counts = countAnswers(final.answers);
    const perSection: Record<string, Record<AnswerStatus, number>> = {};
    final.questions.forEach((question, index) => {
      const status = final.answers[index];
      if (!status) return;
      const row = perSection[question.section] ?? {
        good: 0,
        unsure: 0,
        failed: 0,
      };
      row[status]++;
      perSection[question.section] = row;
    });
    const entry: InterviewHistoryEntry = {
      version: 1,
      config: final.config,
      counts,
      perSection,
      startedAt: final.startedAt,
      completedAt: Date.now(),
      durationSec: Math.max(
        0,
        Math.floor((Date.now() - final.startedAt) / 1000),
      ),
    };
    appendHistory(entry);
    setHistory(loadHistory());
    clearActiveSession();
    setSession(null);
    setLastResult({ entry, questions: final.questions });
    setFlipped(false);
    setPhase("results");
  }, []);

  const advanceTo = useCallback(
    (current: InterviewSession, status: AnswerStatus) => {
      if (lockRef.current) return;
      lockRef.current = true;
      setBusy(true);
      const next: InterviewSession = {
        ...current,
        answers: { ...current.answers, [current.currentIndex]: status },
        currentIndex: current.currentIndex + 1,
      };
      if (next.currentIndex >= next.questions.length) {
        finishInterview(next);
        lockRef.current = false;
        setBusy(false);
        return;
      }
      saveActiveSession(next);
      setSession(next);
      setFlipped(false);
      window.setTimeout(() => {
        lockRef.current = false;
        setBusy(false);
      }, 250);
    },
    [finishInterview],
  );

  const handleAnswer = useCallback(
    (status: AnswerStatus) => {
      if (session) advanceTo(session, status);
    },
    [session, advanceTo],
  );

  const resume = useCallback(() => {
    if (!session || session.currentIndex >= session.questions.length) return;
    setFlipped(false);
    setPhase("active");
  }, [session]);

  const exitInterview = useCallback(() => {
    setFlipped(false);
    setPhase("start");
  }, []);

  const confirmNewInterview = useCallback((action: () => void) => {
    setConfirmRequest({
      title: "Начать новое интервью?",
      description:
        "Текущее интервью и все его ответы будут удалены. Новое интервью начнётся сразу.",
      confirmLabel: "Начать новое",
      action,
    });
  }, []);

  const resetActive = useCallback(() => {
    if (!session) {
      clearActiveSession();
      setSession(null);
      setPhase("start");
      setFlipped(false);
      return;
    }

    setConfirmRequest({
      title: "Сбросить интервью?",
      description:
        "Текущее интервью и все его ответы будут удалены. Это действие нельзя отменить.",
      confirmLabel: "Сбросить",
      action: () => {
        clearActiveSession();
        setSession(null);
        setPhase("start");
        setFlipped(false);
      },
    });
  }, [session]);

  const retake = useCallback(() => {
    if (!lastResult) return;
    const config = lastResult.entry.config;
    if (index) {
      startWithIndex(index, config);
    } else {
      pendingRetakeRef.current = config;
      setPhase("start");
    }
  }, [lastResult, index, startWithIndex]);

  const startPreset = useCallback(
    (preset: InterviewPreset) => {
      if (!index) return;
      const begin = () => startWithIndex(index, configFromPreset(preset));

      if (session) {
        confirmNewInterview(begin);
        return;
      }
      begin();
    },
    [index, session, startWithIndex, confirmNewInterview],
  );

  const repeatLast = useCallback(() => {
    const last = history[0];
    if (!index || !last) return;
    const begin = () => startWithIndex(index, last.config);

    if (session) {
      confirmNewInterview(begin);
      return;
    }
    begin();
  }, [history, index, session, startWithIndex, confirmNewInterview]);

  const startCustom = useCallback(() => {
    if (!index || selectedSections.length === 0) return;
    const begin = () =>
      startWithIndex(index, {
        presetId: null,
        sections: selectedSections,
        stacks: selectedStack ? [selectedStack] : undefined,
        count: length,
        mainSection: null,
      });

    if (session) {
      confirmNewInterview(begin);
      return;
    }
    begin();
  }, [
    index,
    selectedSections,
    selectedStack,
    length,
    session,
    startWithIndex,
    confirmNewInterview,
  ]);

  const toggleSection = useCallback((id: string) => {
    setSelectedSections((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  }, []);

  const selectLength = useCallback((value: number) => {
    setLength(value);
  }, []);

  const selectStack = useCallback((id: string) => {
    setSelectedStack((previous) => (previous === id ? "" : id));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSections([]);
    setSelectedStack("");
  }, []);

  const poolSize = useMemo(() => {
    if (!index || selectedSections.length === 0) return null;
    const set = new Set(selectedSections);
    return index.filter(
      (question) =>
        question.answer !== null &&
        set.has(question.section) &&
        questionInStacks(
          question,
          selectedStack ? [selectedStack] : undefined,
        ),
    ).length;
  }, [index, selectedSections, selectedStack]);

  const sectionPool = useMemo(() => {
    const map = new Map<string, number>();
    if (!index) return map;
    const stacks = selectedStack ? [selectedStack] : undefined;
    for (const question of index) {
      if (question.answer === null || !questionInStacks(question, stacks)) {
        continue;
      }
      map.set(question.section, (map.get(question.section) ?? 0) + 1);
    }
    return map;
  }, [index, selectedStack]);

  const sectionLabels = useMemo(() => {
    const map = new Map<string, string>();
    if (!index) return map;
    for (const question of index) {
      if (!map.has(question.section)) {
        map.set(question.section, question.sectionLabel);
      }
    }
    return map;
  }, [index]);

  const poolCapped =
    poolSize !== null && poolSize > 0 && poolSize < length;
  const poolEmpty = poolSize !== null && poolSize === 0;
  const canStart =
    index !== null && selectedSections.length > 0 && poolSize !== null && poolSize > 0;

  const currentSession = phase === "active" ? session : null;
  const questions = currentSession?.questions ?? [];
  const currentIndex = currentSession?.currentIndex ?? 0;
  const current = questions[currentIndex];
  const elapsedSec = currentSession
    ? Math.max(0, Math.floor((now - currentSession.startedAt) / 1000))
    : 0;

  return (
    <div className="w-full">
      {phase === "start" && autoStartPending && <StartingView />}

      {phase === "start" && !autoStartPending && (
        <StartView
          index={index}
          loading={indexLoading}
          error={indexError}
          session={session}
          history={history}
          progressReady={ready}
          questionCount={questionCount}
          sectionCount={sectionCount}
          presets={PRESETS}
          sections={selectedSections}
          stack={selectedStack}
          length={length}
          sectionPool={sectionPool}
          sectionLabels={sectionLabels}
          poolCapped={poolCapped}
          poolEmpty={poolEmpty}
          poolSize={poolSize}
          canStart={canStart}
          onToggleSection={toggleSection}
          onSelectStack={selectStack}
          onSelectLength={selectLength}
          onClearSelection={clearSelection}
          onStartCustom={startCustom}
          onStartPreset={startPreset}
          onRepeatLast={repeatLast}
          onResume={resume}
          onReset={resetActive}
        />
      )}

      {phase === "active" && current && (
        <ActiveView
          question={current}
          currentIndex={currentIndex}
          total={questions.length}
          elapsedSec={elapsedSec}
          flipped={flipped}
          busy={busy}
          onFlip={() => setFlipped(true)}
          onAnswer={handleAnswer}
          onExit={exitInterview}
        />
      )}

      {phase === "results" && lastResult && (
        <ResultsView
          entry={lastResult.entry}
          questions={lastResult.questions}
          onRetake={retake}
          onBack={() => setPhase("start")}
        />
      )}

      <ConfirmDialog
        open={confirmRequest !== null}
        title={confirmRequest?.title ?? ""}
        description={confirmRequest?.description ?? ""}
        confirmLabel={confirmRequest?.confirmLabel ?? "Сбросить"}
        onCancel={() => setConfirmRequest(null)}
        onConfirm={() => {
          const action = confirmRequest?.action;
          setConfirmRequest(null);
          action?.();
        }}
      />
    </div>
  );
}

function StartingView() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="panel flex min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center">
        <Microphone size={32} weight="bold" className="text-pale-blue-text" />
        <p className="font-mono text-sm font-extrabold uppercase tracking-wider text-text">
          Запускаем интервью…
        </p>
        <p className="eyebrow text-text-tertiary">
          Подбираем вопросы под выбранный сет
        </p>
      </div>
    </div>
  );
}
