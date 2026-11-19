---
name: article-editor
description: Brings one docs/ article to the PrePra standard in a single pass, covering both structural normalization (frontmatter, TOC, intro, conclusion, links) and the focus work (key theses, self-check questions and answers). Works on one article at a time; in focus mode it reads only the needed blocks.
---

# Protocol: Article Editor

## 1. Purpose

One pass over one article in `docs/`: bring it to the PrePra standard and focus it
on what matters. This skill replaces the former `article-format` and
`article-focus` protocols and runs in three modes.

**Goal:** the reader finds what they need fast, then leaves remembering 5–7 key
ideas and able to answer 5–8 conceptual questions.

Article prose stays in its original language (Russian articles remain Russian).
Only this protocol is English; heading names in §4 and the examples are literal.

## 2. Modes

| Mode | When | What changes | What to read |
|---|---|---|---|
| `structure` | new article, or the structure fell apart | everything: frontmatter, intro, TOC, sections, theses, conclusion, links | the whole article |
| `focus` | structure is fine, theses/questions are weak | only `## Ключевые тезисы для интервью`, `questions`, `answers` | 4 blocks (§3) |
| `check` | before delivery, no edits | nothing, report against the §10 checklist | as needed |

With no mode given, check structure first (`structure`), then focus (`focus`).
Never mix: in `focus` do not touch `title`, `section`, `order`, `tags`,
`description` or the body.

## 3. Context economy (`focus` mode)

**Do not load the whole article.** Four blocks are enough:

1. **Frontmatter** — the first ~20 lines: `title`, `section`, `questions`.
2. **`## Содержание`** — the section list, to see the shape.
3. **`## Ключевые тезисы для интервью`** — grep the heading, read to the next `##`.
4. **`## Заключение`** — what the author considers essential.

Only if these four blocks leave the key concepts unclear, read individual
sections selectively.

## 4. Canonical article structure

```markdown
---
title: "..."
section: ...
description: "..."
order: N
tags: [...]
questions:
  - "Вопрос 1"
answers:
  - "Ответ на вопрос 1"
---

# Заголовок (совпадает с title)

Вводная: 2–4 предложения.

## Содержание

1. [Секция 1](#секция-1)
2. ...

---

## Секция 1

...

## Практика            <!-- опционально, для разделов с spine-проектом -->

...

## Ключевые тезисы для интервью

- 5–7 тезисов.

## Заключение

3–7 предложений или нумерованный список выводов.

## Полезные ссылки     <!-- опционально -->

- [Название](https://...)
```

`## Практика` is the only allowed extension of the canon. It belongs to the newer
sections (`backend`, `databases`, `practices`, System Design cases) and must
appear in the TOC. Older articles do not have it; do not add it artificially.

## 5. Frontmatter

**`title`** — required, ≤ 6 words, states the essence. Banned: «Глубокое
погружение», «Глубокое понимание», «Руководство для…», one- or two-word titles,
anything over 8 words.

Good: «XSS: анатомия атаки и методы защиты», «useTransition and
useDeferredValue». Bad: «Fiber», «Гидратация — Глубокое погружение», «Next.js как
монолит: прямое обращение к базе данных без отдельного API».

**`description`** — 1–3 sentences, ≤ 160 characters, for meta tags and cards. Not
a TOC, not a link list, never empty. If it is junk, rewrite it from the content.

**`tags`** — 3–6 terms, the first one the main topic. Nouns and established terms
only; hyphens allowed. Banned: splitting a headline into words (`"передача"`,
`"данных"`, `"через"`), stock words (`"глубокое"`, `"погружение"`, `"основы"`),
prepositions and verbs, repeating `section` in every article.

Good: `["usecontext", "createcontext", "context", "prop-drilling", "provider"]`.
Bad: `["usecontext", "передача", "данных", "через", "дерево"]`.

**Plan fields** — `level`, `requires`, `project`, `market`: keep and validate if
present. `level` is 1–5; `requires` must not point to an article of the same or a
higher level. Do not add them to older articles without a separate task.

**`questions`** — 5–8; **`answers`** — exactly as many. Neither may be empty.

## 6. Article body

**H1** — one, identical to `title`.

**Intro** — 2–4 sentences: what the topic is, why it matters, what the reader will
learn. Do not open with «X — это…»; start from context or a problem.

**TOC** — `## Содержание`, a numbered list of anchors for every `##`. Exclude
`###`. Follow the list with `---`.

**Sections** — `##` for the main ones, `###` inside. Each stands on its own. `---`
between major sections is optional.

**Theses** — see §7. **Conclusion** — 3–7 sentences, no new information.
**Useful links** — external MDN pages and specs; if there are none, omit the
section.

## 7. Key theses for the interview

**Count: 5–7, never more.** Eight or more means duplication or items too granular.

Each thesis answers: "If I am asked about X in an interview, what do I say in one
sentence?" A thesis is a complete thought, a core concept, a merge of 2–3 related
facts. It is **not** a retelling of a section, not a description of one method, and
not a fact anyone can google in ten seconds.

Format: a `-` list, 1–2 lines per item, inline `code` allowed. Never open with
«Эта статья…» or «В статье рассматривается…».

**Example: 12 items → 6**

Bad (excerpt):

```markdown
- `useEffect` выполняется после commit phase.
- Массив зависимостей определяет, когда эффект перезапускается.
- `Object.is` используется для сравнения зависимостей.
- Cleanup-функция чистит подписки.
- Cleanup-функция чистит таймеры.
```

Good:

```markdown
- `useEffect` выполняется после commit phase; массив зависимостей через `Object.is` определяет перезапуск. Честные зависимости обязательны — иначе stale closure.
- Cleanup-функция освобождает подписки, таймеры и AbortController перед повторным запуском и при размонтировании.
- Один эффект — одна ответственность; производные данные вычисляйте в рендере, а не в `useEffect`.
```

## 8. Questions and answers

**Count: 5–8 questions, never more.** They test understanding, not recall:

| Bad (fact) | Good (understanding) |
|---|---|
| «Что такое useEffect» | «Как useEffect связан с жизненным циклом и commit phase» |
| «Сколько осей у Flexbox» | «Как алгоритм распределения пространства объясняет поведение flex-grow и flex-shrink» |
| «Что делает Partial<T>» | «Как mapped types позволяют строить utility-типы вроде Partial и Required» |

Patterns: «Как X связан с Y и почему это важно», «Почему X работает именно так»,
«Чем X отличается от Y в контексте Z», «Что произойдёт, если сделать X».

**Coverage, no repetition**
- Questions span **all major sections**, not just one.
- If two questions share one paragraph of answer, merge them.
- Questions **complement** the theses instead of duplicating them: a thesis gives
  the answer, a question checks whether the reader got it.

Bad: thesis «Cleanup чистит подписки и таймеры» plus the question «Зачем нужна
cleanup-функция». Good: «Что произойдёт, если не вызвать cleanup при
размонтировании компонента с подпиской».

**Answers**
- Exactly as many as `questions`; no empty strings.
- 1–2 sentences: the mechanism plus a practical nuance.
- Only from the article, without restating the question or stock phrases.
- Same language as the article; full rules live in the `generate-answers` skill.

The block renders from frontmatter. Never add `## Вопросы для самопроверки` or
`## Ответы` headings to the body.

## 9. Algorithm

### Pass 1 — structure (`structure`)

1. Read the whole article.
2. Check what is missing: intro, TOC, theses, questions with answers, conclusion,
   links, a valid `description`, correct `tags`.
3. Reorder sections correctly, **keeping all content**.
4. Add what is missing, derived from the existing text.
5. Verify TOC anchors against the actual headings.

### Pass 2 — focus (`focus`)

1. Pull the 4 blocks (§3).
2. Theses: count them (>7 means cut), find duplicates, micro-items and section
   retellings; group by topic; reduce to 5–7.
3. Questions: count them (>8 means cut), find repeats, rephrase factual ones,
   check coverage and overlap with the theses; reduce to 5–8.
4. Rewrite `questions` and sync `answers`.

### Pass 3 — check (`check`)

Walk the §10 checklist and report: what was fixed, what remains debatable. If
nothing needs fixing, say so.

## 10. Checklist

- [ ] one H1, identical to `title`
- [ ] `title` ≤ 6 words, no stock phrases
- [ ] `description` meaningful, ≤ 160 characters, not a TOC
- [ ] `tags` 3–6 terms, the first one the main topic
- [ ] intro 2–4 sentences, does not open with «X — это…»
- [ ] `## Содержание` covers every `##`, anchors resolve
- [ ] no duplicate sections, code and examples preserved
- [ ] `## Ключевые тезисы для интервью` holds 5–7 complete thoughts
- [ ] `questions` 5–8, conceptual, covering the whole article
- [ ] `answers` exactly as many, 1–2 sentences, none empty
- [ ] `## Заключение` 3–7 sentences, no new information
- [ ] no "Вопросы для самопроверки" / "Ответы" headings in the body
- [ ] if `## Практика` exists, it is in the TOC
- [ ] `level` / `requires` (if present) are valid
- [ ] relative links point to existing files

## 11. Constraints

- **One article per run.**
- **Never delete content** — only move, merge and extend it.
- **Never change the meaning** when rewriting the intro, conclusion or theses.
- **Never add information** the article did not have, except the intro, conclusion
  and questions/answers derived from the existing text.
- **Keep code, examples, tables and diagrams** untouched.
- **In `focus` mode** leave `title`, `section`, `order`, `tags`, `description` and
  the body alone.
- **Never change the article's language.**

## 12. Example full pass

Before: no TOC, no theses, no questions, no conclusion, junk `description`.

```markdown
---
title: "CSS Flexbox"
section: html-css
order: 3
---
# CSS Flexbox

CSS Flexbox — это модуль CSS для одномерной раскладки.

## Основные свойства
...
```

After:

```markdown
---
title: "Flexbox в глубину: оси, flex-basis, grow/shrink"
section: html-css
order: 3
description: "Как Flexbox распределяет пространство: оси, flex-basis, grow/shrink и выравнивание."
tags: ["flexbox", "flex-basis", "flex-grow", "alignment", "layout"]
questions:
  - "Как `flex-direction` определяет главную ось и что от этого зависит"
  - "Чем `justify-content` отличается от `align-items`"
  - "Как `flex-grow`, `flex-shrink` и `flex-basis` делят свободное пространство"
  - "Почему `margin` не схлопывается в flex-контексте"
  - "Что делает `min-width: auto` у flex-элементов"
answers:
  - "`flex-direction` задаёт главную ось; от неё зависит, что выравнивает `justify-content`, а что `align-items`."
  - "`justify-content` работает по главной оси, `align-items` — по поперечной."
  - "`flex-basis` задаёт базовый размер, `flex-grow` добавляет долю свободного места, `flex-shrink` сжимает при нехватке."
  - "Flex-контекст не создаёт схлопывания margin, поэтому отступы складываются, а не пересекаются."
  - "`min-width: auto` не даёт flex-элементу сжаться меньше содержимого, из-за чего возможен overflow."
---

# Flexbox в глубину: оси, flex-basis, grow/shrink

Flexbox решает задачу одномерной раскладки: элементы выстраиваются по оси и
делят доступное пространство по правилам, которые легко предсказать. Понимание
этих правил объясняет, почему вёрстка «плывёт» при изменении контента.

## Содержание

1. [Основные свойства](#основные-свойства)
2. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
3. [Заключение](#заключение)
4. [Полезные ссылки](#полезные-ссылки)

---

## Основные свойства
...

## Ключевые тезисы для интервью

- Flexbox — одномерная раскладка: главная ось и поперечная.
- `flex-direction` определяет главную ось, а значит и смысл выравнивания.
- `justify-content` работает по главной оси, `align-items` — по поперечной.
- `flex-grow`, `flex-shrink`, `flex-basis` распределяют свободное пространство.
- `margin` в flex-контексте не схлопывается.
- `min-width: auto` у flex-элементов предотвращает сжатие ниже содержимого.

## Заключение

Flexbox закрывает одномерные задачи; для двумерных — Grid. Ключ к предсказуемой
вёрстке — понимание осей и того, как `flex-basis`, `flex-grow` и `flex-shrink`
делят пространство.

## Полезные ссылки

- [A Complete Guide to Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [Flexbox](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox)
```
