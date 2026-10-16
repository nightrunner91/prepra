---
title: "SOLID в React и Vue"
section: architecture
stacks: []
description: "Пять принципов SOLID — Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion — на примерах React и Vue. Формулы для запоминания и когда не применять."
order: 2
tags: ["solid", "single-responsibility", "open-closed", "liskov-substitution", "dependency-inversion", "react", "vue"]
questions:
  - "Как SOLID адаптируется к frontend-разработке через хуки, композицию и слоты вместо классов и интерфейсов"
  - "Как определить, что компонент нарушает Single Responsibility, и как custom hooks/composables решают эту проблему"
  - "Как реализовать Open/Closed через композицию в React и слоты во Vue"
  - "Что такое Liskov Substitution и как это проявляется в TypeScript-типах и пропсах компонентов"
  - "Почему передача всего DTO в компонент нарушает Interface Segregation и когда это оправдано"
  - "Когда Dependency Inversion действительно нужен, а когда превращается в оверинжиниринг"
  - "Почему S и O применимы почти всегда, а D и I — ситуативные, и какие признаки оверинжиниринга SOLID"
answers:
  - "Вместо классов и интерфейсов SOLID реализуется идиомами фреймворков: SRP — через custom hooks и composables, O — через композицию пропсов в React и слоты во Vue, L и I — через TypeScript-интерфейсы и валидаторы пропсов, D — через props-инъекцию сервисов и `provide/inject`."
  - "Компонент нарушает SRP, если делает больше одной вещи — например, одновременно грузит данные, форматирует их и рендерит. Вынос fetch и трансформации в `useUsers()` оставляет компоненту только рендер, а каждый элемент получает отдельный компонент `UserItem`."
  - "В React базовый `Button` принимает `className` как проп, а `PrimaryButton`/`SecondaryButton` расширяют его через композицию — новый тип добавляется без изменения базового кода. Во Vue то же делает `BaseButton` со слотом, а выбор типа выносится в динамический компонент `<component :is>`."
  - "Если S — подтип T, объекты T можно заменить на S без изменения поведения: `UserCard` должен работать с любым `User`, а не требовать специфичный метод `delete()`. Расширения вроде `AdminUser` добавляют методы, но компонент, работающий с базовым интерфейсом, принимает любой подтип."
  - "Компонент, которому нужны два поля, но получающий весь `UserDTO`, зависим от методов, которые не использует. Это не значит, что нужно дробить искусственно: если компоненту реально нужно 15 полей — передавай 15."
  - "DI оправдан, когда есть несколько источников данных, смена API или изолированное тестирование через мок-сервис: компонент зависит от интерфейса `UserService`, а реализация подставляется снаружи. Он не нужен при стабильном API, в прототипах и когда компонент не планируется тестировать — там абстракция «на будущее» становится оверинжинирингом."
  - "S и O легко соблюдаются и реально облегчают жизнь, поэтому применимы почти всегда, тогда как D и I требуют конкретной причины — тестов, смены API или больших DTO. Признаки оверинжиниринга: абстракция «на будущее» без проблемы, интерфейс из трёх методов где нужен один и код, который стал сложнее читать ради «правильной архитектуры»."
---

# SOLID в React и Vue

SOLID — пять принципов проектирования, которые пришли из ООП, но во фронтенде реализуются через хуки, композицию и слоты. Цель этой статьи — чтобы после прочтения ты мог **объяснить каждый принцип своими словами**: назвать суть одной фразой, показать, что ломается без него, и узнать нарушение в собственном коде.

Ради этого у каждого принципа одна и та же структура: суть → что реально ломается → симптомы → разбор примера → чего принцип **не** значит. Примеры выстроены вокруг одного приложения — списка пользователей, — которое постепенно развивается от принципа к принципу.

## Содержание

1. [Как запомнить: формулы принципов](#как-запомнить-формулы-принципов)
2. [S — Single Responsibility](#s--single-responsibility)
3. [O — Open/Closed](#o--openclosed)
4. [L — Liskov Substitution](#l--liskov-substitution)
5. [I — Interface Segregation](#i--interface-segregation)
6. [D — Dependency Inversion](#d--dependency-inversion)
7. [Шпаргалка для собеседования](#шпаргалка-для-собеседования)
8. [Когда НЕ применять SOLID](#когда-не-применять-solid)
9. [Главные мысли](#главные-мысли)
10. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
11. [Заключение](#заключение)
12. [Полезные ссылки](#полезные-ссылки)

---

## Как запомнить: формулы принципов

Акроним **SOLID** стоит расшифровывать не через житейские аналогии, а через формулу — одну фразу, которую ты и должен уметь сказать своими словами на собеседовании:

| Буква | Принцип | Формула |
|-------|---------|---------|
| **S** | Single Responsibility | **Одна причина изменить** |
| **O** | Open/Closed | **Новое дописывай, старое не трогай** |
| **L** | Liskov Substitution | **Подтип не должен удивлять** |
| **I** | Interface Segregation | **Не заставляй зависеть от того, что не используешь** |
| **D** | Dependency Inversion | **Зависи от контракта, не от реализации** |

Дальше — каждый принцип: что он значит, как выглядит его нарушение и что конкретно ломается, если его игнорировать.

---

## S — Single Responsibility

**Суть:** У каждой части кода должна быть одна причина измениться. Если причин несколько — раздели.

**Что реально ломается:** Над `UserList` работают три человека и три задачи. API поменял формат ответа — правки в компоненте. Дизайнер переделал карточку — там же. Тимлид просит кешировать запросы — снова тот же файл. Три несвязанных изменения постоянно сталкиваются в одном месте: конфликты в мержах, чужие правки ломают твою вёрстку, а чтобы поменять *только способ загрузки*, приходится перечитывать весь компонент.

**Симптомы (узнай у себя):**
- В имени компонента есть «и»: `UserListAndFetcher`.
- Меняешь загрузку данных — лезешь в файл с разметкой.
- Компонент нельзя отрендерить в тесте без сети/стора/роутера — значит, он делает больше одного дела.
- `useEffect` + `useState` + разметка растут вместе, и всё это «про юзеров».

### React

**Было:**
```tsx
function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data.map(u => ({ ...u, name: u.name.toUpperCase() })));
        setLoading(false);
      });
  }, []);

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name} ({user.email})</li>
      ))}
    </ul>
  );
}
```

**Что конкретно не так** — здесь три независимые причины менять код:
1. Меняется контракт API (`data.users` вместо массива) → правишь `useEffect`.
2. Меняется вид строки (аватар, бейдж) → правишь разметку тут же.
3. Меняется способ загрузки (кеш, retry) → опять этот файл.

Плюс этот компонент нельзя протестировать, не подняв сеть.

**Стало:**
```tsx
// Отвечает за «как получить данные» — меняется вместе с API
function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);

  return { users, loading };
}

// Отвечает за «как расположить список»
function UserList() {
  const { users, loading } = useUsers();

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {users.map(user => <UserItem key={user.id} user={user} />)}
    </ul>
  );
}

// Отвечает за «как выглядит один элемент»
function UserItem({ user }) {
  return <li>{user.name.toUpperCase()} ({user.email})</li>;
}
```

**Почему стало лучше:** у каждой части теперь **ровно одна причина меняться**. `useUsers` меняется с API, `UserList` — с раскладкой, `UserItem` — с видом строки. Их можно менять и тестировать порознь: `useUsers` — юнит-тест с моком `fetch`, `UserItem` — тест с одним объектом, без сети вообще.

### Vue

**Было:**
```vue
<script setup>
import { ref, onMounted } from 'vue';

const users = ref([]);
const loading = ref(true);

onMounted(async () => {
  const res = await fetch('/api/users');
  const data = await res.json();
  users.value = data.map(u => ({ ...u, name: u.name.toUpperCase() }));
  loading.value = false;
});
</script>

<template>
  <ul v-if="!loading">
    <li v-for="user in users" :key="user.id">
      {{ user.name }} ({{ user.email }})
    </li>
  </ul>
  <div v-else>Loading...</div>
</template>
```

**Стало** — та же логика, но ответственности разнесены:

```js
// composables/useUsers.js — одна ответственность: получить данные
import { ref, onMounted } from 'vue';

export function useUsers() {
  const users = ref([]);
  const loading = ref(true);

  onMounted(async () => {
    const res = await fetch('/api/users');
    users.value = await res.json();
    loading.value = false;
  });

  return { users, loading };
}
```
```vue
<!-- UserList.vue — раскладка списка -->
<script setup>
import { useUsers } from './composables/useUsers';
import UserItem from './UserItem.vue';
const { users, loading } = useUsers();
</script>

<template>
  <div v-if="loading">Loading...</div>
  <ul v-else>
    <UserItem v-for="user in users" :key="user.id" :user="user" />
  </ul>
</template>
```
```vue
<!-- UserItem.vue — вид строки -->
<script setup>
defineProps(['user']);
</script>

<template>
  <li>{{ user.name.toUpperCase() }} ({{ user.email }})</li>
</template>
```

**Чего принцип НЕ значит:**
- Это не «один метод = один компонент». Ответственность — это *причина изменения*, а не размер. Компонент на 200 строк с одной задачей — нормально.
- Не значит дробить всё заранее. Если кусок никогда не меняется отдельно и не тестируется отдельно — делить нечего.

---

## O — Open/Closed

**Суть:** Новую функциональность добавляй новым кодом, не переписывая уже работающий.

**Что реально ломается:** Каждая новая вариация требует лезть в один и тот же общий компонент. Добавили третий тип кнопки — снова `if` в `Button`. Через десять типов `Button` превращается в свалку условий: любая правка рискует сломать уже работающие варианты, и регресс нужно проверять на всех типах сразу.

**Симптомы (узнай у себя):**
- В компоненте растёт лестница `if/switch` по `type` или `variant`.
- Чтобы добавить вариант, обязательно правишь существующий файл.
- Изменение одного варианта заставляет перепроверять остальные.

### React

**Было** — базовый компонент знает про каждый тип:
```tsx
function Button({ type, onClick, children }) {
  if (type === 'primary') {
    return <button className="btn-primary" onClick={onClick}>{children}</button>;
  }
  if (type === 'secondary') {
    return <button className="btn-secondary" onClick={onClick}>{children}</button>;
  }
  // новый тип — снова правим этот же компонент
}
```

**Что конкретно не так:** `Button` знает про каждый существующий тип. Это не «открыто для расширения», а **открыто для изменения**: добавление `danger` — это правка `Button`, то есть риск для `primary` и `secondary`, которые уже работают.

**Стало** — расширение через данные и композицию:
```tsx
// База не знает про конкретные типы: принимает стили и стандартные пропсы кнопки
function Button({ className = '', children, ...props }) {
  return (
    <button className={`btn ${className}`} {...props}>
      {children}
    </button>
  );
}

// Варианты — это новый код; базовый компонент не трогаем
const PrimaryButton = (props) => <Button className="btn-primary" {...props} />;
const SecondaryButton = (props) => <Button className="btn-secondary" {...props} />;
const DangerButton = (props) => <Button className="btn-danger" {...props} />;
```

**Почему стало лучше:** новый вариант — это **новый код**, `Button` менять не нужно. Код существующих вариантов не изменился, поэтому их не нужно перепроверять.

### Vue

**Было:**
```vue
<script setup>
defineProps(['type']);
</script>

<template>
  <button v-if="type === 'primary'" class="btn-primary">
    <slot />
  </button>
  <button v-else-if="type === 'secondary'" class="btn-secondary">
    <slot />
  </button>
</template>
```

**Стало** — база ничего не знает о вариантах, новый вариант наследует её через слот:
```vue
<!-- BaseButton.vue -->
<script setup>
defineProps(['class']);
</script>

<template>
  <button :class="['btn', $props.class]">
    <slot />
  </button>
</template>
```
```vue
<!-- DangerButton.vue — новый файл, BaseButton не меняем -->
<script setup>
import BaseButton from './BaseButton.vue';
</script>

<template>
  <BaseButton class="btn-danger">
    <slot />
  </BaseButton>
</template>
```

> Не путать с `<component :is="...">`. Это выбор компонента по условию в рантайме — он ничего не «расширяет», а просто переключает уже написанные варианты.

**Чего принцип НЕ значит:**
- Не значит «никаких условий вообще». Условие «есть `className` или нет» внутри `Button` нормально; плохо, когда база знает про каждый конкретный вариант.
- Не значит «заведи фабрику и конфиг на 20 строк ради двух кнопок». Вариант через пропс (`<Button variant="primary" />`) тоже закрыт для изменения — пока не требует правки базовой логики.

---

## L — Liskov Substitution

**Суть:** Подтип должен работать везде, где ожидается базовый тип, и не удивлять вызывающий код.

**Что реально ломается:** Компонент обещает работать с `User`, а на деле требует `AdminUser` — метода `delete` или поля `permissions`. Пока приходят админы — всё хорошо. Первый `Guest` роняет страницу. Баг выходит в прод, потому что заявленный контракт типа был шире реальных требований компонента.

**Симптомы (узнай у себя):**
- Компонент принимает общий тип, но внутри вызывает методы, которых у части значений нет.
- В теле есть защитные проверки `if (user.delete)` / `user.permissions?.length` — признак, что контракт пропсов неверен.
- Подтип «умеет больше» базового, но при этом ломает базовое поведение (например, `delete` для гостя бросает исключение).

### React

**Было:**
```tsx
function UserItem({ user }) {
  return (
    <div>
      <h3>{user.name}</h3>
      <button onClick={() => user.delete()}>Delete</button>
    </div>
  );
}

// ❌ Guest приходит без delete — падает
<UserItem user={{ name: 'Guest', email: 'guest@example.com' }} />
```

**Что конкретно не так:** `UserItem` заявляет, что работает с «пользователем вообще», но внутри требует `delete`, которого у гостя нет. Тип обещает одно, код требует другое — это и есть нарушение L: часть значений базового типа здесь не работает.

**Стало** — компонент принимает ровно то, что обещает, а админ-специфика живёт отдельно:
```tsx
interface User {
  name: string;
  email: string;
}

// Работает с любым User
function UserItem({ user }: { user: User }) {
  return (
    <div>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}

// Админ — подтип: добавляет поведение, не ломая базовое
interface AdminUser extends User {
  delete: () => void;
}

// Действие, специфичное для админа, — в отдельном компоненте
function AdminItem({ user }: { user: AdminUser }) {
  return (
    <div>
      <UserItem user={user} />
      <button onClick={user.delete}>Delete</button>
    </div>
  );
}
```

**Почему стало лучше:** `UserItem` теперь действительно работает с любым `User`, а админ-специфика не просочилась в базовый компонент. Подстановка `AdminUser` вместо `User` не ломает `UserItem`.

### Vue

**Было** — валидатор требует `delete`, которого у гостя нет:
```vue
<script setup>
defineProps({
  user: {
    type: Object,
    required: true,
    validator: (u) => typeof u.delete === 'function'
  }
});
</script>

<template>
  <div>
    <h3>{{ user.name }}</h3>
    <button @click="user.delete()">Delete</button>
  </div>
</template>
```

**Стало** — база проверяет только общий контракт, админское действие приходит через слот:
```vue
<!-- BaseUserItem.vue -->
<script setup>
defineProps({
  user: {
    type: Object,
    required: true,
    validator: (u) => 'name' in u && 'email' in u
  }
});
</script>

<template>
  <div class="user-card">
    <h3>{{ user.name }}</h3>
    <p>{{ user.email }}</p>
    <slot name="actions" />
  </div>
</template>
```
```vue
<!-- AdminItem.vue -->
<script setup>
import BaseUserItem from './BaseUserItem.vue';
defineProps({ user: { type: Object, required: true } });
</script>

<template>
  <BaseUserItem :user="user">
    <template #actions>
      <button @click="user.delete()">Delete</button>
    </template>
  </BaseUserItem>
</template>
```

**Чего принцип НЕ значит:**
- Во фронтенде L чаще всего означает «не расширяй контракт пропсов больше, чем компонент реально использует, и не ломай базовое поведение в подтипе». Наследования классов тут почти нет, поэтому принцип проявляется в типах и валидаторах пропсов.
- Не значит «никогда не принимай узкий тип». `AdminItem`, требующий `AdminUser`, — нормально: он честно заявляет, что работает только с админами.

---

## I — Interface Segregation

**Суть:** Компонент не должен зависеть от того, что он не использует. Передавай ему только нужные поля.

**Что реально ломается:** `Avatar` получает весь `UserDTO` (15 полей), а использует два. Теперь баг: переименовали `avatar` в `avatarUrl` в DTO — падает `Avatar`, хотя его собственная задача не менялась. Компонент зависит от формы данных, которая ему не нужна, и ломается от чужих изменений.

**Симптомы (узнай у себя):**
- В тест компонента приходится собирать огромный объект, хотя проверяешь два поля.
- Компонент ломается при изменении DTO, которого он почти не касается.
- Непонятно, какие поля компоненту реально нужны, пока не прочитаешь всё его тело.

### React

**Было:**
```tsx
interface UserDTO {
  id: number;
  name: string;
  email: string;
  avatar: string;
  phone: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date;
  role: string;
  // ... ещё 10 полей
}

// Использует только avatar и name, но зависит от всего DTO
function Avatar({ user }: { user: UserDTO }) {
  return (
    <div className="avatar">
      <img src={user.avatar} alt={user.name} />
      <span>{user.name}</span>
    </div>
  );
}
```

**Что конкретно не так:** `Avatar` объявил зависимость от 15 полей, хотя работает с двумя. Любое изменение `UserDTO` — его потенциальная поломка, а в тесте приходится собирать весь объект.

**Стало:**
```tsx
interface AvatarProps {
  avatarUrl: string;
  name: string;
}

function Avatar({ avatarUrl, name }: AvatarProps) {
  return (
    <div className="avatar">
      <img src={avatarUrl} alt={name} />
      <span>{name}</span>
    </div>
  );
}

// Родитель знает про DTO и передаёт только нужное
function UserProfile({ userDTO }: { userDTO: UserDTO }) {
  return <Avatar avatarUrl={userDTO.avatar} name={userDTO.name} />;
}
```

**Почему стало лучше:** теперь видно, что `Avatar` нужны ровно две строки. Он не сломается от переименования полей, которые не использует, а в тесте достаточно `{ avatarUrl, name }`.

**Нормально (если компонент реально использует много полей):**
```tsx
// Форма редактирования использует почти все поля — это честный контракт
interface UserFormProps {
  name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  avatar: string;
}

function UserForm({ name, email, phone, address, role, avatar }: UserFormProps) {
  // ...
}
```

### Vue

**Было:**
```vue
<!-- Avatar.vue -->
<script setup>
const props = defineProps({
  user: {
    type: Object,
    required: true
    // Принимает весь UserDTO, хотя использует только avatar и name
  }
});
</script>

<template>
  <div class="avatar">
    <img :src="user.avatar" :alt="user.name" />
    <span>{{ user.name }}</span>
  </div>
</template>
```

**Стало:**
```vue
<!-- Avatar.vue -->
<script setup>
const props = defineProps({
  avatarUrl: { type: String, required: true },
  name: { type: String, required: true }
});
</script>

<template>
  <div class="avatar">
    <img :src="avatarUrl" :alt="name" />
    <span>{{ name }}</span>
  </div>
</template>
```
```vue
<!-- UserProfile.vue -->
<script setup>
import Avatar from './Avatar.vue';

const props = defineProps({
  userDTO: { type: Object, required: true }
});
</script>

<template>
  <div>
    <Avatar :avatar-url="userDTO.avatar" :name="userDTO.name" />
    <div>{{ userDTO.email }}</div>
    <div>{{ userDTO.phone }}</div>
  </div>
</template>
```

**Чего принцип НЕ значит:**
- Не значит дробить пропсы «до атомов». Если форма реально использует 15 полей — принимай 15 полей, это честный контракт, а не нарушение.
- Не значит «никогда не передавай объект». Передавать `user` целиком нормально, если компонент и правда работает с большинством его полей.

---

## D — Dependency Inversion

**Суть:** Завись от контракта, а не от конкретной реализации. Реализацию подставляют снаружи.

**Что реально ломается:** `UserList` сам хардкодит URL и формат ответа. Протестировать его без сети нечем. Сменить источник (кеш, GraphQL, другой бэкенд) нельзя, не правя сам компонент. Логика «где брать данные» намертво прибита к логике «как показать список».

**Симптомы (узнай у себя):**
- `fetch('https://...')` написан прямо внутри компонента.
- Чтобы протестировать компонент, нужен реальный бэкенд или глобальный мок.
- Смена окружения (dev/staging/prod) требует правок в компонентах.
- Один и тот же запрос повторяется в нескольких компонентах.

**Когда DI реально нужен:** несколько источников данных; смена API; изолированные тесты через мок-сервис.
**Когда НЕ нужен:** один стабильный API без тестов; прототип; MVP.

### React

**Было:**
```tsx
function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // URL, формат ответа и клиент зашиты внутрь
    fetch('https://api.example.com/users')
      .then(res => res.json())
      .then(data => setUsers(data.users));
  }, []);

  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

**Что конкретно не так:** компонент знает и про конкретный URL, и про формат `data.users`. Тест требует сети; смена источника — это правка компонента.

**Стало:**
```tsx
// Контракт: что можно, а не «как»
interface UserService {
  getUsers(): Promise<User[]>;
}

// Реализация для прода
class HttpUserService implements UserService {
  async getUsers(): Promise<User[]> {
    const res = await fetch('https://api.example.com/users');
    const data = await res.json();
    return data.users; // знание о формате живёт здесь, а не в компоненте
  }
}

// Мок для тестов
class MockUserService implements UserService {
  async getUsers(): Promise<User[]> {
    return [{ id: 1, name: 'Test User' }];
  }
}

// Компонент зависит от контракта
function UserList({ userService }: { userService: UserService }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    userService.getUsers().then(setUsers);
  }, [userService]);

  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}

<UserList userService={new HttpUserService()} />   // прод
<UserList userService={new MockUserService()} />   // тест
```

**Почему стало лучше:** компонент больше не знает, откуда берутся данные. В тесте подставляется мок — сеть не нужна. Смена источника — это новый класс, а `UserList` не трогаем. По духу это то же «старое не трогай» из O, но применительно к зависимостям.

### Vue

**Было:**
```vue
<script setup>
import { ref, onMounted } from 'vue';

const users = ref([]);

onMounted(async () => {
  const res = await fetch('https://api.example.com/users');
  const data = await res.json();
  users.value = data.users;
});
</script>

<template>
  <ul>
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

**Стало** — сервис как контракт, реализация приходит снаружи:
```ts
// services/userService.ts
export interface UserService {
  getUsers(): Promise<User[]>;
}

export class HttpUserService implements UserService {
  async getUsers(): Promise<User[]> {
    const res = await fetch('https://api.example.com/users');
    const data = await res.json();
    return data.users;
  }
}

export class MockUserService implements UserService {
  async getUsers(): Promise<User[]> {
    return [{ id: 1, name: 'Test User' }];
  }
}
```
```vue
<!-- UserList.vue -->
<script setup>
import { ref, onMounted } from 'vue';
import type { UserService } from './services/userService';

const props = defineProps({
  userService: {
    type: Object as () => UserService,
    required: true
  }
});

const users = ref([]);

onMounted(async () => {
  users.value = await props.userService.getUsers();
});
</script>

<template>
  <ul>
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```
```vue
<!-- App.vue -->
<script setup>
import UserList from './UserList.vue';
import { HttpUserService } from './services/userService';

const userService = new HttpUserService();
</script>

<template>
  <UserList :user-service="userService" />
</template>
```

> Если сервис нужен глубоко в дереве, вместо протаскивания пропсов через много уровней во Vue используют `provide/inject`: родитель `provide('userService', service)`, потомок `inject('userService')`. Это тот же DI — компонент зависит от контракта, а не создаёт реализацию сам.

**Чего принцип НЕ значит:**
- Не значит «заведи абстракцию на будущее». Интерфейс оправдан, когда есть вторая реализация или реальные тесты, а не потому что «вдруг понадобится».
- Не значит «один сервис-контейнер на всё приложение». DI стоит вводить точечно, там, где есть настоящая причина.

---

## Шпаргалка для собеседования

| Принцип | Вопрос на собесе | Короткий ответ |
|---------|------------------|----------------|
| **S** | "Как понять, что компонент слишком большой?" | "По числу причин измениться: если он и грузит, и форматирует, и рендерит — это три причины. Раздели на хуки/компоненты." |
| **O** | "Как добавить новый тип кнопки без изменения кода?" | "Через композицию: базовый компонент + новые обёртки, а не `if` по `type`. Старый код не трогаем." |
| **L** | "Можно ли заменить Admin на Guest?" | "Да, если оба реализуют базовый `User` и компонент не требует специфичных методов вроде `delete`." |
| **I** | "Зачем разделять пропсы?" | "Чтобы компонент не зависел от полей, которые не использует. Backend может отдавать DTO из 15 полей — передаём только нужные." |
| **D** | "Как тестировать компонент с API?" | "Зависеть от контракта-сервиса, реализацию (мок) подставлять снаружи. Но если API стабилен и тестов нет — DI не нужен." |

**Важный вопрос на собесе:** "Когда НЕ применять SOLID?"
- Прототипы и MVP
- Маленькие проекты с одним разработчиком
- Когда абстракция не упрощает код, а усложняет
- Когда нет конкретной проблемы, которую решает принцип

---

## Когда НЕ применять SOLID

SOLID — это инструмент, а не религия. Вот ситуации, когда можно (и нужно) отступать от правил:

### 1. Прототипы и MVP
Когда нужно быстро проверить гипотезу — пиши как проще. SOLID добавишь позже, если проект выживет.

```tsx
// Нормально для прототипа
function UserList() {
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers);
  }, []);

  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

### 2. Маленькие проекты
Если проект на 5-10 компонентов и один разработчик — оверинжиниринг вреден. Пиши просто.

### 3. Backend стабилен и не меняется
Если API не меняется годами, нет смысла делать DI "на всякий случай". Добавишь, когда появится вторая реализация.

### 4. Компонент реально использует все поля
Если форма редактирования пользователя использует 15 полей — передавай 15 полей. Не нужно искусственно дробить на 3 интерфейса.

### 5. Нет планов тестировать изолированно
Если компонент всегда будет работать с реальным API и ты не пишешь unit-тесты — DI не нужен.

### Признаки оверинжиниринга:
- Создаёшь абстракцию "на будущее", но нет конкретной причины
- Интерфейс из 3 методов, где нужен 1
- Компонент разбит на 5 частей, хотя каждая часть используется только здесь
- Код стал сложнее читать из-за "правильной архитектуры"

**Правило:** Если абстракция не упрощает код сейчас и не решает конкретную проблему — она не нужна.

---

## Главные мысли

1. **SOLID — это инструмент, а не догма.** Применяй там, где это упрощает код и решает конкретные проблемы.
2. **S и O — самые полезные.** Одна причина изменить и «новое дописывай, старое не трогай» легко соблюдаются и реально облегчают жизнь.
3. **D и I — ситуативные.** Dependency Inversion нужен для тестов и гибкости, Interface Segregation — когда компонент не использует все поля.
4. **Не занимайся оверинжинирингом.** Если абстракция не упрощает код сейчас — она не нужна.
5. **В React** SOLID проявляется через хуки, композицию пропсов и разделение ответственности.
6. **В Vue** — через composables, слоты и dependency injection.
7. **Формулы для памяти:** одна причина изменить (S), новое дописывай — старое не трогай (O), подтип не должен удивлять (L), не заставляй зависеть от лишнего (I), зависи от контракта, не от реализации (D).
8. **На собесах** важнее показать применение и понимание, когда правило НЕ нужно применять.

## Ключевые тезисы для интервью

- SOLID — пять принципов ООП, адаптированных к фронтенду: в React они реализуются через custom hooks (SRP), композицию пропсов (O), TypeScript-интерфейсы (L, I) и props-инъекцию сервисов (D); во Vue — через composables (SRP), слоты (O), валидаторы пропсов (L, I) и `provide/inject` для сервисов (D).
- **S (Single Responsibility)** — одна причина изменить: если компонент и грузит данные, и трансформирует, и рендерит — разделяй через custom hooks/composables. **O (Open/Closed)** — расширение новым кодом: базовый `Button` + обёртки `PrimaryButton`, `SecondaryButton`, а не `if type ===`.
- **L (Liskov Substitution)** — подтип заменяет базовый тип без ломки: `UserItem` должен работать с любым `User`, а не ждать `admin.delete()`. **I (Interface Segregation)** — не тащи весь DTO в компонент, если ему нужно 2 поля; но если реально нужно 15 — передавай 15.
- **D (Dependency Inversion)** — компонент зависит от контракта (интерфейс `UserService`), реализация подставляется снаружи; помогает в тестах и при смене API.
- S и O применимы почти всегда, D и I — ситуативные и часто становятся оверинжинирингом. SOLID не нужен в прототипах, MVP и маленьких проектах.
- Признак оверинжиниринга: абстракция создана «на будущее», без конкретной проблемы, которую она решает. Применение SOLID должно упрощать код, а не создавать иллюзию «правильной архитектуры».

## Заключение

SOLID — инструмент, а не религия. Пять принципов помогают выявить типичные проблемы: слишком большие компоненты, жёсткие условные ветки, зависимости от конкретики. Но применение SOLID должно упрощать код, а не создавать иллюзию «правильной архитектуры». На собеседовании важнее не заучить пять букв, а показать, что вы понимаете, когда каждый принцип уместен и когда от него нужно сознательно отступить.

## Полезные ссылки

- [SOLID Principles — Wikipedia](https://en.wikipedia.org/wiki/SOLID)
- [The Principles of OOD — Robert C. Martin](http://butunclebob.com/ArticleS.UncleBob.PrinciplesOfOod)
- [React Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Vue Composables](https://vuejs.org/guide/reusability/composables.html)
- [The Wrong Abstraction — Sandi Metz](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction)
