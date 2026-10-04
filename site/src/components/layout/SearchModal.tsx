import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  OPEN_SEARCH_SELECTOR,
  SEARCH_EVENT,
  TAG_SEARCH_SELECTOR,
} from "../../lib/search/events";
import { addToHistory, getHistory, removeFromHistory } from "../../lib/search/history";
import { search, type SearchResult } from "../../lib/search/searchClient";

const DEBOUNCE_MS = 150;
const RESULTS_LIMIT_LABEL = 5;

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [history, setHistory] = useState<string[]>(() => getHistory());
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const seqRef = useRef(0);
  const resultsRef = useRef(results);
  resultsRef.current = results;
  const queryRef = useRef(query);
  queryRef.current = query;

  const commit = useCallback((value: string) => {
    setHistory(addToHistory(value));
  }, []);

  const runSearch = useCallback(async (value: string) => {
    const trimmed = value.trim();
    const seq = ++seqRef.current;
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      setSearching(false);
      setActiveIndex(-1);
      return;
    }
    setHasSearched(true);
    setSearching(true);
    setActiveIndex(-1);
    const found = await search(trimmed);
    if (seq !== seqRef.current) return;
    setSearching(false);
    setResults(found);
    setActiveIndex(found.length > 0 ? 0 : -1);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setSearching(false);
    setActiveIndex(-1);
    lastTriggerRef.current?.focus?.();
  }, []);

  const openModal = useCallback(
    (prefill?: string) => {
      lastTriggerRef.current = document.activeElement as HTMLElement | null;
      setQuery(prefill ?? "");
      setResults([]);
      setHasSearched(false);
      setSearching(false);
      setActiveIndex(-1);
      setOpen(true);
      if (prefill?.trim()) {
        commit(prefill);
        runSearch(prefill);
      }
    },
    [commit, runSearch],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openModal();
      }
    };
    const onSearchEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ query?: string }>).detail;
      openModal(detail?.query);
    };
    const onDocClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        `${OPEN_SEARCH_SELECTOR}, ${TAG_SEARCH_SELECTOR}`,
      );
      if (!target) return;
      const tag = target.getAttribute("data-search-tag");
      event.preventDefault();
      openModal(tag ?? undefined);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(SEARCH_EVENT, onSearchEvent);
    document.addEventListener("click", onDocClick);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(SEARCH_EVENT, onSearchEvent);
      document.removeEventListener("click", onDocClick);
    };
  }, [openModal]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      runSearch(query);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query, open, runSearch]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      const list = resultsRef.current;
      if (event.key === "ArrowDown") {
        if (list.length > 0) {
          event.preventDefault();
          setActiveIndex((prev) => (prev + 1) % list.length);
        }
      } else if (event.key === "ArrowUp") {
        if (list.length > 0) {
          event.preventDefault();
          setActiveIndex((prev) => (prev - 1 + list.length) % list.length);
        }
      } else if (event.key === "Enter") {
        event.preventDefault();
        commit(queryRef.current);
        const target = list.length > 0 ? list[activeIndex >= 0 ? activeIndex : 0] : undefined;
        if (target) {
          close();
          window.location.assign(target.url);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close, commit, activeIndex]);

  const selectResult = useCallback(
    (result: SearchResult) => {
      commit(queryRef.current);
      close();
      window.location.assign(result.url);
    },
    [commit, close],
  );

  const searchPill = useCallback(
    (pill: string) => {
      commit(pill);
      setQuery(pill);
      runSearch(pill);
    },
    [commit, runSearch],
  );

  const removePill = useCallback((pill: string) => {
    setHistory(removeFromHistory(pill));
  }, []);

  const clearQuery = useCallback(() => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }, []);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Поиск по сайту"
      className="fixed inset-0 z-[70] flex flex-col bg-black/70 backdrop-blur-sm sm:px-6 sm:py-16"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="flex h-full min-h-0 w-full flex-col border-2 border-border bg-canvas sm:mx-auto sm:h-auto sm:max-h-[calc(100vh-8rem)] sm:max-w-3xl">
        <div className="flex items-center gap-3 border-b-2 border-border px-4 sm:px-6">
          <MagnifyingGlass size={22} weight="bold" className="shrink-0 text-text/60" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по Prepra..."
            aria-label="Поиск по сайту"
            aria-controls="search-results"
            className="h-14 min-w-0 flex-1 bg-transparent text-base text-text placeholder:text-text/50 focus:outline-none sm:h-16"
          />
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              aria-label="Очистить запрос"
              className="shrink-0 text-text-tertiary transition-colors hover:text-text"
            >
              <X size={18} weight="bold" />
            </button>
          )}
          <kbd
            aria-hidden="true"
            className="hidden shrink-0 border border-border px-2 py-1 font-mono text-xs text-text/50 sm:flex"
          >
            Esc
          </kbd>
          <button
            type="button"
            onClick={close}
            aria-label="Закрыть поиск"
            className="shrink-0 text-text-tertiary transition-colors hover:text-text sm:hidden"
          >
            <X size={24} weight="bold" />
          </button>
        </div>

        {history.length > 0 && (
          <div className="flex flex-wrap gap-2.5 border-b-2 border-border px-4 py-4 sm:px-6">
            {history.map((pill) => (
              <span
                key={pill}
                className="inline-flex items-center border-2 border-border bg-surface-alt text-text-secondary badge-hover-neutral transition-all"
              >
                <button
                  type="button"
                  onClick={() => searchPill(pill)}
                  className="px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-text-secondary transition-colors hover:text-text"
                >
                  {pill}
                </button>
                <button
                  type="button"
                  onClick={() => removePill(pill)}
                  aria-label={`Удалить запрос «${pill}»`}
                  className="py-1.5 pl-1.5 pr-2.5 text-text-tertiary transition-colors hover:text-text"
                >
                  <X size={13} weight="bold" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="min-h-[200px] flex-1 overflow-y-auto p-4 sm:p-6">
          {hasSearched && !searching && results.length === 0 ? (
            <p className="px-2 py-14 text-center font-mono text-base font-bold uppercase tracking-wider text-text-tertiary">
              Ничего не найдено
            </p>
          ) : (
            <ul
              id="search-results"
              role="listbox"
              aria-label="Результаты поиска"
              aria-activedescendant={
                activeIndex >= 0 ? `search-result-${activeIndex}` : undefined
              }
              className="space-y-3"
            >
              {results.slice(0, RESULTS_LIMIT_LABEL).map((result, index) => (
                <li
                  key={result.id}
                  id={`search-result-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                >
                  <a
                    href={result.url}
                    onClick={(event) => {
                      event.preventDefault();
                      selectResult(result);
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`card-hover block border-2 px-4 py-3 transition-all sm:px-5 ${index === activeIndex ? "border-accent bg-surface" : "border-border bg-surface"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-5">
                      <h3 className="min-w-0 font-mono text-sm font-extrabold uppercase tracking-tight text-text">
                        {result.title}
                      </h3>
                      <span className="shrink-0 border border-border px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
                        {result.sectionLabel}
                      </span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}