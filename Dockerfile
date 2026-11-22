# syntax=docker/dockerfile:1

# Сборка статики. Контекст — корень репозитория: Astro читает статьи из ../docs.
FROM node:24-alpine AS build

WORKDIR /app/site

COPY site/package.json site/package-lock.json ./
# postinstall патчит node_modules, поэтому скрипт нужен до npm ci.
COPY site/scripts/patch-shiki-singleton.mjs ./scripts/
RUN npm ci

COPY site/ ./
COPY docs/ /app/docs/

RUN npm run build

# Раздача статики: nginx, конфиг из шаблона (envsubst подставляет $PORT).
FROM nginx:1.27-alpine AS runtime

ENV PORT=8080

COPY deploy/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/site/dist /usr/share/nginx/html

EXPOSE 8080
