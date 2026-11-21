import type {
  AnswerStatus,
  InterviewHistoryEntry,
  InterviewSession,
} from './types';

const ACTIVE_KEY = 'prepra:interview:active';
const HISTORY_KEY = 'prepra:interview:history';
const HISTORY_CAP = 20;

export const EMPTY_COUNTS: Record<AnswerStatus, number> = {
  good: 0,
  unsure: 0,
  failed: 0,
};

const ANSWER_STATUSES = new Set<AnswerStatus>(Object.keys(EMPTY_COUNTS) as AnswerStatus[]);

function isAnswerStatus(value: unknown): value is AnswerStatus {
  return typeof value === 'string' && ANSWER_STATUSES.has(value as AnswerStatus);
}

export function countAnswers(
  answers: Record<number, AnswerStatus>,
): Record<AnswerStatus, number> {
  const counts = { ...EMPTY_COUNTS };
  for (const status of Object.values(answers)) {
    // Старые сохранения могут содержать пропущенные вопросы — в статистику они не входят.
    if (isAnswerStatus(status)) counts[status]++;
  }
  return counts;
}

export function loadActiveSession(): InterviewSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as InterviewSession;
    if (data.version !== 1) return null;
    const answers: Record<number, AnswerStatus> = {};
    for (const [index, status] of Object.entries(data.answers ?? {})) {
      // Ответы старого формата «пропущено» больше не считаются ответом.
      if (isAnswerStatus(status)) answers[Number(index)] = status;
    }
    return { ...data, answers };
  } catch {
    return null;
  }
}

export function saveActiveSession(session: InterviewSession): void {
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(session));
}

export function clearActiveSession(): void {
  localStorage.removeItem(ACTIVE_KEY);
}

function normalizeCounts(raw: unknown): Record<AnswerStatus, number> {
  const counts = { ...EMPTY_COUNTS };
  if (!raw || typeof raw !== 'object') return counts;
  const source = raw as Record<string, unknown>;
  for (const status of ANSWER_STATUSES) {
    const value = source[status];
    if (typeof value === 'number' && Number.isFinite(value)) {
      counts[status] = value;
    }
  }
  return counts;
}

export function loadHistory(): InterviewHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as InterviewHistoryEntry[];
    if (!Array.isArray(data)) return [];
    return data
      .filter((entry) => entry && entry.version === 1)
      .map((entry) => ({
        ...entry,
        counts: normalizeCounts(entry.counts),
        perSection: Object.fromEntries(
          Object.entries(entry.perSection ?? {}).map(([section, counts]) => [
            section,
            normalizeCounts(counts),
          ]),
        ),
      }));
  } catch {
    return [];
  }
}

export function appendHistory(entry: InterviewHistoryEntry): void {
  const history = loadHistory();
  history.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_CAP)));
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}