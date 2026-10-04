export const TRANSLIT_DICT: Record<string, string> = {
  react: "реакт",
  hook: "хук",
  hooks: "хуки",
  js: "джаваскрипт",
  javascript: "джаваскрипт",
  ts: "тайпскрипт",
  typescript: "тайпскрипт",
  component: "компонент",
  components: "компоненты",
  state: "стейт",
  "state-management": "стейт-менеджмент",
  test: "тест",
  tests: "тесты",
  testing: "тестирование",
  router: "роутер",
  next: "некст",
  nextjs: "некст",
  vue: "вью",
  nuxt: "нукс",
  prop: "проп",
  props: "пропсы",
  event: "событие",
  events: "события",
  array: "массив",
  object: "объект",
  function: "функция",
  functions: "функции",
  promise: "промис",
  async: "асинхрон",
  render: "рендер",
  rendering: "рендеринг",
  server: "сервер",
  client: "клиент",
  bundle: "бандл",
  cache: "кэш",
  fetch: "фетч",
  query: "запрос",
  error: "ошибка",
  errors: "ошибки",
  security: "безопасность",
  performance: "производительность",
  architecture: "архитектура",
  "http": "эйчтитипи",
  dom: "дом",
  ui: "интерфейс",
  css: "цсс",
  html: "эйчтиэмэль",
};

const CYR_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

export function cyrToLatin(term: string): string {
  let out = "";
  for (const ch of term.toLowerCase()) {
    out += CYR_TO_LATIN[ch] ?? ch;
  }
  return out;
}

export function expandTerm(term: string): string[] {
  const variants = new Set<string>([term]);

  const dictValue = TRANSLIT_DICT[term];
  if (dictValue) variants.add(dictValue);

  if (/[а-яё]/.test(term)) {
    const latin = cyrToLatin(term);
    if (latin) variants.add(latin);
    for (const [latinKey, cyrValue] of Object.entries(TRANSLIT_DICT)) {
      if (cyrValue === term) variants.add(latinKey);
    }
  }

  if (term.includes("-")) {
    for (const part of term.split("-")) {
      if (part) variants.add(part);
    }
  }

  return [...variants];
}