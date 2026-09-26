# Руководство по написанию раздела `docs/vue/`

Этот файл — единая точка отсчёта для агента, который пишет статьи раздела Vue. Перед созданием новой статьи прочти его полностью.

---

## 1. Цель и аудитория

**Цель:** создать в `docs/vue/` полноценный учебный раздел по Vue 3, который по структуре, стилю и глубине соответствует `docs/react/`, но адаптирован под специфику Vue.

**Аудитория:** фронтенд-разработчики, готовящиеся к собеседованиям. Базовое знание JavaScript/TypeScript и общее понимание фронтенд-фреймворков предполагается.

---

## 2. Общие принципы

- **Основной API:** Composition API + `<script setup>`.
- **Options API:** позиционируется как legacy, но необходим для чтения чужого кода и миграций.
- **Сравнение с React:** добавлять в каждой статье, где есть прямой аналог. Не превращать статью в сравнение — оно должно помогать понять, а не отвлекать.
- **Код:** примеры на Vue SFC (`*.vue`) и TypeScript (`*.ts`) там, где это важно.
- **Единый тон:** как в `docs/react/` — объяснять «почему», а не только «как».

---

## 3. Структура каждой статьи

Каждая статья должна содержать:

1. **Frontmatter** (см. раздел 4).
2. **Введение** — 2–4 абзаца: что разбирается и зачем нужно.
3. **Содержание** — список разделов с якорями.
4. **Основные разделы** — теория + примеры кода + таблицы.
5. **Лучшие практики / антипаттерны** — если уместно.
6. **Ключевые тезисы для интервью** — 5–10 пунктов.
7. **Заключение** — краткий итог.
8. **Полезные ссылки** — официальная документация и проверенные источники.

---

## 4. Frontmatter

Обязательный формат:

```yaml
---
title: "Название статьи"
section: vue
description: "Краткое описание для SEO и чеклиста."
order: N
tags: ["vue", "composition-api", "..."]
questions:
  - "Вопрос для самопроверки 1"
  - "Вопрос для самопроверки 2"
---
```

Требования:
- `order` — уникальное число в пределах раздела, определяет порядок в README.
- `tags` — релевантные ключевые слова без пробелов.
- `questions` — 5–8 вопросов, на которые читатель должен уметь ответить после прочтения.

---

## 5. Именование файлов

- `kebab-case`.
- Префикс `vue-` для всех статей раздела.
- Исключение — `README.md`.

Примеры: `vue-fundamentals.md`, `vue-reactivity.md`, `vue-router.md`.

---

## 6. Список статей

### Группа 1 — Начни с базы

| order | Файл | title | Описание | Целевой объём |
|---|---|---|---|---|
| 1 | `vue-fundamentals.md` | Основы Vue 3 | SFC, шаблоны, директивы (`v-if`, `v-for`, `v-bind`, `v-on`, `v-model`), компоненты, `props`, `emits`, условный рендеринг, списки, создание проекта через Vite. | 900–1200 строк |
| 2 | `vue-reactivity.md` | Реактивность Vue | `ref`, `reactive`, `computed`, `watch`/`watchEffect`, `toRef`/`toRefs`, `readonly`, `shallowRef`/`shallowReactive`, реактивность коллекций, Proxy под капотом. | 900–1200 строк |
| 3 | `vue-composition-api.md` | Composition API и `<script setup>` | `setup()`, `<script setup>`, composables, `provide`/`inject`, правила организации кода. | 800–1000 строк |
| 4 | `vue-router.md` | Vue Router | Маршрутизация, guards, lazy loading, `useRoute`/`useRouter`, динамические маршруты. | 700–900 строк |
| 5 | `vue-lifecycle.md` | Жизненный цикл компонента | `onMounted`, `onUpdated`, `onUnmounted` и др., Options API lifecycle hooks, render → patch, сравнение с `useEffect`/`useLayoutEffect`. | 700–900 строк |
| 6 | `vue-events.md` | События во Vue | `v-on`, модификаторы, компонентные события (`emits`), нативные события, `v-model` как сахар для пропса + события. | 600–800 строк |

### Группа 2 — Углубись в детали

| order | Файл | title | Описание | Целевой объём |
|---|---|---|---|---|
| 7 | `vue-components-slots.md` | Компоненты, слоты и композиция | default/named/scoped slots, `render()`/`h()`, `<component :is>`, `keep-alive`, `<teleport>`. | 700–900 строк |
| 8 | `vue-performance.md` | Оптимизация производительности | `computed`, `v-memo`, `defineAsyncComponent`, `shallowRef`, lazy hydration, сравнение с `React.memo`/`useMemo`/`useCallback`. | 700–900 строк |
| 9 | `vue-suspense.md` | Suspense и async setup | `<Suspense>`, async `setup()`, fallback, вложенные границы, связь с обработкой ошибок. | 600–800 строк |
| 10 | `vue-error-handling.md` | Обработка ошибок | `app.config.errorHandler`, `onErrorCaptured`, error boundary pattern, SSR-ошибки. | 500–700 строк |
| 11 | `vue-transitions.md` | Transition и TransitionGroup | `<Transition>`, `<TransitionGroup>`, CSS/JS-хуки, анимация списков, performance. | 600–800 строк |

### Группа 3 — Не будет лишним

| order | Файл | title | Описание | Целевой объём |
|---|---|---|---|---|
| 12 | `vue-options-vs-composition.md` | Options API vs Composition API | История, различия, когда что использовать, миграция внутри проекта. | 500–700 строк |
| 13 | `vue-typescript.md` | TypeScript во Vue | Типизация пропсов (`defineProps`), emits (`defineEmits`), composables, `defineModel`, generics в SFC. | 600–800 строк |
| 14 | `vueuse.md` | Экосистема VueUse | Обзор готовых composables, когда стоит использовать, а когда писать свой. | 400–600 строк |
| 15 | `vue-vite.md` | Создание проекта и структура | `npm create vue@latest`, Vite, структура папок, SFC, dev/prod. | 400–600 строк |

---

## 7. Что НЕ дублировать в `docs/vue/`

Эти темы уже покрыты в соседних разделах — в README и статьях на них стоит ссылаться:

- **Pinia / Vuex** → `docs/state-management/pinia.md`, `docs/state-management/vuex.md`
- **Тестирование Vue-компонентов** → `docs/testing/testing-vue-components.md`
- **Тестирование Nuxt** → `docs/testing/testing-nuxt.md`
- **Безопасность Vue/Nuxt** → `docs/security/security-vue-nuxt.md`
- **Nuxt** → будет отдельный раздел `docs/nuxt/`; в `docs/vue/` упоминать только в контексте примеров.

---

## 8. README раздела

После написания статей создать `docs/vue/README.md` по аналогии с `docs/react/README.md`:

- Краткое описание раздела.
- Группы «Начни с базы», «Углубись в детали», «Не будет лишним».
- Ссылки на смежные материалы (Pinia, тестирование, безопасность, Nuxt).

---

## 9. Проверка перед завершением статьи

- [ ] Frontmatter заполнен корректно.
- [ ] `order` не конфликтует с другими статьями.
- [ ] Есть оглавление с якорями.
- [ ] Есть раздел «Ключевые тезисы для интервью».
- [ ] Есть «Заключение» и «Полезные ссылки».
- [ ] Примеры кода рабочие и соответствуют Vue 3.
- [ ] Options API упомянут как legacy, если используется.
- [ ] Сравнение с React добавлено там, где это помогает понять.
