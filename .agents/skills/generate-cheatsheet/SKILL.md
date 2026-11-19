---
name: generate-cheatsheet
description: Generates a one-page anchor cheat sheet for a docs/ section interview prep. Reads the README and every article of the section, then writes docs/<section>/CHEATSHEET.md with terms and anchors only, no sentences. It renders on the section page and prints on one A4 sheet. Use to create or refresh a section cheat sheet.
---

# Protocol: Generate Section Cheatsheet

## 1. Purpose

A cheat sheet is a beacon for the interviewee. One glance and the structure of
the topic comes back; the term acts as an anchor to talk from. It is **not a
summary**: no sentences, no theses, no explanations, only compressed terms and
concepts, grouped so they can carry a coherent story.

`docs/<section>/CHEATSHEET.md` is rendered as a block under the article list on
the section page (`site/src/components/content/Cheatsheet.astro`) and printed on
click. Content language: Russian, matching the articles.

Reference file for format and style: `docs/javascript/CHEATSHEET.md`. Read it
before generating. It sits at the size limit; the limits in §6 are stricter.

## 2. Invocation

```
/generate-cheatsheet <section>
/generate-cheatsheet <section> --force   # overwrite an existing cheat sheet
```

Valid sections: `javascript`, `typescript`, `html-css`, `react`, `vue`, `nuxt`,
`nextjs`, `testing`, `performance`, `architecture`, `state-management`,
`api-communication`, `build-and-deployment`, `security`, `ai`

If `docs/<section>/CHEATSHEET.md` exists and `--force` is not passed, print
`skip (cheatsheet exists): <section>` and stop.

## 3. Algorithm

### Step 1. Gather material

1. Read the reference `docs/javascript/CHEATSHEET.md`.
2. Read `docs/<section>/README.md`: its article order and grouping set the
   skeleton.
3. For **every** article in the section (all `.md` except `README.md`, `GUIDE.md`,
   `CHEATSHEET.md`):
   - frontmatter: `title`, `tags`, `questions` — what is actually asked;
   - `##` / `###` headings — the structure of the topic;
   - the "Ключевые тезисы для интервью" section — the main anchors;
   - the body, only where a term needs pinning down.

Base everything on the section's own articles. Do not add topics the section does
not cover.

### Step 2. Extract anchors

Write 2–5 anchors per article: terms, mechanisms, comparisons, classic traps —
whatever an answer to a `questions` entry starts from. Drop intros, history and
"why you need this" parts.

**A cheat sheet is not an index of articles.** The goal is not coverage but what
matters most. Keep a candidate only if the main question of the topic cannot be
answered without it:
- ✅ mechanisms and comparisons (`useState vs ref`, `ISR vs SWR`), execution
  order, classic traps;
- ❌ API catalogs (every helper, hook or config option): 2–4 most common, drop
  the rest;
- ❌ package and module names, CLI commands, generated file paths, rare options;
- ❌ anything repeated in another group — keep it in one place.

If you hesitate whether an anchor is needed, it is not.

### Step 3. Group

- 5–7 `##` groups. Names are 1–4 words, by meaning, not by article titles.
- Group order follows the README logic, basics to advanced.
- Related articles may share one group; a large article may span several lines.
- 2–8 lines per group.

### Step 4. Write the lines

Each line is one item: `- **Term:** anchor, anchor, anchor`.

## 4. File format

```markdown
# Шпаргалка: <Название раздела>

## <Группа>

- **<Термин>:** <якорь>, <якорь> (<микросноска>), <якорь>
- **<Термин>:** <якорь> / <якорь> → <якорь>

## <Группа>

- ...
```

The parser (`site/src/lib/section-cheatsheet.ts`) understands only:
- `# ...` — file title (not rendered on the site);
- `## ...` — group;
- `- **Term:** text` — item;
- inside text: `` `code` `` and `**bold**`.

Anything else (nested lists, tables, links, paragraphs, `###`) will not render.

## 5. Content rules

### Hard bans

- No sentences and no finite verbs. Not «Promise имеет три состояния» but
  `pending → fulfilled / rejected`.
- No evaluation or filler: «важно», «ключевой», «основной», «позволяет»,
  «используется для».
- No explanatory definitions after the colon. After `**Term:**` come anchors, not
  a gloss of the term.
- No code examples longer than a single expression.

### Notation

| Symbol | Meaning | Example |
|---|---|---|
| `,` | list of anchors | `map, filter, reduce` |
| `/` | alternatives, pairs | `call / apply / bind` |
| `→` | order, transition, result | `sync → микрозадачи → render` |
| `vs` | contrast | `ESM vs CJS` |
| `·` | subtopic shift within a line | `7 примитивов · всё остальное — object` |
| `( )` | micro-note | `var (func, ⬆ undefined)` |
| `⬆` | hoisting | `let и const ({}, ⬆ TDZ)` |

### Micro-notes

A bracket note is 1–4 words that disambiguate the anchor; omit it when the term is
clear on its own:
- ✅ `all (fail-fast), any (первый успешный, AggregateError)`
- ✅ `debounce (после паузы), throttle (раз в N мс)`
- ❌ `all (возвращает промис, который резолвится когда все промисы выполнены)` —
  that is a sentence.

Do not annotate everything. Target: notes on a third of the lines or fewer.

### Code

Backticks hold literal syntax only: `` `Symbol.iterator` ``, `` `#private` ``,
`` `0.1 + 0.2` ``, `` `useEffect` ``. Concept names (Event Loop, tree shaking,
hydration) stay plain text.

### Language

Terms as they are spoken in an interview: English for APIs and established
concepts (stale closure, tree shaking, hydration), Russian for general words
(утечки, приватные данные, порядок). Do not translate settled anglicisms.

## 6. Size

The cheat sheet **must** print on **one A4 sheet**. Print layout
(`Cheatsheet.astro`): 10 mm margins, 9 pt, two columns of ~91 mm → ~50 characters
per column line, ~110 printed lines per page including group headings. An item up
to 100 characters takes 2 printed lines, 100–150 already 3, so long items cost
the most.

Hard limits (counted over `- **…` lines, markup included):
- **≤ 3800 characters total** — the main limit;
- 30–40 items;
- each item **≤ 100 characters**, ~90 on average;
- 5–7 groups.

If it does not fit, drop secondary anchors and whole items first (see "not an
index of articles"), then merge groups. Never compress the text into
unreadability.

## 7. Examples

**Good** ✅

```markdown
- **Переменные:** var (func, ⬆ undefined), let и const ({}, ⬆ TDZ)
- **Event Loop:** call stack, Web API, macrotask (setTimeout, I/O), microtask (then, queueMicrotask), rAF
- **Порядок:** sync → все микрозадачи → render → одна макрозадача
- **SOLID:** Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
```

**Bad** ❌

```markdown
- **Переменные:** var имеет функциональную область видимости и всплывает со значением undefined
- **Event Loop** — механизм, который позволяет JS выполнять асинхронный код в одном потоке
- **Важно:** не блокировать Event Loop тяжёлыми вычислениями
- **Promise:** pending (ожидание), fulfilled (выполнен), rejected (отклонён), then (обработка), catch (ошибка)
```

Problems: sentences, definitions instead of anchors, an "Important" line, notes
that gloss every anchor.

## 8. Quality control

After writing the file, verify:
1. Every article of the section is covered by at least one line (compare with the
   file list).
2. Every line starts with `- **` and contains `:**`.
3. No sentences: lines do not end with a period, no finite verbs.
4. Size within the §6 limits, checked by script, not by eye:
   ```bash
   f=docs/<section>/CHEATSHEET.md
   echo "groups=$(grep -c '^## ' $f) lines=$(grep -c '^- ' $f) chars=$(grep '^- ' $f | tr -d '\n' | wc -m)"
   awk '/^- / && length>100 {print length": "$0}' $f   # items over the limit
   ```
   Any overrun means trim and check again.
5. `cd site && npm run build` passes.

## 9. Report

```
=== generate-cheatsheet: <section> ===
file:     docs/<section>/CHEATSHEET.md
groups:   N
lines:    N
chars:    N / 3800
articles: N/N covered
build:    ok | failed (<reason>)
```

## 10. Constraints

- Create or modify only `docs/<section>/CHEATSHEET.md`.
- Do not touch articles, READMEs or site code.
- Do not add topics the section's articles do not cover.
