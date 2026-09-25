import {
  ArrowsClockwise,
  ClipboardText,
  Eye,
  PauseCircle,
  SmileyMeh,
  ThumbsDown,
  ThumbsUp,
  X
} from '@phosphor-icons/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

type AnswerStatus = 'good' | 'unsure' | 'failed' | 'skipped';

interface QuizAttempt {
  timestamp: number;
  answers: Record<number, AnswerStatus>;
}

interface QuizData {
  version: 1;
  lastAttempt: QuizAttempt;
}

interface QuizOverlayProps {
  questions: string[];
  articleId: string;
}

const ANSWER_TEMPLATES = [
  (q: string) => `${q.replace(/\?$/, '')}? Это ключевой концепт, который требует понимания базовых принципов. На практике это проявляется через конкретные паттерны использования и помогает решать типовые задачи.`,
  (q: string) => `Ответ кроется в понимании внутренней реализации. Если разобраться в механизме работы, становится очевидно, почему это поведение является стандартным и как его использовать эффективно.`,
  (q: string) => `Это один из фундаментальных вопросов, который часто встречается на собеседованиях. Понимание темы позволяет принимать обоснованные архитектурные решения и избегать типичных ошибок.`,
  (q: string) => `Суть сводится к нескольким ключевым принципам. На практике важно не только знать теорию, но и уметь применять её в реальных проектах, учитывая компромиссы и ограничения.`,
  (q: string) => `Ответ требует понимания контекста использования. В разных ситуациях подход может отличаться, но базовые принципы остаются неизменными и служат основой для принятия решений.`,
];

function getDefaultAnswer(question: string, index: number): string {
  return ANSWER_TEMPLATES[index % ANSWER_TEMPLATES.length](question);
}

function storageKey(articleId: string): string {
  return `prepra:quiz:${articleId}`;
}

function loadQuizData(articleId: string): QuizData | null {
  try {
    const raw = localStorage.getItem(storageKey(articleId));
    if (!raw) return null;
    return JSON.parse(raw) as QuizData;
  } catch {
    return null;
  }
}

function saveQuizData(articleId: string, data: QuizData): void {
  localStorage.setItem(storageKey(articleId), JSON.stringify(data));
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) return 'только что';
  if (seconds < 60) return `${seconds} сек. назад`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const mod = minutes % 10;
    if (mod === 1 && minutes !== 11) return `${minutes} минуту назад`;
    if ([2, 3, 4].includes(mod) && ![12, 13, 14].includes(minutes)) return `${minutes} минуты назад`;
    return `${minutes} минут назад`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const mod = hours % 10;
    if (mod === 1 && hours !== 11) return `${hours} час назад`;
    if ([2, 3, 4].includes(mod) && ![12, 13, 14].includes(hours)) return `${hours} часа назад`;
    return `${hours} часов назад`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    const mod = days % 10;
    if (mod === 1 && days !== 11) return `${days} день назад`;
    if ([2, 3, 4].includes(mod) && ![12, 13, 14].includes(days)) return `${days} дня назад`;
    return `${days} дней назад`;
  }
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} нед. назад`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} мес. назад`;
  return new Date(timestamp).toLocaleDateString('ru-RU');
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type Phase = 'idle' | 'results' | 'quiz';

const STATUS_META: Record<AnswerStatus, { label: string; icon: React.ReactNode; bg: string; border: string; color: string }> = {
  good: {
    label: 'Ответил хорошо',
    icon: <ThumbsUp size={24} weight="bold" />,
    bg: 'bg-pale-green-bg',
    border: 'border-pale-green-text',
    color: 'text-pale-green-text',
  },
  unsure: {
    label: 'Ответил неуверенно',
    icon: <SmileyMeh size={24} weight="bold" />,
    bg: 'bg-pale-yellow-bg',
    border: 'border-pale-yellow-text',
    color: 'text-pale-yellow-text',
  },
  failed: {
    label: 'Не смог ответить',
    icon: <ThumbsDown size={24} weight="bold" />,
    bg: 'bg-pale-red-bg',
    border: 'border-pale-red-text',
    color: 'text-pale-red-text',
  },
  skipped: {
    label: 'Пропущено',
    icon: <PauseCircle size={24} weight="fill" />,
    bg: 'bg-surface-alt',
    border: 'border-border',
    color: 'text-text-secondary',
  },
};

export function QuizOverlay({ questions, articleId }: QuizOverlayProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answers, setAnswers] = useState<Record<number, AnswerStatus>>({});
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  const [savingStatus, setSavingStatus] = useState<number | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = loadQuizData(articleId);
    if (data?.lastAttempt) {
      setLastAttempt(data.lastAttempt);
    }
  }, [articleId]);

  const startQuiz = useCallback(() => {
    setAnswers({});
    setCurrentIndex(0);
    setFlipped(false);
    setPhase('quiz');
  }, []);

  const closeOverlay = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setPhase('idle');
      setIsClosing(false);
    }, 300);
  }, []);

  const handleAnswer = useCallback((status: AnswerStatus) => {
    const newAnswers = { ...answers, [currentIndex]: status };
    setAnswers(newAnswers);
    setSavingStatus(currentIndex);

    setTimeout(() => {
      setSavingStatus(null);
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setFlipped(false);
      } else {
        const attempt: QuizAttempt = { timestamp: Date.now(), answers: newAnswers };
        saveQuizData(articleId, { version: 1, lastAttempt: attempt });
        setLastAttempt(attempt);
        setPhase('results');
      }
    }, 400);
  }, [answers, currentIndex, questions.length, articleId]);

  const handleClose = useCallback(() => {
    if (phase === 'quiz') {
      const finalAnswers = { ...answers };
      for (let i = 0; i < questions.length; i++) {
        if (!(i in finalAnswers)) {
          finalAnswers[i] = 'skipped';
        }
      }
      const attempt: QuizAttempt = { timestamp: Date.now(), answers: finalAnswers };
      saveQuizData(articleId, { version: 1, lastAttempt: attempt });
      setLastAttempt(attempt);
    }
    closeOverlay();
  }, [phase, answers, questions.length, articleId, closeOverlay]);

  useEffect(() => {
    if (phase !== 'idle') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [phase]);

  const hasAttempt = lastAttempt !== null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (hasAttempt) {
            setPhase('results');
          } else {
            startQuiz();
          }
        }}
        className="w-full flex items-center justify-center border-[3px] border-border bg-surface px-6 py-3 font-mono font-bold uppercase tracking-wider text-text-secondary transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000000] dark:hover:shadow-[4px_4px_0px_#ffffff] active:translate-x-0 active:translate-y-0 active:shadow-none"
      >
        <span className="flex items-center gap-2">
          {hasAttempt ? <ArrowsClockwise size={20} weight="bold" /> : <ClipboardText size={20} weight="bold" />}
          {hasAttempt ? 'Перепройти тест' : 'Пройти тест'}
        </span>
      </button>

      {phase !== 'idle' && (
        <div
          ref={overlayRef}
          className={`fixed inset-0 z-50 overflow-x-hidden overflow-y-auto transition-opacity duration-300 bg-black/70 backdrop-blur-sm ${isClosing ? 'opacity-0' : 'opacity-100'}`}
          role="dialog"
          aria-modal="true"
        >

          <div className="absolute inset-x-4 w-full top-12 md:inset-x-auto md:left-1/2 md:right-auto md:-translate-x-1/2 md:max-w-2xl bottom-12 md:bottom-20">
            {phase === 'results' && lastAttempt && (
              <ResultsView
                questions={questions}
                attempt={lastAttempt}
                onRetake={startQuiz}
                onClose={closeOverlay}
              />
            )}

            {phase === 'quiz' && (
              <QuizView
                questions={questions}
                currentIndex={currentIndex}
                flipped={flipped}
                savingStatus={savingStatus}
                onFlip={() => setFlipped(true)}
                onAnswer={handleAnswer}
                onClose={handleClose}
                total={questions.length}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

interface ResultsViewProps {
  questions: string[];
  attempt: QuizAttempt;
  onRetake: () => void;
  onClose: () => void;
}

function ResultsView({ questions, attempt, onRetake, onClose }: ResultsViewProps) {
  const counts = { good: 0, unsure: 0, failed: 0, skipped: 0 };
  Object.values(attempt.answers).forEach(s => { counts[s]++; });

  const total = questions.length;
  const answered = total - counts.skipped;

  return (
    <div className="w-full border-[3px] border-border bg-surface">
      <div className="flex items-start justify-between border-b-[3px] border-border p-6 md:p-8">
        <div>
          <h2 className="font-mono text-xl font-extrabold uppercase tracking-tight text-text">
            Результат теста
          </h2>
          <p className="mt-1 font-mono text-sm text-text-secondary">
            {formatDate(attempt.timestamp)} · {timeAgo(attempt.timestamp)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center border-2 border-border bg-surface-alt text-text-secondary transition-all hover:bg-text hover:text-canvas"
          aria-label="Закрыть"
        >
          <X size={18} weight="bold" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 p-6 md:grid-cols-4 md:p-8">
        <div className="flex flex-col items-center gap-1 border-2 border-border bg-pale-green-bg p-3">
          <ThumbsUp size={22} weight="bold" className="text-pale-green-text" />
          <span className="font-mono text-2xl font-extrabold text-pale-green-text">{counts.good}</span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-pale-green-text">Отлично</span>
        </div>
        <div className="flex flex-col items-center gap-1 border-2 border-border bg-pale-yellow-bg p-3">
          <SmileyMeh size={22} weight="bold" className="text-pale-yellow-text" />
          <span className="font-mono text-2xl font-extrabold text-pale-yellow-text">{counts.unsure}</span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-pale-yellow-text">Неуверенно</span>
        </div>
        <div className="flex flex-col items-center gap-1 border-2 border-border bg-pale-red-bg p-3">
          <ThumbsDown size={22} weight="bold" className="text-pale-red-text" />
          <span className="font-mono text-2xl font-extrabold text-pale-red-text">{counts.failed}</span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-pale-red-text">Плохо</span>
        </div>
        <div className="flex flex-col items-center gap-1 border-2 border-border bg-surface-alt p-3">
          <PauseCircle size={22} weight="fill" className="text-text-secondary" />
          <span className="font-mono text-2xl font-extrabold text-text-secondary">{counts.skipped}</span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-text-secondary">Пропущено</span>
        </div>
      </div>

      <div className="px-6 md:px-8">
        <div className="mb-4 font-mono text-xs font-bold uppercase tracking-wider text-text-secondary">
          Ответы по вопросам
        </div>
        <ul className="space-y-2">
          {questions.map((q, i) => {
            const status = attempt.answers[i] || 'skipped';
            const meta = STATUS_META[status];
            return (
              <li
                key={i}
                className={`flex items-start gap-3 border-2 ${meta.border} ${meta.bg} p-3`}
              >
                <span className={`mt-0.5 flex-shrink-0 ${meta.color}`}>{meta.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-text">{q}?</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="p-6 md:p-8">
        <button
          type="button"
          onClick={onRetake}
          className="w-full flex items-center justify-center border-[3px] border-border bg-accent px-6 py-3 font-mono font-bold uppercase tracking-wider text-white transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000000] dark:hover:shadow-[4px_4px_0px_#ffffff] active:translate-x-0 active:translate-y-0 active:shadow-none"
        >
          Перепройти
        </button>
      </div>
    </div>
  );
}

interface QuizViewProps {
  questions: string[];
  currentIndex: number;
  flipped: boolean;
  savingStatus: number | null;
  onFlip: () => void;
  onAnswer: (status: AnswerStatus) => void;
  onClose: () => void;
  total: number;
}

function QuizView({
  questions,
  currentIndex,
  flipped,
  savingStatus,
  onFlip,
  onAnswer,
  onClose,
  total,
}: QuizViewProps) {
  const question = questions[currentIndex];
  const answer = getDefaultAnswer(question, currentIndex);
  const progress = ((currentIndex) / total) * 100;

  return (
    <div className="w-full flex flex-col">
      <div className="mb-4 flex items-center justify-between font-mono text-sm font-bold uppercase tracking-wider text-white">
        <span>Вопрос {currentIndex + 1} / {total}</span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center border-2 border-white/30 bg-white/10 text-white transition-all hover:bg-white/20"
          aria-label="Закрыть"
        >
          <X size={18} weight="bold" />
        </button>
      </div>

      <div className="mb-8 h-1.5 w-full border border-border bg-surface-alt">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        className="quiz-card relative w-full cursor-pointer"
        style={{ minHeight: '400px' }}
        onClick={() => { if (!flipped) onFlip(); }}
      >
        <div className={`quiz-card-inner relative h-full w-full ${flipped ? 'flipped' : ''}`}
          style={{ minHeight: '400px' }}
        >
          <div className="quiz-card-face flex flex-col justify-center border-[3px] border-border bg-surface p-8 md:p-12"
            style={{ minHeight: '400px' }}
          >
            <div className="mb-6 font-mono text-xs font-bold uppercase tracking-wider text-text-secondary">
              Вопрос
            </div>
            <p className="text-left text-lg font-medium leading-relaxed text-text md:text-xl">
              {question}?
            </p>
            {!flipped && (
              <div className="mt-10 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-text-secondary">
                <Eye size={14} />
                Нажмите, чтобы увидеть ответ
              </div>
            )}
          </div>

          <div className="quiz-card-face quiz-card-back flex flex-col justify-center border-[3px] border-border bg-surface p-8 md:p-12"
            style={{ minHeight: '400px' }}
          >
            <div className="mb-4 font-mono text-xs font-bold uppercase tracking-wider text-accent">
              Ответ
            </div>
            <p className="text-left text-base leading-relaxed text-text-secondary md:text-lg">
              {answer}
            </p>
          </div>
        </div>
      </div>

      {flipped && (
        <div className={`mt-8 flex flex-col items-center gap-4 transition-all duration-300 ${savingStatus === currentIndex ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
          <div className="font-mono text-sm font-bold uppercase tracking-wider text-white">
            Оцени свой ответ
          </div>
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={() => onAnswer('good')}
              disabled={savingStatus === currentIndex}
              className="quiz-rate-btn flex flex-1 flex-col items-center gap-1.5 border-[3px] border-border bg-pale-green-bg px-6 py-4 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000000] hover:bg-pale-green-bg-hover dark:hover:shadow-[4px_4px_0px_#ffffff] active:translate-x-0 active:translate-y-0 active:shadow-none disabled:pointer-events-none"
              aria-label="Ответил уверенно"
            >
              <ThumbsUp size={24} weight="bold" className="text-pale-green-text" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-pale-green-text">Отлично</span>
            </button>
            <button
              type="button"
              onClick={() => onAnswer('unsure')}
              disabled={savingStatus === currentIndex}
              className="quiz-rate-btn flex flex-1 flex-col items-center gap-1.5 border-[3px] border-border bg-pale-yellow-bg px-6 py-4 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000000] hover:bg-pale-yellow-bg-hover dark:hover:shadow-[4px_4px_0px_#ffffff] active:translate-x-0 active:translate-y-0 active:shadow-none disabled:pointer-events-none"
              aria-label="Ответил неуверенно"
            >
              <SmileyMeh size={24} weight="bold" className="text-pale-yellow-text" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-pale-yellow-text">Так себе</span>
            </button>
            <button
              type="button"
              onClick={() => onAnswer('failed')}
              disabled={savingStatus === currentIndex}
              className="quiz-rate-btn flex flex-1 flex-col items-center gap-1.5 border-[3px] border-border bg-pale-red-bg px-6 py-4 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000000] hover:bg-pale-red-bg-hover dark:hover:shadow-[4px_4px_0px_#ffffff] active:translate-x-0 active:translate-y-0 active:shadow-none disabled:pointer-events-none"
              aria-label="Не смог ответить"
            >
              <ThumbsDown size={24} weight="bold" className="text-pale-red-text" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-pale-red-text">Плохо</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
