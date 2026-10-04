export type AnswerStatus = 'good' | 'unsure' | 'failed' | 'skipped';

export type MockInterviewQuestion = {
  id: string;
  section: string;
  sectionLabel: string;
  articleSlug: string;
  articleTitle: string;
  url: string;
  order: number;
  question: string;
  answer: string | null;
};

export type InterviewPreset = {
  id: string;
  title: string;
  description: string;
  sections: string[];
  count: number;
};

export type InterviewConfig = {
  presetId: string | null;
  sections: string[];
  count: number;
};

export type InterviewSession = {
  version: 1;
  config: InterviewConfig;
  questions: MockInterviewQuestion[];
  answers: Record<number, AnswerStatus>;
  currentIndex: number;
  startedAt: number;
};

export type InterviewHistoryEntry = {
  version: 1;
  config: InterviewConfig;
  counts: Record<AnswerStatus, number>;
  perSection: Record<string, Record<AnswerStatus, number>>;
  startedAt: number;
  completedAt: number;
  durationSec: number;
};