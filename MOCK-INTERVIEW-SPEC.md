# Техзадание: Мок-интервью

Статус: согласовано (сессия grill-me)
Связано: `ROADMAP.md` Phase 5.1, `SEARCH-SPEC.md` (паттерн build-time JSON-индекса)

## Контекст

- Статический сайт Astro 5 (`output: 'static'`, `base: '/prepra'`), хостинг — GitHub Pages.
- Контент — markdown в `docs/`, 15 разделов, 174 статьи, ~2400 вопросов. Схема `site/src/content/config.ts` поддерживает `questions` и `answers` (массивы строк).
- 153 статьи имеют и вопросы, и ответы. **6 статей без ответов — весь раздел AI** (50 вопросов). Раздел в разработке, в мок-интервью не участвует, но должен подключаться автоматически, когда у статей появятся ответы.
- Существующий `QuizOverlay.tsx` — постатейный квиз: флип-карточка, самооценка (`good`/`unsure`/`failed`/`skipped`), попытка сохраняется в `prepra:quiz:{articleId}`. Классы флип-карточки `.quiz-card*` уже есть в `global.css`.
- На главной (`Hero.astro:26-31`) — кнопка-заглушка «Пройти мок-интервью» с `href="#"`.
- Бэкенда нет, env-переменных нет. Всё работает на клиенте + build-time данные.

## Решение

Мок-интервью — **кросс-раздельный квиз** по UX/UI повторяющий `QuizOverlay`, но с конфигурируемым пулом вопросов из разных разделов. Отдельная страница `/interview` с тремя фазами: **конфигурация → интервью → агрегированный результат**. Без жёсткого таймера (только видимые «часы хода» интервью). Сессия переживает перезагрузку страницы.

## Принятые решения (сессия grill-me)

| Вопрос | Решение |
|--------|---------|
| Формат | Расширение постатейного квиза, но по нескольким разделам сразу |
| Таймер | Нет обратного отсчёта. Только констатация: «интервью идёт 15:32» |
| Где живёт | Отдельная страница `/interview` |
| Архитектура данных | Build-time JSON-индекс (паттерн `search-index.json.ts`) + ленивый фетч на клиенте |
| Пресеты | Правила `{ sections, count }`, а не материализованные сеты; вопросы выбираются на клиенте из индекса |
| Распределение | Пропорционально размеру пула раздела, с капом по доступному и добором из остатка; финальный шаффл — каждое интервью отличается |
| Вопросы без ответа | Исключаются при выборке (фильтр `answer !== null`); в индексе остаются — AI подключится сам, когда заполнят ответы |
| Сохранение | Отдельный namespace `prepra:interview:*`. Связки с постатейными квизами нет |
| Resume | Хранится весь выбранный сет вопросов в localStorage — восстановление без повторного фетча |
| Пропуск вопроса | Есть, считается отдельно |
| Бейдж раздела | Показывается на карточке вопроса (контекст) и в результатах |
| Результат | Только агрегат: счётчики, таблица по разделам, слабая тема, время, «перепройти» |
| Точка входа | Сайдбар (отличный от пунктов меню стиль) + кнопка в Hero |

## Требования

### 1. Build-time индекс `site/src/pages/mock-interview-index.json.ts`

Endpoint (паттерн `search-index.json.ts`) генерирует из content collections массив объектов:

```ts
type MockInterviewQuestion = {
  id: string;            // `${section}/${articleSlug}/${questionIndex}`
  section: string;       // id раздела
  sectionLabel: string;  // «JavaScript», «React»…
  articleSlug: string;
  articleTitle: string;
  url: string;           // withBase(`/${section}/${slug}`)
  order: number;         // порядок статьи в разделе (tie-break)
  stacks: string[];      // стеки статьи; [] — нейтральная
  question: string;
  answer: string | null; // null, если для вопроса нет ответа
};
```

- Пары строятся по индексу: `questions[i]` ↔ `answers[i]`.
- `answer: null`, когда `answers` отсутствуют/короче `questions`.
- **Все** вопросы попадают в индекс, включая безответные — чтобы AI подключился автоматически, когда в `docs/ai/*` появятся ответы.

### 1.1 Стеки

Чтобы вопросы рамки не смешивались между фреймворками, у статьи есть измерение **стек** (`stacks` в frontmatter, массив; `[]` — нейтральная).

- Нейтральные статьи (`stacks: []`) подходят любому стеку.
- Фреймворк-разделы не размечаются вручную — стек выводится из раздела: `react → ["react"]`, `vue → ["vue"]`, `nextjs → ["nextjs","react"]`, `nuxt → ["nuxt","vue"]` (фреймворки наследуют базу).
- Смешанные разделы размечаются явно: `state-management`, `api-communication`, `build-and-deployment`, `security`, `testing`, `performance`, `architecture`, `typescript` (в нём есть статьи `react`/`vue`).
- Индекс берёт `data.stacks`, иначе — инференс по разделу, иначе `[]`.

### 2. Пресеты `site/src/lib/mock-interview/presets.ts`

Чистые правила, без данных:

```ts
type InterviewPreset = {
  id: string;
  title: string;
  description: string;
  sections: string[]; // id разделов
  stacks?: string[];  // рамка стека; отсутствует — любой
  count: number;
};
```

Стартовый набор:

| id | title | sections | stacks | count |
|----|-------|----------|--------|-------|
| `react-stack` | React-стек | react, typescript, state-management | `["react"]` | 20 |
| `js-core` | Основы JavaScript | javascript, typescript, html-css | — | 30 |
| `security` | Безопасность | security, api-communication | — | 15 |
| `vue` | Vue-стек | vue, nuxt, typescript, state-management | `["vue","nuxt"]` | 20 |
| `next` | Next.js full-stack | nextjs, api-communication, build-and-deployment, security | `["nextjs"]` | 20 |
| `full-frontend` | Полный фронтенд | все 15 разделов | — | 50 |

Примечание: `js-core`, `security`, `senior`, `basics`, `testing`, `ai`, `full-frontend` стек не задают — вопросы рамки не смешивают, а осознанно берут весь раздел.

### 3. Алгоритм выборки `site/src/lib/mock-interview/selection.ts`

- Вход: индекс, выбранные разделы, опциональный стек, запрошенное количество.
- Фильтр пула: `selectedSections.contains(q.section) && q.answer !== null && inStacks(q, stacks)`, где `inStacks` = «стек не задан ИЛИ статья нейтральная ИЛИ `q.stacks` пересекается с `stacks`».
- Пропорциональное распределение: доля раздела = `round(count * qtySection / qtyTotal)`.
- Внутри раздела — выборка без повторений (шаффл + срез). Если раздел даёт меньше доли — берём всё, нехватку добором по кругу в разделы с запасом.
- Если `count` > доступного пула → кап на весь пул, показать заметку «в выбранных разделах N вопросов — выдано N».
- Если пул пуст (например, выбран только AI) → блокировка старта с пояснением.
- Финальный шаффл (Fisher–Yates) объединённого списка — каждое интервью отличается от предыдущего.

### 4. Хранилище `site/src/lib/mock-interview/storage.ts`

Ключи localStorage:

- `prepra:interview:active` — незавершённая сессия:
  ```ts
  type InterviewSession = {
    version: 1;
    config: { presetId: string | null; sections: string[]; stacks?: string[]; count: number };
    questions: MockInterviewQuestion[]; // весь выбранный сет, фиксированный порядок
    answers: Record<number, 'good' | 'unsure' | 'failed' | 'skipped'>;
    currentIndex: number;
    startedAt: number;        // epoch ms
  };
  ```
- `prepra:interview:history` — массив завершённых (кап 20):
  ```ts
  type InterviewHistoryEntry = {
    version: 1;
    config: InterviewSession['config'];
    counts: Record<'good' | 'unsure' | 'failed' | 'skipped', number>;
    perSection: Record<string, Record<'good' | 'unsure' | 'failed' | 'skipped', number>>;
    startedAt: number;
    completedAt: number;
    durationSec: number;
  };
  ```

Правила:
- Запись в `active` — **write-through** после каждого действия (оценка/пропуск/переход). Размер сета 20–50 вопросов ≈ 10–15KB — допустимо для localStorage.
- Возобновление **не требует** повторного фетча индекса: сет уже в `active.questions`.
- Завершение → `active` перемещается в `history`, `active` очищается.
- Сет вопросов не дедуплицируется между попытками (шаффл уже даёт отличие).

### 5. Страница `site/src/pages/interview.astro`

- `BaseLayout`, title «Мок-интервью».
- React-остров `<MockInterview client:only="react" />` — без SSR-пропсов, всё состояние (localStorage, фетч индекса) на клиенте.
- Индекс фетчится лениво при первом входе в фазу конфигурации, кэшируется в памяти страницы (в localStorage индекс **не** хранится).
- Фазы: `start` (конфигурация) → `active` (интервью) → `results` (агрегат).

#### Фаза `start` (конфигурация)

- Если есть `active`-сессия — баннер поверх: «Незавершённое интервью: отвечено N из M» + кнопки **Продолжить** / **Начать новое** (сброс).
- **Пресеты**: карточки (title, description, «N вопросов») — клик выделяет пресет.
- **Кастомный конфиг**: multiselect разделов (чекбоксы, метка + количество вопросов в разделе из индекса) + выбор стека (пилюли **Любой / React / Vue / Next.js / Nuxt**, влияет на счётчики разделов и пул) + выбор длины интервью (пилюли **20 / 30 / 50**).
- Кнопка «Начать интервью»: валидация (≥1 раздел, длина > 0, пул не пуст) → выборка → создание `active` → фаза `active`.
- Выбор пресета и кастомный конфиг взаимоисключающие: старт пресета фиксирует его `presetId`, кастом — `presetId: null`.

#### Фаза `active` (интервью)

- Верхняя панель: «Вопрос X / M», **часы хода** `mm:ss` (или `h:mm:ss`) от `startedAt`, обновление раз в секунду.
- **Бейдж раздела** на лицевой стороне карточки (контекст вопроса).
- Флип-карточка — переиспользовать классы `.quiz-card*` из `global.css`.
- После переворота — самооценка **Отлично / Так себе / Плохо** (палео-цвета из `STATUS_META` в `QuizOverlay`).
- Кнопка **Пропустить** доступна и до, и после переворота; пропуск → `skipped`, переход дальше без оценки.
- После оценки/пропуска — авто-переход к следующему. На 50-м — фаза `results`.
- Каждый переход пишется в `active` (resume безопасен при закрытии вкладки).

#### Фаза `results` (агрегат)

Без списка вопросов. Сверху вниз:

1. Счётчики по статусам (как в `ResultsView` у `QuizOverlay`).
2. **Таблица по разделам**: строки = разделы, столбцы = good/unsure/failed/skipped, сортировка по худшему соотношению. Ссылка на страницу раздела.
3. **Самая слабая тема**: раздел с худшим `good / (good+unsure+failed)` → метка + ссылка на раздел.
4. Время интервью (`mm:ss` + дата старта).
5. Кнопки: **Перепройти** (тот же конфиг, новый шаффл → `active`) и **На главную**.

Запись в `history` и очистка `active` происходят при переходе в `results`.

## Дизайн-код проекта

Все компоненты обязаны соблюдать дизайн-код Prepra (нео-брутализм, как в `SEARCH-SPEC.md`):

- **Цвета** — только токены Tailwind (`canvas`, `surface`, `surface-alt`, `border`, `text`, `accent`, `pale-*`) и CSS-переменные. Обе темы через класс `.dark`.
- **Стиль** — рамки `border-2 border-border` / `border-[3px]`, скругления `rounded-none`, hover-эффекты в духе `.card-hover` (сдвиг + жёсткая тень), без мягких теней.
- **Шрифты** — `font-sans` (JetBrains Mono), заголовки uppercase, `font-weight: 800`.
- **Иконки** — Phosphor (`@phosphor-icons/react`): микрофон/беседа для входа, `ArrowRight`, `Clock`, `X` и т.п.
- **Паттерны** — флип-карточка из `QuizOverlay.tsx`, кнопки из `ui/Button.tsx`, стиль бейджа раздела из `DailyQuestion.astro`.
- **Адаптивность** — mobile-first, фулл-скрин на мобильных, центрированная колонка (`max-w-2xl`/`max-w-3xl`) на десктопе.

## Точки входа

1. **Hero.astro** — заменить `href="#"` на `withBase("/interview")`. Стиль кнопки не меняется.
2. **Sidebar.astro** — отдельный элемент вверху сайдбара, визуально отличный от пунктов разделов: рамка `border-2 border-accent`, фон `bg-pale-*`, иконка, `mb-4`. Ссылка `withBase("/interview")`.

## Файлы

- `site/src/pages/interview.astro` — новая страница.
- `site/src/pages/mock-interview-index.json.ts` — build-time индекс (паттерн `search-index.json.ts`).
- `site/src/lib/mock-interview/types.ts` — типы (`MockInterviewQuestion`, `InterviewSession`, `InterviewHistoryEntry`, `InterviewPreset`).
- `site/src/lib/mock-interview/presets.ts` — пресеты-правила.
- `site/src/lib/mock-interview/selection.ts` — пропорциональная выборка + шаффл.
- `site/src/lib/mock-interview/storage.ts` — localStorage (active/history), версионирование.
- `site/src/components/interview/MockInterview.tsx` — React-остров: фазы start/active/results.
- `site/src/components/layout/Sidebar.astro` — правка: отличный от меню вход.
- `site/src/components/content/Hero.astro` — правка: `href`.

## Проверка

- `npm run build` собирается без ошибок TypeScript/схемы контента; `mock-interview-index.json` присутствует в `dist/`.
- Пресет «React-стек» даёт 20 вопросов только из react/typescript/state-management и не содержит статей `pinia`/`vuex`; «Vue-стек» не содержит `redux`/`zustand`/`tanstack-query`; «Next.js full-stack» не содержит `nuxt-deployment`/`security/vue`/`security/react`; «Полный фронтенд» — 50 из 15 разделов.
- Кастом: 3 раздела × 50 → пропорции по пулам; запрос больше пула → кап + заметка; только AI → блокировка старта; выбранный стек уменьшает пул и счётчики разделов.
- Два запуска одного пресета дают разный порядок/состав.
- Перезагрузка страницы на 49/50 → «Продолжить» восстанавливает интервью без повторного фетча.
- Пропуск считается в `skipped` и в таблице по разделам.
- Результат: счётчики, таблица по разделам, слабая тема, время, «Перепройти» работает.
- Часы хода идут от старта и сохраняются при resume.
- Sidebar-вход визуально отличается от пунктов разделов; кнопка Hero ведёт на `/interview`.
- После заполнения ответов в `docs/ai/*` вопросы AI появляются в мок-интервью без изменений кода.