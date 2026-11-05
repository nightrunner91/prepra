---
title: "Стримы и backpressure"
section: nodejs
description: "Readable, Writable, Duplex и Transform, порог highWaterMark, pipe и pipeline, обработка больших файлов и Web Streams."
order: 8
tags: ["streams", "backpressure", "highwatermark", "pipeline", "web-streams"]
stacks: []
questions:
  - "Что произойдёт, если производитель игнорирует `false` из `write()` и продолжает писать"
  - "Как `pipeline` обрабатывает ошибку в середине цепочки и чем это отличается от `pipe`"
  - "Почему `readFile` + `res.end` убивает память под нагрузкой, а потоковая отдача — нет"
  - "Почему `highWaterMark` — порог, а не жёсткий лимит памяти, и когда эта разница проявляется"
  - "Чем flowing mode отличается от paused и async iteration и что происходит при `break` в цикле"
  - "Чем `end`, `finish` и `close` отличаются и почему `pipeline` ждёт не только `finish`"
  - "В чём разница между Duplex и Transform и почему в object mode `highWaterMark` считает объекты"
  - "Чем Web Streams отличаются от стримов Node и как передать `response.body` из `fetch` в файл"
answers:
  - "Внутренний буфер `Writable` вырастет до размера всех записанных данных: ошибки не будет, но память, задержки и риск OOM растут пропорционально объёму. `false` — это сигнал остановиться до события `drain`, а не индикатор сбоя."
  - "`pipeline` разрушает все стадии, закрывает файлы и сокеты и отклоняет промис с исходной ошибкой. `pipe` ошибки не пробрасывает: источник и приёмник могут остаться открытыми, а необработанное событие `error` способно уронить процесс."
  - "`readFile` выделяет буфер под весь файл на каждый запрос, поэтому десять параллельных скачиваний держат в памяти десять копий. Поток читает окно размером с `highWaterMark` и притормаживает чтение, когда сокет не успевает, — память ограничена окном, а не размером файла."
  - "Порог определяет, когда `write()` вернёт `false` и когда прекратится `push()`, но уже принятый чанк целиком остаётся в буфере. Поэтому один чанк больше `highWaterMark` проходит сразу, а реальная память равна сумме накопленных чанков."
  - "В flowing mode поток выдаёт данные через `data` без ожидания потребителя, а async iteration забирает по чанку и тем самым даёт backpressure. `break`, `return` или исключение в цикле разрушают поток, освобождая файл или сокет."
  - "`end` означает, что источник больше не выдаст данных, `finish` — что приёмник записал и сбросил всё принятое, а `close` — что ресурс закрыт. `pipeline` ждёт завершения всей цепочки и закрытия ресурсов, а не только события `finish` последнего потока."
  - "Duplex — две независимые стороны в одном объекте, Transform — Duplex, который превращает вход в выход через `_transform`. В object mode `highWaterMark` измеряется в объектах (по умолчанию 16), а не в байтах, потому что размер объекта заранее неизвестен."
  - "Web Streams — стандарт WHATWG с промисами, `getReader()` и `pipeThrough`, а не EventEmitter и `pipe`; именно его использует `fetch`. `response.body` конвертируют через `Readable.fromWeb()`, после чего он работает с `pipeline`, `zlib` и файловыми потоками Node."
---

# Стримы и backpressure

Сервис, который читает файл целиком перед отправкой, на файле в 2 ГБ и десяти параллельных запросах займёт десятки гигабайт — задолго до того, как упрётся в лимит контейнера. Стримы решают эту задачу иначе: данные идут чанками, а буфер между производителем и потребителем ограничен. Разберём типы потоков, механизм backpressure, разницу между `pipe` и `pipeline` и то, как перейти от буферов в памяти к честной потоковой обработке.

## Содержание

1. [Зачем нужны стримы](#зачем-нужны-стримы)
2. [Четыре типа потоков](#четыре-типа-потоков)
3. [Readable: flowing, paused и async iteration](#readable-flowing-paused-и-async-iteration)
4. [Writable и backpressure](#writable-и-backpressure)
5. [pipe, pipeline и finished](#pipe-pipeline-и-finished)
6. [Ошибки, destroy и отмена](#ошибки-destroy-и-отмена)
7. [Потоковая обработка больших файлов](#потоковая-обработка-больших-файлов)
8. [Свои Transform и object mode](#свои-transform-и-object-mode)
9. [Web Streams и совместимость](#web-streams-и-совместимость)
10. [Частые ошибки](#частые-ошибки)
11. [Эксперименты](#эксперименты)
12. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
13. [Заключение](#заключение)
14. [Полезные ссылки](#полезные-ссылки)

---

## Зачем нужны стримы

Разница между `readFile` и `createReadStream` — не в удобстве API, а в профиле памяти. `readFile` сначала выделяет буфер под весь файл и только потом возвращает результат. Один запрос к файлу в 2 ГБ — это 2 ГБ в `arrayBuffers`; десять одновременных запросов — 20 ГБ, OOM и падение сервиса. Подробнее о том, почему буферы живут вне кучи V8, — в статье [«Встроенные модули Node.js»](./builtin-api.md).

Стрим не загружает файл целиком. Он читает очередной кусок размером порядка `highWaterMark`, отдаёт его потребителю и ждёт, пока тот освободит место. Пока сокет медленно отправляет данные, файловый поток приостанавливает чтение; в памяти висит одно окно, а не весь файл. Это свойство называют **backpressure** — обратным давлением: медленный потребитель тормозит быстрого производителя, вместо того чтобы копить данные.

Стримы — не отдельная библиотека для редких задач, а основа сетевого слоя Node: `http.IncomingMessage` и `http.ServerResponse`, `fs.createReadStream`, `net.Socket`, `zlib`, шифрование и `child_process` работают через них. Поэтому понимание потоков нужно и для HTTP-сервера, и для загрузки файлов, и для проксирования ответов.

Цена — сложность. У потока несколько состояний, ошибки приходят событиями, а не исключениями, а цепочку нужно собирать так, чтобы при сбое закрылись все ресурсы. Ниже — минимальный набор правил, который делает эту сложность управляемой.

---

## Четыре типа потоков

Все потоки строятся на четырёх базовых классах из `node:stream`:

| Тип | Что делает | Типичные представители |
|---|---|---|
| `Readable` | источник данных | `fs.createReadStream()`, `http.IncomingMessage`, `process.stdin` |
| `Writable` | приёмник данных | `fs.createWriteStream()`, `http.ServerResponse` |
| `Duplex` | и источник, и приёмник; стороны независимы | `net.Socket`, `tls.TLSSocket` |
| `Transform` | `Duplex`, который преобразует вход в выход | `zlib.createGzip()`, `crypto.createCipheriv()` |

`PassThrough` — вырожденный `Transform`, который ничего не меняет: удобен, чтобы вклиниться в цепочку, наблюдать чанки или разделить поток на две ветки.

Потоки совместимы по интерфейсу: у читаемого есть `pipe()`, `read()`, события `data`/`end`, у записываемого — `write()`, `end()`, `drain`. Кроме событий, любой поток можно обходить асинхронным итератором `for await`, а `Readable.from()` строит читаемый поток из массива, синхронного или асинхронного генератора.

Node-стримы — наследники `EventEmitter`, поэтому событие `error` у них подчиняется тем же правилам: без слушателя процесс падает. Общая механика разобрана в статье [«EventEmitter и события»](./event-emitter.md).

---

## Readable: flowing, paused и async iteration

У читаемого потока три режима, и от выбранного зависит, кто управляет темпом.

| Режим | Как включается | Кто задаёт скорость |
|---|---|---|
| flowing | подписка на `data` или `resume()` | поток: выдаёт чанки, не ожидая потребителя |
| paused | `read()`, событие `readable`, `pause()` | потребитель: забирает данные по мере готовности |
| async iteration | `for await (const chunk of stream)` | потребитель: цикл ждёт обработки каждого чанка |

В flowing mode обработчик `data` вызывается на каждый чанк, а поток продолжает читать. Если обработчик медленный, данные не теряются, но копятся в буфере потока и входящего сокета: `data` не даёт обратного давления. Поэтому тяжёлая синхронная работа в `data` — такая же проблема, как в HTTP-обработчике: она блокирует event loop и не даёт источнику остановиться.

Paused mode — pull-модель: потребитель вызывает `read(size)`, получает чанк или `null`, а событие `readable` сообщает, что данные появились. Так работает и асинхронный итератор, который предпочтителен в новом коде:

```js
import { createReadStream } from 'node:fs';

const source = createReadStream('access.log', { encoding: 'utf8' });

for await (const chunk of source) {
  await processChunk(chunk); // цикл ждёт обработки, поток не бежит вперёд
}
```

Три детали, которые легко упустить.

**`for await` даёт backpressure.** Пока тело цикла не завершилось, следующая порция не запрашивается; буфер источника заполняется до `highWaterMark` и чтение останавливается.

**`break` разрушает поток.** Выход из цикла по `break`, `return` или исключению вызывает `destroy()` — файловый дескриптор закрывается. Это удобно, но означает, что «прочитать первые десять строк» нельзя, не закрыв поток; для такого чтения лучше `readline` или явный `read()`.

**Не смешивайте режимы.** Если на потоке уже висит обработчик `data`, он переводит поток в flowing, и `for await` начнёт конкурировать с ним за чанки. Один потребитель — один режим.

`setEncoding('utf8')` или опция `encoding` превращает буферы в строки. Внутри используется `StringDecoder`, который склеивает разрезанный на границе чанка многобайтовый символ, — вручную через `chunk.toString()` этого не получить.

---

## Writable и backpressure

`Writable` принимает чанки через `write()` и передаёт их в реализацию `_write()` по одному. Пока запись не завершилась, следующие чанки лежат во внутреннем буфере. Его размер и ограничивает `highWaterMark`.

```js
import { once } from 'node:events';
import { createWriteStream } from 'node:fs';

const dest = createWriteStream('out.log');

for (const chunk of chunks) {
  if (!dest.write(chunk)) {
    await once(dest, 'drain'); // буфер заполнен — ждём, пока он опустеет
  }
}
dest.end();
```

`write()` возвращает `true`, пока объём буфера меньше порога, и `false`, когда порог достигнут или превышен. `false` — не ошибка, а просьба остановиться: следующий `write()` разрешён после события `drain`. Если сигнал игнорировать, буфер вырастет до размера всех данных: исключения не будет, но память и задержка будут расти, пока процесс не упадёт по OOM.

У читаемой стороны зеркальная логика: `push(chunk)` возвращает `false`, когда внутренняя очередь заполнена, и источник перестаёт вызывать `_read()`, пока потребитель не заберёт данные.

Размеры по умолчанию:

- с Node 22 дефолт `stream` — 64 КиБ для байтовых потоков (до этого — 16 КиБ);
- в object mode — 16 объектов;
- текущие значения доступны через `stream.getDefaultHighWaterMark(objectMode)`, изменить глобально — `stream.setDefaultHighWaterMark()`.

`highWaterMark` — **порог, а не лимит**. Он определяет, когда поток перестаёт просить новые данные, но не запрещает принять чанк больше порога и не ограничивает сумму уже принятых чанков. Реальная память — это буфер, а не константа в конструкторе.

Порог выбирают под задачу. Слишком маленький — больше системных вызовов и переключений; слишком большой — больше памяти на каждое соединение. При 10 000 открытых сокетов разница между 16 и 64 КиБ на поток составляет сотни мегабайт потенциального буфера, поэтому в чувствительных к памяти сервисах размер задают явно.

Инспектировать состояние помогают `writableLength`, `writableNeedDrain`, `writableHighWaterMark` и `readableLength`.

---

## pipe, pipeline и finished

`readable.pipe(writable)` соединяет потоки и управляет скоростью: при `write() === false` вызывает `pause()` у источника, на `drain` — `resume()`, а по завершении вызывает `dest.end()`. Этого достаточно для простой передачи, но не для надёжной цепочки.

Чего `pipe` не делает:

- не пробрасывает ошибку из одной стадии в другую;
- не разрушает источник, если приёмник упал, — файл или сокет может остаться открытым;
- не гарантирует очистку слушателей при ошибке;
- не сообщает вызывающему коду, что цепочка завершилась (нет ни промиса, ни колбэка);
- не гарантирует, что ошибка не станет необработанным событием `error` и не уронит процесс.

`pipeline` из `node:stream/promises` закрывает эти пробелы: связывает стадии, при ошибке любой из них вызывает `destroy(err)` на всех и отклоняет промис. Он же ждёт фактического завершения и закрытия ресурсов.

```js
import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';

await pipeline(
  createReadStream('access.log'),
  createGzip(),
  createWriteStream('access.log.gz'),
);
```

`pipeline` принимает не только потоки, но и асинхронные генераторы в роли источника или трансформации, поддерживает Web Streams (с Node 18.16 и 19.7) и опции:

- `{ signal }` — отмена через `AbortSignal`; стадии разрушаются с ошибкой отмены (`AbortError` или `TimeoutError`);
- `{ end: false }` — не закрывать последний поток автоматически.

`finished` решает другую задачу — дождаться, что поток больше не читается и не пишется:

```js
import { finished } from 'node:stream/promises';

await finished(dest);
```

Он отклоняется на `error`, но ничего не разрушает и не управляет цепочкой. Его место — ожидание конкретного потока: дописать лог перед выходом, дождаться закрытия сокета, проверить поток в тесте. Для цепочки из нескольких стадий нужен `pipeline`, а не набор `finished`.

События завершения различаются:

- `end` — источник выдал все данные, но потребитель мог их ещё не обработать;
- `finish` — приёмник принял и сбросил всё, что ему передали;
- `close` — базовый ресурс (файл, сокет) закрыт, обычно после `destroy()`.

`pipeline` ждёт не только `finish`, но и закрытия ресурсов, поэтому его промис — более сильная гарантия, чем `finish` на последнем потоке.

---

## Ошибки, destroy и отмена

Ошибка в потоке приходит событием `error`, а не исключением в точке вызова. Без слушателя это необработанное событие: процесс завершается. Поэтому в ручной цепочке на каждый поток нужен обработчик, а в `pipeline` — `try/catch` вокруг `await`.

```js
import { pipeline } from 'node:stream/promises';

try {
  await pipeline(source, transform, destination);
} catch (err) {
  logger.error({ err }, 'поток упал');
}
```

`pipeline` вызывает `destroy(err)` на всех стадиях, кроме уже завершившихся. `destroy()` освобождает ресурс, после чего поток эмитит `error` и `close`. С Node 14 `autoDestroy` включён по умолчанию: поток разрушается сам после `end`, `finish` или ошибки, поэтому повторно использовать его нельзя.

В собственной реализации `Writable` ошибку сообщают через колбэк, а не `throw`:

```js
_write(chunk, _encoding, callback) {
  save(chunk)
    .then(() => callback())
    .catch(callback); // ошибка уйдёт в 'error' и в pipeline
}
```

Отмена нужна там, где работа может длиться дольше, чем нужно: клиент закрыл соединение, истёк таймаут, сервис останавливается. Для этого есть `AbortSignal`:

```js
const signal = AbortSignal.timeout(5_000);

await pipeline(source, destination, { signal });
```

`addAbortSignal(signal, stream)` делает то же для отдельного потока: при отмене разрушает его с ошибкой отмены. Для HTTP-ответа удобно связать сигнал с закрытием соединения:

```js
const ac = new AbortController();
res.on('close', () => ac.abort());
await pipeline(createReadStream(file), res, { signal: ac.signal });
```

Если заголовки уже отправлены, код состояния изменить нельзя: остаётся `res.destroy(err)`, чтобы оборвать соединение, а не пытаться вернуть JSON с ошибкой.

---

## Потоковая обработка больших файлов

Правило одно: **не собирайте данные в память, если их можно обработать по пути**. Всё остальное — детали конкретного формата.

**CSV.** Парсер — это `Transform`, поэтому он встаёт в цепочку между файлом и приёмником:

```js
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { parse } from 'csv-parse';

await pipeline(
  createReadStream('orders.csv'),
  parse({ columns: true, bom: true }),
  async function* (rows) {
    for await (const row of rows) {
      if (row.status === 'paid') yield `${row.id}\n`;
    }
  },
  createWriteStream('paid-ids.txt'),
);
```

Асинхронный генератор здесь — обычная стадия `pipeline`: он получает предыдущий поток и выдаёт новый, сохраняя backpressure.

**Архивы.** `zlib.createGzip()` сжимает поток на лету, `tar-stream` и `archiver` читают и собирают архивы по записям. Распаковка «в память» через `readFile` на архиве в несколько гигабайт сводит всю экономию на нет.

**Отдача файла клиенту.** Размер известен — ставят `Content-Length`; неизвестен — работает chunked transfer encoding. `pipeline` сам вызывает `end()` у ответа:

```js
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

createServer(async (req, res) => {
  const ac = new AbortController();
  res.on('close', () => ac.abort());

  try {
    res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
    await pipeline(createReadStream('big.bin'), res, { signal: ac.signal });
  } catch (err) {
    if (err.name !== 'AbortError') res.destroy(err);
  }
}).listen(3000);
```

Чего здесь нет: проверки пути (пользовательский ввод нельзя бездумно подставлять в `createReadStream` — см. path traversal в статье [«Встроенные модули Node.js»](./builtin-api.md)), поддержки `Range` и проверки прав. Статику обычно отдают через reverse proxy или библиотеку, а не самописным обработчиком.

**Загрузка файла.** Тело запроса — тоже `Readable`, поэтому его пишут на диск потоком:

```js
await pipeline(req, createWriteStream(target));
```

Стрим не ограничивает размер тела: лимит ставят на прокси или проверяют `Content-Length` до чтения. Обрыв соединения посреди загрузки оставит неполный файл — его удаляют или проверяют размер и хеш после записи.

---

## Свои Transform и object mode

`Transform` — это `Duplex`, у которого вход и выход связаны: каждый чанк проходит через `_transform`, результат уходит в `push()`. Когда вход закончился, вызывается `_flush` — место для хвоста, который накопился в буфере.

```js
import { Transform } from 'node:stream';
import { StringDecoder } from 'node:string_decoder';

class JsonLinesParser extends Transform {
  #buffer = '';
  #decoder = new StringDecoder('utf8');

  constructor() {
    super({ readableObjectMode: true });
  }

  _transform(chunk, _encoding, callback) {
    this.#buffer += this.#decoder.write(chunk);
    const lines = this.#buffer.split('\n');
    this.#buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        this.push(JSON.parse(line));
      } catch (err) {
        return callback(err);
      }
    }
    callback();
  }

  _flush(callback) {
    this.#buffer += this.#decoder.end();
    if (!this.#buffer.trim()) return callback();

    try {
      this.push(JSON.parse(this.#buffer));
      callback();
    } catch (err) {
      callback(err);
    }
  }
}
```

`StringDecoder` нужен, потому что чанк — это произвольный кусок байтов, и разрезанный посередине UTF-8 символ нельзя декодировать по отдельности. `readableObjectMode: true` позволяет выдавать объекты, хотя на вход приходят буферы.

**Object mode** переключает поток с байтов на произвольные JavaScript-значения. В нём `highWaterMark` считается в объектах (по умолчанию 16), потому что размер объекта заранее неизвестен. `readableObjectMode` и `writableObjectMode` включаются независимо; `null` в object mode — не данные, а сигнал конца потока, поэтому записать его нельзя.

```js
import { Readable } from 'node:stream';

const rows = Readable.from([{ id: 1 }, { id: 2 }]); // objectMode включён
```

Object mode удобен для строк БД, результатов парсинга и сообщений очереди. Но помните: поток объектов не уменьшает память сам по себе — если каждый объект большой, буфер из 16 таких объектов может весить больше, чем килобайтное окно байтового потока.

И ещё: `_transform` выполняется в главном потоке. Синхронный парсинг большого JSON или сжатие внутри колбэка блокируют event loop так же, как любой другой синхронный код; для CPU-bound работы нужно выносить её в worker, а не надеяться, что «это же стрим».

---

## Web Streams и совместимость

В Node есть два семейства потоков. Кроме классических `node:stream`, поддерживаются **Web Streams** — стандарт WHATWG с `ReadableStream`, `WritableStream` и `TransformStream`. Они глобальны с Node 18, доступны и из `node:stream/web`.

Различия принципиальные:

| Аспект | Стримы Node | Web Streams |
|---|---|---|
| Чтение | события, `read()`, async iterator | `getReader()`, `read()` с промисом |
| Соединение | `pipe()` | `pipeThrough()`, `pipeTo()` |
| Ошибки | событие `error` | отклонение промиса |
| Backpressure | `write() === false`, `drain` | `desiredSize` и `controller` |
| Источник | `fs`, `http`, `zlib` | `fetch`, браузерные API |

Web Streams — это то, что возвращает `fetch`: `response.body` — `ReadableStream`, а `request.body` при отправке — поток для загрузки. Обращаться с ним как с Node-стримом нельзя, но мост существует:

```js
import { Readable } from 'node:stream';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

const upstream = await fetch(url);

await pipeline(
  Readable.fromWeb(upstream.body),
  createWriteStream('copy.bin'),
);
```

`Readable.fromWeb()` сохраняет backpressure: медленная запись притормозит чтение из сети. Обратное направление — `Readable.toWeb(createReadStream(file))`, например чтобы вернуть файл из обработчика, который умеет только `Response`. Аналогичные пары есть для `Writable` и `Duplex`.

С Node 18.16 `pipeline` принимает Web Streams напрямую, но при смешивании с Node-трансформами (`zlib`, `crypto`) проще привести поток к одному семейству. `for await` по `ReadableStream` тоже работает и при `break` отменяет поток.

---

## Частые ошибки

- **`readFile` + `res.end`.** Файл целиком в памяти на каждый запрос; под нагрузкой это OOM. Для отдачи — `createReadStream` и `pipeline`.
- **Игнорирование `write() === false`.** Буфер растёт без сигнала ошибки; спасает только лимит памяти процесса.
- **`pipe` без обработки ошибок.** Ошибка одной стадии не закрывает остальные, а необработанное `error` роняет процесс.
- **Смешивание `data` и `for await`.** Два потребителя конкурируют за чанки; поведение зависит от порядка подписок.
- **Огромный `highWaterMark` «для скорости».** Порог — не пропускная способность: память на каждое соединение растёт, а выигрыш часто в другом.
- **Забытый `end()`.** Приёмник не эмитит `finish`, `pipeline` не завершается, соединение висит.
- **Отсутствие `_flush`.** Последняя строка без перевода строки или хвост архива теряются.
- **Сборка всего результата через `Buffer.concat`.** Данные уже были потоком, но снова сложены в память.
- **Синхронная CPU-работа в `_transform`.** Поток не спасает event loop от блокировки.
- **Нет реакции на обрыв клиента.** Чтение файла продолжается в пустоту, дескриптор занят до конца передачи.

---

## Эксперименты

Три запуска, которые показывают поведение, плохо заметное в документации.

### 1. `write()` возвращает `false` и `drain`

```js
import { Writable } from 'node:stream';

const slow = new Writable({
  highWaterMark: 16,
  write(chunk, _encoding, callback) {
    setTimeout(callback, 50);
  },
});

for (let i = 1; i <= 5; i++) {
  console.log(`write ${i}:`, slow.write(Buffer.alloc(8)));
}

slow.on('drain', () => console.log('drain'));
slow.end();
```

Первые записи вернут `true`, затем `false`: буфер заполнился, и продолжать можно только после `drain`. Данные при этом не теряются — они ждут во внутренней очереди.

### 2. Ошибка в середине цепочки

```js
import { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const source = Readable.from(async function* () {
  yield 'a';
  throw new Error('boom');
}());

const dest = new Writable({
  write(_chunk, _encoding, callback) {
    callback();
  },
});

try {
  await pipeline(source, dest);
} catch (err) {
  console.log('pipeline упал:', err.message); // boom
}
```

`pipeline` отклоняет промис и разрушает обе стадии. С `pipe` та же ошибка осталась бы необработанным событием `error`.

### 3. `break` разрушает поток

```js
import { Readable } from 'node:stream';

const numbers = Readable.from([1, 2, 3, 4]);

for await (const n of numbers) {
  console.log(n);
  if (n === 2) break;
}

console.log('destroyed:', numbers.destroyed); // true
```

Выход из цикла — это не «пауза», а закрытие потока. Если данные ещё нужны, поток нельзя покидать через `break`.

---

## Ключевые тезисы для интервью

- Стрим ограничивает память окном `highWaterMark`, а не размером данных: медленный потребитель притормаживает источник через backpressure, вместо того чтобы копить всё в буфере.
- `write()` возвращает `false` при заполнении буфера, и продолжать можно только после `drain`; игнорирование сигнала не даёт ошибки, но превращает буфер в неограниченную память.
- `pipe` соединяет потоки и управляет скоростью, но не пробрасывает ошибки и не закрывает цепочку; `pipeline` разрушает все стадии при сбое, поддерживает промисы, `AbortSignal`, генераторы и Web Streams.
- `finished` только ждёт завершения конкретного потока, а `end`, `finish` и `close` означают разное: конец данных, сброс записи и закрытие ресурса.
- Flowing mode (`data`) не даёт backpressure, async iteration забирает чанки по одному и даёт; `break` в цикле разрушает поток.
- `Transform` — это `Duplex` с `_transform` и `_flush`; в object mode `highWaterMark` считается в объектах (16 по умолчанию), а `null` означает конец потока.
- Web Streams — стандарт `fetch` с промисами и `getReader()`; мост к Node — `Readable.fromWeb()` и `Readable.toWeb()`, при этом backpressure сохраняется.

## Заключение

Стримы нужны там, где размер данных превышает разумный буфер: файлы, ответы API, архивы, загрузки, логи. Их главная идея — не «читать по кусочкам», а ограничить окно и передать управление скоростью потребителю. Отсюда три практических правила: уважайте `false` и `drain`, собирайте цепочки через `pipeline`, а не `pipe`, и всегда закрывайте ресурсы при ошибке или отмене. Если эти правила соблюдены, память сервиса перестаёт зависеть от размера файла, а поведение под нагрузкой становится предсказуемым. Дальше эти же потоковые принципы встречаются в HTTP-сервере, проксировании и фоновых задачах.

## Полезные ссылки

- [Stream](https://nodejs.org/api/stream.html) — полный API классических потоков
- [Backpressuring in Streams](https://nodejs.org/en/learn/modules/backpressuring-in-streams) — официальное объяснение backpressure
- [stream/promises](https://nodejs.org/api/stream.html#streampromises) — `pipeline` и `finished` в промис-варианте
- [Web Streams](https://nodejs.org/api/webstreams.html) — `ReadableStream`, `WritableStream`, `TransformStream`
- [Streams Standard](https://streams.spec.whatwg.org/) — спецификация Web Streams
