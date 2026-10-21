# Шпаргалка: Безопасность

## Принципы и XSS

- **Defense in depth:** middleware → сервер → БД → CSP · least privilege, secure by default
- **Типы XSS:** reflected, stored (в БД, поражает всех), DOM-based (только клиент), mXSS, blind
- **Source → sink:** URL, form, `postMessage` → `innerHTML`, `eval`, `document.write`
- **Защита:** экранирование (текст) vs санитизация (HTML, DOMPurify) vs валидация (формат)
- **Trusted Types:** доверенные объекты вместо строк в sinks → закрытие DOM-based XSS

## CSRF

- **Механика:** авто-cookie, ответ не нужен (SOP), JSON CSRF (`text/plain`) · CORS не спасает
- **SameSite:** Strict, Lax (дефолт, GET по ссылке проходит), None (+ Secure)
- **Токены:** synchronizer token, Double Submit Cookie (stateless) · Origin / Referer — доп. слой
- **Компромисс:** cookie + CSRF-защита vs Bearer в `Authorization` + XSS-риск

## CSP и заголовки

- **CSP:** вторая линия обороны, `default-src`, `script-src`, `connect-src`, `frame-ancestors`
- **Inline:** без `'unsafe-inline'` → nonce (на каждый запрос) / hash (SHA скрипта)
- **strict-dynamic:** доверие скриптам от доверенного корня, бандлеры, `import()`
- **Внедрение:** Report-Only → enforce · ошибки: `https:` в `script-src`, `*`, предсказуемый nonce
- **Clickjacking:** `X-Frame-Options: DENY` vs `frame-ancestors 'none'` (современный)
- **Базовые:** HSTS (`preload`), `nosniff`, `Referrer-Policy`, Permissions-Policy
- **Изоляция:** COOP + COEP → cross-origin isolated · logout → `Clear-Site-Data`, `no-store`

## Аутентификация

- **AuthN vs AuthZ:** кто ты / что можно · сервер проверяет, клиент адаптирует UI
- **Сессии vs JWT:** server state, мгновенный revoke vs stateless, микросервисы, сложный отзыв
- **OAuth 2.0 / OIDC:** делегированный доступ / аутентификация, Authorization Code Flow, `state`
- **PKCE:** `code_verifier` → `code_challenge` вместо `client_secret`, SPA и mobile
- **Токены:** access (минуты, memory) + refresh (HttpOnly cookie), rotation · не localStorage
- **RBAC vs ABAC:** роли (старт) vs атрибуты (контекст, сложный аудит)

## Фреймворки

- **Экранирование:** JSX / `{{ }}` · обход: `dangerouslySetInnerHTML` / `v-html`, ref + `innerHTML`
- **Ссылки:** `javascript:` в `href` → whitelist, `noopener` (tabnabbing), Open Redirect
- **SSR:** stored XSS в HTML до гидратации → санитизация и на сервере
- **Граница Next.js:** Server Components, `"use client"`, RSC Payload (только нужные поля)
- **Server Actions:** публичный endpoint → Zod, авторизация, владение ресурсом, rate limiting
- **Middleware:** Edge, редиректы, заголовки, nonce · не замена проверки в Server Action
- **Nuxt:** `runtimeConfig.public`, Nitro (Zod, права), `nuxt-security`, CSRF вручную

## Секреты и зависимости

- **Бандл = публично:** `NEXT_PUBLIC_`, `VITE_` · утечки: серверный импорт, логи, source maps
- **Серверный прокси:** клиент → свой сервер → внешний API с секретом
- **Vault и ротация:** Vault / AWS Secrets Manager, zero-downtime (оба секрета → переключение)
- **Git:** `.gitignore`, pre-commit (`gitleaks`) · утёк → отзыв, `git filter-repo`
- **Supply chain:** компрометация мейнтейнера, typosquatting, транзитивные, `postinstall`
- **Инструменты:** `npm audit` (известные CVE) vs Socket (поведение), lock-файл + `npm ci`
- **Доверие:** SBOM (SPDX, CycloneDX), provenance (коммит + CI), приватный registry

## Compliance

- **SOC2 / CASA:** Type II (3–12 мес), evidence, change management (PR → CI) · CASA (Google, OAuth)
- **Incident response:** Detection → Containment → Eradication → Recovery → Lessons learned
- **Pentest и SDLC:** XSS, CSRF, Open Redirect, IDOR · threat modeling, SAST / DAST
