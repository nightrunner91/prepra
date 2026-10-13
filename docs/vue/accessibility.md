---
title: "Доступные компоненты во Vue"
section: vue
description: "Доступность Vue-компонентов: focus trap для модалок на Teleport, aria-live и Transition, атрибут inert, клавиатурные паттерны tabs/dialog/combobox и prefers-reduced-motion."
order: 17
tags: ["accessibility", "aria", "focus-management", "focus-trap", "inert", "prefers-reduced-motion"]
questions:
  - "Почему во Vue-компонентах нативные элементы предпочтительнее самодельных ARIA-виджетов"
  - "Как связаны перенос фокуса, focus trap и возврат фокуса в модалке на `<Teleport>` и зачем нужен `await nextTick()`"
  - "Зачем нужен `inert` и почему `aria-hidden` не заменяет изоляцию фона"
  - "Почему live-регион нельзя создавать одновременно с текстом и как это влияет на связку с `<Transition>`"
  - "Как `roving tabindex` в tabs и `aria-activedescendant` в combobox обеспечивают клавиатурную навигацию"
  - "Как `prefers-reduced-motion` влияет на анимации Vue и как его учитывать"
  - "Как тестировать доступность Vue-компонентов и почему автотесты не заменяют ручную проверку"
answers:
  - "Нативные `<button>`, `<dialog>` и `<details>` уже несут семантику, фокус и клавиатурные обработчики, тогда как `div` с ARIA требует вручную добавить `tabindex`, обработчики `Enter`/`Space`, состояния и визуальный фокус — ARIA добавляют только там, где нативного элемента не хватает."
  - "Модалка на `<Teleport>` должна перенести фокус внутрь диалога, удержать `Tab`/`Shift+Tab` внутри него (focus trap) и вернуть фокус на триггер при закрытии; `await nextTick()` нужен потому, что узел появляется в DOM не синхронно, и без ожидания фокусировать ещё нечего."
  - "`inert` делает поддерево целиком нефокусируемым и удаляет его из дерева доступности, а `aria-hidden` скрывает контент от скринридера, но оставляет интерактивные элементы в порядке фокуса — из-за этого возникает конфликт."
  - "Если регион добавляется в DOM вместе с текстом, скринридер не успевает подписаться и не озвучивает изменение, поэтому текст меняют в постоянном контейнере; `<Transition>` с `v-if` удаляет узел и создаёт заново, так что визуальный toast и live-регион разделяют."
  - "В tabs активная вкладка имеет `tabindex=\"0\"`, остальные — `tabindex=\"-1\"`, а переключение идёт стрелками и `Home`/`End` с явным `focus()`; в combobox фокус остаётся в поле, а активную опцию помечает `aria-activedescendant`."
  - "Настраивают `matchMedia('(prefers-reduced-motion: reduce)')` или VueUse `usePreferredReducedMotion` и при `reduce` обнуляют длительности — через CSS-медиазапрос или `:duration=\"0\"`/`:css=\"false\"` у `<Transition>`."
  - "Доступность проверяют тремя слоями: линтер `eslint-plugin-vuejs-accessibility`, axe-тесты (`vitest-axe`, `@axe-core/playwright`) и ручной проход интерфейса клавиатурой со скринридером — автоматика находит лишь часть проблем."
---

# Доступные компоненты во Vue

Vue отлично подходит для сборки сложных UI, но фреймворк не делает интерфейс доступным автоматически. Как только компонент становится переиспользуемым — модалка, вкладки, выпадающий список, аккордеон — вместе с его API появляются обязательства: управлять фокусом, объявлять изменения скринридеру, поддерживать клавиатуру и не ломать ожидания пользователей вспомогательных технологий.

Доступность (a11y) — это не отдельная «галочка» в конце проекта, а часть проектирования компонента. В этой статье разберём, как во Vue управлять фокусом и делать focus trap для модалок на `<Teleport>`, изолировать фон атрибутом `inert`, связывать `aria-live` с `<Transition>`, реализовывать доступные паттерны tabs, dialog, disclosure и combobox, а также уважать `prefers-reduced-motion`.

## Содержание

1. [Зачем нужна доступность компонентов](#зачем-нужна-доступность-компонентов)
2. [Семантика и ARIA в компонентах](#семантика-и-aria-в-компонентах)
3. [Модалки на Teleport: фокус и focus trap](#модалки-на-teleport-фокус-и-focus-trap)
4. [Инертный фон при открытой модалке](#инертный-фон-при-открытой-модалке)
5. [Динамические объявления: aria-live и Transition](#динамические-объявления-aria-live-и-transition)
6. [Клавиатурные паттерны](#клавиатурные-паттерны)
7. [prefers-reduced-motion](#prefers-reduced-motion)
8. [Тестирование доступности](#тестирование-доступности)
9. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
10. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
11. [Заключение](#заключение)
12. [Полезные ссылки](#полезные-ссылки)

---

## Зачем нужна доступность компонентов

Когда компонент используется один раз в контролируемом месте, многие проблемы незаметны. Как только он превращается в библиотечный — с пропсами, слотами и emits — ответственность растёт: его будут ставить в разные контексты, переиспользовать в формах, модалках и таблицах. Общая теория доступности (семантика, landmarks, ARIA) разобрана в разделе HTML/CSS; здесь важна именно **Vue-специфика**: управление фокусом через реактивные ссылки, изоляция фона при телепортации, объявления об изменениях и клавиатурное поведение.

Ключевая идея: доступность — это часть контракта компонента, такая же, как пропсы и события. Если модалка не возвращает фокус при закрытии, а вкладки не переключаются стрелками, компонент сломан для пользователя клавиатуры или скринридера — даже если визуально он безупречен.

---

## Семантика и ARIA в компонентах

### Сначала нативный элемент

Первый вопрос при проектировании компонента: **нельзя ли обойтись нативным HTML?** `<button>`, `<a href>`, `<input>`, `<select>`, `<details>` уже включают семантику, фокус и клавиатурное поведение. Vue-компонент `BaseButton`, который рендерит `<div>` вместо `<button>`, теряет всё это.

```vue
<!-- ❌ Плохо: теряются фокус, Enter/Space и роль -->
<template>
  <div class="btn" @click="emit('click')">
    <slot />
  </div>
</template>
```

```vue
<!-- ✅ Хорошо: нативная кнопка сохраняет всё поведение -->
<template>
  <button type="button" class="btn" @click="emit('click')">
    <slot />
  </button>
</template>
```

Если нужно, чтобы компонент умел быть и ссылкой, и кнопкой, используют динамический тег `<component :is>` и передают нужные атрибуты, а не «эмулируют» поведение на `div`.

### role, tabindex и aria-*

Когда нативный элемент недоступен (например, сложный виджет), компонент берёт на себя роль и состояния. Соглашение простое:

| Что | Атрибут | Когда нужен |
|---|---|---|
| Роль виджета | `role="dialog"`, `role="tablist"`, `role="combobox"` | Нет подходящего HTML-элемента |
| Порядок фокуса | `tabindex="0"` / `tabindex="-1"` | Управляемый фокус, roving tabindex |
| Состояние | `aria-expanded`, `aria-selected`, `aria-invalid` | Виджет меняет состояние |
| Связи | `aria-controls`, `aria-labelledby`, `aria-describedby` | Элемент управляет другим |
| Скрытие | `inert`, `aria-hidden` | Фон, декоративные элементы |

Правило номер один: **не дублируйте встроенные роли**. `<button role="button">` и `<nav role="navigation">` избыточны. ARIA добавляется только тогда, когда элемент или виджет меняет своё поведение относительно нативной семантики.

```vue
<script setup>
defineProps({ expanded: Boolean });
const emit = defineEmits(['toggle']);
</script>

<template>
  <button
    type="button"
    :aria-expanded="expanded"
    aria-controls="filters-panel"
    @click="emit('toggle')"
  >
    Фильтры
  </button>
</template>
```

Здесь `role` не нужен — кнопка и так кнопка, — но `aria-expanded` и `aria-controls` сообщают скринридеру, что кнопка управляет раскрывающейся областью.

---

## Модалки на Teleport: фокус и focus trap

Модальное окно — самый частый источник проблем с доступностью. Его принято рендерить через `<Teleport to="body">`, чтобы избежать конфликтов с `overflow` и `z-index`, но телепортация не добавляет доступности автоматически: нужно управлять фокусом вручную.

### Перенос фокуса при открытии

Когда модалка открывается, фокус должен перейти **внутрь** диалога. Иначе пользователь клавиатуры продолжит «ходить» по контенту под оверлеем, не видя этого. Варианты:

- фокус на первый интерактивный элемент (кнопку «Отмена», поле ввода);
- фокус на сам контейнер диалога с `tabindex="-1"` — если первый элемент может быть деструктивным (например, «Удалить»).

### Возврат фокуса при закрытии

Когда модалка закрывается, фокус обязан вернуться на элемент, который её открыл. Потерянный фокус сбрасывается в начало страницы — пользователь теряет контекст.

### Ловушка фокуса

Пока диалог открыт, `Tab` не должен уводить фокус на фон. Это и есть **focus trap**: на последнем элементе `Tab` переводит на первый, на первом `Shift+Tab` — на последний.

```ts
// composables/useFocusTrap.ts
import { watch, nextTick, onUnmounted, type Ref } from 'vue';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useFocusTrap(
  container: Ref<HTMLElement | null>,
  active: Ref<boolean>,
) {
  let previouslyFocused: HTMLElement | null = null;

  const getFocusable = () =>
    container.value
      ? Array.from(container.value.querySelectorAll<HTMLElement>(FOCUSABLE))
      : [];

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;

    const focusable = getFocusable();
    if (focusable.length === 0) {
      event.preventDefault();
      container.value?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const current = document.activeElement;

    if (event.shiftKey && (current === first || current === container.value)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  }

  watch(active, async (isActive) => {
    if (isActive) {
      previouslyFocused = document.activeElement as HTMLElement;
      await nextTick(); // ждём, пока Teleport отрендерит контейнер
      (getFocusable()[0] ?? container.value)?.focus();
      document.addEventListener('keydown', onKeydown);
    } else {
      document.removeEventListener('keydown', onKeydown);
      previouslyFocused?.focus();
      previouslyFocused = null;
    }
  });

  onUnmounted(() => document.removeEventListener('keydown', onKeydown));
}
```

Компонент модалки связывает `ref` контейнера с состоянием открытия:

```vue
<script setup>
import { computed, ref } from 'vue';
import { useFocusTrap } from '@/composables/useFocusTrap';

const props = defineProps({ open: Boolean });
const emit = defineEmits(['close']);

const dialog = ref<HTMLElement | null>(null);
const isOpen = computed(() => props.open);

useFocusTrap(dialog, isOpen);
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        ref="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabindex="-1"
        class="modal"
        @keydown.esc="emit('close')"
      >
        <h2 id="modal-title">Подтвердите действие</h2>
        <slot />
        <button type="button" @click="emit('close')">Отмена</button>
      </div>
    </Transition>
  </Teleport>
</template>
```

Важные детали:

- `aria-modal="true"` сообщает вспомогательным технологиям, что остальной контент недоступен.
- `aria-labelledby` связывает диалог с его заголовком — диалог получает доступное имя.
- `tabindex="-1"` делает контейнер фокусируемым программно, но не включает его в порядок табуляции.
- Закрытие по `Escape` — ожидаемое поведение диалога; обработчик висит на контейнере, куда и попадает фокус.
- `await nextTick()` обязателен: при `<Transition>`/`<Teleport>` контейнер появляется в DOM не синхронно, а на следующем тике.

### Нативный `<dialog>` как альтернатива

Прежде чем писать ловушку фокуса самому, стоит рассмотреть нативный элемент `<dialog>`. Вызов `showModal()` бесплатно даёт модальность, ловушку фокуса, закрытие по `Escape`, возврат фокуса и `::backdrop`:

```vue
<script setup>
import { ref, watch } from 'vue';

const props = defineProps({ open: Boolean });
const dialog = ref<HTMLDialogElement | null>(null);

watch(
  () => props.open,
  (open) => {
    if (open) dialog.value?.showModal();
    else dialog.value?.close();
  },
);
</script>

<template>
  <dialog ref="dialog" @close="$emit('close')">
    <h2>Подтвердите действие</h2>
    <button type="button" @click="dialog?.close()">Отмена</button>
  </dialog>
</template>
```

`<dialog>` поддерживается всеми современными браузерами, поэтому для стандартной модалки это самый короткий путь к доступности. Самодельный focus trap нужен, когда требуется нестандартное поведение или поддержка очень старых движков.

---

## Инертный фон при открытой модалке

Даже с focus trap остаётся проблема: контент под оверлеем остаётся в дереве доступности. Пользователь скринридера может прочитать его, «пройдя» виртуальным курсором за пределы диалога, а ссылки фона могут получить фокус, если trap дал сбой.

Раньше для этого использовали `aria-hidden="true"` на корневом контейнере приложения. Проблема в том, что `aria-hidden` **не убирает элементы из порядка фокуса**: получается конфликт — элемент скрыт для скринридера, но всё ещё фокусируем. Это ошибка доступности.

Современное решение — HTML-атрибут **`inert`**. Он делает поддерево целиком неинтерактивным: элементы не фокусируются, не кликаются и исчезают из дерева доступности.

```vue
<script setup>
import { ref, watchEffect } from 'vue';

const isOpen = ref(false);

watchEffect(() => {
  // модалка телепортирована в body, значит фон — это корень приложения
  const root = document.getElementById('app');
  if (root) root.inert = isOpen.value;
});
</script>
```

Если модалка рендерится внутри дерева (без `<Teleport>`), `inert` удобно навесить прямо в шаблоне — браузеры выставляют его как DOM-свойство:

```vue
<template>
  <div class="app" :inert="isModalOpen">
    <AppHeader />
    <router-view />
  </div>

  <Modal :open="isModalOpen" @close="isModalOpen = false" />
</template>
```

Практическое правило: для модалки используйте **и** focus trap, **и** `inert` (или нативный `<dialog>`), потому что они закрывают разные сценарии — порядок табуляции и доступность дерева соответственно.

---

## Динамические объявления: aria-live и Transition

Скринридер не «видит» изменения на экране — ему нужно сообщить о них. Для этого служат live-регионы: `role="status"` (вежливое объявление, `aria-live="polite"`) и `role="alert"` (срочное, `aria-live="assertive"`).

```vue
<script setup>
import { ref } from 'vue';

const message = ref('');

function save() {
  message.value = 'Изменения сохранены';
}
</script>

<template>
  <button type="button" @click="save">Сохранить</button>

  <div class="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
    {{ message }}
  </div>
</template>
```

```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
```

### Живой регион должен существовать заранее

Главная ошибка — создавать live-регион вместе с текстом через `v-if`:

```vue
<!-- ❌ Скринридер часто не озвучит: регион появился вместе с сообщением -->
<div v-if="message" role="status" aria-live="polite">
  {{ message }}
</div>
```

Когда узел добавляется в DOM уже с текстом, вспомогательные технологии не успевают подписаться на изменения и просто не замечают объявление. Регион должен присутствовать в DOM **постоянно**, а меняться должен только его текст — как в первом примере.

### Связка с Transition

Соблазн обернуть уведомление в `<Transition>`, чтобы оно плавно появлялось, усугубляет проблему: `<Transition>` с `v-if` удаляет узел из DOM после анимации и создаёт заново при следующем показе. Есть два рабочих подхода:

1. **Разделить визуальный и доступный слои.** Красивый toast с `aria-hidden="true"` визуально, а объявление отдаёт отдельный постоянный live-регион.
2. **Анимировать прозрачность, не удаляя узел.** Держать контейнер постоянным, менять текст и анимировать opacity/visibility.

```vue
<template>
  <!-- визуальный toast: не озвучивается, чтобы не дублировать -->
  <Transition name="toast">
    <div v-if="message" class="toast" aria-hidden="true">{{ message }}</div>
  </Transition>

  <!-- постоянный live-регион: отвечает только за объявление -->
  <div class="visually-hidden" role="status" aria-live="polite">
    {{ message }}
  </div>
</template>
```

Так анимация и доступность не мешают друг другу. Подробнее про сам `<Transition>` — в отдельной статье раздела.

---

## Клавиатурные паттерны

Доступный виджет должен работать без мыши. Ниже — четыре базовых паттерна из WAI-ARIA Authoring Practices, которые чаще всего приходится реализовывать во Vue.

### Tabs

Роли: `tablist` → `tab` + `tabpanel`. Фокус остаётся внутри `tablist`, переключение — стрелками. Порядок табуляции содержит только активную вкладку — это **roving tabindex**.

```vue
<script setup>
import { ref } from 'vue';

const tabs = [
  { id: 'profile', label: 'Профиль' },
  { id: 'security', label: 'Безопасность' },
  { id: 'billing', label: 'Оплата' },
];

const active = ref(tabs[0].id);
const tabRefs = ref([]);

function onKeydown(event, index) {
  let next = index;

  if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
  else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = tabs.length - 1;
  else return;

  event.preventDefault();
  active.value = tabs[next].id;
  tabRefs.value[next]?.focus();
}
</script>

<template>
  <div role="tablist" aria-label="Настройки аккаунта">
    <button
      v-for="(tab, index) in tabs"
      :key="tab.id"
      :ref="(el) => (tabRefs[index] = el)"
      role="tab"
      :id="`tab-${tab.id}`"
      :aria-selected="active === tab.id"
      :aria-controls="`panel-${tab.id}`"
      :tabindex="active === tab.id ? 0 : -1"
      @click="active = tab.id"
      @keydown="onKeydown($event, index)"
    >
      {{ tab.label }}
    </button>
  </div>

  <div
    v-for="tab in tabs"
    v-show="active === tab.id"
    :key="tab.id"
    role="tabpanel"
    :id="`panel-${tab.id}`"
    :aria-labelledby="`tab-${tab.id}`"
    tabindex="0"
  >
    <slot :name="tab.id" />
  </div>
</template>
```

`aria-selected` сообщает активную вкладку, `aria-controls`/`aria-labelledby` связывают вкладку и панель, `tabindex="-1"` убирает неактивные вкладки из табуляции, а `tabindex="0"` на панели позволяет перейти в неё клавиатурой.

### Disclosure (аккордеон)

Раскрывающийся блок — кнопка с `aria-expanded` и `aria-controls`. Самый простой доступный вариант — нативный `<details>`/`<summary>`, который умеет это из коробки.

```vue
<template>
  <!-- нативно и доступно -->
  <details>
    <summary>Дополнительные настройки</summary>
    <p>Содержимое, скрытое по умолчанию.</p>
  </details>
</template>
```

Если нужен полный контроль над разметкой, повторяем контракт вручную:

```vue
<script setup>
import { ref } from 'vue';

const isOpen = ref(false);
</script>

<template>
  <h3>
    <button
      type="button"
      :aria-expanded="isOpen"
      aria-controls="extra-settings"
      @click="isOpen = !isOpen"
    >
      Дополнительные настройки
    </button>
  </h3>

  <div v-show="isOpen" id="extra-settings">
    <p>Содержимое, скрытое по умолчанию.</p>
  </div>
</template>
```

Обратите внимание: для скрытия используется `v-show`, а не `v-if`. `v-show` оставляет элемент в DOM и переключает `display`, поэтому ссылка `aria-controls` всегда остаётся валидной.

### Dialog

Диалог разобран выше: `role="dialog"`, `aria-modal="true"`, доступное имя через `aria-labelledby`, focus trap, `Escape` для закрытия и `inert` для фона. Если контент диалога загружается асинхронно, добавьте `aria-busy="true"` на время загрузки.

### Combobox

Combobox — самый сложный из базовых паттернов: поле ввода с выпадающим списком. Фокус остаётся в поле, а активный вариант помечается через `aria-activedescendant` (фокус **не** перемещается в список).

```vue
<template>
  <div class="combobox">
    <label id="city-label" for="city">Город</label>
    <input
      id="city"
      v-model="query"
      type="text"
      role="combobox"
      autocomplete="off"
      aria-autocomplete="list"
      :aria-expanded="isOpen"
      aria-controls="city-listbox"
      :aria-activedescendant="activeId"
      @input="isOpen = true"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter="selectActive"
      @keydown.esc="isOpen = false"
    />

    <ul v-show="isOpen" id="city-listbox" role="listbox" aria-labelledby="city-label">
      <li
        v-for="(option, index) in filtered"
        :id="`city-opt-${option.id}`"
        :key="option.id"
        role="option"
        :aria-selected="index === activeIndex"
        @click="select(option)"
      >
        {{ option.label }}
      </li>
    </ul>
  </div>
</template>
```

Контракт combobox:

| Атрибут | Назначение |
|---|---|
| `role="combobox"` на `<input>` | Поле объединяет ввод и выбор из списка |
| `aria-expanded` | Открыт ли список |
| `aria-controls` | Ссылка на `listbox` |
| `aria-autocomplete="list"` | Автодополнение из списка |
| `aria-activedescendant` | id активного `role="option"` |
| `aria-selected` на опции | Текущий выбор |

Клавиатура: `↓`/`↑` перемещают активный вариант, `Enter` выбирает, `Escape` закрывает список, `Home`/`End` — к границам. Не забывайте про type-ahead (ввод символов переводит к подходящему варианту) — для сложных случаев проще взять проверенную библиотеку, чем реализовывать всё с нуля.

---

## prefers-reduced-motion

Анимации могут вызывать головокружение, тошноту и потерю ориентации у людей с вестибулярными расстройствами. Пользователь может сообщить об этом системе, а медиапризнак `prefers-reduced-motion` — передать предпочтение в CSS и JS.

CSS-подход — обесценить длительности переходов и анимаций:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

JS-подход нужен, когда анимацией управляет `<Transition>`. Можно прочитать предпочтение напрямую или через VueUse:

```ts
import { usePreferredReducedMotion } from '@vueuse/core';

const prefersReduced = usePreferredReducedMotion(); // Ref<'reduce' | 'no-preference'>
```

```vue
<template>
  <Transition :name="prefersReduced === 'reduce' ? 'none' : 'fade'">
    <div v-if="isOpen">Содержимое</div>
  </Transition>
</template>
```

Более аккуратный вариант — не менять имя, а обнулять длительность через проп `duration`:

```vue
<Transition :duration="prefersReduced === 'reduce' ? 0 : 300" name="fade">
  <div v-if="isOpen">Содержимое</div>
</Transition>
```

Это пересекается с общей темой анимаций: `prefers-reduced-motion` уже упоминается в статье про `<Transition>` и `<TransitionGroup>`, но здесь важно помнить, что отключение анимации — не украшение, а требование доступности.

---

## Тестирование доступности

Доступность проверяется в три слоя.

**1. Линтер.** `eslint-plugin-vuejs-accessibility` ловит типичные ошибки прямо в SFC: `alt` без текста, `role` без обязательных атрибутов, обработчики клика на нефокусируемых элементах.

```js
// eslint.config.js
import vueA11y from 'eslint-plugin-vuejs-accessibility';

export default [
  ...vueA11y.configs['flat/recommended'],
];
```

**2. Автоматические проверки.** `vitest-axe` / `jest-axe` прогоняют правила axe-core на отрендеренном компоненте:

```ts
import { mount } from '@vue/test-utils';
import { axe } from 'vitest-axe';
import { expect, it } from 'vitest';
import Tabs from './Tabs.vue';

it('не имеет нарушений доступности', async () => {
  const wrapper = mount(Tabs);
  expect(await axe(wrapper.element)).toHaveNoViolations();
});
```

В end-to-end тестах то же самое делает `@axe-core/playwright` на реальной странице.

**3. Ручная проверка.** Автоматика находит лишь часть проблем. Обязательный минимум: пройти интерфейс **только клавиатурой** (`Tab`, `Shift+Tab`, `Enter`, `Space`, стрелки, `Escape`), проверить видимый фокус и логичный порядок, включить скринридер (NVDA, VoiceOver) и пройти основной сценарий, увеличить страницу до 200%.

---

## Лучшие практики и антипаттерны

### Делайте

- **Начинайте с нативного элемента.** `<button>` вместо `<div role="button">`, `<details>` вместо самодельного аккордеона, `<dialog>` вместо самодельной модалки.
- **Связывайте диалог с заголовком** через `aria-labelledby` и ставьте `aria-modal="true"`.
- **Управляйте фокусом при открытии и закрытии** модалки: переносите внутрь и возвращайте на триггер.
- **Изолируйте фон** атрибутом `inert` — он снимает и фокус, и доступность.
- **Держите live-регион постоянным** и меняйте только текст.
- **Используйте `v-show` для `aria-controls`-связей**, чтобы ссылка не ломалась.
- **Уважайте `prefers-reduced-motion`** и `:focus-visible` для видимого фокуса.

### Не делайте

- **Не убирайте обводку фокуса без замены.**

```css
/* ❌ Пользователь клавиатуры теряет ориентацию */
button:focus { outline: none; }

/* ✅ Замена видимого фокуса */
button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
```

- **Не используйте положительный `tabindex`.** `tabindex="1"` ломает естественный порядок; для roving tabindex нужны только `0` и `-1`.
- **Не подменяйте `aria-hidden` изоляцией фона.** Он не мешает фокусу попасть на скрытый элемент — используйте `inert`.
- **Не создавайте live-регион одновременно с текстом.** Объявление потеряется.
- **Не вешайте `@click` на `div`.** Если элемент интерактивен — это `<button>` или `<a href>`.
- **Не полагайтесь только на цвет.** Ошибка формы должна иметь текст или `aria-invalid` и `aria-describedby`, а не только красную рамку.
- **Не забывайте про combobox-детали.** Без `aria-activedescendant`, стрелок и type-ahead виджет недоступен для клавиатуры.

---

## Ключевые тезисы для интервью

- Нативные элементы (`<button>`, `<dialog>`, `<details>`) дают семантику, фокус и клавиатуру бесплатно; ARIA добавляют только там, где их не хватает, и не дублируют встроенные роли.
- Модалка на `<Teleport>` требует трёх вещей: переноса фокуса внутрь, ловушки `Tab` и возврата фокуса на триггер; `await nextTick()` обязателен, потому что узел появляется в DOM не синхронно.
- `inert` изолирует фон целиком — убирает элементы и из порядка фокуса, и из дерева доступности, тогда как `aria-hidden` оставляет их фокусируемыми.
- Live-регион (`role="status"`/`role="alert"`) должен существовать в DOM до изменения текста, поэтому визуальный toast и объявление разделяют.
- Клавиатурные паттерны (tabs, dialog, disclosure, combobox) строятся на ролях и состояниях: roving tabindex оставляет в табуляции один элемент, а combobox держит фокус в поле через `aria-activedescendant`.
- `prefers-reduced-motion` обязателен: длительности обнуляют через CSS-медиазапрос или `duration`/`css` у `<Transition>`.
- Доступность проверяют тремя слоями — линтер (`eslint-plugin-vuejs-accessibility`), axe-тесты и ручной проход клавиатурой со скринридером.

---

## Заключение

Vue не делает интерфейс доступным автоматически, но даёт всё необходимое, чтобы собрать доступные компоненты: реактивные ссылки для управления фокусом, `<Teleport>` для модалок, `<Transition>` для визуального слоя и прямую работу с DOM-API в хуках. Доступность здесь — это контракт компонента наравне с пропсами и событиями.

Ключевые правила: начинайте с нативного элемента, управляйте фокусом при открытии и закрытии модалки, изолируйте фон через `inert`, держите live-регион постоянным и уважайте `prefers-reduced-motion`. Для сложных виджетов — tabs, dialog, combobox — опирайтесь на паттерны WAI-ARIA APG и не забывайте про `aria-selected`, `aria-activedescendant` и roving tabindex.

Попробуйте пройти свой интерфейс только клавиатурой и вслух проговорить, что должно услышать приложение при сохранении, открытии диалога и переключении вкладок. Это упражнение выявляет больше проблем, чем любой чеклист, и быстро превращает доступность в привычку проектирования.

## Полезные ссылки

- [Vue Docs — Accessibility](https://vuejs.org/guide/best-practices/accessibility.html)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN — inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert)
- [MDN — dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog)
- [MDN — prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [MDN — ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)
- [eslint-plugin-vuejs-accessibility](https://github.com/vue-a11y/eslint-plugin-vuejs-accessibility)
- [axe-core](https://github.com/dequelabs/axe-core)
