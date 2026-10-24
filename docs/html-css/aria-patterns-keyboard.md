---
title: "ARIA-паттерны и клавиатурное взаимодействие"
section: html-css
description: "Как собирать доступные tabs, dialog, menu, combobox и live-регионы: роли и состояния, roving tabindex против aria-activedescendant, управление фокусом, порталы, виртуализация и тестирование клавиатурой."
order: 8
tags: ["accessibility", "aria", "apg", "keyboard", "focus-management", "dialog", "tabs", "combobox", "live-regions", "screen-reader"]
questions:
  - "Как сделать доступные tabs без библиотеки?"
  - "Где должен находиться фокус при открытии и закрытии dialog?"
  - "Чем `aria-activedescendant` отличается от roving tabindex?"
  - "Как объявить об ошибке формы, не перебивая пользователя?"
  - "Чем disclosure отличается от accordion и зачем нужен `aria-expanded`?"
  - "Почему `role=\"menu\"` не подходит для обычной навигации по сайту?"
  - "Как собрать доступный combobox с асинхронной загрузкой?"
  - "Что ломается при порталах, вложенных диалогах и виртуализированных списках?"
  - "Какие клавиши обязательны для доступного виджета и как их тестировать?"
  - "Когда `aria-live=\"assertive\"` вредит и что использовать вместо него?"
answers:
  - "Tabs строят на трёх ролях: `tablist` — контейнер, `tab` — кнопка вкладки, `tabpanel` — панель с `aria-labelledby` на вкладку. У активной вкладки `aria-selected=\"true\"` и `tabindex=\"0\"`, у остальных `-1` (roving tabindex), `aria-controls` связывает вкладку с панелью; стрелки `←`/`→` перемещают фокус, `Home`/`End` — к краям, а панели переключаются либо сразу (automatic activation), либо по `Enter`/`Space` (manual). Панель прячут атрибутом `hidden`, а не `aria-hidden`, иначе фокус останется в невидимом контенте; сама панель получает `tabindex=\"0\"`, чтобы с клавиатуры можно было прочитать её содержимое."
  - "При открытии фокус переводится внутрь диалога — на первый осмысленный элемент или на сам диалог с `tabindex=\"-1\"`, причём лучше на безопасное действие вроде «Отмена», а не на деструктивное. `Esc` закрывает диалог, а после закрытия фокус возвращается на элемент, который его открыл; нативный `<dialog>` с `showModal()` делает фон `inert` и удерживает фокус сам, а кастомной модалке нужно вручную включить `inert` на остальное приложение, реализовать цикл фокуса и восстановление. Возврат фокуса — часть контракта: без него пользователь клавиатуры теряет место в интерфейсе."
  - "`aria-activedescendant` оставляет DOM-фокус на поле ввода или контейнере и через id указывает на «активный» вариант, который скринридер объявляет как текущий; это стандартный подход для combobox и listbox с полем поиска. Roving tabindex, наоборот, перемещает реальный фокус между элементами: у активного `tabindex=\"0\"`, у остальных `-1`. Первый вариант проще для ввода текста и не требует управлять фокусом на каждом варианте, второй естественнее для tabs, menu и toolbar, где DOM-фокус и есть выбор."
  - "Ошибку показывают после взаимодействия с полем или после отправки, а не при первой загрузке. Поле получает `aria-invalid=\"true\"` и `aria-describedby` на видимый текст ошибки, при submit фокус переводится на error summary или первое невалидное поле. Для асинхронной проверки достаточно `role=\"status\"`/`aria-live=\"polite\"`, а `role=\"alert\"` и перемещение фокуса одновременно применять не стоит: скринридер может объявить сообщение дважды или перебить пользователя посреди ввода."
  - "Disclosure — это одна кнопка, которая показывает и скрывает связанный блок: у неё `aria-expanded=\"true|false\"` и `aria-controls`, а содержимое остаётся в DOM или скрывается через `hidden`. Accordion — группа таких disclosure-блоков, обычно с заголовками `<h3><button>...</button></h3>` и опциональной навигацией стрелками; это не tabs, потому что здесь можно открыть несколько секций и нет `aria-selected`. `aria-expanded` обязателен: без него скринридер не знает, раскрыт блок или нет, даже если визуально это видно по стрелке."
  - "`role=\"menu\"` описывает меню приложения с командами и особым режимом: стрелки, `Home`/`End`, typeahead, `Esc`, а скринридер переключается в режим, где каждая строка — `menuitem`. Обычная навигация по сайту — это ссылки в `<nav>` и списке, где `Tab` и стандартный режим чтения работают предсказуемо; если повесить `menu` на список ссылок, пользователь получит неверные ожидания и лишние клавиатурные правила. Для выпадающих действий используют menu button, а для раскрывающегося блока ссылок — disclosure."
  - "Combobox — это поле ввода с `role=\"combobox\"`, `aria-expanded`, `aria-controls` на listbox и `aria-autocomplete=\"list\"`, а список — `role=\"listbox\"` с `role=\"option\"` и `aria-selected`. Фокус остаётся в поле, активный вариант отмечается через `aria-activedescendant`; `↓`/`↑` двигают активный вариант, `Enter` выбирает, `Esc` закрывает, `Alt+↓` открывает список. При асинхронной загрузке дебаунсят запрос, отменяют предыдущий через `AbortController`, не объявляют каждое нажатие и показывают состояние загрузки и пустой результат в вежливом live-регионе."
  - "Портал выносит диалог или меню в конец `body`, поэтому DOM-порядок перестаёт совпадать с визуальным: ломаются порядок `Tab`, возврат фокуса и ссылки `aria-labelledby`, если заголовок остался в другом поддереве. Виртуализированные списки размонтируют варианты, и `aria-activedescendant` начинает указывать на несуществующий id, а скринридер теряет размер списка; помогают `aria-setsize`/`aria-posinset`, стабильные id, удержание активного варианта в DOM и отказ от агрессивной виртуализации для небольших списков. В мобильных скринридерах добавляется режим обхода касанием, поэтому автоматические перемещения фокуса и слишком частая смена live-региона раздражают сильнее, чем на десктопе."
  - "Минимальный набор: `Tab` входит в виджет и выходит из него, стрелки перемещают внутри, `Home`/`End` — к первому и последнему элементу, `Enter`/`Space` активируют, `Esc` закрывает overlay и возвращает фокус, в меню и listbox работает typeahead. Проверяют не только наличие клавиш, но и отсутствие ловушек, видимый фокус, обновление `aria-expanded`/`aria-selected` и возврат фокуса; автоматизируют сценарии в Playwright через `keyboard.press`, а объявления и режимы скринридера проверяют руками в NVDA/VoiceOver/TalkBack."
  - "`assertive` прерывает текущую речь скринридера, поэтому он вредит на каждом нажатии клавиши, при фильтрации поиска, в стеке тостов и в валидации «на лету»: пользователь не успевает дослушать поле. Для большинства обновлений достаточно `role=\"status\"`/`aria-live=\"polite\"`, `aria-atomic=\"true\"` и короткого текста; `role=\"alert\"` оставляют для критичных ошибок, которые требуют немедленной реакции. Регион должен существовать в DOM до обновления, а комбинировать `alert` с перемещением фокуса на тот же текст не стоит из-за двойного объявления."
---

# ARIA-паттерны и клавиатурное взаимодействие

На собеседовании UI Engineer редко просят «рассказать про ARIA» в общем. Чаще дают практическую задачу: собрать tabs, диалог подтверждения, combobox с поиском или выпадающее меню — и проверить, работает ли это с клавиатуры и скринридера. Именно здесь видно разницу между разработчиком, который знает атрибуты, и тем, кто понимает модель взаимодействия.

Предыдущая статья — [Доступность: WCAG 2.2, дерево доступности и аудит](./accessibility-wcag.md) — объясняет, что видит вспомогательная технология и как проверять страницу. Эта статья про следующий слой: как устроены составные виджеты, какие роли и состояния им нужны, как управлять фокусом и что ломается в реальных приложениях — порталах, виртуализации и асинхронности.

## Содержание

1. [Глубокий разбор](#глубокий-разбор)
2. [Практические примеры](#практические-примеры)
3. [Типичные ошибки и антипаттерны](#типичные-ошибки-и-антипаттерны)
4. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
5. [Практическое задание и code review-чеклист](#практическое-задание-и-code-review-чеклист)
6. [Заключение](#заключение)
7. [Полезные ссылки](#полезные-ссылки)

---

## Глубокий разбор

### Зачем нужен APG и когда хватит нативного элемента

**ARIA Authoring Practices Guide (APG)** — это не стандарт, а каталог проверенных паттернов: какие роли, состояния и клавиши ожидаются от tabs, dialog, menu, combobox, tree, grid и других виджетов. APG полезен как словарь ожиданий, но у него есть важная оговорка: это рекомендации, а не единственный допустимый способ.

Порядок принятия решений для UI Engineer выглядит так:

1. **Нативный элемент.** `<button>`, `<a href>`, `<input>`, `<select>`, `<details>`, `<dialog>` уже дают роль, фокус и клавиатурное поведение. Это лучший вариант.
2. **Нативный элемент с небольшой доработкой.** Например, `<dialog>` плюс управление возвратом фокуса или `<details>` плюс синхронизация `aria-expanded`, если это нужно дизайну.
3. **APG-паттерн на составных элементах.** Tabs, combobox, menu, tree, grid — там, где нативного аналога нет или он недостаточно гибок.
4. **Собственный паттерн.** Только если он документирован, протестирован со скринридерами и не противоречит ожиданиям пользователей.

Главное правило: **ARIA меняет семантику, но не добавляет поведение**. `<div role="tab" aria-selected="true">` не станет вкладкой: ему нужны `tabindex`, обработка стрелок, переключение панелей и визуальный фокус. Поэтому на интервью хороший ответ начинается не с атрибутов, а с вопроса: «а это точно не решается нативным элементом?»

### Анатомия доступного виджета

У любого составного виджета есть пять слоёв, и пропуск любого из них виден пользователю:

| Слой | Вопрос | Примеры |
|---|---|---|
| **Роль** | Что это за элемент? | `tablist`, `tab`, `dialog`, `listbox`, `menu` |
| **Имя** | Как это называется? | видимый текст, `aria-labelledby`, `aria-label` |
| **Состояние** | Что с ним сейчас? | `aria-expanded`, `aria-selected`, `aria-checked`, `aria-disabled` |
| **Связи** | С чем это связано? | `aria-controls`, `aria-describedby`, `aria-activedescendant` |
| **Поведение** | Как этим управлять? | `Tab`, стрелки, `Home`/`End`, `Enter`, `Space`, `Esc` |

Роль без состояния бесполезна: кнопка с `aria-expanded` без обновления врёт скринридеру. Состояние без имени нечитаемо: пользователь слышит «свёрнуто», но не знает, что именно. Поведение без роли создаёт «див с обработчиком»: мышь работает, клавиатура — нет.

Есть и обратная крайность — **ARIA-шум**. Если навесить `role="region"` на каждую секцию, `aria-live` на весь список результатов и `aria-label` на каждый `div`, дерево доступности станет шумным, а навигация по landmarks потеряет смысл. Хорошая ARIA почти незаметна: она добавляет ровно те связи и состояния, которых не хватает нативной разметке.

### Disclosure и accordion

**Disclosure** — самый простой паттерн: кнопка раскрывает и скрывает связанный блок. Он не требует `role`, потому что `<button>` уже даёт роль и клавиатуру.

```html
<h3>
  <button type="button" aria-expanded="false" aria-controls="shipping">
    Доставка
  </button>
</h3>
<div id="shipping" hidden>
  <p>Курьером — 1–2 дня, самовывоз — в день заказа.</p>
</div>
```

```js
const trigger = document.querySelector('[aria-controls="shipping"]');
const panel = document.getElementById('shipping');

trigger.addEventListener('click', () => {
  const expanded = trigger.getAttribute('aria-expanded') === 'true';
  trigger.setAttribute('aria-expanded', String(!expanded));
  panel.hidden = expanded;
});
```

Что важно:

- **Кнопка внутри заголовка.** Заголовок сохраняет структуру страницы, а кнопка даёт фокус и активацию. Так пользователь может перейти к секции по заголовкам и раскрыть её.
- **`aria-expanded` обновляется синхронно с видимостью.** Если анимация задерживает появление, состояние всё равно должно соответствовать тому, что скоро станет видно.
- **`aria-controls` полезен, но не критичен.** Поддержка связи скринридерами нестабильна, поэтому не полагайтесь на неё как на единственный источник контекста.
- **`hidden` вместо `aria-hidden`.** Скрытый блок не должен оставаться в tab-порядке.

**Accordion** — это несколько disclosure-блоков. В APG у него есть опциональная навигация стрелками между заголовками, `Home`/`End` и правила «один открыт» или «несколько открыты». Но принципиально это тот же механизм. Не превращайте accordion в tabs: в tabs выбран ровно один элемент и есть `aria-selected`, в accordion секции независимы.

Если панель большая и самостоятельная, ей можно дать `role="region"` и `aria-labelledby` на кнопку — тогда она появится в списке landmarks. Но злоупотреблять этим не стоит: десять `region` подряд превращают навигацию в лабиринт.

### Tabs: roving tabindex и переключение панелей

Tabs — один из самых частых вопросов на практических интервью. Ожидаемая модель:

- контейнер — `role="tablist"`, у него есть доступное имя;
- каждая вкладка — `role="tab"`, `aria-selected`, `aria-controls`;
- панель — `role="tabpanel"`, `aria-labelledby` на вкладку, `tabindex="0"`;
- в tab-порядке вся группа занимает **одну** позицию: активная вкладка `tabindex="0"`, остальные `-1`;
- `←`/`→` двигают фокус, `Home`/`End` — к краям;
- `Enter`/`Space` выбирают вкладку при manual activation;
- `Esc` не обязателен, если вкладки не находятся внутри другого overlay.

Есть два режима активации:

- **Automatic activation** — стрелка сразу переключает панель. Подходит, когда панели уже загружены и переключение дешёвое.
- **Manual activation** — стрелка только перемещает фокус, выбор происходит по `Enter`/`Space`. Нужен, когда переключение запускает сетевой запрос или перерисовку, которую пользователь не хочет инициировать каждым нажатием.

В RTL-интерфейсе направление стрелок инвертируется: в `dir="rtl"` `ArrowRight` должен вести к предыдущей вкладке. Это частая деталь, которую забывают.

### Dialog: фокус, inert и возврат

Диалог — место, где ломается больше всего сценариев. Контракт модального окна:

1. **Фокус внутри.** При открытии он переходит в диалог, а не остаётся на фоне.
2. **Фон недоступен.** Остальная страница не фокусируется и не кликается.
3. **Фокус не выходит наружу.** Цикл `Tab`/`Shift+Tab` замыкается внутри.
4. **`Esc` закрывает.** Если закрытие опасно (несохранённые данные), его можно перехватить и спросить подтверждение.
5. **Фокус возвращается на триггер.** Или на логически следующее место, если триггер исчез.
6. **Заголовок связан с диалогом.** `aria-labelledby` на `h2` внутри диалога.

Нативный `<dialog>` с `showModal()` закрывает пункты 2–4 сам: браузер делает остальной документ `inert`, удерживает фокус и закрывает по `Esc`. Это предпочтительный вариант для большинства случаев. Кастомная модалка (drawer, полноэкранный sheet, портал) требует ручной реализации всех пунктов.

Важная деталь: **`aria-hidden` на фоне — неправильный инструмент**. Он убирает фон из дерева доступности, но оставляет фокусируемые элементы в tab-порядке. Используйте `inert` — он убирает поддерево из дерева доступности, tab-порядка и событий. Подробнее — в [статье про WCAG](./accessibility-wcag.md#aria-hidden-vs-inert).

Куда ставить фокус при открытии:

- **На первый осмысленный элемент** — если диалог длинный и пользователь пришёл что-то читать или заполнять.
- **На сам диалог** (`tabindex="-1"`) — если контент статичный и первый элемент случайный.
- **На безопасное действие** — «Отмена», а не «Удалить». Иначе случайный `Enter` выполнит деструктивную операцию.

Не ставьте автофокус на поле, если диалог открылся после действия пользователя и он ещё не решил, что вводить: это может вызвать нежелательную мобильную клавиатуру и сбить контекст.

### Menu и menubar: почему не для навигации

`role="menu"` — самый неправильно используемый паттерн. Он нужен для **меню команд**, как в десктопных приложениях: «Переименовать», «Дублировать», «Удалить». У него особый режим взаимодействия:

- `Tab` не ходит по пунктам: он входит в меню и выходит из него;
- стрелки `↑`/`↓` перемещают фокус между `menuitem`;
- `Home`/`End` — к первому и последнему пункту;
- `Enter`/`Space` активируют пункт;
- `Esc` закрывает меню и возвращает фокус на кнопку;
- набор символов (typeahead) перемещает к пункту, начинающемуся с этих букв.

Для навигации по сайту это не подходит. Ссылки в шапке — это `<nav>` со списком `<a>`, где работают обычный `Tab` и режим чтения скринридера. Если навесить `menu` на список ссылок, пользователь VoiceOver/NVDA попадёт в режим, где ожидаются команды и стрелки, а получит переходы по страницам.

Правильные альтернативы:

| Задача | Паттерн |
|---|---|
| Раскрыть блок с ссылками или текстом | Disclosure |
| Кнопка с меню действий | Menu button + `role="menu"` |
| Верхнее меню приложения с командами | Menubar + `role="menubar"` |
| Навигация по сайту | `<nav>` + ссылки/список |

Menu button — это кнопка с `aria-haspopup="menu"`, `aria-expanded` и `aria-controls`, которая открывает меню и переводит фокус на первый пункт. При закрытии фокус возвращается на кнопку. Вложенные меню (submenu) добавляют `aria-haspopup="menu"`, `aria-expanded` и открытие по `→`, но сложность быстро растёт: если вложенность не обязательна, лучше упростить интерфейс.

### Listbox и combobox: activedescendant против roving tabindex

**Combobox** — поле ввода с выпадающим списком. В ARIA 1.2 модель такая:

```html
<label for="city">Город</label>
<input
  id="city"
  role="combobox"
  aria-expanded="false"
  aria-controls="city-listbox"
  aria-autocomplete="list"
  autocomplete="off"
>
<ul id="city-listbox" role="listbox" aria-label="Города" hidden>
  <li role="option" id="city-option-0" aria-selected="false">Москва</li>
  <li role="option" id="city-option-1" aria-selected="false">Санкт-Петербург</li>
</ul>
```

Ключевое отличие от нативного `<select>`: фокус **остаётся в поле ввода**. Пользователь продолжает печатать, а скринридер объявляет активный вариант через `aria-activedescendant`:

```html
<input aria-activedescendant="city-option-1" ...>
```

Два подхода к навигации:

| | `aria-activedescendant` | Roving tabindex |
|---|---|---|
| Где DOM-фокус | На контейнере или поле | На активном элементе |
| Кто получает фокус | Один элемент | Каждый элемент по очереди |
| Типичные паттерны | Combobox, listbox, grid | Tabs, menu, toolbar |
| Плюсы | Ввод не прерывается, меньше DOM-фокусов | Естественная работа скринридера с элементом |
| Минусы | Нужны стабильные id и элемент в DOM | Нужно управлять `tabindex` при каждом переходе |

Для combobox `aria-activedescendant` почти всегда лучше: иначе при перемещении фокуса в список пользователь перестаёт печатать. Для tabs и menu — roving tabindex: там сам фокус и есть выбор.

Состояния combobox:

- `aria-expanded="true|false"` — открыт ли список;
- `aria-controls` — id listbox;
- `aria-autocomplete="list"` — список подсказывает варианты;
- `aria-selected="true"` на активном варианте (в single-select listbox);
- `aria-activedescendant` — id активного варианта;
- `aria-busy="true"` на listbox или статус-регионе — пока идёт загрузка.

Клавиатура:

- `↓` — открыть список и перейти к первому варианту;
- `↑`/`↓` — двигать активный вариант;
- `Alt+↓` — открыть список, не меняя ввод;
- `Enter` — выбрать активный вариант;
- `Esc` — закрыть список, не очищая ввод;
- `Tab` — закрыть список и уйти к следующему полю;
- `Home`/`End` — к первому/последнему варианту, если курсор не в тексте.

### Tooltip, grid и tree: коротко о границах

**Tooltip** — это подсказка, а не интерактивный элемент. Она появляется по hover и focus, связана с триггером через `aria-describedby`, закрывается по `Esc` и не содержит кнопок или ссылок. Если внутри есть действия, это уже popover или dialog, а не tooltip. На touch tooltip по hover недоступен, поэтому важная информация не должна жить только в нём.

**Grid** (`role="grid"`) — интерактивная таблица с ячейками, по которым ходят стрелками. Это не «таблица для раскладки» и не замена `<table>` для статичных данных. Если данные только читают, используйте `<table>` с `<caption>`, `<th scope>` и нативными заголовками. `role="grid"` оправдан для редактируемых таблиц, календарей и spreadsheet-подобных интерфейсов, где нужна двумерная навигация.

**Tree** (`role="tree"`, `treeitem`, `group`) — иерархия с раскрытием узлов: файловое дерево, категории, оглавление. Клавиши: `↑`/`↓` между видимыми узлами, `→` раскрыть или перейти к первому ребёнку, `←` свернуть или подняться к родителю, `Home`/`End` — к краям. Если иерархия неглубокая и не требует клавиатурной навигации, хватит вложенных списков и disclosure.

### Live regions: как объявлять изменения

Live region — механизм, который сообщает скринридеру об изменении контента без перемещения фокуса. Это нужно для статусов, ошибок, результатов поиска и уведомлений.

| Атрибут/роль | Поведение | Когда использовать |
|---|---|---|
| `role="status"` | Неявно `aria-live="polite"`, `aria-atomic="true"` | Загрузка, сохранение, «5 результатов» |
| `role="alert"` | Неявно `aria-live="assertive"`, `aria-atomic="true"` | Критичная ошибка, требующая немедленной реакции |
| `role="log"` | Вежливые добавления, старые сообщения сохраняются | Чат, журнал событий |
| `aria-live="polite"` | Объявляет после текущей речи | Большинство динамики |
| `aria-live="assertive"` | Прерывает текущую речь | Только критичное |
| `aria-atomic="true"` | Читает регион целиком | Когда важен полный текст сообщения |

Правила, которые чаще всего нарушают:

1. **Регион должен существовать до изменения.** Если создать `<div role="status">` и текст одновременно, скринридер может не успеть подписаться. Контейнер рендерят заранее, а меняют только его содержимое.
2. **Не объявляйте каждое нажатие.** Фильтрация по каждой букве с `aria-live` превращается в поток. Дебаунсьте и объявляйте итог: «Найдено 5 городов».
3. **`assertive` — не «важнее», а «громче».** Он перебивает пользователя. Для ошибок валидации после submit обычно достаточно фокуса на error summary, а для асинхронной проверки — `polite`.
4. **Один регион — одна мысль.** Длинный текст в `role="alert"` читается целиком и блокирует остальное.
5. **Не дублируйте объявление.** `role="alert"` плюс перевод фокуса на тот же блок часто дают двойное чтение.

```html
<!-- Регион существует заранее, текст меняется позже -->
<p id="search-status" role="status" aria-atomic="true"></p>
```

```js
const status = document.querySelector('#search-status');

function announce(message) {
  status.textContent = '';
  // Небольшая пауза помогает некоторым скринридерам заметить изменение
  requestAnimationFrame(() => {
    status.textContent = message;
  });
}
```

### Сложные случаи: порталы, виртуализация, мобильные скринридеры

**Порталы и Teleport.** Диалог, поповер или меню часто рендерят в конец `<body>`, чтобы не бороться с `overflow: hidden` и stacking context. Проблемы:

- DOM-порядок перестаёт совпадать с визуальным — `Tab` может уйти не туда;
- `aria-labelledby` ссылается на заголовок, который остался в другом поддереве;
- возврат фокуса ломается, если триггер размонтирован;
- фон нужно изолировать через `inert`, а не `aria-hidden`.

Решение: хранить ссылку на триггер, после закрытия возвращать фокус, держать заголовок и описание внутри портала, а фон изолировать `inert`. Если диалогов два, вложенность должна быть осмысленной: второй диалог поверх первого — это отдельный слой с собственным `inert` на нижележащем.

**Виртуализированные списки.** В списке из 10 000 элементов в DOM живут только 20. Скринридер видит неполный список, а `aria-activedescendant` может указывать на вариант, которого уже нет. Что помогает:

- `aria-setsize` и `aria-posinset` на каждом варианте — сообщают общий размер и позицию;
- стабильные id, не зависящие от индекса в окне;
- активный вариант всегда остаётся в DOM;
- для небольших списков (до нескольких сотен) виртуализацию лучше не включать;
- при прокрутке не перемещать фокус без действия пользователя.

**Мобильные скринридеры.** VoiceOver и TalkBack работают иначе: есть режим обхода касанием, ротор и виртуальный курсор. Слишком агрессивное управление фокусом, `aria-live` на каждом шаге и кастомные жесты часто раздражают сильнее, чем помогают. Проверяйте не только десктопный NVDA, но и мобильный сценарий, особенно для combobox, date picker и drag-and-drop.

**Вложенные интерактивные элементы.** Кнопка внутри ссылки, ссылка внутри кнопки, кнопка внутри `label` — невалидная и непредсказуемая комбинация. Скринридер видит один элемент, а клавиатура — другой. Разделяйте действия на соседние элементы.

## Практические примеры

### Пример 1. Доступные tabs на чистом JS и в React

```html
<div class="tabs">
  <div role="tablist" aria-label="Настройки профиля">
    <button
      role="tab"
      id="tab-profile"
      aria-controls="panel-profile"
      aria-selected="true"
      tabindex="0"
    >Профиль</button>
    <button
      role="tab"
      id="tab-security"
      aria-controls="panel-security"
      aria-selected="false"
      tabindex="-1"
    >Безопасность</button>
    <button
      role="tab"
      id="tab-notifications"
      aria-controls="panel-notifications"
      aria-selected="false"
      tabindex="-1"
    >Уведомления</button>
  </div>

  <div role="tabpanel" id="panel-profile" aria-labelledby="tab-profile" tabindex="0">
    ...
  </div>
  <div role="tabpanel" id="panel-security" aria-labelledby="tab-security" tabindex="0" hidden>
    ...
  </div>
  <div role="tabpanel" id="panel-notifications" aria-labelledby="tab-notifications" tabindex="0" hidden>
    ...
  </div>
</div>
```

```js
const tablist = document.querySelector('[role="tablist"]');
const tabs = [...tablist.querySelectorAll('[role="tab"]')];

function selectTab(next, { focus = true } = {}) {
  if (next.getAttribute('aria-selected') === 'true') return;

  for (const tab of tabs) {
    const selected = tab === next;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
  }

  if (focus) next.focus();
}

tablist.addEventListener('click', (event) => {
  const tab = event.target.closest('[role="tab"]');
  if (tab) selectTab(tab);
});

tablist.addEventListener('keydown', (event) => {
  const index = tabs.indexOf(document.activeElement);
  if (index === -1) return;

  let next;
  switch (event.key) {
    case 'ArrowRight':
      next = tabs[(index + 1) % tabs.length];
      break;
    case 'ArrowLeft':
      next = tabs[(index - 1 + tabs.length) % tabs.length];
      break;
    case 'Home':
      next = tabs[0];
      break;
    case 'End':
      next = tabs[tabs.length - 1];
      break;
    default:
      return;
  }

  event.preventDefault();
  selectTab(next);
});
```

Почему так:

- вся группа — одна остановка `Tab`, дальше работают стрелки;
- `aria-selected` и `hidden` меняются вместе, состояние не врёт;
- `Home`/`End` дают быстрый доступ к краям;
- панель с `tabindex="0"` позволяет с клавиатуры войти в её содержимое и прочитать его.

Для manual activation уберите вызов `selectTab` из `keydown` и оставьте только перемещение фокуса:

```js
next.focus();
// выбор — по Enter/Space
tablist.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    selectTab(document.activeElement);
  }
});
```

В React та же логика живёт в состоянии, а не в DOM:

```tsx
import { useId, useRef, useState } from 'react';

type Tab = { id: string; label: string; content: React.ReactNode };

export function Tabs({ items, label }: { items: Tab[]; label: string }) {
  const baseId = useId();
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: React.KeyboardEvent) {
    let next = active;
    if (event.key === 'ArrowRight') next = (active + 1) % items.length;
    else if (event.key === 'ArrowLeft') next = (active - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else return;

    event.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label={label} onKeyDown={onKeyDown}>
        {items.map((item, index) => {
          const selected = index === active;
          return (
            <button
              key={item.id}
              ref={(node) => { refs.current[index] = node; }}
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-controls={`${baseId}-panel-${item.id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {items.map((item, index) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          tabIndex={0}
          hidden={index !== active}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
```

`useId` здесь не украшение: без уникальных id несколько экземпляров tabs на странице начнут ссылаться на чужие панели.

### Пример 2. Нативный dialog с возвратом фокуса

```html
<button type="button" id="open-settings" aria-haspopup="dialog">
  Настройки
</button>

<dialog id="settings-dialog" aria-labelledby="settings-title">
  <h2 id="settings-title">Настройки уведомлений</h2>

  <label>
    <input type="checkbox" checked>
    Присылать дайджест раз в неделю
  </label>

  <div class="dialog-actions">
    <button type="button" data-close>Отмена</button>
    <button type="submit">Сохранить</button>
  </div>
</dialog>
```

```js
const dialog = document.querySelector('#settings-dialog');
const trigger = document.querySelector('#open-settings');

trigger.addEventListener('click', () => {
  dialog.showModal();
  dialog.querySelector('[data-close]').focus();
});

dialog.querySelector('[data-close]').addEventListener('click', () => {
  dialog.close();
});

dialog.addEventListener('click', (event) => {
  // Клик по backdrop приходит с target === dialog
  if (event.target === dialog) dialog.close();
});

dialog.addEventListener('close', () => {
  trigger.focus();
});
```

Что делает браузер:

- `showModal()` добавляет диалог в **top layer** и делает остальной документ `inert`;
- фокус удерживается внутри, `Esc` вызывает `cancel` и закрывает диалог;
- `::backdrop` позволяет стилизовать затемнение без отдельного оверлея;
- после закрытия современные браузеры возвращают фокус на триггер, но явный вызов делает поведение предсказуемым и в кастомных сценариях.

Чего не хватает нативному `<dialog>`:

- **Стилизация** ограничена, но `::backdrop` и обычный CSS закрывают большинство задач.
- **Анимация** требует `@starting-style` и `transition-behavior: allow-discrete` — это тема отдельной статьи про motion.
- **Вложенные диалоги** работают, но требуют аккуратного возврата фокуса: закрывайте верхний и возвращайте фокус на элемент, который его открыл, а не сразу на исходный триггер.

Если дизайн требует кастомный drawer или sheet, минимум такой:

```js
function openDrawer(drawer, trigger) {
  const app = document.querySelector('#app');
  const previous = document.activeElement;
  app.inert = true;
  drawer.hidden = false;
  const initial = drawer.querySelector('[data-autofocus]') ?? drawer;
  initial.focus();
  return () => {
    drawer.hidden = true;
    app.inert = false;
    (trigger ?? previous)?.focus();
  };
}
```

Это только каркас: ещё нужны цикл `Tab`, закрытие по `Esc`, блокировка прокрутки и корректная работа с порталом. У самого drawer должен быть `tabindex="-1"`, иначе `drawer.focus()` не сработает.

### Пример 3. Combobox с `aria-activedescendant` и асинхронным поиском

```html
<div class="combobox">
  <label for="city">Город</label>
  <input
    id="city"
    role="combobox"
    aria-expanded="false"
    aria-controls="city-listbox"
    aria-autocomplete="list"
    autocomplete="off"
    placeholder="Начните вводить"
  >
  <ul id="city-listbox" role="listbox" aria-label="Города" hidden></ul>
  <p id="city-status" role="status" aria-atomic="true"></p>
</div>
```

```js
const input = document.querySelector('#city');
const listbox = document.querySelector('#city-listbox');
const status = document.querySelector('#city-status');

let options = [];
let activeIndex = -1;
let controller;

function setExpanded(expanded) {
  input.setAttribute('aria-expanded', String(expanded));
  listbox.hidden = !expanded;
}

function render(items, query) {
  options = items;
  activeIndex = items.length > 0 ? 0 : -1;
  listbox.replaceChildren(
    ...items.map((item, index) => {
      const option = document.createElement('li');
      option.id = `city-option-${item.id}`;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', String(index === activeIndex));
      option.textContent = item.label;
      option.addEventListener('mousedown', (event) => {
        event.preventDefault();
        choose(item);
      });
      return option;
    }),
  );

  setExpanded(items.length > 0);
  setActive(activeIndex);

  if (items.length === 0) {
    status.textContent = query
      ? `Ничего не найдено по запросу «${query}»`
      : '';
  } else {
    status.textContent = `Найдено ${items.length}`;
  }
}

function setActive(index) {
  activeIndex = index;
  const active = options[index];

  if (!active) {
    input.removeAttribute('aria-activedescendant');
    return;
  }

  input.setAttribute('aria-activedescendant', `city-option-${active.id}`);
  for (const option of listbox.children) {
    option.setAttribute(
      'aria-selected',
      String(option.id === `city-option-${active.id}`),
    );
  }
  listbox.querySelector(`#city-option-${active.id}`)?.scrollIntoView({ block: 'nearest' });
}

function choose(item) {
  input.value = item.label;
  setExpanded(false);
  input.removeAttribute('aria-activedescendant');
  status.textContent = `Выбран город ${item.label}`;
}

input.addEventListener('input', async () => {
  const query = input.value.trim();
  controller?.abort();
  controller = new AbortController();

  if (query.length < 2) {
    render([], '');
    return;
  }

  status.textContent = 'Загрузка…';

  try {
    const response = await fetch(`/api/cities?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('request failed');
    render(await response.json(), query);
  } catch (error) {
    if (error.name !== 'AbortError') {
      render([], query);
      status.textContent = 'Не удалось загрузить города. Попробуйте ещё раз.';
    }
  }
});

input.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      if (listbox.hidden) setExpanded(true);
      setActive(Math.min(activeIndex + 1, options.length - 1));
      break;
    case 'ArrowUp':
      event.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
      break;
    case 'Home':
      if (input.selectionStart === 0) {
        event.preventDefault();
        setActive(0);
      }
      break;
    case 'End':
      if (input.selectionStart === input.value.length) {
        event.preventDefault();
        setActive(options.length - 1);
      }
      break;
    case 'Enter':
      if (activeIndex >= 0 && !listbox.hidden) {
        event.preventDefault();
        choose(options[activeIndex]);
      }
      break;
    case 'Escape':
      if (!listbox.hidden) {
        event.preventDefault();
        setExpanded(false);
      }
      break;
    case 'Tab':
      setExpanded(false);
      break;
  }
});
```

Что здесь важно:

- фокус не покидает поле — пользователь продолжает печатать;
- `activeIndex` и `aria-selected` синхронизированы;
- `AbortController` отменяет устаревший запрос, чтобы результаты не перезаписывали друг друга;
- загрузка, пустой результат и ошибка объявляются в `role="status"` без `assertive`;
- `mousedown` с `preventDefault` не даёт полю потерять фокус при клике по варианту;
- выбор мышью и с клавиатуры проходит через одну функцию.

Чего в примере нет и что нужно в продакшене: debounce ввода, кэширования, клавиши `Alt+ArrowDown`, подсветки совпадения, обработки IME-композиции и мобильного поведения. Но базовая модель уже корректна.

Во Vue тот же виджет удобно собирать на `ref` + `watch`:

```vue
<script setup lang="ts">
import { ref, watch } from 'vue';

const query = ref('');
const options = ref<{ id: string; label: string }[]>([]);
const activeIndex = ref(-1);
const expanded = ref(false);
let controller: AbortController | undefined;

watch(query, async (value) => {
  controller?.abort();
  controller = new AbortController();

  if (value.trim().length < 2) {
    options.value = [];
    expanded.value = false;
    return;
  }

  const response = await fetch(`/api/cities?q=${encodeURIComponent(value)}`, {
    signal: controller.signal,
  }).catch((error) => {
    if (error.name !== 'AbortError') throw error;
  });

  if (response?.ok) {
    options.value = await response.json();
    expanded.value = options.value.length > 0;
    activeIndex.value = expanded.value ? 0 : -1;
  }
});
</script>
```

Шаблон и клавиатурная логика остаются такими же: роль `combobox` на поле, `listbox` на списке, `aria-activedescendant` на активном варианте.

### Пример 4. Menu button с roving tabindex

```html
<button
  type="button"
  id="actions-button"
  aria-haspopup="menu"
  aria-expanded="false"
  aria-controls="actions-menu"
>
  Действия
</button>

<ul id="actions-menu" role="menu" aria-labelledby="actions-button" hidden>
  <li role="none"><button type="button" role="menuitem" tabindex="-1">Переименовать</button></li>
  <li role="none"><button type="button" role="menuitem" tabindex="-1">Дублировать</button></li>
  <li role="none"><button type="button" role="menuitem" tabindex="-1">Удалить</button></li>
</ul>
```

```js
const button = document.querySelector('#actions-button');
const menu = document.querySelector('#actions-menu');
const items = [...menu.querySelectorAll('[role="menuitem"]')];

function openMenu() {
  menu.hidden = false;
  button.setAttribute('aria-expanded', 'true');
  items[0].tabIndex = 0;
  items[0].focus();
}

function closeMenu({ focusButton = true } = {}) {
  menu.hidden = true;
  button.setAttribute('aria-expanded', 'false');
  items.forEach((item) => { item.tabIndex = -1; });
  if (focusButton) button.focus();
}

function focusItem(index) {
  items.forEach((item, i) => { item.tabIndex = i === index ? 0 : -1; });
  items[index].focus();
}

button.addEventListener('click', () => {
  menu.hidden ? openMenu() : closeMenu();
});

button.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openMenu();
  }
});

menu.addEventListener('keydown', (event) => {
  const index = items.indexOf(document.activeElement);
  if (event.key === 'Escape') {
    event.preventDefault();
    closeMenu();
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    focusItem((index + 1) % items.length);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    focusItem((index - 1 + items.length) % items.length);
  } else if (event.key === 'Home') {
    event.preventDefault();
    focusItem(0);
  } else if (event.key === 'End') {
    event.preventDefault();
    focusItem(items.length - 1);
  } else if (event.key === 'Tab') {
    // Закрываем меню и возвращаем фокус на кнопку,
    // чтобы следующая остановка Tab была предсказуемой.
    event.preventDefault();
    closeMenu();
  }
});

document.addEventListener('pointerdown', (event) => {
  if (!menu.hidden && !menu.contains(event.target) && !button.contains(event.target)) {
    closeMenu({ focusButton: false });
  }
});
```

Дополнительно нужен typeahead: нажатие буквы перемещает к первому пункту, начинающемуся с неё. В меню действий это заметно улучшает работу с клавиатуры, особенно если пунктов больше пяти.

### Пример 5. Error summary и вежливое объявление результата

```html
<form id="profile-form" novalidate>
  <div id="form-errors" role="group" aria-labelledby="form-errors-title" tabindex="-1" hidden>
    <h2 id="form-errors-title">Проверьте поля</h2>
    <ul></ul>
  </div>

  <label for="email">Email</label>
  <input id="email" name="email" type="email" autocomplete="email" aria-describedby="email-error">
  <p id="email-error" hidden>Введите email в формате name@example.com</p>

  <button type="submit">Сохранить</button>
</form>
```

```js
const form = document.querySelector('#profile-form');
const summary = document.querySelector('#form-errors');
const summaryList = summary.querySelector('ul');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const invalid = [...form.elements].filter(
    (field) => field.willValidate && !field.checkValidity(),
  );

  for (const field of form.querySelectorAll('[aria-invalid="true"]')) {
    field.removeAttribute('aria-invalid');
    document.getElementById(`${field.id}-error`).hidden = true;
  }

  summary.hidden = true;
  summaryList.replaceChildren();

  if (invalid.length === 0) {
    form.submit();
    return;
  }

  for (const field of invalid) {
    field.setAttribute('aria-invalid', 'true');
    document.getElementById(`${field.id}-error`).hidden = false;

    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${field.id}`;
    link.textContent = field.labels?.[0]?.textContent ?? field.name;
    item.append(link);
    summaryList.append(item);
  }

  summary.hidden = false;
  summary.focus();
});
```

Почему не `role="alert"` на summary:

- фокус уже переводится на блок — скринридер прочитает заголовок и список;
- `alert` вместе с фокусом может дать двойное объявление;
- ошибки не исчезают, пользователь может вернуться к ним в любой момент.

Асинхронную проверку (например, «email уже занят») лучше объявлять отдельно и вежливо:

```html
<p id="email-async" role="status" aria-atomic="true"></p>
```

```js
async function checkEmail(email) {
  const status = document.querySelector('#email-async');
  status.textContent = 'Проверяем email…';

  const response = await fetch(`/api/email-available?email=${encodeURIComponent(email)}`);
  const { available } = await response.json();

  status.textContent = available ? 'Email свободен' : 'Этот email уже занят';
}
```

## Типичные ошибки и антипаттерны

- **`role="menu"` на навигации сайта.** Скринридер переключается в режим команд, а пользователь ожидает ссылки. Для навигации — `<nav>` и `<a href>`.
- **`tabindex="0"` на каждой вкладке.** Группа перестаёт быть одной остановкой `Tab`, roving tabindex ломается. Активная — `0`, остальные — `-1`.
- **`aria-selected` без `tabindex` и стрелок.** Состояние есть, поведения нет; с клавиатуры вкладки недоступны.
- **`hidden` и `aria-hidden` вперемешку.** Скрытая панель с `aria-hidden` остаётся фокусируемой; используйте `hidden` или `inert`.
- **Модалка без возврата фокуса.** После закрытия фокус уходит в `body`, и пользователь начинает `Tab` с начала страницы.
- **Фокус на деструктивной кнопке при открытии.** Случайный `Enter` удаляет данные; ставьте фокус на «Отмена» или на диалог.
- **`aria-hidden` на фоне вместо `inert`.** Фон исчезает из дерева доступности, но остаётся в tab-порядке.
- **`role="alert"` на каждом изменении.** Каждое нажатие перебивает речь; используйте `role="status"`.
- **Live-регион создаётся вместе с текстом.** Скринридер может не успеть подписаться; контейнер должен быть в DOM заранее.
- **`aria-expanded` не обновляется.** Скринридер сообщает ложное состояние — это хуже, чем отсутствие атрибута.
- **`aria-activedescendant` указывает на несуществующий id.** Частое следствие виртуализации или фильтрации; активный вариант должен быть в DOM.
- **Фокус уходит в список при вводе.** В combobox фокус остаётся в поле, иначе пользователь не может печатать.
- **Tooltip с кнопками внутри.** Tooltip не интерактивен; для действий нужен popover или dialog.
- **`aria-label` перекрывает видимый текст.** Ломает Label in Name и голосовое управление; видимая подпись должна входить в имя.
- **`role="application"` на всём приложении.** Отключает привычные режимы скринридера и почти всегда ухудшает навигацию.
- **Автофокус на поле в мобильном диалоге.** Вызывает клавиатуру и сбивает контекст; фокус лучше ставить на диалог или безопасное действие.
- **Проверка только мышью.** Клавиатурный сценарий и скринридер не проверены — значит, паттерн не готов.

## Ключевые тезисы для интервью

- **Сначала нативный элемент, потом APG, потом своя реализация.** `<dialog>`, `<details>`, `<button>` и `<select>` закрывают больше сценариев, чем кажется.
- **ARIA меняет семантику, но не поведение.** Роль `tab` без roving tabindex, стрелок и `aria-selected` — это `div`, который выглядит как вкладка.
- **У виджета пять слоёв: роль, имя, состояние, связи, поведение.** Пропуск любого виден пользователю скринридера или клавиатуры.
- **Tabs — одна остановка `Tab`.** Активная вкладка `tabindex="0"`, остальные `-1`, стрелки и `Home`/`End`, панель связана через `aria-labelledby`.
- **Dialog удерживает фокус и возвращает его.** Нативный `showModal()` делает фон `inert`; кастомной модалке нужны `inert`, цикл фокуса и восстановление.
- **`aria-activedescendant` и roving tabindex решают разные задачи.** Первый — для combobox/listbox с вводом, второй — для tabs/menu/toolbar.
- **`role="menu"` — это меню команд, а не навигация.** Для ссылок в шапке нужен `<nav>`, для раскрывающегося блока — disclosure.
- **Combobox держит фокус в поле.** Активный вариант помечается `aria-activedescendant`, загрузка и пустой результат объявляются вежливо.
- **Live regions должны существовать заранее.** `polite` — для большинства обновлений, `assertive` — только для критичного; не дублируйте объявление фокусом.
- **Порталы и виртуализация ломают связи.** Возвращайте фокус, держите заголовок рядом с диалогом, используйте `aria-setsize`/`aria-posinset` и не размонтируйте активный вариант.
- **Клавиатура — часть Definition of Done.** `Tab`, стрелки, `Home`/`End`, `Enter`, `Space`, `Esc` и возврат фокуса проверяются в e2e и руками.

## Практическое задание и code review-чеклист

### Задание: собрать три паттерна и проверить клавиатурой

Соберите на одной странице:

1. **Tabs** с тремя вкладками, roving tabindex, `Home`/`End` и переключением панелей.
2. **Dialog** подтверждения удаления: нативный `<dialog>`, фокус на «Отмена», `Esc`, возврат фокуса на триггер.
3. **Combobox** с асинхронным поиском: загрузка, пустой результат, выбор мышью и с клавиатуры, `aria-activedescendant`.

Проверьте:

- пройдите страницу только клавиатурой: `Tab`, `Shift+Tab`, стрелки, `Home`/`End`, `Enter`, `Space`, `Esc`;
- убедитесь, что фокус видим и нигде не проваливается;
- включите NVDA + Firefox или VoiceOver + Safari и проверьте объявления ролей, состояний и результатов;
- отключите мышь и попробуйте выполнить тот же сценарий;
- проверьте RTL: стрелки в tabs должны инвертироваться;
- прогоните axe и добавьте клавиатурный e2e-тест в Playwright.

### Чек-лист code review доступного компонента

- [ ] Использован нативный элемент, если он закрывает сценарий; ARIA не дублирует семантику.
- [ ] У каждой роли есть доступное имя, а у виджета — понятная инструкция или очевидная модель.
- [ ] Состояния (`aria-expanded`, `aria-selected`, `aria-checked`, `aria-disabled`) обновляются вместе с UI.
- [ ] Вся группа — одна остановка `Tab`; внутри работают стрелки, `Home`/`End`, `Enter`/`Space`.
- [ ] `Esc` закрывает overlay и возвращает фокус; ловушек клавиатуры нет.
- [ ] Модальный диалог переводит фокус внутрь и возвращает на триггер; фон изолирован через `inert`.
- [ ] Активная вкладка имеет `tabindex="0"`, остальные `-1`; панель связана через `aria-labelledby`.
- [ ] Combobox держит фокус в поле; `aria-activedescendant` указывает на существующий вариант.
- [ ] Live-регион существует в DOM заранее; `assertive` использован только для критичных ошибок.
- [ ] Ошибки формы связаны с полями через `aria-invalid` и `aria-describedby`, фокус переходит к проблеме.
- [ ] Portal/Teleport не ломает порядок фокуса, `aria-labelledby` и возврат фокуса.
- [ ] Виртуализированный список сообщает `aria-setsize`/`aria-posinset` и не размонтирует активный вариант.
- [ ] `aria-label` не перекрывает видимый текст; иконочные кнопки имеют имя.
- [ ] Есть клавиатурный e2e-тест и ручная проверка скринридером.
- [ ] Компонент проверен в RTL и на мобильном скринридере, если это часть продукта.

## Заключение

Доступный виджет — это не набор ARIA-атрибутов, а договор о поведении. Пользователь клавиатуры ожидает, что `Tab` войдёт в компонент один раз, стрелки подвинут фокус, `Esc` закроет overlay, а фокус вернётся туда, откуда пришёл. Пользователь скринридера ожидает, что роль, имя и состояние совпадают с тем, что происходит на экране.

APG даёт готовые модели для tabs, dialog, menu, combobox, tree и grid, но применять их нужно осознанно: сначала нативный элемент, потом паттерн, потом собственная реализация. Самое сложное начинается не в разметке, а в интеграции — порталы, виртуализация, асинхронность и мобильные скринридеры. Именно там проверяется, понимает ли UI Engineer модель фокуса и дерева доступности, а не только набор атрибутов.

Следующий шаг — автоматизация: как встроить axe, клавиатурные сценарии и скринридер-проверки в CI. Об этом — [Тестирование доступности](../testing/accessibility-testing.md). Vue-специфика компонентов разобрана в [Доступные компоненты во Vue](../vue/accessibility.md), а API компонентов и выбор библиотеки — в [UI-киты, headless-компоненты и Storybook](./ui-kits-and-component-libraries.md).

## Полезные ссылки

- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/)
- [MDN: ARIA roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles)
- [MDN: `aria-activedescendant`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-activedescendant)
- [MDN: `inert`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert)
- [MDN: `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)
- [MDN: ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)
- [APG: Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [APG: Dialog (modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [APG: Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [APG: Menu button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)
- [Deque: aria-activedescendant vs roving tabindex](https://www.deque.com/blog/aria-activedescendant-vs-roving-tabindex/)
- [GOV.UK: Error summary](https://design-system.service.gov.uk/components/error-summary/)
