---
title: "Формы и валидация: Constraint Validation API"
section: html-css
description: "Формы — это контракт между пользователем, DOM и сервером: какие данные собирать, как их проверять и как сообщать об ошибках. Разбираем встроенную валидацию HTML, Constraint Validation API, псевдоклассы валидации и событие formdata."
order: 7
tags: ["forms", "constraint-validation", "validation", "formdata", "pseudo-classes"]
questions:
  - "Как встроенная HTML-валидация работает через атрибуты `required`, `pattern`, `min`/`max` и блокирует отправку формы"
  - "Что такое Constraint Validation API и как `checkValidity()`, `reportValidity()`, `setCustomValidity()` управляют проверкой"
  - "Чем `:user-valid`/`:user-invalid` отличаются от `:valid`/`:invalid` и почему это важно для UX"
  - "Как событие `formdata` позволяет модифицировать данные формы перед отправкой"
  - "Почему клиентская валидация — это UX, а не безопасность, и почему сервер всегда должен проверять данные"
  - "Как `ElementInternals` позволяет custom element стать участником формы через `formAssociated = true`"
answers:
  - "Браузер проверяет поля до отправки без JS: `required` — непустое значение, `type=\"email\"`/`url`/`number` — формат, `min`/`max` — диапазон, `minlength`/`maxlength` — длина, `pattern` — регулярное выражение; при ошибке отправка блокируется и показывается нативная подсказка, которую можно переопределить через Constraint Validation API."
  - "`checkValidity()` проверяет поле без показа UI, `reportValidity()` проверяет и показывает нативную подсказку, `setCustomValidity(message)` задаёт кастомную ошибку через флаг `customError` в объекте `validity` (`valueMissing`, `typeMismatch`, `patternMismatch`, `tooShort` и др.); без `setCustomValidity('')` поле останется невалидным даже при корректном значении."
  - "`:invalid` применяется сразу к пустым обязательным полям при загрузке формы, а `:user-valid`/`:user-invalid` — только после взаимодействия пользователя с полем, поэтому позволяют не подсвечивать все поля красным с самого начала."
  - "Перед отправкой на `<form>` генерируется событие `formdata`, в обработчике которого через `event.formData` можно нормализовать значения (`data.set('phone', phone.replace(/\\D/g, ''))`) или добавить скрытые поля (`data.append('submittedAt', ...)`) — удобная точка трансформации без изменения разметки."
  - "Клиентскую валидацию выполняет браузер на стороне пользователя, поэтому её можно обойти — она лишь улучшает UX и уменьшает нагрузку на сервер; сервер обязан валидировать данные повторно, потому что в `fetch` или `curl` приходит что угодно."
  - "`ElementInternals` через `this.attachInternals()` даёт custom element'у участие в форме: значение через `setFormValue()`, валидацию через `setValidity(flags, message, anchor)`; без `static formAssociated = true` форма не увидит значение элемента — это нишевый сценарий для библиотек компонентов, а не для повседневной разработки."
---

# Формы и валидация: Constraint Validation API

Формы — это не просто набор полей ввода. Это контракт между пользователем, DOM и сервером: какие данные собирать, как их проверять и как сообщать об ошибках. В этой статье разбираем встроенную валидацию HTML, Constraint Validation API и псевдоклассы валидации — темы, которые реально спрашивают на собеседованиях.

## Содержание

1. [Глубокий разбор](#глубокий-разбор)
2. [Практические примеры](#практические-примеры)
3. [Типичные ошибки и антипаттерны](#типичные-ошибки-и-антипаттерны)
4. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
5. [Заключение](#заключение)
6. [Полезные ссылки](#полезные-ссылки)

---

## Глубокий разбор

### Как форма собирает данные

Любой элемент формы, у которого есть атрибут `name`, участвует в отправке. Браузер собирает пары `name=value` и либо строит из них `application/x-www-form-urlencoded` тело, либо передаёт в `FormData`.

```html
<form id="profile">
  <input name="email" value="user@example.com">
  <input type="checkbox" name="newsletter" checked>
  <button type="submit">Отправить</button>
</form>
```

```js
const form = document.getElementById('profile');
const data = new FormData(form);

for (const [key, value] of data) {
  console.log(key, value); // email user@example.com, newsletter on
}
```

Важный нюанс: кнопка `<button type="submit">` внутри формы отправляет её, но если внутри формы несколько submit-кнопок, каждая может иметь собственные `name` и `value`, которые тоже попадают в данные при активации.

### Встроенная валидация HTML

Браузер умеет проверять поля до отправки без единой строчки JS:

- `required` — поле не должно быть пустым;
- `type="email"`, `type="url"`, `type="number"` — проверка формата;
- `min` / `max` — для чисел и дат;
- `minlength` / `maxlength` — для строк;
- `pattern` — регулярное выражение;
- `step` — для чисел и дат.

```html
<input
  type="email"
  name="email"
  required
  minlength="5"
  placeholder="user@example.com"
>
```

Если валидация не проходит, браузер блокирует отправку и показывает всплывающую подсказку с сообщением об ошибке. Это поведение можно переопределить через Constraint Validation API.

### Constraint Validation API

Каждый элемент формы реализует интерфейс `ConstraintValidation`. Его ключевые методы и свойства:

- `willValidate` — будет ли элемент валидироваться;
- `checkValidity()` — проверяет поле, не показывая UI;
- `reportValidity()` — проверяет поле и показывает нативную подсказку;
- `setCustomValidity(message)` — устанавливает кастомную ошибку;
- `validity` — объект `ValidityState` с флагами: `valueMissing`, `typeMismatch`, `patternMismatch`, `tooShort`, `tooLong`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `badInput`, `customError`, `valid`.

```js
const input = document.querySelector('input[name="password"]');

input.addEventListener('input', () => {
  if (input.value.length < 8) {
    input.setCustomValidity('Пароль должен быть не короче 8 символов');
  } else {
    input.setCustomValidity(''); // сброс кастомной ошибки
  }
});
```

Если `setCustomValidity('')` не вызвать, поле останется невалидным даже при корректном значении, потому что флаг `customError` будет установлен.

### Псевдоклассы валидации

Браузер применяет к элементам псевдоклассы:

- `:valid` / `:invalid` — поле проходит или не проходит валидацию;
- `:user-valid` / `:user-invalid` — то же самое, но только после взаимодействия пользователя с полем;
- `:required` / `:optional` — по наличию атрибута `required`;
- `:in-range` / `:out-of-range` — для числовых полей.

```css
input:user-invalid {
  border-color: #dc2626;
}

input:user-valid {
  border-color: #16a34a;
}
```

`:user-valid` и `:user-invalid` удобнее `:valid`/`:invalid`, потому что не подсвечивают поля красным сразу при загрузке страницы.

### Событие `submit` и `formdata`

При отправке формы происходит последовательность:

1. Событие `submit` на `<form>`.
2. Если обработчик не отменил событие и форма валидна, браузер инициирует навигацию или отправку.
3. Перед отправкой генерируется событие `formdata` на `<form>`, в обработчике которого можно модифицировать данные через `FormData`.

```js
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  fetch('/api/profile', { method: 'POST', body: data });
});

form.addEventListener('formdata', (event) => {
  event.formData.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
});
```

### `ElementInternals`: собственный элемент внутри формы

`ElementInternals` — это API, которое позволяет custom element участвовать в жизни формы: передавать значение, валидироваться и реагировать на reset и disabled. Это нишевый сценарий для библиотек компонентов, но его стоит знать как минимум на уровне «что это и зачем».

Чтобы связать custom element с формой:

1. Объявить статическое свойство `formAssociated = true`.
2. Получить `ElementInternals` через `this.attachInternals()`.
3. Устанавливать значение через `internals.setFormValue(value)`.

```js
class RatingElement extends HTMLElement {
  static formAssociated = true;

  constructor() {
    super();
    this._internals = this.attachInternals();
    this._value = '0';
  }

  connectedCallback() {
    this.addEventListener('click', this);
    this._internals.setFormValue(this._value);
  }

  handleEvent(event) {
    if (event.type === 'click') {
      this._value = event.target.dataset.value ?? this._value;
      this._internals.setFormValue(this._value);
    }
  }
}

customElements.define('star-rating', RatingElement);
```

```html
<form>
  <star-rating name="rating"></star-rating>
  <button type="submit">Отправить</button>
</form>
```

Для валидации используется `setValidity(flags, message, anchor)`, где `flags` — объект `ValidityStateFlags`, а `anchor` — элемент для фокуса при ошибке. Также есть колбэки `formAssociatedCallback`, `formDisabledCallback`, `formResetCallback`, `formStateRestoreCallback`. Без `formAssociated = true` форма не увидит значение элемента.

## Практические примеры

### Пример 1: валидация пароля

```html
<form id="signup">
  <label for="password">Пароль</label>
  <input
    id="password"
    name="password"
    type="password"
    minlength="8"
    pattern="^(?=.*[A-Za-z])(?=.*\d).+$"
    required
  >
  <span class="error" id="password-error"></span>

  <button type="submit">Зарегистрироваться</button>
</form>
```

```js
const form = document.getElementById('signup');
const password = form.elements.password;
const error = document.getElementById('password-error');

password.addEventListener('input', () => {
  password.setCustomValidity('');

  if (password.validity.valueMissing) {
    password.setCustomValidity('Введите пароль');
  } else if (password.validity.tooShort) {
    password.setCustomValidity(`Минимум ${password.minLength} символов`);
  } else if (password.validity.patternMismatch) {
    password.setCustomValidity('Пароль должен содержать буквы и цифры');
  }

  error.textContent = password.validationMessage;
});

form.addEventListener('submit', (event) => {
  if (!form.reportValidity()) {
    event.preventDefault();
  }
});
```

### Пример 2: модификация данных перед отправкой

```js
const form = document.getElementById('checkout');

form.addEventListener('formdata', (event) => {
  const data = event.formData;

  // нормализуем телефон
  const phone = data.get('phone').replace(/\D/g, '');
  data.set('phone', phone);

  // добавляем метаданные
  data.append('submittedAt', new Date().toISOString());
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!form.reportValidity()) return;

  await fetch('/api/order', {
    method: 'POST',
    body: new FormData(form)
  });
});
```

## Типичные ошибки и антипаттерны

- **Валидация только на сервере.** Клиентская валидация не заменяет серверную, но улучшает UX и уменьшает нагрузку. Делайте и то, и другое.
- **Сообщения об ошибках висят в HTML и не синхронизируются с `validationMessage`.** Дублируйте состояние из API, чтобы скринридеры и пользователи видели одно и то же.
- **Использование `:invalid` для стилизации сразу после загрузки.** При загрузке формы все обязательные пустые поля будут `:invalid`. Используй `:user-invalid` или классы после `reportValidity()`.
- **Забытый `setCustomValidity('')`.** Если один раз установить кастомную ошибку, она останется навсегда. Сбрасывайте её, когда условие исправлено.
- **Отмена `submit` без `event.preventDefault()` и без `reportValidity()`.** Проверяйте `form.reportValidity()` до отправки, иначе браузер может отправить невалидную форму.
- **Custom element без `formAssociated = true` пытается участвовать в форме.** Без этого свойства `attachInternals()` вернёт `internals`, но форма не увидит значение элемента.
- **Передача в `setFormValue` не строки.** Метод принимает `FormData`, `File` или строку. Если передать объект, получится непредсказуемое поведение.

## Ключевые тезисы для интервью

- Встроенная HTML-валидация работает через атрибуты `required`, `pattern`, `min`/`max`, `minlength`/`maxlength` и блокирует отправку формы при ошибках — без JavaScript.
- Constraint Validation API даёт полный контроль: `checkValidity()` проверяет без UI, `reportValidity()` показывает ошибки, `setCustomValidity()` задаёт кастомное сообщение; объект `ValidityState` содержит флаги (`valueMissing`, `typeMismatch`, `patternMismatch` и др.).
- `:user-valid` и `:user-invalid` удобнее `:valid`/`:invalid`, потому что не срабатывают до взаимодействия пользователя — не пугают красным сразу при загрузке формы.
- `ElementInternals` позволяет custom element участвовать в форме через `formAssociated = true` и `setFormValue()`/`setValidity()` — нишевый сценарий для библиотек компонентов.
- Событие `formdata` позволяет модифицировать данные формы непосредственно перед отправкой — удобная точка для добавления скрытых полей или трансформации значений.
- Клиентская валидация — это UX, а не безопасность. Сервер всегда должен проверять данные повторно, так как клиентскую проверку можно обойти.

## Заключение

Формы в HTML — целостная система: атрибуты задают правила, Constraint Validation API управляет проверкой, а псевдоклассы `:user-valid`/`:user-invalid` позволяют стилизовать состояния без излишней навязчивости. Событие `formdata` — удобная точка для модификации данных перед отправкой. `ElementInternals` — отдельный нишевый механизм для интеграции custom elements в формы; его достаточно знать на уровне «что это», если вы не пишете библиотеки компонентов. Клиентская валидация улучшает UX, но никогда не заменяет серверную проверку.

## Полезные ссылки

- [Form validation](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation)
- [Constraint validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation)
- [ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)
- [`formdata` event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/formdata_event)
