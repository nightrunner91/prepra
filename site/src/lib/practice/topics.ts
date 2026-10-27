import type { TopicId, TopicMeta } from "./types";

export const TOPICS: TopicMeta[] = [
  {
    id: "hoisting",
    label: "Hoisting и scope",
    short: "Hoisting",
    description: "var/let/const, TDZ, function declaration, область видимости",
    color: "yellow",
  },
  {
    id: "closures",
    label: "Замыкания",
    short: "Closures",
    description: "Лексическое окружение, фабрики функций, утечки состояния",
    color: "blue",
  },
  {
    id: "this",
    label: "this и контекст",
    short: "this",
    description: "Методы, потеря контекста, bind/call/apply, стрелочные функции",
    color: "red",
  },
  {
    id: "event-loop",
    label: "Event loop",
    short: "Event loop",
    description: "Стек, микро- и макрозадачи, async/await, очередь таймеров",
    color: "green",
  },
  {
    id: "collections",
    label: "Map, Set и объекты",
    short: "Map/Set",
    description: "Ключи, SameValueZero, порядок обхода, WeakMap и WeakSet",
    color: "blue",
  },
  {
    id: "big-o",
    label: "Big O",
    short: "Big O",
    description: "Сложность алгоритмов, скрытые O(n²), память",
    color: "yellow",
  },
  {
    id: "coercion",
    label: "Типы и приведение",
    short: "Coercion",
    description: "== vs ===, ToPrimitive, NaN, falsy-значения, typeof",
    color: "red",
  },
  {
    id: "prototypes",
    label: "Прототипы и классы",
    short: "Prototypes",
    description: "Цепочка прототипов, new, instanceof, class и super",
    color: "neutral",
  },
  {
    id: "async",
    label: "Промисы и async",
    short: "Async",
    description: "Состояния промисов, all/allSettled/race/any, обработка ошибок",
    color: "green",
  },
  {
    id: "functions",
    label: "Функции и массивы",
    short: "Arrays",
    description: "map/filter/reduce, sort, мутации, slice/splice, NaN",
    color: "blue",
  },
];

export const TOPIC_MAP: Record<TopicId, TopicMeta> = TOPICS.reduce(
  (acc, topic) => {
    acc[topic.id] = topic;
    return acc;
  },
  {} as Record<TopicId, TopicMeta>,
);

export const DIFFICULTIES = [
  { id: "junior", label: "Junior" },
  { id: "middle", label: "Middle" },
  { id: "senior", label: "Senior" },
] as const;

export const DIFFICULTY_COLOR: Record<
  "junior" | "middle" | "senior",
  "green" | "yellow" | "red"
> = {
  junior: "green",
  middle: "yellow",
  senior: "red",
};
