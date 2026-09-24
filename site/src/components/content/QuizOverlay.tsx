import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Brain,
  X,
  ThumbsUp,
  Smiley,
  ThumbsDown,
  CheckCircle,
  MinusCircle,
  XCircle,
  PauseCircle,
  ArrowRight,
  Eye,
} from '@phosphor-icons/react';

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
      setPhase('results');
    }
  }, [articleId]);

  const startQuiz = useCallback(() => {
    setAnswers({});
    setCurrentIndex(0);
    setFlipped(false);
    setPhase('quiz');
  }, []);

  const finishQuiz = useCallback((finalAnswers: Record<number, AnswerStatus>) => {
    const attempt: QuizAttempt = {
      timestamp: Date.now(),
      answers: finalAnswers,
    };
    saveQuizData(articleId, { version: 1, lastAttempt: attempt });
    setLastAttempt(attempt);
    setIsClosing(true);
    setTimeout(() => {
      setPhase('idle');
      setIsClosing(false);
    }, 300);
  }, [articleId]);

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
        finishQuiz(newAnswers);
      }
    }, 400);
  }, [answers, currentIndex, questions.length, finishQuiz]);

  const handleClose = useCallback(() => {
    if (phase !== 'quiz') {
      setPhase('idle');
      return;
    }
    const finalAnswers = { ...answers };
    for (let i = 0; i < questions.length; i++) {
      if (!(i in finalAnswers)) {
        finalAnswers[i] = 'skipped';
      }
    }
    finishQuiz(finalAnswers);
  }, [phase, answers, questions.length, finishQuiz]);

  useEffect(() => {
    if (phase !== 'quiz') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, handleClose]);

  useEffect(() => {
    if (phase === 'quiz') {
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
        className="mb-3 w-full flex items-center justify-center gap-2 border-[3px] border-border bg-surface px-6 py-3 font-mono font-bold uppercase tracking-wider text-text-secondary transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000000] dark:hover:shadow-[4px_4px_0px_#ffffff] active:translate-x-0 active:translate-y-0 active:shadow-none"
      >
        <Brain size={20} weight="bold" />
        {hasAttempt ? 'Перепройти тест' : 'Пройти тест'}
      </button>

      {phase !== 'idle' && (
        <div
          ref={overlayRef}
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          <div className="relative z-10 flex w-full max-w-2xl flex-col items-center">
            {phase === 'results' && lastAttempt && (
              <ResultsView
                questions={questions}
                attempt={lastAttempt}
                onRetake={startQuiz}
                onClose={handleClose}
              />
            )}

            {phase === 'quiz' && (
              <QuizView
                questions={questions}
                currentIndex={currentIndex}
                flipped={flipped}
                answers={answers}
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
  const statusIcon = (status: AnswerStatus) => {
    switch (status) {
      case 'good':
        return <CheckCircle size={20} weight="fill" className="text-pale-green-text" />;
      case 'unsure':
        return <MinusCircle size={20} weight="fill" className="text-pale-yellow-text" />;
      case 'failed':
        return <XCircle size={20} weight="fill" className="text-pale-red-text" />;
      case 'skipped':
        return <PauseCircle size={20} weight="fill" className="text-text-tertiary" />;
    }
  };

  const statusBg = (status: AnswerStatus) => {
    switch (status) {
      case 'good': return 'bg-pale-green-bg';
      case 'unsure': return 'bg-pale-yellow-bg';
      case 'failed': return 'bg-pale-red-bg';
      case 'skipped': return 'bg-surface-alt';
    }
  };

  const counts = {
    good: 0, unsure: 0, failed: 0, skipped: 0,
  };
  Object.values(attempt.answers).forEach(s => { counts[s]++; });

  return (
    <div className="w-full max-w-xl border-[3px] border-border bg-surface p-8 md:p-10">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="font-mono text-xl font-extrabold uppercase tracking-tight text-text">
            Результат теста
          </h2>
          <p className="mt-1 font-mono text-xs text-text-tertiary">
            {formatDate(attempt.timestamp)} · {timeAgo(attempt.timestamp)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center border-2 border-border bg-surface-alt text-text-secondary transition-all hover:bg-text hover:text-canvas"
          aria-label="Закрыть"
        >
          <X size={16} weight="bold" />
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3 font-mono text-xs font-bold uppercase tracking-wider">
        <span className="flex items-center gap-1.5 text-pale-green-text">
          <CheckCircle size={14} weight="fill" /> {counts.good}
        </span>
        <span className="flex items-center gap-1.5 text-pale-yellow-text">
          <MinusCircle size={14} weight="fill" /> {counts.unsure}
        </span>
        <span className="flex items-center gap-1.5 text-pale-red-text">
          <XCircle size={14} weight="fill" /> {counts.failed}
        </span>
        {counts.skipped > 0 && (
          <span className="flex items-center gap-1.5 text-text-tertiary">
            <PauseCircle size={14} weight="fill" /> {counts.skipped}
          </span>
        )}
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {questions.map((_, i) => {
          const status = attempt.answers[i] || 'skipped';
          return (
            <div
              key={i}
              className={`flex h-10 w-10 items-center justify-center border-2 border-border font-mono text-xs font-bold ${statusBg(status)}`}
              title={questions[i]}
            >
              {statusIcon(status)}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onRetake}
        className="w-full flex items-center justify-center gap-2 border-[3px] border-border bg-accent px-6 py-3 font-mono font-bold uppercase tracking-wider text-white transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000000] dark:hover:shadow-[4px_4px_0px_#ffffff] active:translate-x-0 active:translate-y-0 active:shadow-none"
      >
        <Brain size={18} weight="bold" />
        Перепройти
      </button>
    </div>
  );
}

interface QuizViewProps {
  questions: string[];
  currentIndex: number;
  flipped: boolean;
  answers: Record<number, AnswerStatus>;
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
    <div className="w-full max-w-xl flex flex-col">
      <div className="mb-4 flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wider text-text-secondary">
        <span>Вопрос {currentIndex + 1} / {total}</span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center border-2 border-border bg-surface-alt text-text-secondary transition-all hover:bg-text hover:text-canvas"
          aria-label="Закрыть"
        >
          <X size={16} weight="bold" />
        </button>
      </div>

      <div className="mb-6 h-1 w-full border border-border bg-surface-alt">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        className="quiz-card relative w-full cursor-pointer"
        style={{ minHeight: '320px' }}
        onClick={() => { if (!flipped) onFlip(); }}
      >
        <div className={`quiz-card-inner relative h-full w-full ${flipped ? 'flipped' : ''}`}
          style={{ minHeight: '320px' }}
        >
          <div className="quiz-card-face flex flex-col items-center justify-center border-[3px] border-border bg-surface p-8 md:p-10"
            style={{ minHeight: '320px' }}
          >
            <div className="mb-6 font-mono text-xs font-bold uppercase tracking-wider text-text-tertiary">
              Вопрос
            </div>
            <p className="text-center text-lg font-medium leading-relaxed text-text md:text-xl">
              {question}?
            </p>
            {!flipped && (
              <div className="mt-8 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-text-tertiary">
                <Eye size={14} />
                Нажмите, чтобы увидеть ответ
              </div>
            )}
          </div>

          <div className="quiz-card-face quiz-card-back flex flex-col items-center justify-center border-[3px] border-border bg-surface p-8 md:p-10"
            style={{ minHeight: '320px' }}
          >
            <div className="mb-4 font-mono text-xs font-bold uppercase tracking-wider text-accent">
              Ответ
            </div>
            <p className="text-center text-base leading-relaxed text-text-secondary md:text-lg">
              {answer}
            </p>
          </div>
        </div>
      </div>

      {flipped && (
        <div className={`mt-6 flex flex-col items-center gap-3 transition-all duration-300 ${savingStatus === currentIndex ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-text-tertiary">
            Как вы ответили?
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onAnswer('good')}
              disabled={savingStatus === currentIndex}
              className="quiz-rate-btn group flex flex-col items-center gap-1.5 border-[3px] border-border bg-pale-green-bg px-5 py-3 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000000] hover:bg-pale-green-bg-hover active:translate-x-0 active:translate-y-0 active:shadow-none disabled:pointer-events-none"
              aria-label="Ответил хорошо"
            >
              <ThumbsUp size={22} weight="bold" className="text-pale-green-text transition-transform group-hover:scale-110" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-pale-green-text">Хорошо</span>
            </button>
            <button
              type="button"
              onClick={() => onAnswer('unsure')}
              disabled={savingStatus === currentIndex}
              className="quiz-rate-btn group flex flex-col items-center gap-1.5 border-[3px] border-border bg-pale-yellow-bg px-5 py-3 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000000] hover:bg-pale-yellow-bg-hover active:translate-x-0 active:translate-y-0 active:shadow-none disabled:pointer-events-none"
              aria-label="Ответил неуверенно"
            >
              <Smiley size={22} weight="bold" className="text-pale-yellow-text transition-transform group-hover:scale-110" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-pale-yellow-text">Так себе</span>
            </button>
            <button
              type="button"
              onClick={() => onAnswer('failed')}
              disabled={savingStatus === currentIndex}
              className="quiz-rate-btn group flex flex-col items-center gap-1.5 border-[3px] border-border bg-pale-red-bg px-5 py-3 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000000] hover:bg-pale-red-bg-hover active:translate-x-0 active:translate-y-0 active:shadow-none disabled:pointer-events-none"
              aria-label="Не смог ответить"
            >
              <ThumbsDown size={22} weight="bold" className="text-pale-red-text transition-transform group-hover:scale-110" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-pale-red-text">Не знаю</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
