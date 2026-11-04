# P0 — Перепаковка (1–2 недели, 0 новых статей)

Цель: привести витрину и структуру в соответствие с рынком 2026, не написав ни
одной новой статьи. После P0 React — главный стек, Vue — второй, `state-management`
и `nuxt` исчезли, разделы переименованы, пресеты мок-интервью отражают целевые роли.

Зависимости: нет. Блокирует: P1 (пустые коллекции нельзя добавить раньше контента).

Итог фазы: 13 разделов (без `backend`, `databases`, `practices` — они приходят
вместе с контентом), 182 статьи, битых ссылок 0.

---

## Порядок работ

### Шаг 1. Слияние `nuxt` → `vue`

**1.1. Перенос файлов.** 11 статей с префиксом `nuxt-` (иначе коллизии
`fundamentals.md` и `error-handling.md`):

```powershell
$src = "E:\Projects\prepra\docs\nuxt"
$dst = "E:\Projects\prepra\docs\vue"
$files = @("app-lifecycle","composables-and-auto-imports","data-fetching","error-handling",
  "file-based-routing","fundamentals","layers","modules-ecosystem","nitro-server",
  "rendering-modes","state-and-seo")
foreach ($f in $files) {
  git mv "$src\$f.md" "$dst\nuxt-$f.md"
}
```

**1.2. Frontmatter.** В каждом перенесённом файле:
`section: nuxt` → `section: vue`, `order` — по новой лестнице:

| order | файл | уровень |
|---|---|---|
| 20 | `pinia.md` (из state-management) | 3 |
| 21 | `vuex.md` (из state-management) | 3 |
| 22 | `nuxt-fundamentals.md` | 2 |
| 23 | `nuxt-file-based-routing.md` | 3 |
| 24 | `nuxt-rendering-modes.md` | 3 |
| 25 | `nuxt-data-fetching.md` | 3 |
| 26 | `nuxt-state-and-seo.md` | 3 |
| 27 | `nuxt-composables-and-auto-imports.md` | 3 |
| 28 | `nuxt-nitro-server.md` | 4 |
| 29 | `nuxt-app-lifecycle.md` | 4 |
| 30 | `nuxt-modules-ecosystem.md` | 4 |
| 31 | `nuxt-layers.md` | 4 |
| 32 | `nuxt-error-handling.md` | 4 |

**1.3. Внутренние ссылки Nuxt.** Одна штука: в `nuxt-data-fetching.md`
`./nitro-server.md` → `./nuxt-nitro-server.md`.

**1.4. Входящие ссылки** (`../nuxt/X.md` → `../vue/nuxt-X.md`):

| Файл | Ссылок |
|---|---|
| `build-and-deployment/nuxt-deployment.md` | 2 (`rendering-modes`) |
| `performance/rendering-methods.md` | 4 (`rendering-modes`) |
| `performance/README.md` | 1 (`rendering-modes`) |
| `html-css/images-and-fonts.md` | 1 (`rendering-modes`) |
| `vue/plugins-and-app-api.md` | 1 (`app-lifecycle`) |

**1.5. README и cheatsheet.** `docs/nuxt/README.md` и `docs/nuxt/CHEATSHEET.md`
удалить, содержимое Nuxt-части влить в `docs/vue/README.md` как отдельный блок
«Nuxt» внутри секций «Углубись в детали». CHEATSHEET Vue
пересобрать скиллом `generate-cheatsheet` для `vue`.

---

### Шаг 2. Роспуск `state-management`

Раскладка (6 статей, коллизий имён нет):

| Файл | Куда | order |
|---|---|---|
| `tanstack-query.md` | `docs/react/` | 18 |
| `zustand.md` | `docs/react/` | 19 |
| `redux.md` | `docs/react/` | 20 |
| `pinia.md` | `docs/vue/` | 20 |
| `vuex.md` | `docs/vue/` | 21 |
| `client-storage.md` | `docs/html-css/` | 18 |

Правки `section` в каждом файле. Ссылки, которые сломаются при разъезде по
разным разделам (внутри раздела относительные пути работают, между — нет):

| Файл | Было | Стало |
|---|---|---|
| `react/redux.md` | `./pinia.md` | `../vue/pinia.md` |
| `vue/pinia.md` | `./zustand.md` | `../react/zustand.md` |
| `vue/nuxt-state-and-seo.md` | `../state-management/pinia.md` | `./pinia.md` |
| `react/usecontext.md` | `../state-management/zustand.md` | `./zustand.md` |
| `react/useeffect.md` | `../state-management/tanstack-query.md` | `./tanstack-query.md` |

Остальные `./zustand.md`, `./tanstack-query.md`, `./pinia.md`, `./vuex.md`
внутри новых разделов разрешаются корректно — проверить сборкой, не переписывать
вслепую. `docs/state-management/README.md` и `CHEATSHEET.md` удалить, ссылку из
`vue/README.md` убрать.

---

### Шаг 3. Redirect-заглушки

GitHub Pages отдаёт только статику. Для 17 старых URL создать
`site/public/legacy/{section}/{slug}/index.html` с meta-refresh на новый адрес —
или сгенерировать их скриптом в `astro:build:done` (предпочтительно, чтобы не
держать 17 файлов в репозитории). Минимум:

```html
<!doctype html><meta charset="utf-8">
<link rel="canonical" href="/prepra/vue/nuxt-fundamentals/">
<meta http-equiv="refresh" content="0;url=/prepra/vue/nuxt-fundamentals/">
<a href="/prepra/vue/nuxt-fundamentals/">Перейти</a>
```

Список: 11 URL `/nuxt/*` + 6 URL `/state-management/*`.

---

### Шаг 4. Реестр разделов (5 мест)

**4.1. `site/src/lib/sections.ts`** — новый порядок, группы, иконки, `market`.
После P0 в списке 13 разделов (новые `backend`, `databases`, `practices`
добавляются в P1/P2 вместе с первыми статьями):

`javascript, typescript, html-css, react, nextjs, architecture,
api-communication, build-and-deployment, testing, performance, security, ai, vue`

Целевой порядок с новыми разделами (для P1/P2 вставлять на эти позиции):

`javascript, typescript, html-css, react, nextjs, backend, databases, architecture,
api-communication, build-and-deployment, testing, performance, security, ai,
practices, vue`

Группы для сайдбара (6 заголовков; пустые группы не рендерятся, поэтому в P0
видны 5 — без «Бэкенд и данные»):

| group | Заголовок | Разделы |
|---|---|---|
| `core` | Язык и браузер | javascript, typescript, html-css |
| `frontend` | Фронтенд | react, nextjs |
| `backend` | Бэкенд и данные | backend, databases, api-communication |
| `infra` | Инфраструктура и качество | architecture, build-and-deployment, testing, performance, security |
| `product` | Продукт и практики | ai, practices |
| `legacy` | Второй стек | vue |

Новые поля: `group`, `market?: { value: number; label: string }`.
Значения `market` — из README плана §7: react 65.9, typescript 62.2,
javascript 50.0, nextjs 31.7, vue 17.1, html-css 37.8, backend 34.1,
databases 25.6, architecture 13.4, build-and-deployment 41.5,
api-communication 34.1 (раздел удалён — учесть в потребителях),
ai 29.3, performance 22.0, testing 12.2, practices 43.9 (senior-сигнал,
label «senior-сигнал»), security — без бейджа.

> ⚠️ `api-communication` остаётся отдельным разделом (в целевой карте он есть,
> id не меняется) — просто не переименовывается. Проверить, что он не потерян
> при правке списков.

**4.2. `site/src/content/config.ts`** — убрать `nuxt` и `state-management` из
enum/collections. `backend`, `databases`, `practices` добавить **в P1/P2**, не в P0:
пустая коллекция ломает `getStaticPaths`.

**4.3. `site/src/pages/[section]/index.astro`** — `getStaticPaths`: удалить
`nuxt` и `state-management`, обновить label/description
(`html-css` → «Браузер и UI», `architecture` → «Архитектура и System Design»,
`build-and-deployment` → «DevOps и инфраструктура», `vue` → «Vue и Nuxt»).

**4.4. `site/src/lib/mock-interview/presets.ts`** — убрать `nuxt` и
`state-management` из `ALL_SECTION_IDS`. Пресеты:
- удалить `vue-stack`, `nuxt-fullstack` (Vue остаётся только через «свой конфиг»
  и `ui-engineer-vue`);
- добавить `react-fullstack`: sections `[react, nextjs, api-communication,
  build-and-deployment, security]`, mainSection `react`, count 50;
- `architecture` → title «Архитектура и System Design», sections
  `[architecture, build-and-deployment]`;
- `web-basics` без изменений.
- README проекта: «9 готовых сетов» → пересчитать фактическое число.

**4.5. `site/src/components/layout/Sidebar.astro`** — рендер групп:
заголовок группы (мелкий uppercase) перед первым разделом группы, разделы
внутри. `MobileNav.astro` — тот же порядок. `Header.astro` содержит локальный
массив из 6 разделов, который нигде не используется — удалить как мёртвый код
(проверить grep по `sections` в файле).

---

### Шаг 5. Витрина и тексты

- **`Hero.astro`**: «подготовка к фронтенд-собеседованию» → «от фронтенда к
  Product Engineer: React, Node, Postgres, System Design». Никаких обещаний,
  которых нет в контенте до P3 — формулировать как «трек», а не «всё уже есть».
- **`index.astro`**: `sectionDescriptions` и `sectionColors` — под новый список;
  `faqItems`: вопрос «Какие темы покрывают материалы» переписать (сейчас «упор
  на React и Vue»), добавить вопрос «Чем PrePra отличается от курса» с ответом
  про уровни и spine-проекты (появится в P1 — текст можно поставить сразу).
- **`SectionsGrid.astro` / `SectionCard.astro`**: бейдж `market`.
  Если бейдж не влезает в текущую сетку — выводить только на странице раздела.
- **`README.md`** проекта: заголовок и описание, список разделов, счётчики
  (182 статьи, 13 разделов), убрать Vue/Nuxt из примеров структуры, добавить
  `docs/`-дерево без `nuxt`/`state-management`.

---

## Критерии приёмки P0

- [ ] `docs/nuxt/` и `docs/state-management/` отсутствуют
- [ ] `docs/vue/` содержит 30 статей, `order` 1–32 без дублей
- [ ] Redirect-заглушки отвечают на все 17 старых URL
- [ ] `npm run build` зелёный
- [ ] Проверка битых ссылок из README плана §6 — 0 находок
- [ ] Сайдбар показывает 5 групп (без «Бэкенд и данные»), Vue внизу
- [ ] Главная: React выше Vue, бейджи рынка видны
- [ ] `ALL_SECTION_IDS` совпадает с `sections.ts` и `config.ts`
- [ ] Пресет `react-fullstack` собирается, `vue-stack`/`nuxt-fullstack` удалены
- [ ] README проекта не упоминает Nuxt как отдельный раздел
- [ ] Мок-интервью: незавершённая сессия со старым `section` не падает
      (проверить `storage.ts` — при неизвестном id раздел просто игнорируется)

## Риски

| Риск | Как снять |
|---|---|
| `parseSectionReadme` теряет статьи, если README ссылается на старый путь | прогнать сборку и сверить число статей на странице раздела |
| Ссылки внутри перенесённых статей разрешаются от корня раздела | проверять по списку из шагов 1.3–2, не «на глаз» |
| GitHub Pages кэширует старые URL | canonical + meta-refresh, проверить `curl -I` после деплоя |
| `sections.ts` и `presets.ts` расходятся | вынести `ALL_SECTION_IDS` из `sections.ts` в P0 (одна точка правды) |
