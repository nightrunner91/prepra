---
name: generate-answers
description: Generates quiz answers for articles of a docs/ section. Takes a section and fills the answers frontmatter field for every article that has questions but no answers. Use to fill answers for a whole section or a single article.
---

# Protocol: Generate Quiz Answers

## 1. Purpose

Generate interview answers for the `questions` in each article's frontmatter and
store them in `answers`. The site renders them in the quiz overlay when a card is
flipped. Answer language matches the article (Russian).

## 2. Invocation

```
/generate-answers <section>
/generate-answers <section> --force   # regenerate even if answers exist
/generate-answers <section>/<slug>    # a single article
```

Valid sections: `javascript`, `typescript`, `html-css`, `react`, `vue`, `nuxt`,
`nextjs`, `testing`, `performance`, `architecture`, `state-management`,
`api-communication`, `build-and-deployment`, `security`, `ai`

## 3. Algorithm

### Step 1. Find the articles

Glob all `.md` files in `docs/<section>/`, excluding `README.md` and `GUIDE.md`.
For a `<section>/<slug>` argument, process only `docs/<section>/<slug>.md`.

### Step 2. Per article, one at a time

1. Read the file in full.
2. Check the frontmatter:
   - no `questions` or an empty array → print `skip (no questions): <filename>`
     and continue;
   - `answers` already filled and no `--force` → print
     `skip (answers exist): <filename>` and continue.
3. Read the body (everything after the second `---`).
4. Write one answer per question.
5. Save `answers` into the frontmatter with Edit.
6. Print `done: <filename> (N answers)`.

### Step 3. Answer rules

**Format**
- Language: the article's language (Russian).
- Length: 1–2 sentences.
- Tone: concrete, no filler, as a senior developer explains it in an interview.
- Source: only what the article says, no outside knowledge.
- Shape: the mechanism, plus a practical consequence or nuance.

**Include**
- A precise, compact definition or description of how it works.
- Where relevant, the key distinction or pitfall that separates a good answer
  from a mediocre one.

**Avoid**
- Restating the question in other words.
- Stock phrases: «важный концепт», «ключевой принцип», «на практике это помогает».
- Naming the effect instead of explaining the mechanism.
- Abstraction with no specifics.
- More than two sentences.

**Examples** (answers below are Russian, matching the articles)

Question: `Что такое замыкание и как оно работает под капотом`

Good: Замыкание — функция, сохраняющая ссылку на Lexical Environment внешней
функции: движок не удаляет этот объект, пока на него ссылается замыкание,
поэтому внутренняя функция читает и изменяет переменные внешней даже после её
завершения.

Bad: Замыкание — важный концепт JavaScript, который помогает писать лучший код.

Question: `Как runtime CSS-in-JS генерирует стили и почему это создаёт проблемы с RSC, performance и CSP`

Good: Styled-components при рендере вставляет CSS-правило через DOM-манипуляцию
в `<style>` в `<head>` — RSC без клиентского JS не могут этого делать, каждый
уникальный набор props раздувает `<style>`, а CSP без `'unsafe-inline'`
блокирует вставку.

Bad: Runtime CSS-in-JS динамически создаёт стили в браузере, что влияет на
производительность и создаёт проблемы с безопасностью.

### Step 4. Write the answers

Use Edit for a targeted change.

**Placement:** insert the `answers:` block right after `questions:`. If `answers:`
already exists, replace it.

**YAML format**

```yaml
answers:
  - "Ответ на первый вопрос..."
  - "Ответ на второй вопрос..."
```

**Escaping:** inside double quotes escape `"` as `\"` and `\` as `\\`.

**Do not** touch other frontmatter fields, change the article body, or write a
number of answers that differs from the number of questions.

### Step 5. Report

After the whole section:

```
=== generate-answers: <section> ===
done:    N articles
skipped: N articles (answers exist / no questions)
errors:  N articles

Files with errors:
  - <filename>: <reason>
```

## 4. Quality control

After writing each article, verify:
1. The number of answers equals the number of questions. If not, it is an error:
   do not write.
2. No answer is an empty string.
3. No answer contains the stock phrases from `ANSWER_TEMPLATES` in
   `QuizOverlay.tsx` — they mark generic text.

## 5. Constraints

- Work only with files in `docs/<section>/`.
- Change nothing except the `answers` frontmatter field.
- Skip `README.md` and `GUIDE.md`.
- Do not add information the article does not contain.
- If one article fails, continue with the rest.
