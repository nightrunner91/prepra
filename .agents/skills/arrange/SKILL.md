---
name: arrange
description: Reviews and proposes a logical order for the articles of a docs/ section, simple to advanced. Use when checking or fixing the order of articles in a section. Takes the section folder name in docs/.
---

# Protocol: Article Order Arranger

## 1. Purpose

Check and propose a logical order of articles in `docs/<section>/`. The source of
truth is the `order` field in each article's frontmatter: the site renders by it.
The section `README.md` is a derived, human-readable roadmap and must match
`order`.

## 2. Input

`/arrange <section>` — a folder name in `docs/` (`javascript`, `react`, `vue`, ...).
If the folder does not exist, report the error and list the available sections.

## 3. Steps

1. **Collect data.** For every article in `docs/<section>/*.md` (except
   `README.md`) read `order`, `title`, `section` from the frontmatter. Skim the
   `##` headings to grasp the topic and its dependencies.
2. **Read the section `README.md`** if present: it records the current roadmap
   and groupings.
3. **Find problems in the current order:**
   - duplicate `order` values;
   - mismatch between the README order and `order`;
   - jumps: an advanced article placed before the basic one it depends on;
   - inconsistent numbering.
4. **Build the dependency chain**, simple to advanced, so each article rests on
   the previous ones:
   - basics (syntax, types) → mechanisms (scope, closures, `this`) → abstractions
     (prototypes, async) → advanced (metaprogramming, performance);
   - an article that introduces a concept comes before the one that uses it
     (closures before modules / FP; Promise before Event Loop).
5. **Propose the new order** as a numbered list 1..N: `order` — file — title.
   Show the diff against the current order.
6. **Do not apply immediately.** Ask whether to write `order` into every
   frontmatter and update `README.md`.

## 4. Rules

- Change nothing except the frontmatter `order` and the item order in `README.md`.
- `order` values are integers 1..N, with no gaps and no duplicates.
- Do not rename files or touch article content.
- Keep README group headings («Начни с базы», «Углубись в детали»), updating
  only the order of their items.

## 5. Constraints

- Do not read articles in full — frontmatter and headings only.
- Judge ordering logic only, never content quality.
- Without user confirmation: propose only, make no edits.
