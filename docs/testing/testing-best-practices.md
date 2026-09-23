---
title: "Лучшие практики тестирования фронтенда"
section: testing
description: "Практики написания устойчивых тестов фронтенда: структура AAA, именование, фабрики данных, селекторы, изоляция, мокирование границ и POM для E2E."
order: 5
tags:
  - "тестирование"
  - "unit-тестирование"
  - "e2e"
  - "page-object-model"
  - "data-testid"
  - "snapshot-testing"
questions:
  - "Как FIRST-принципы и структура AAA делают тесты читаемыми и устойчивыми к изменениям"
  - "Почему тестирование поведения (роли, label) надёжнее тестирования реализации (состояние компонентов, CSS-классы)"
  - "Что произойдёт, если тесты зависят от shared state или порядка выполнения, и как это предотвратить"
  - "Какие зависимости следует мокировать (API, сеть, время), а какие нет, и почему мокирование внутренностей делает тесты хрупкими"
  - "Как Page Object Model и фабрики данных снижают хрупкость E2E и unit-тестов"
  - "Почему snapshot-тесты требуют осторожности и когда они полезны, а когда вредны"
---

# Лучшие практики тестирования фронтенда

Профессиональный набор тестов отличается от хрупких скриптов не количеством, а качеством: каждый тест должен ловить реальные ошибки, читаться как документация и оставаться стабильным при рефакторинге. В статье собраны проверенные практики именования, структурирования, изоляции и поддержки тестов фронтенда. Вы узнаете, как писать тесты, которые не падают от каждого изменения в коде и помогают команде уверенно вносить правки.

## Содержание

1. [FIRST — быстро, изолированно, повторяемо](#first-быстро-изолированно-повторяемо)
2. [AAA: Arrange — Act — Assert](#aaa-arrange-act-assert)
3. [Именование тестов](#именование-тестов)
4. [Один тест — одна концепция](#один-тест-одна-концепция)
5. [Тестируй поведение, не реализацию](#тестируй-поведение-не-реализацию)
6. [Фабрики тестовых данных](#фабрики-тестовых-данных)
7. [Селекторы: роли, label, data-testid](#селекторы-роли-label-data-testid)
8. [Page Object Model для E2E](#page-object-model-для-e2e)
9. [Изоляция и независимость](#изоляция-и-независимость)
10. [Мокируй границы, не внутренности](#мокируй-границы-не-внутренности)
11. [Избегай shared state](#избегай-shared-state)
12. [Детерминированные тесты](#детерминированные-тесты)
13. [Ревью тестов](#ревью-тестов)
14. [Snapshot testing: осторожно](#snapshot-testing-осторожно)
15. [Чеклист](#чеклист)

---

## FIRST — быстро, изолированно, повторяемо

Хороший тест соответствует принципу **FIRST**:

| Буква | Принцип | Практика |
|---|---|---|
| **F**ast | Быстрый | Мокируй внешние зависимости, не жди реального времени |
| **I**solated | Изолированный | Каждый тест создаёт своё состояние |
| **R**epeatable | Повторяемый | Одинаковый результат локально и в CI |
| **S**elf-validating | Самопроверяемый | Явные `expect`, не ручной осмотр |
| **T**imely | Своевременный | Пиши вместе с кодом или раньше (TDD) |

---

## AAA: Arrange — Act — Assert

Каждый тест должен читаться как мини-история:

```ts
it("adds item to cart", () => {
  // Arrange
  const cart = createCart();
  const item = createItem({ name: "Book", price: 29.99 });

  // Act
  addToCart(cart, item);

  // Assert
  expect(cart.items).toHaveLength(1);
  expect(cart.total).toBe(29.99);
});
```

Преимущества:

- понятно, где подготовка, где действие, где проверка;
- проще отлаживать: падает на фазе Act — проблема в коде, на Assert — в ожиданиях;
- новый разработчик сразу понимает структуру.

---

## Именование тестов

Имя теста — это документация. Оно должно отвечать на вопрос: **что должно произойти и при каких условиях?**

```ts
// ❌ Плохо
it("test1", () => {});
it("user", () => {});

// ✅ Хорошо
it("returns 401 when token is expired", () => {});
it("disables submit button while form is submitting", () => {});
it("shows empty state when search returns no results", () => {});
```

Формула:

```
[действие] → [ожидаемый результат] (when [условие])
```

---

## Один тест — одна концепция

Не пытайся проверить всё в одном тесте. Разделяй сценарии:

```ts
// ❌ Плохо: тест делает слишком много
it("handles login", async () => {
  await login("user@example.com", "password");
  await openProfile();
  await changePassword();
  await logout();
  expect(...);
});

// ✅ Хорошо: каждый тест — одна концепция
it("redirects to dashboard after successful login", async () => {});
it("shows error for invalid credentials", async () => {});
it("displays user name in header after login", async () => {});
it("clears session after logout", async () => {});
```

---

## Тестируй поведение, не реализацию

Тест должен быть устойчив к рефакторингу. Если ты меняешь внутреннюю реализацию, но поведение остаётся прежним — тесты не должны падать.

```ts
// ❌ Плохо: проверяем внутреннее состояние
it("calls setState with correct value", () => {
  const setState = vi.spyOn(React, "useState");
  render(<Counter />);
  expect(setState).toHaveBeenCalled();
});

// ✅ Хорошо: проверяем то, что видит пользователь
it("increments count on button click", async () => {
  render(<Counter />);
  await userEvent.click(screen.getByRole("button", { name: /increment/i }));
  expect(screen.getByText("Count: 1")).toBeInTheDocument();
});
```

---

## Фабрики тестовых данных

Не хардкоди данные в каждом тесте. Используй фабрики:

```ts
const createUser = (overrides?: Partial<User>): User => ({
  id: crypto.randomUUID(),
  name: "Test User",
  email: "test@example.com",
  role: "user",
  ...overrides,
});

// В тесте видно только важное
const admin = createUser({ role: "admin" });
const inactive = createUser({ isActive: false });
```

Плюсы:

- добавление поля в тип не ломает 50 тестов;
- в тесте видны только релевантные данные;
- легко создавать edge cases.

---

## Селекторы: роли, label, data-testid

Приоритет селекторов в React Testing Library:

```
1. getByRole           ← лучше всего: доступность + стабильность
2. getByLabelText
3. getByPlaceholderText
4. getByText
5. getByDisplayValue
6. getByTestId          ← последний резерв
```

В Playwright аналогично:

```ts
// ✅ Хорошо
await page.getByRole("button", { name: /submit/i }).click();
await page.getByLabel("Email").fill("user@example.com");

// ⚠️ Допустимо
await page.getByTestId("checkout-button").click();

// ❌ Плохо
await page.click(".btn-primary");
await page.click("#submit");
```

`data-testid` — контракт между разработчиком и тестировщиком. Используй его, когда нет семантических селекторов: сложные композитные компоненты, иконки без текста, canvas.

---

## Page Object Model для E2E

E2E-тесты быстро становятся длинными и хрупкими. Page Object Model (POM) выносит работу со страницей в отдельный класс:

```ts
// e2e/pages/CartPage.ts
export class CartPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/cart");
  }

  async getItems() {
    return this.page.getByTestId("cart-item").all();
  }

  async removeItem(name: string) {
    const item = this.page
      .getByTestId("cart-item")
      .filter({ hasText: name });
    await item.getByRole("button", { name: /remove/i }).click();
  }

  async getTotal() {
    return this.page.getByTestId("cart-total").textContent();
  }
}
```

Использование:

```ts
test("removes item from cart", async ({ page }) => {
  const cart = new CartPage(page);
  await cart.goto();
  await cart.removeItem("React Handbook");

  expect(await cart.getItems()).toHaveLength(0);
  expect(await cart.getTotal()).toBe("$0.00");
});
```

Плюсы:

- если селектор изменится, правишь в одном месте;
- тесты читаются как бизнес-сценарии;
- легче переиспользовать шаги.

---

## Изоляция и независимость

Тесты не должны зависеть от порядка выполнения.

```ts
// ❌ Плохо: shared mutable state
let counter = 0;

it("increments", () => {
  counter++;
  expect(counter).toBe(1);
});

it("increments again", () => {
  counter++;
  expect(counter).toBe(2); // упадёт при параллельном запуске
});

// ✅ Хорошо: каждый тест создаёт своё состояние
it("increments", () => {
  const counter = createCounter();
  counter.increment();
  expect(counter.value).toBe(1);
});
```

Используй `beforeEach` / `afterEach` для очистки:

```ts
beforeEach(() => {
  localStorage.clear();
  server.resetHandlers();
  vi.clearAllMocks();
});
```

---

## Мокируй границы, не внутренности

Мокируй только внешние зависимости: API, браузерные API, таймеры, сторонние библиотеки.

```ts
// ✅ Мокируем API на границе
vi.mock("./api", () => ({
  fetchUser: vi.fn(),
}));

// ❌ Не мокируй внутренние хуки и компоненты
vi.mock("./useUser", () => ({
  useUser: vi.fn(),
}));
```

Если приходится мокировать много внутренних модулей — это сигнал, что компонент слишком большой или связанный.

---

## Избегай shared state

Shared state между тестами — главный источник flakiness.

| Что делать | Как |
|---|---|
| Чистить localStorage/sessionStorage | `localStorage.clear()` в `beforeEach` |
| Сбрасывать MSW handlers | `server.resetHandlers()` |
| Очищать моки | `vi.clearAllMocks()` |
| Очищать DOM | `cleanup()` от Testing Library |
| Останавливать таймеры | `vi.useRealTimers()` |

---

## Детерминированные тесты

Тест должен давать одинаковый результат в любой среде.

```ts
// ❌ Плохо: зависит от текущего времени
it("formats date", () => {
  expect(formatRelativeDate(new Date())).toBe("just now");
});

// ✅ Хорошо: фиксируем время
it("formats date", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));

  expect(formatRelativeDate(new Date("2026-01-01T11:00:00Z"))).toBe("1 hour ago");

  vi.useRealTimers();
});
```

Также избегай:

- случайных данных без seed,
- зависимости от сети,
- зависимости от файловой системы.

---

## Ревью тестов

Тесты должны проходить код-ревью наравне с продакшн-кодом. Проверяй:

- [ ] Тест проверяет поведение, а не реализацию.
- [ ] Имя теста понятно без контекста.
- [ ] Нет shared state.
- [ ] Данные создаются через фабрики.
- [ ] Селекторы устойчивы к рефакторингу.
- [ ] Есть как минимум один негативный сценарий.
- [ ] Тест не содержит `waitForTimeout` / `sleep`.

---

## Snapshot testing: осторожно

Snapshot-тесты легко создать, но сложно поддерживать.

```ts
// ❌ Плохо: огромный snapshot всего компонента
expect(container).toMatchSnapshot();

// ✅ Хорошо: точечная проверка
expect(screen.getByRole("heading")).toHaveTextContent("Welcome");
```

Используй snapshot только для:

- стабильных структур данных (JSON-конфиги, ответы API);
- дизайн-системы, где изменения UI осознанные;
- больших объектов, которые неудобно проверять вручную.

Всегда ревьюй изменения snapshot. Если snapshot меняется на каждый чих — от него лучше избавиться.

---

## Чеклист

- [ ] Каждый тест следует структуре AAA.
- [ ] Имя теста описывает поведение и условие.
- [ ] Один тест проверяет одну концепцию.
- [ ] Данные создаются через фабрики.
- [ ] Селекторы используют роли/label, data-testid — как запасной вариант.
- [ ] E2E используют Page Object Model.
- [ ] Тесты изолированы и не зависят от порядка.
- [ ] Мокируются только внешние зависимости.
- [ ] Тесты детерминированы: нет случайности, времени, сети.
- [ ] Тесты проходят код-ревью.

---

## Ключевые тезисы для интервью

- FIRST-принципы (Fast, Isolated, Repeatable, Self-validating, Timely) и структура AAA (Arrange-Act-Assert) делают тесты читаемыми, быстрыми и устойчивыми; каждый тест проверяет одну концепцию с именем, описывающим действие, результат и условие.
- Тестируй поведение, видимое пользователю (роли, label, текст), а не внутреннее состояние компонентов; приоритет селекторов: `getByRole` > `getByLabelText` > `getByTestId` как последний резерв.
- Фабрики тестовых данных снижают хрупкость, подчёркивая значимые поля; Page Object Model выносит селекторы и шаги E2E в переиспользуемые классы, изолируя изменения UI.
- Тесты должны быть изолированы, детерминированы и независимы от порядка запуска; мокируй только внешние границы (API, сеть, время), а не внутренние модули — избыточное мокирование делает тесты хрупкими.
- Snapshot-тесты полезны для стабильных структур (API-ответы, конфигурации), но требуют осознанного ревью; не снимай snapshot со всего подряд — это создаёт шум при изменениях.

## Заключение

Качество тестов определяется не их количеством, а тем, насколько они помогают ловить ошибки и поддерживать рефакторинг. Структура AAA, понятные имена, изолированные сценарии и устойчивые селекторы делают тесты читаемыми и надёжными. Важно мокировать только границы системы, избегать shared state и следить за детерминизмом. E2E-тесты выигрывают от Page Object Model, а snapshot-тесты требуют осторожности. Регулярное код-ревью тестов помогает поддерживать их в том же качестве, что и продакшн-код.

## Полезные ссылки

- [Testing Library — Guiding Principles](https://testing-library.com/docs/guiding-principles)
- [Testing Library — Queries priority](https://testing-library.com/docs/queries/about#priority)
- [Playwright — Best practices](https://playwright.dev/docs/best-practices)
- [Vitest — Mocking](https://vitest.dev/guide/mocking.html)
- [Jest — Snapshot Testing](https://jestjs.io/docs/snapshot-testing)
