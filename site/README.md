# Prepra

Интерактивная учебная платформа для подготовки к собеседованиям Frontend-разработчика. Построена на Astro.

## Технологии

- **Astro** - SSG фреймворк
- **MDX** - Markdown + React компоненты
- **React** - Интерактивные элементы
- **Tailwind CSS** - Стили
- **TypeScript** - Типизация

## Структура проекта

```
site/
├── src/
│   ├── content/          # Контент статей (MDX)
│   │   ├── javascript/
│   │   ├── typescript/
│   │   ├── react/
│   │   └── ...
│   ├── layouts/          # Layout компоненты
│   ├── pages/            # Страницы сайта
│   └── components/       # React компоненты
├── public/               # Статические файлы
└── astro.config.mjs      # Конфигурация Astro
```

## Команды

```bash
# Запуск dev сервера
npm run dev

# Сборка для продакшена
npm run build

# Предпросмотр собранного сайта
npm run preview
```

## Разработка

1. Установите зависимости: `npm install`
2. Запустите dev сервер: `npm run dev`
3. Откройте http://localhost:4321/prepra

## Деплой

Сайт автоматически деплоится на GitHub Pages при push в main branch.
