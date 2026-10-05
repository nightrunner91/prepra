import {
  ArrowCounterClockwise,
  ArrowRight,
  Clock,
  Eye,
  House,
  Microphone,
  PauseCircle,
  SmileyMeh,
  ThumbsDown,
  ThumbsUp,
} from '@phosphor-icons/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { withBase } from '../../lib/urls';
import { ALL_SECTION_IDS, PRESETS } from '../../lib/mock-interview/presets';
import { selectQuestions, questionInStacks } from '../../lib/mock-interview/selection';
import {
  appendHistory,
  clearActiveSession,
  countAnswers,
  formatDate,
  formatDuration,
  loadActiveSession,
  saveActiveSession,
} from '../../lib/mock-interview/storage';
import type {
  AnswerStatus,
  InterviewConfig,
  InterviewHistoryEntry,
  InterviewPreset,
  InterviewSession,
  MockInterviewQuestion,
} from '../../lib/mock-interview/types';

type Phase = 'start' | 'active' | 'results';

const INDEX_URL = withBase('/mock-interview-index.json');
const LENGTH_OPTIONS = [20, 30, 50];
const STACK_OPTIONS: { id: string; label: string }[] = [
  { id: 'react', label: 'React' },
  { id: 'vue', label: 'Vue' },
  { id: 'nextjs', label: 'Next.js' },
  { id: 'nuxt', label: 'Nuxt' },
];
const STATUSES: AnswerStatus[] = ['good', 'unsure', 'failed', 'skipped'];
const RATE_STATUSES: AnswerStatus[] = ['good', 'unsure', 'failed'];

const STATUS_META: Record<
  AnswerStatus,
  { label: string; icon: React.ReactNode; bg: string; hoverBg: string; color: string }
> = {
  good: {
    label: 'Отлично',
    icon: <ThumbsUp size={22} weight="bold" />,
    bg: 'bg-pale-green-bg',
    hoverBg: 'hover:bg-pale-green-bg-hover',
    color: 'text-pale-green-text',
  },
  unsure: {
    label: 'Так себе',
    icon: <SmileyMeh size={22} weight="bold" />,
    bg: 'bg-pale-yellow-bg',
    hoverBg: 'hover:bg-pale-yellow-bg-hover',
    color: 'text-pale-yellow-text',
  },
  failed: {
    label: 'Плохо',
    icon: <ThumbsDown size={22} weight="bold" />,
    bg: 'bg-pale-red-bg',
    hoverBg: 'hover:bg-pale-red-bg-hover',
    color: 'text-pale-red-text',
  },
  skipped: {
    label: 'Пропущено',
    icon: <PauseCircle size={22} weight="fill" />,
    bg: 'bg-surface-alt',
    hoverBg: 'hover:bg-surface-alt',
    color: 'text-text-secondary',
  },
};

function renderInlineCode(text: string): React.ReactNode[] {
  return text.split('`').map((part, i) =>
    i % 2 === 1 ? <code key={i}>{part}</code> : part,
  );
}

export function MockInterview() {
  const [phase, setPhase] = useState<Phase>('start');
  const [index, setIndex] = useState<MockInterviewQuestion[] | null>(null);
  const [indexLoading, setIndexLoading] = useState(false);
  const [indexError, setIndexError] = useState(false);
  const [session, setSession] = useState<InterviewSession | null>(() => {
    const s = loadActiveSession();
    if (s && s.currentIndex >= s.questions.length) {
      clearActiveSession();
      return null;
    }
    return s;
  });
  const [lastResult, setLastResult] = useState<{
    entry: InterviewHistoryEntry;
    questions: MockInterviewQuestion[];
  } | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedStack, setSelectedStack] = useState<string>('');
  const [length, setLength] = useState(30);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const lockRef = useRef(false);
  const pendingRetakeRef = useRef<InterviewConfig | null>(null);

  const startWithIndex = useCallback(
    (data: MockInterviewQuestion[], config: InterviewConfig) => {
      const result = selectQuestions(data, config.sections, config.stacks, config.count);
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
      setPhase('active');
    },
    [],
  );

  useEffect(() => {
    if (phase !== 'start' || index || indexLoading) return;
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
        }
      })
      .catch(() => setIndexError(true))
      .finally(() => setIndexLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index, indexLoading]);

  useEffect(() => {
    if (phase !== 'active') return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const finishInterview = useCallback((final: InterviewSession) => {
    const counts = countAnswers(final.answers);
    const perSection: Record<string, Record<AnswerStatus, number>> = {};
    final.questions.forEach((q, i) => {
      const status = final.answers[i] ?? 'skipped';
      const row = perSection[q.section] ?? { good: 0, unsure: 0, failed: 0, skipped: 0 };
      row[status]++;
      perSection[q.section] = row;
    });
    const entry: InterviewHistoryEntry = {
      version: 1,
      config: final.config,
      counts,
      perSection,
      startedAt: final.startedAt,
      completedAt: Date.now(),
      durationSec: Math.max(0, Math.floor((Date.now() - final.startedAt) / 1000)),
    };
    appendHistory(entry);
    clearActiveSession();
    setSession(null);
    setLastResult({ entry, questions: final.questions });
    setFlipped(false);
    setPhase('results');
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

  const handleSkip = useCallback(() => {
    if (session) advanceTo(session, 'skipped');
  }, [session, advanceTo]);

  const startInterview = useCallback(
    (config: InterviewConfig) => {
      if (index) startWithIndex(index, config);
    },
    [index, startWithIndex],
  );

  const handleStart = useCallback(() => {
    const preset = selectedPresetId
      ? PRESETS.find((p) => p.id === selectedPresetId)
      : undefined;
    const sections = preset ? preset.sections : selectedSections;
    if (sections.length === 0) return;
    const stacks = preset
      ? preset.stacks
      : selectedStack
        ? [selectedStack]
        : undefined;
    const config: InterviewConfig = {
      presetId: selectedPresetId,
      sections,
      stacks,
      count: preset ? preset.count : length,
    };
    startInterview(config);
  }, [selectedPresetId, selectedSections, selectedStack, length, startInterview]);

  const resume = useCallback(() => {
    if (!session || session.currentIndex >= session.questions.length) return;
    setFlipped(false);
    setPhase('active');
  }, [session]);

  const resetActive = useCallback(() => {
    clearActiveSession();
    setSession(null);
    setPhase('start');
    setFlipped(false);
  }, []);

  const retake = useCallback(() => {
    if (!lastResult) return;
    const config = lastResult.entry.config;
    if (index) {
      startWithIndex(index, config);
    } else {
      pendingRetakeRef.current = config;
      setPhase('start');
    }
  }, [lastResult, index, startWithIndex]);

  const selectPreset = useCallback((id: string) => {
    setSelectedPresetId(id);
    setSelectedSections([]);
  }, []);

  const toggleSection = useCallback((id: string) => {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setSelectedPresetId(null);
  }, []);

  const selectLength = useCallback((l: number) => {
    setLength(l);
    setSelectedPresetId(null);
  }, []);

  const selectStack = useCallback((id: string) => {
    setSelectedStack((prev) => (prev === id ? '' : id));
    setSelectedPresetId(null);
  }, []);

  const presetForStart = selectedPresetId
    ? (PRESETS.find((p) => p.id === selectedPresetId) ?? null)
    : null;
  const startSections = presetForStart ? presetForStart.sections : selectedSections;
  const effectiveCount = presetForStart ? presetForStart.count : length;
  const activeStacks = presetForStart
    ? presetForStart.stacks
    : selectedStack
      ? [selectedStack]
      : undefined;

  const poolSize = useMemo(() => {
    if (!index || startSections.length === 0) return null;
    const set = new Set(startSections);
    return index.filter(
      (q) => q.answer !== null && set.has(q.section) && questionInStacks(q, activeStacks),
    ).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, startSections, selectedStack, selectedPresetId]);

  const sectionPool = useMemo(() => {
    const map = new Map<string, number>();
    if (!index) return map;
    const stacks = selectedStack ? [selectedStack] : undefined;
    for (const q of index) {
      if (q.answer === null || !questionInStacks(q, stacks)) continue;
      map.set(q.section, (map.get(q.section) ?? 0) + 1);
    }
    return map;
  }, [index, selectedStack]);

  const sectionLabels = useMemo(() => {
    const map = new Map<string, string>();
    if (!index) return map;
    for (const q of index) {
      if (!map.has(q.section)) map.set(q.section, q.sectionLabel);
    }
    return map;
  }, [index]);

  const poolCapped = poolSize !== null && poolSize > 0 && poolSize < effectiveCount;
  const poolEmpty = poolSize !== null && poolSize === 0;
  const canStart =
    index !== null &&
    (presetForStart !== null || selectedSections.length > 0) &&
    poolSize !== null &&
    poolSize > 0;

  const currentSession = phase === 'active' ? session : null;
  const questions = currentSession?.questions ?? [];
  const currentIndex = currentSession?.currentIndex ?? 0;
  const current = questions[currentIndex];
  const elapsedSec = currentSession
    ? Math.max(0, Math.floor((now - currentSession.startedAt) / 1000))
    : 0;

  return (
    <div className="w-full">
      {phase === 'start' && (
        <StartView
          index={index}
          loading={indexLoading}
          error={indexError}
          session={session}
          presets={PRESETS}
          presetId={selectedPresetId}
          sections={selectedSections}
          stack={selectedStack}
          length={length}
          sectionPool={sectionPool}
          sectionLabels={sectionLabels}
          poolCapped={poolCapped}
          poolEmpty={poolEmpty}
          poolSize={poolSize}
          canStart={canStart}
          onSelectPreset={selectPreset}
          onToggleSection={toggleSection}
          onSelectStack={selectStack}
          onSelectLength={selectLength}
          onStart={handleStart}
          onResume={resume}
          onReset={resetActive}
        />
      )}

      {phase === 'active' && current && (
        <ActiveView
          question={current}
          currentIndex={currentIndex}
          total={questions.length}
          elapsedSec={elapsedSec}
          flipped={flipped}
          busy={busy}
          onFlip={() => setFlipped(true)}
          onAnswer={handleAnswer}
          onSkip={handleSkip}
        />
      )}

      {phase === 'results' && lastResult && (
        <ResultsView
          entry={lastResult.entry}
          questions={lastResult.questions}
          onRetake={retake}
        />
      )}
    </div>
  );
}

interface StartViewProps {
  index: MockInterviewQuestion[] | null;
  loading: boolean;
  error: boolean;
  session: InterviewSession | null;
  presets: InterviewPreset[];
  presetId: string | null;
  sections: string[];
  stack: string;
  length: number;
  sectionPool: Map<string, number>;
  sectionLabels: Map<string, string>;
  poolCapped: boolean;
  poolEmpty: boolean;
  poolSize: number | null;
  canStart: boolean;
  onSelectPreset: (id: string) => void;
  onToggleSection: (id: string) => void;
  onSelectStack: (id: string) => void;
  onSelectLength: (l: number) => void;
  onStart: () => void;
  onResume: () => void;
  onReset: () => void;
}

function StartView({
  index,
  loading,
  error,
  session,
  presets,
  presetId,
  sections,
  stack,
  length,
  sectionPool,
  sectionLabels,
  poolCapped,
  poolEmpty,
  poolSize,
  canStart,
  onSelectPreset,
  onToggleSection,
  onSelectStack,
  onSelectLength,
  onStart,
  onResume,
  onReset,
}: StartViewProps) {
  const customDisabled = presetId !== null;
  const presetsDisabled = sections.length > 0;

  return (
    <>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 font-mono text-3xl font-extrabold uppercase tracking-tight text-text">
          <Microphone size={28} weight="bold" className="text-accent" />
          Мок-интервью
        </h1>
        <p className="mt-2 font-mono text-sm font-bold uppercase tracking-wider text-text-secondary">
          Кросс-раздельный квиз для подготовки к собеседованию
        </p>
      </div>

      {session && (
        <div className="mb-8 border-2 border-border bg-pale-yellow-bg p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-mono text-sm font-extrabold uppercase tracking-tight text-text">
                Незавершённое интервью
              </div>
              <p className="mt-1 font-mono text-xs font-bold uppercase tracking-wider text-text-secondary">
                Отвечено {Object.keys(session.answers).length} из{' '}
                {session.questions.length}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onResume}
                className="border-2 border-border bg-accent px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000000] dark:hover:shadow-[3px_3px_0px_#ffffff] active:translate-x-0 active:translate-y-0 active:shadow-none"
              >
                Продолжить
              </button>
              <button
                type="button"
                onClick={onReset}
                className="border-2 border-border bg-surface-alt px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-text-secondary transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000000] dark:hover:shadow-[3px_3px_0px_#ffffff] active:translate-x-0 active:translate-y-0 active:shadow-none hover:bg-text hover:text-canvas"
              >
                Начать новое
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 border-b-[3px] border-border pb-4">
        <h2 className="font-mono text-lg font-extrabold uppercase tracking-tight text-text">
          Готовые сеты
        </h2>
      </div>

      <div
        className={`grid gap-3 sm:grid-cols-2 ${presetsDisabled ? 'pointer-events-none opacity-40' : ''}`}
      >
        {presets.map((p) => {
          const active = presetId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPreset(p.id)}
              className={`text-left border-2 p-4 transition-all ${
                active
                  ? 'border-accent bg-pale-green-bg'
                  : 'border-border bg-surface card-hover'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-extrabold uppercase tracking-tight text-text">
                  {p.title}
                </span>
                <span className="shrink-0 border border-border px-1.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  {p.count}
                </span>
              </div>
              <p className="mt-1.5 font-mono text-xs font-bold uppercase tracking-wide text-text-secondary">
                {p.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mb-4 mt-10 border-b-[3px] border-border pb-4">
        <h2 className="font-mono text-lg font-extrabold uppercase tracking-tight text-text">
          Свой конфиг
        </h2>
      </div>

      <div className={customDisabled ? 'pointer-events-none opacity-40' : ''}>
        <div className="border-2 border-border bg-surface p-4 sm:p-6">
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-text-secondary">
            Разделы
          </div>
          {loading && (
            <p className="mt-3 font-mono text-xs font-bold uppercase tracking-wider text-text-tertiary">
              Загрузка вопросов…
            </p>
          )}
          {error && (
            <p className="mt-3 font-mono text-xs font-bold uppercase tracking-wider text-pale-red-text">
              Не удалось загрузить вопросы — обновите страницу
            </p>
          )}
          {index && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {ALL_SECTION_IDS.map((id) => {
                const checked = sections.includes(id);
                return (
                  <label
                    key={id}
                    className={`flex cursor-pointer items-center gap-2 border-2 px-3 py-2 transition-colors ${
                      checked
                        ? 'border-accent bg-pale-green-bg'
                        : 'border-border bg-surface-alt hover:bg-surface'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleSection(id)}
                      className="h-4 w-4 accent-[var(--color-accent)]"
                    />
                    <span className="min-w-0 flex-1 font-mono text-xs font-bold uppercase tracking-wide text-text">
                      {sectionLabels.get(id) ?? id}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] font-bold text-text-tertiary">
                      {sectionPool.get(id) ?? 0}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 border-2 border-border bg-surface p-4 sm:p-6">
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-text-secondary">
            Стек
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSelectStack('')}
              className={`border-2 px-4 py-2 font-mono text-sm font-bold uppercase tracking-wider transition-all ${
                stack === ''
                  ? 'border-accent bg-accent text-white'
                  : 'border-border bg-surface-alt text-text-secondary hover:bg-surface'
              }`}
            >
              Любой
            </button>
            {STACK_OPTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectStack(s.id)}
                className={`border-2 px-4 py-2 font-mono text-sm font-bold uppercase tracking-wider transition-all ${
                  stack === s.id
                    ? 'border-accent bg-accent text-white'
                    : 'border-border bg-surface-alt text-text-secondary hover:bg-surface'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 border-2 border-border bg-surface p-4 sm:p-6">
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-text-secondary">
            Длина интервью
          </div>
          <div className="mt-3 flex gap-2">
            {LENGTH_OPTIONS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onSelectLength(l)}
                className={`border-2 px-4 py-2 font-mono text-sm font-bold uppercase tracking-wider transition-all ${
                  length === l
                    ? 'border-accent bg-accent text-white'
                    : 'border-border bg-surface-alt text-text-secondary hover:bg-surface'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {poolCapped && (
        <p className="mt-3 font-mono text-xs font-bold uppercase tracking-wider text-pale-yellow-text">
          В выбранных разделах {poolSize} вопросов — выдано {poolSize}
        </p>
      )}
      {poolEmpty && (
        <p className="mt-3 font-mono text-xs font-bold uppercase tracking-wider text-pale-red-text">
          В выбранных разделах нет вопросов с ответами — выберите другие разделы
        </p>
      )}

      <button
        type="button"
        onClick={onStart}
        disabled={!canStart}
        className="mt-6 flex w-full items-center justify-center gap-2 border-[3px] border-border bg-accent px-6 py-3 font-mono font-bold uppercase tracking-wider text-white transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000000] dark:hover:shadow-[4px_4px_0px_#ffffff] active:translate-x-0 active:translate-y-0 active:shadow-none disabled:pointer-events-none disabled:opacity-40"
      >
        <Microphone size={20} weight="bold" />
        Начать интервью
      </button>
    </>
  );
}

interface ActiveViewProps {
  question: MockInterviewQuestion;
  currentIndex: number;
  total: number;
  elapsedSec: number;
  flipped: boolean;
  busy: boolean;
  onFlip: () => void;
  onAnswer: (status: AnswerStatus) => void;
  onSkip: () => void;
}

function ActiveView({
  question,
  currentIndex,
  total,
  elapsedSec,
  flipped,
  busy,
  onFlip,
  onAnswer,
  onSkip,
}: ActiveViewProps) {
  const progress = (currentIndex / total) * 100;

  return (
    <div className="flex w-full flex-col">
      <div className="mb-4 flex items-center justify-between gap-3 font-mono text-sm font-bold uppercase tracking-wider text-text">
        <span>
          Вопрос {currentIndex + 1} / {total}
        </span>
        <span className="flex items-center gap-1.5 text-text-secondary">
          <Clock size={14} weight="bold" />
          {formatDuration(elapsedSec)}
        </span>
      </div>

      <div className="mb-6 h-1.5 w-full border border-border bg-surface-alt sm:mb-8">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        className="quiz-card relative min-h-[300px] w-full cursor-pointer sm:min-h-[400px]"
        onClick={() => {
          if (!flipped) onFlip();
        }}
      >
        <div
          className={`quiz-card-inner relative h-full min-h-[300px] w-full sm:min-h-[400px] ${flipped ? 'flipped' : ''}`}
        >
          <div className="quiz-card-face flex flex-col overflow-y-auto border-[3px] border-border bg-surface p-6 md:p-12">
            <div className="flex items-start justify-between gap-2">
              <span className="border-2 border-border bg-canvas px-2 py-1 font-mono text-xs font-extrabold uppercase tracking-wider text-accent">
                {question.sectionLabel}
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-text-tertiary">
                Вопрос
              </span>
            </div>
            <div className="my-auto">
              <p className="break-words text-left text-lg font-bold leading-relaxed text-text md:text-xl">
                {renderInlineCode(question.question)}?
              </p>
              {!flipped && (
                <div className="mt-6 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-text-secondary md:mt-10">
                  <Eye size={14} />
                  Нажмите, чтобы увидеть ответ
                </div>
              )}
            </div>
          </div>

          <div className="quiz-card-face quiz-card-back flex flex-col overflow-y-auto border-[3px] border-border bg-surface p-6 md:p-12">
            <div className="my-auto">
              <div className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-accent md:mb-4">
                Ответ
              </div>
              <p className="quiz-answer break-words text-left text-base leading-relaxed text-text-secondary md:text-lg">
                {renderInlineCode(question.answer ?? '')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:mt-8">
        {flipped && (
          <div className="flex w-full gap-3">
            {RATE_STATUSES.map((status) => {
              const meta = STATUS_META[status];
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => onAnswer(status)}
                  disabled={busy}
                  aria-label={meta.label}
                  className={`flex flex-1 flex-col items-center gap-1.5 border-[3px] border-border px-4 py-4 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000000] dark:hover:shadow-[4px_4px_0px_#ffffff] active:translate-x-0 active:translate-y-0 active:shadow-none disabled:pointer-events-none sm:px-6 ${meta.bg} ${meta.hoverBg}`}
                >
                  {meta.icon}
                  <span className={`font-mono text-xs font-bold uppercase tracking-wider ${meta.color}`}>
                    {meta.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <button
          type="button"
          onClick={onSkip}
          disabled={busy}
          className="flex items-center justify-center gap-2 border-2 border-border bg-surface-alt px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-text-secondary transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000000] dark:hover:shadow-[4px_4px_0px_#ffffff] active:translate-x-0 active:translate-y-0 active:shadow-none disabled:pointer-events-none hover:bg-text hover:text-canvas"
        >
          <PauseCircle size={18} weight="fill" />
          Пропустить
        </button>
      </div>
    </div>
  );
}

interface ResultsViewProps {
  entry: InterviewHistoryEntry;
  questions: MockInterviewQuestion[];
  onRetake: () => void;
}

function ResultsView({ entry, questions, onRetake }: ResultsViewProps) {
  const counts = entry.counts;

  const rows = useMemo(() => {
    const bySection = new Map<
      string,
      { section: string; label: string; url: string }
    >();
    for (const q of questions) {
      if (!bySection.has(q.section)) {
        bySection.set(q.section, {
          section: q.section,
          label: q.sectionLabel,
          url: withBase(`/${q.section}`),
        });
      }
    }
    const ratio = (c: Record<AnswerStatus, number>) => {
      const answered = c.good + c.unsure + c.failed;
      return answered === 0 ? Infinity : c.good / answered;
    };
    const total = (c: Record<AnswerStatus, number>) =>
      c.good + c.unsure + c.failed + c.skipped;
    return [...bySection.values()]
      .map((row) => ({
        ...row,
        counts: entry.perSection[row.section] ?? {
          good: 0,
          unsure: 0,
          failed: 0,
          skipped: 0,
        },
      }))
      .sort((a, b) => ratio(a.counts) - ratio(b.counts) || total(b.counts) - total(a.counts));
  }, [entry, questions]);

  const weakest = useMemo(() => {
    let best: (typeof rows)[number] | null = null;
    for (const row of rows) {
      const answered = row.counts.good + row.counts.unsure + row.counts.failed;
      if (answered === 0) continue;
      if (!best) {
        best = row;
        continue;
      }
      const prevAnswered =
        best.counts.good + best.counts.unsure + best.counts.failed;
      if (row.counts.good / answered < best.counts.good / prevAnswered) {
        best = row;
      }
    }
    return best;
  }, [rows]);

  return (
    <>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 font-mono text-3xl font-extrabold uppercase tracking-tight text-text">
          <Microphone size={28} weight="bold" className="text-accent" />
          Результат интервью
        </h1>
        <p className="mt-2 font-mono text-sm font-bold uppercase tracking-wider text-text-secondary">
          {formatDate(entry.startedAt)} · {formatDuration(entry.durationSec)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {STATUSES.map((status) => {
          const meta = STATUS_META[status];
          return (
            <div
              key={status}
              className={`flex flex-col items-center gap-1 border-2 border-border p-3 ${meta.bg}`}
            >
              {meta.icon}
              <span className={`font-mono text-2xl font-extrabold ${meta.color}`}>
                {counts[status]}
              </span>
              <span className={`font-mono text-xs font-bold uppercase tracking-wider ${meta.color}`}>
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-8 border-[3px] border-border bg-surface">
        <div className="border-b-[3px] border-border p-4 sm:p-6">
          <h2 className="font-mono text-sm font-extrabold uppercase tracking-tight text-text">
            Результаты по разделам
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-border font-mono text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
                <th className="px-4 py-2 sm:px-6">Раздел</th>
                {STATUSES.map((s) => (
                  <th key={s} className="px-3 py-2 text-center">
                    {STATUS_META[s].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.section}
                  className="border-b-2 border-border last:border-b-0"
                >
                  <td className="px-4 py-2 sm:px-6">
                    <a
                      href={row.url}
                      className="font-mono text-xs font-extrabold uppercase tracking-wide text-accent hover:text-accent-hover"
                    >
                      {row.label}
                    </a>
                  </td>
                  {STATUSES.map((s) => (
                    <td
                      key={s}
                      className={`px-3 py-2 text-center font-mono text-sm font-bold ${
                        row.counts[s] > 0 ? 'text-text' : 'text-text-tertiary'
                      }`}
                    >
                      {row.counts[s]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {weakest && (
        <div className="mt-8 border-2 border-border bg-pale-red-bg p-4 sm:p-6">
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-pale-red-text">
            Самая слабая тема
          </div>
          <div className="mt-2 flex items-center gap-2">
            <a
              href={weakest.url}
              className="font-mono text-lg font-extrabold uppercase tracking-tight text-text hover:text-accent"
            >
              {weakest.label}
            </a>
            <ArrowRight size={18} weight="bold" className="text-pale-red-text" />
          </div>
        </div>
      )}

      <div className="mt-8 border-2 border-border bg-surface p-4 sm:p-6">
        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-text-secondary">
          <Clock size={14} weight="bold" />
          Время интервью
        </div>
        <div className="mt-2 font-mono text-xl font-extrabold text-text">
          {formatDuration(entry.durationSec)}
        </div>
        <div className="mt-1 font-mono text-xs font-bold uppercase tracking-wider text-text-tertiary">
          Старт: {formatDate(entry.startedAt)}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRetake}
          className="flex flex-1 items-center justify-center gap-2 border-[3px] border-border bg-accent px-6 py-3 font-mono font-bold uppercase tracking-wider text-white transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000000] dark:hover:shadow-[4px_4px_0px_#ffffff] active:translate-x-0 active:translate-y-0 active:shadow-none"
        >
          <ArrowCounterClockwise size={20} weight="bold" />
          Перепройти
        </button>
        <a
          href={withBase('/')}
          className="flex flex-1 items-center justify-center gap-2 border-[3px] border-border bg-surface px-6 py-3 font-mono font-bold uppercase tracking-wider text-text transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000000] dark:hover:shadow-[4px_4px_0px_#ffffff] active:translate-x-0 active:translate-y-0 active:shadow-none"
        >
          <House size={20} weight="bold" />
          На главную
        </a>
      </div>
    </>
  );
}