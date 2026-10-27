import {
  ArrowCounterClockwise,
  ArrowRight,
  Eye,
  EyeSlash,
  Lightbulb,
  Play,
  Spinner,
} from "@phosphor-icons/react";
import { useState, type KeyboardEvent } from "react";
import type { CodeTask } from "../../lib/practice/types";
import { withBase } from "../../lib/urls";
import { CodeBlock } from "./CodeBlock";
import { InlineText, formatValue } from "./ui";

interface TestResult {
  ok: boolean;
  label: string;
  actual: string;
  expected: string;
  ms: number;
}

interface WorkerResponse {
  fatal?: string;
  timeout?: boolean;
  results?: TestResult[];
}

const WORKER_SOURCE = `
self.onmessage = function (event) {
  var data = event.data;
  var code = data.code;
  var entry = data.entry;
  var tests = data.tests;

  function deepEqual(a, b) {
    if (Object.is(a, b)) return true;
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
      return false;
    }
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (a instanceof Map || b instanceof Map) {
      if (!(a instanceof Map) || !(b instanceof Map) || a.size !== b.size) return false;
      for (var pair of a) {
        if (!b.has(pair[0]) || !deepEqual(pair[1], b.get(pair[0]))) return false;
      }
      return true;
    }

    if (a instanceof Set || b instanceof Set) {
      if (!(a instanceof Set) || !(b instanceof Set) || a.size !== b.size) return false;
      for (var value of a) {
        if (!b.has(value)) return false;
      }
      return true;
    }

    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (var index = 0; index < a.length; index++) {
        if (!deepEqual(a[index], b[index])) return false;
      }
      return true;
    }

    var keysA = Object.keys(a);
    var keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    for (var key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  function format(value) {
    if (value === undefined) return 'undefined';
    if (typeof value === 'function') return 'function';
    if (typeof value === 'symbol') return value.toString();
    if (typeof value === 'bigint') return value.toString() + 'n';
    if (typeof value === 'number' && !isFinite(value)) return String(value);

    try {
      return JSON.stringify(value, function (key, current) {
        if (current instanceof Map) return Array.from(current.entries());
        if (current instanceof Set) return Array.from(current);
        if (typeof current === 'undefined') return '__undefined__';
        if (typeof current === 'number' && !isFinite(current)) return String(current);
        return current;
      }, 2);
    } catch (error) {
      return String(value);
    }
  }

  var fn;

  try {
    var factory = new Function(
      '"use strict";\\n' + code + '\\n; return typeof ' + entry + ' === "function" ? ' + entry + ' : undefined;'
    );
    fn = factory();
  } catch (error) {
    self.postMessage({ fatal: 'Синтаксическая ошибка: ' + error.message });
    return;
  }

  if (typeof fn !== 'function') {
    self.postMessage({
      fatal: 'Не найдена функция ' + entry + '. Не переименовывай её — тесты вызывают именно это имя.'
    });
    return;
  }

  var results = [];

  for (var testIndex = 0; testIndex < tests.length; testIndex++) {
    var test = tests[testIndex];
    var started = performance.now();

    try {
      var actual = fn.apply(null, test.args);
      results.push({
        ok: deepEqual(actual, test.expected),
        label: test.label || 'Тест ' + (testIndex + 1),
        actual: format(actual),
        expected: format(test.expected),
        ms: Math.round((performance.now() - started) * 100) / 100
      });
    } catch (error) {
      results.push({
        ok: false,
        label: test.label || 'Тест ' + (testIndex + 1),
        actual: 'Ошибка: ' + (error && error.message ? error.message : String(error)),
        expected: format(test.expected),
        ms: Math.round((performance.now() - started) * 100) / 100
      });
    }
  }

  self.postMessage({ results: results });
};
`;

function runTests(
  code: string,
  entry: string,
  tests: CodeTask["tests"],
): Promise<WorkerResponse> {
  return new Promise((resolve) => {
    if (typeof Worker === "undefined") {
      resolve({ fatal: "Web Worker недоступен в этом браузере." });
      return;
    }

    const blob = new Blob([WORKER_SOURCE], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    let worker: Worker;

    try {
      worker = new Worker(url);
    } catch (error) {
      URL.revokeObjectURL(url);
      resolve({
        fatal: `Не удалось запустить Worker: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
      return;
    }

    let settled = false;
    let timer: number | undefined;

    const finish = (value: WorkerResponse) => {
      if (settled) return;
      settled = true;
      if (timer) window.clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(value);
    };

    timer = window.setTimeout(() => {
      finish({
        fatal:
          "Превышено время выполнения: 4 секунды. Проверь, нет ли бесконечного цикла.",
      });
    }, 4000);

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      finish(event.data);
    };

    worker.onerror = (event) => {
      finish({ fatal: event.message || "Ошибка выполнения в Worker." });
    };

    worker.postMessage({ code, entry, tests });
  });
}

interface CodeChallengeProps {
  task: CodeTask;
  onResult: (solved: boolean) => void;
}

export function CodeChallenge({ task, onResult }: CodeChallengeProps) {
  const [code, setCode] = useState(task.starter);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const passed = results?.filter((result) => result.ok).length ?? 0;
  const allPassed =
    results !== null && results.length === task.tests.length && passed === task.tests.length;

  async function handleRun() {
    if (running) return;

    setRunning(true);
    setFatal(null);
    setResults(null);

    let response: WorkerResponse;

    try {
      response = await runTests(code, task.entry, task.tests);
    } catch (error) {
      setRunning(false);
      setFatal(
        `Не удалось выполнить тесты: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      onResult(false);
      return;
    }

    setRunning(false);

    if (response.timeout || response.fatal || !response.results) {
      setFatal(response.fatal ?? "Не удалось выполнить тесты.");
      onResult(false);
      return;
    }

    setResults(response.results);
    const success =
      response.results.length === task.tests.length &&
      response.results.every((result) => result.ok);

    if (success) {
      setRevealed(true);
      onResult(true);
    } else {
      onResult(false);
    }
  }

  function handleCodeChange(value: string) {
    setCode(value);
    if (results) setResults(null);
    if (fatal) setFatal(null);
  }

  function handleReset() {
    setCode(task.starter);
    setResults(null);
    setFatal(null);
    setRevealed(false);
    setShowSolution(false);
    setShowHints(false);
  }

  function handleSolution() {
    const next = !showSolution;
    setShowSolution(next);
    if (next) {
      setRevealed(true);
      onResult(false);
    }
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Tab") return;

    event.preventDefault();
    const element = event.currentTarget;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const nextCode = `${code.slice(0, start)}  ${code.slice(end)}`;
    setCode(nextCode);

    window.requestAnimationFrame(() => {
      element.selectionStart = start + 2;
      element.selectionEnd = start + 2;
    });
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden border-2 border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border bg-surface-alt px-3 py-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
            Решение · {task.entry}()
          </span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
            {task.tests.length} тестов
          </span>
        </div>

        <textarea
          value={code}
          onChange={(event) => handleCodeChange(event.target.value)}
          onKeyDown={handleEditorKeyDown}
          spellCheck={false}
          rows={Math.min(20, Math.max(10, code.split("\n").length + 1))}
          className="block w-full resize-y border-0 bg-canvas p-3 font-mono text-[13px] leading-relaxed text-text outline-none focus:ring-2 focus:ring-inset focus:ring-accent"
          aria-label={`Редактор решения задачи ${task.title}`}
        />

        <div className="flex flex-wrap items-center gap-2 border-t-2 border-border p-3">
          <button
            type="button"
            onClick={handleRun}
            disabled={running}
            className="inline-flex items-center gap-2 border-2 border-border bg-accent px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_var(--color-border)] active:translate-x-0 active:translate-y-0 active:shadow-none disabled:cursor-wait disabled:opacity-70"
          >
            {running ? (
              <Spinner size={15} weight="bold" className="animate-spin" />
            ) : (
              <Play size={15} weight="fill" />
            )}
            {running ? "Проверяем" : "Запустить тесты"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 border-2 border-border bg-surface px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-text transition-colors hover:bg-surface-alt"
          >
            <ArrowCounterClockwise size={15} weight="bold" />
            Сбросить
          </button>

          {task.hints && task.hints.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHints((value) => !value)}
              className="inline-flex items-center gap-2 border-2 border-border bg-surface px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-text transition-colors hover:bg-surface-alt"
              aria-expanded={showHints}
            >
              <Lightbulb size={15} weight="bold" />
              Подсказки
            </button>
          )}

          <button
            type="button"
            onClick={handleSolution}
            className="ml-auto inline-flex items-center gap-2 border-2 border-border bg-surface px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-text-secondary transition-colors hover:bg-surface-alt hover:text-text"
            aria-expanded={showSolution}
          >
            {showSolution ? <EyeSlash size={15} /> : <Eye size={15} />}
            {showSolution ? "Скрыть решение" : "Показать решение"}
          </button>
        </div>
      </div>

      {showHints && task.hints && task.hints.length > 0 && (
        <div className="border-2 border-border bg-pale-yellow-bg p-4">
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-pale-yellow-text">
            Подсказки
          </div>
          <ul className="mt-2 space-y-1.5 text-sm font-medium text-text-secondary">
            {task.hints.map((hint, index) => (
              <li key={index} className="flex gap-2">
                <span className="font-mono text-xs font-bold text-text-tertiary">
                  {index + 1}.
                </span>
                <span>
                  <InlineText text={hint} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {fatal && (
        <div className="border-2 border-pale-red-text bg-pale-red-bg p-4 font-mono text-sm font-bold text-pale-red-text">
          {fatal}
        </div>
      )}

      <details className="border-2 border-border bg-surface">
        <summary className="cursor-pointer px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-text-secondary">
          Тестовые случаи
        </summary>
        <div className="space-y-2 border-t-2 border-border p-3">
          {task.tests.map((test, index) => (
            <div key={index} className="border border-border bg-canvas p-2.5">
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                {test.label ?? `Тест ${index + 1}`}
              </div>
              <div className="mt-1.5 grid gap-1 text-[12px] text-text-secondary sm:grid-cols-2">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase text-text-tertiary">
                    Вход:
                  </span>
                  <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11.5px] text-text">
                    {formatValue(test.args)}
                  </pre>
                </div>
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase text-text-tertiary">
                    Ожидается:
                  </span>
                  <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11.5px] text-text">
                    {formatValue(test.expected)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </details>

      {results && (
        <div className="space-y-2">
          <div
            className={`border-2 border-border p-3 font-mono text-sm font-bold ${
              allPassed
                ? "bg-pale-green-bg text-pale-green-text"
                : "bg-pale-red-bg text-pale-red-text"
            }`}
          >
            {allPassed
              ? `Все тесты пройдены: ${passed} / ${task.tests.length}`
              : `Пройдено ${passed} из ${task.tests.length}. Попробуй ещё раз.`}
          </div>

          {results.map((result, index) => (
            <div
              key={index}
              className={`border-2 border-border p-3 ${
                result.ok ? "bg-pale-green-bg" : "bg-pale-red-bg"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`font-mono text-xs font-bold uppercase tracking-wider ${
                    result.ok ? "text-pale-green-text" : "text-pale-red-text"
                  }`}
                >
                  {result.ok ? "✓" : "✕"} {result.label}
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                  {result.ms} ms
                </span>
              </div>

              {!result.ok && (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div>
                    <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                      Получено
                    </div>
                    <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11.5px] text-text">
                      {result.actual}
                    </pre>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                      Ожидалось
                    </div>
                    <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11.5px] text-text">
                      {result.expected}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showSolution && (
        <div className="space-y-2">
          <CodeBlock code={task.solution} label="Эталонное решение" />
          <button
            type="button"
            onClick={() => setCode(task.solution)}
            className="border-2 border-border bg-surface px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-text-secondary transition-colors hover:bg-surface-alt hover:text-text"
          >
            Загрузить решение в редактор
          </button>
        </div>
      )}

      {revealed && (
        <div
          className={`border-2 border-border p-4 ${
            allPassed ? "bg-pale-green-bg" : "bg-surface-alt"
          }`}
        >
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-text">
            {allPassed ? "Разбор" : "Разбор решения"}
          </div>
          <p className="mt-2 whitespace-pre-line text-sm font-medium leading-relaxed text-text-secondary">
            <InlineText text={task.explanation} />
          </p>

          {task.article && (
            <a
              href={withBase(task.article.href)}
              className="mt-3 inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-wider text-accent hover:underline"
            >
              {task.article.label}
              <ArrowRight size={13} weight="bold" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
