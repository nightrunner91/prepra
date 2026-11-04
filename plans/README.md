# PrePra 2026 — план переработки

Статус: черновик v1 · дата: 2026-11-04 · источник рынка: `E:\Projects\roadmap\roadmap-report.html`
(82 вакансии, 319 навыков, 28.5 недель обучения)

Цель: превратить PrePra из «подготовки к фронтенд-собеседованию» в платформу
**«от фронтенда к Product Engineer»**: React-first, с бэкендом, базами данных,
системным дизайном и инженерными практиками.

---

## 1. Зафиксированные решения

| # | Решение | Следствие |
|---|---|---|
| 1 | **Vue/Nuxt заморозить и понизить**, не удалять | 30 статей сохраняются, новых не пишем, раздел уходит вниз навигации |
| 2 | **Миграция = навигация + 2 слияния** | `nuxt` → `vue`, `state-management` распускается. Остальные id/URL не трогаем |
| 3 | **Первый контентный спринт — бэкенд-ядро** | Node.js + PostgreSQL, они разблокируют System Design и DevOps |

Отклонённые варианты: удаление Vue (теряем 17.1% локального рынка, 30 статей и SEO
без экономии времени); агрессивное слияние JS+TS и testing+performance (churn ради
косметики); только витрина без миграции (оставляет мёртвый раздел `state-management`).

---

## 2. Целевая карта разделов

`id` = URL. Меняются только `nuxt` и `state-management` (с redirect-заглушками).

| # | id | Label | Было статей | Станет | Статус |
|---|---|---|---|---|---|
| 1 | `javascript` | JavaScript | 15 | 15 | как есть |
| 2 | `typescript` | TypeScript | 11 | 11 | как есть |
| 3 | `html-css` | Браузер и UI | 16 | 17 | +`client-storage`, переименование |
| 4 | `react` | React | 17 | 27 | +3 из state-management, +7 новых |
| 5 | `nextjs` | Next.js | 13 | 17 | +4 новых |
| 6 | `backend` | Node.js и API | — | 15 | **новый** |
| 7 | `databases` | Базы данных | — | 11 | **новый** |
| 8 | `architecture` | Архитектура и System Design | 9 | 22 | label + 9 концепций + 4 кейса |
| 9 | `api-communication` | API и интеграции | 10 | 10 | как есть |
| 10 | `build-and-deployment` | DevOps и инфраструктура | 8 | 15 | +`gitlab-ci-cd`, +6 новых |
| 11 | `testing` | Тестирование | 14 | 16 | −`gitlab-ci-cd`, +3 новых |
| 12 | `performance` | Производительность | 8 | 10 | +2 новых |
| 13 | `security` | Безопасность | 13 | 16 | +3 новых |
| 14 | `ai` | AI и LLM | 12 | 17 | +5 новых |
| 15 | `practices` | Инженерные практики | — | 9 | **новый** |
| 16 | `vue` | Vue и Nuxt | 19 | 32 | +11 из nuxt, +2 из state-management, заморожен |

Итого: 182 → 260 статей в 16 разделах. Новых — 78, перенесённых — 17.

---

## 3. Фазы

| Фаза | Файл | Недели | Объём | Статус |
|---|---|---|---|---|
| P0 | [01-p0-repackaging.md](./01-p0-repackaging.md) | 1–2 | 0 статей, миграция + витрина | ☐ |
| P1 | [02-p1-backend-core.md](./02-p1-backend-core.md) | 7 | 23 статьи + 30 SQL-задач | ☐ |
| P2 | [03-p2-senior-layer.md](./03-p2-senior-layer.md) | 7 | 22 статьи + `/tracks` | ☐ |
| P3 | [04-p3-infra-ai.md](./04-p3-infra-ai.md) | 9 | 22 статьи | ☐ |
| P4 | [05-p4-react-next.md](./05-p4-react-next.md) | 4 | 11 статей + добивка | ☐ |

Обязательное чтение перед любой фазой: [article-spec.md](./article-spec.md).

---

## 4. Инварианты (не нарушать ни в одной фазе)

1. **`docs/` — только контент.** В `docs/{section}/` допустимы статьи и файлы
   `README.md`, `CHEATSHEET.md`, `GUIDE.md`. Любой другой `.md` в `docs/` попадёт
   в content collection и сломает сборку.
2. **Смена id раздела = смена URL.** Разрешена только с meta-refresh заглушкой
   (GitHub Pages не умеет серверные редиректы).
3. **Новый раздел добавляется одним PR с первыми 3 статьями.** Пустая коллекция
   ломает `getStaticPaths` и главную страницу.
4. **`questions` и `answers` — строго одинаковой длины**, оба непустые. Это
   топливо для мок-интервью: статья без `answers` в выборку не попадает.
5. **Реестр разделов живёт в 5 местах** — обновлять все:
   - `site/src/lib/sections.ts` (иконки, порядок, группы, market)
   - `site/src/content/config.ts` (enum + collection)
   - `site/src/pages/[section]/index.astro` (`getStaticPaths`, label, description)
   - `site/src/lib/mock-interview/presets.ts` (`ALL_SECTION_IDS`, пресеты)
   - `README.md` проекта (счётчики и список разделов)
6. **Перед коммитом:** `cd site; npm run build` — зелёный. Проверить битые
   ссылки в `dist/` (см. §6).
7. **Авторский голос и формат** — по `article-spec.md`, скиллы `article-editor`
   (структура + фокус), `generate-answers`, `generate-cheatsheet`, `arrange`.

---

## 5. Как начинать сессию

Скопируй в новую сессию:

> Прочитай `.opencode/plans/prepra/README.md`, `article-spec.md` и
> `0X-pX-*.md`. Работаем по фазе PX. Начни с задач из раздела «Порядок работ»,
> отмечай выполненное в файле фазы. Каждую новую статью прогоняй через skill
> `article-editor` (режим `check` минимум). Перед завершением прогони
> `npm run build` и проверь критерии приёмки.

Правила сессии:
- одна сессия = один логический кусок фазы (3–5 статей или один блок миграции);
- чекбоксы `[ ]` в файле фазы обновлять по факту;
- статья не считается готовой без прохода `article-editor`;
- если решение из плана упирается в реальность — **сначала** правь план, потом код.

---

## 6. Верификация

```powershell
cd E:\Projects\prepra\site
npm run build

# битые внутренние ссылки в собранном HTML
$dist = "E:\Projects\prepra\site\dist"
$sections = @("javascript","typescript","html-css","react","nextjs","backend","databases",
  "architecture","build-and-deployment","testing","performance","security","ai","practices","vue")
Get-ChildItem $dist -Recurse -Filter *.html | ForEach-Object {
  $html = Get-Content $_.FullName -Raw -Encoding UTF8
  [regex]::Matches($html, 'href="(/prepra/[^"#?]+)"') | ForEach-Object {
    $p = $_.Groups[1].Value -replace '^/prepra',''
    $target = Join-Path $dist ($p.TrimStart('/') -replace '/$','\index.html')
    if (-not (Test-Path $target) -and -not (Test-Path ($target + '\index.html'))) {
      "BROKEN $($_.Groups[1].Value) in $($_.Name)"
    }
  }
}
```

Дополнительно: `npm run build` падает при дубле `id` задач практикума и при
неверном индексе правильного ответа — это встроенная валидация, не обходить.

---

## 7. Данные рынка (для бейджей и приоритетов)

Из отчёта, дата среза 2026-11-03. Weight — сумма весов классов
(required 3 / nice-to-have 2 / mentioned 1), count — число вакансий из 82.

| Навык | weight | count | % | Раздел PrePra |
|---|---|---|---|---|
| React | 158 | 54 | 65.9 | react |
| TypeScript | 150 | 51 | 62.2 | typescript |
| JavaScript | 123 | 41 | 50.0 | javascript |
| CI/CD | 89 | 34 | 41.5 | build-and-deployment |
| CSS / HTML | 91 / 87 | 31 / 29 | 37.8 / 35.4 | html-css |
| **Code Review** | **84** | **28** | **34.1** | **practices** |
| REST API | 82 | 28 | 34.1 | api-communication |
| **Node.js** | **81** | **28** | **34.1** | **backend** |
| Next.js | 74 | 26 | 31.7 | nextjs |
| AI / AI-assistants | 46 / 42 | 24 / 16 | 29.3 / 19.5 | ai |
| **PostgreSQL** | **60** | **21** | **25.6** | **databases** |
| **AWS / Docker** | **57 / 52** | **21 / 21** | **25.6** | **build-and-deployment** |
| Performance | 51 | 18 | 22.0 | performance |
| Vue.js | 39 | 14 | 17.1 | vue (заморожен) |
| SQL | 37 | 13 | 15.9 | databases |
| Architecture | 33 | 11 | 13.4 | architecture |
| NestJS | 28 | 10 | 12.2 | backend |
| GraphQL | 21 | 8 | 9.8 | api-communication |
| Microservices / K8s | 18 / 15 | 7 / 7 | 8.5 / 8.5 | architecture / devops |

Senior-сигналы (доля вакансий с упоминанием):
architecture 46.3% · **code_review 43.9%** · performance 32.9% ·
**system_design 19.5%** · **mentoring 18.3%** · observability 11.0% ·
leading 8.5% · stakeholder 6.1%.

Не берём (низкий ROI): Angular, PHP/Laravel, .NET/Java, MySQL отдельно,
Kubernetes в глубину, Terraform, мобильная разработка, Three.js/WebGL,
micro-frontends, Svelte/Solid/Qwik, LangChain в глубину, Rust/Go, SEO как трек.

> Данные устаревают. Перепроверять раз в 6 месяцев и обновлять §7 + бейджи.

---

## 8. Открытые вопросы

- [ ] Нужен ли `/tracks` как отдельный продукт или достаточно README-разделов
      с уровнями (решается в P2 по объёму).
- [ ] SQL-практикум: ограничиться `choice`-задачами или добавлять исполняемый
      SQL-раннер (Web Worker + sql.js) — решается в P1 по стоимости.
- [ ] Нужен ли трек «Vue legacy» или Vue окончательно уходит в справочник.
