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
  skipped: 0,
};

export function countAnswers(
  answers: Record<number, AnswerStatus>,
): Record<AnswerStatus, number> {
  const counts = { ...EMPTY_COUNTS };
  for (const status of Object.values(answers)) {
    counts[status]++;
  }
  return counts;
}

export function loadActiveSession(): InterviewSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as InterviewSession;
    if (data.version !== 1) return null;
    return data;
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

export function loadHistory(): InterviewHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as InterviewHistoryEntry[];
    return Array.isArray(data) ? data.filter((e) => e.version === 1) : [];
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