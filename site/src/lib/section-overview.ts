import { getCollection } from "astro:content";
import { sections } from "./sections";
import type { SectionMark } from "./section-marks";

const sectionDescriptions: Record<string, string> = {
  javascript: "Основы JavaScript, ES6+, замыкания, прототипы, асинхронность",
  typescript: "Типизация, дженерики, утилитарные типы, декораторы",
  "html-css":
    "Семантика, CSS-методологии, flexbox, grid, доступность",
  react:
    "JSX, хуки, паттерны, состояние, архитектура компонентов",
  nextjs: "Серверные и клиентские компоненты, кэширование, деплой",
  architecture:
    "Паттерны, SOLID, BFF, монорепо и микросервисы",
  "api-communication":
    "REST, GraphQL, WebSocket, HTTP-клиенты, коды ответов",
  "build-and-deployment":
    "Сборка бандлов, CI/CD, контейнеры, деплой и наблюдаемость",
  testing:
    "Unit, интеграционное и E2E тестирование",
  performance: "Метрики, виртуализация, hydration, web workers",
  security: "XSS, CSRF, CSP, аутентификация, HTTP-заголовки",
  ai: "Ментальная модель, паттерны промптинга, агенты, RAG",
  vue: "Vue 3, Composition API, реактивность, Pinia и Nuxt",
  nodejs: "Рантайм, асинхронность, HTTP-API, сервисы",
};

const sectionColors: Record<string, SectionMark> = {
  javascript: "yellow",
  typescript: "blue",
  "html-css": "red",
  react: "cyan",
  nextjs: "neutral",
  architecture: "indigo",
  "api-communication": "violet",
  "build-and-deployment": "slate",
  testing: "lime",
  performance: "orange",
  security: "rose",
  ai: "fuchsia",
  vue: "green",
  nodejs: "teal",
};

export interface SectionStat {
  id: string;
  label: string;
  icon?: (typeof sections)[number]["icon"];
  description: string;
  color: SectionMark;
  articleCount: number;
  questionCount: number;
}

export interface DailyQuestionItem {
  text: string;
  sectionId: string;
  sectionLabel: string;
  articleSlug: string;
}

/** Разделы теории со счётчиками статей и вопросов. Считается на этапе сборки. */
export async function getSectionStats(): Promise<SectionStat[]> {
  return Promise.all(
    sections.map(async (section) => {
      const articles = await getCollection(section.id as any);
      const totalQuestions = articles.reduce(
        (sum, article) => sum + (article.data.questions?.length || 0),
        0,
      );

      return {
        ...section,
        description: sectionDescriptions[section.id] || "",
        color: sectionColors[section.id] || "neutral",
        articleCount: articles.length,
        questionCount: totalQuestions,
      };
    }),
  );
}

export function getTotals(stats: SectionStat[]) {
  return {
    articleCount: stats.reduce((sum, section) => sum + section.articleCount, 0),
    questionCount: stats.reduce(
      (sum, section) => sum + section.questionCount,
      0,
    ),
    sectionCount: stats.length,
  };
}

/** Вопрос дня: стабильно один и тот же в течение суток, без бэкенда. */
export async function getDailyQuestion(
  stats: SectionStat[],
): Promise<DailyQuestionItem | null> {
  const allQuestions: DailyQuestionItem[] = [];

  for (const section of stats) {
    const articles = await getCollection(section.id as any);
    for (const article of articles) {
      for (const question of article.data.questions || []) {
        allQuestions.push({
          text: question,
          sectionId: section.id,
          sectionLabel: section.label,
          articleSlug: article.id,
        });
      }
    }
  }

  if (allQuestions.length === 0) return null;

  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
    (1000 * 60 * 60 * 24),
  );

  return allQuestions[dayOfYear % allQuestions.length];
}
