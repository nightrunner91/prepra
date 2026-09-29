# Безопасность

Раздел объясняет, как защищать веб-приложения на уровне фронтенда: от классических XSS и CSRF до CSP, секретов, авторизации, безопасности зависимостей и compliance.

## Начни с базы

1. **[Безопасность веб-приложений](./security.md)** — комплексный обзор угроз и защит, карта тем.
2. **[Управление секретами](./security-secrets-management.md)** — `NEXT_PUBLIC_`, `runtimeConfig`, vaults, ротация, защита от утечек в git.

## Углубись в детали

- **[XSS: анатомия атаки](./security-xss-deep-dive.md)** — виды XSS, экранирование, санитизация, Trusted Types.
- **[CSRF: как браузер становится оружием](./security-csrf-deep-dive.md)** — механика атаки, SameSite cookies, CSRF-токены, double submit cookie.
- **[CSP: Content Security Policy](./security-csp-deep-dive.md)** — директивы, nonce, strict-dynamic, Report-Only, настройка в Next.js и Nuxt.
- **[HTTP-заголовки безопасности](./security-http-headers.md)** — HSTS, X-Frame-Options, COOP, COEP, CORP, Permissions-Policy и другие.
- **[Аутентификация и авторизация](./security-authn-authz.md)** — сессии, JWT, OAuth 2.0, OIDC, PKCE, RBAC/ABAC, хранение токенов.

## Не будет лишним

- **[Безопасность зависимостей и supply chain](./security-dependency-supply-chain.md)** — npm audit, lock-файлы, Snyk, Socket, SBOM, provenance.
- **[Подготовка к SOC2 и CASA](./security-soc2-casa-workflows.md)** — как фронтендеру участвовать в security аудите.

## Смежные разделы

- **[Безопасность Next.js](../nextjs/nextjs-security.md)** — Server Components, Server Actions, middleware, CSP, Open Redirect.
- **[Безопасность Vue](../vue/vue-security.md)** — `v-html`, refs, URL-атрибуты, хранение токенов.
- **[Безопасность Nuxt](../nuxt/nuxt-security.md)** — SSR, Nitro, `nuxt-security`, `runtimeConfig`, CSRF, CSP.