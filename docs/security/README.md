# Безопасность

Раздел объясняет, как защищать веб-приложения на уровне фронтенда: от классических XSS и CSRF до Server Actions, CSP, секретов, авторизации, безопасности зависимостей.

## Начни с базы 📚

1. **[Безопасность веб-приложений](./security.md)** — комплексный обзор угроз и защит.
2. **[Управление секретами](./security-secrets-management.md)** — `NEXT_PUBLIC_`, `runtimeConfig`, vaults, ротация, защита от утечек в git.

## Углубись в детали 🔎

- **[XSS: анатомия атаки](./security-xss-deep-dive.md)** — виды XSS, экранирование, санитизация, защита в React/Vue/Nuxt/Next.js, Trusted Types.
- **[CSRF: как браузер становится оружием](./security-csrf-deep-dive.md)** — механика атаки, SameSite cookies, CSRF-токены, double submit cookie.
- **[CSP: Content Security Policy](./security-csp-deep-dive.md)** — директивы, nonce, strict-dynamic, Report-Only, настройка в Next.js и Nuxt.
- **[HTTP-заголовки безопасности](./security-http-headers.md)** — HSTS, X-Frame-Options, COOP, COEP, CORP, Permissions-Policy и другие.
- **[Аутентификация и авторизация](./security-authn-authz.md)** — сессии, JWT, OAuth 2.0, OIDC, PKCE, RBAC/ABAC, хранение токенов.
- **[Безопасность Next.js](./security-nextjs.md)** — Server Components, Server Actions, middleware, Route Handlers, CSP, Open Redirect.
- **[Безопасность Vue и Nuxt](./security-vue-nuxt.md)** — `v-html`, refs, Nitro, `nuxt-security`, `runtimeConfig`, CSRF, CSP.
- **[Безопасность зависимостей и supply chain](./security-dependency-supply-chain.md)** — npm audit, lock-файлы, Snyk, Socket, SBOM, provenance.

## Не будет лишним ✍

- **[Подготовка к SOC2 и CASA](./security-soc2-casa-workflows.md)** — как фронтендеру участвовать в security аудите.
