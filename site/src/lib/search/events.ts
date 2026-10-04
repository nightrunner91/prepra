export const OPEN_SEARCH_SELECTOR = "[data-open-search]";
export const TAG_SEARCH_SELECTOR = "[data-search-tag]";
export const SEARCH_EVENT = "prepra:search";

export function openSearchWithQuery(query: string): void {
  window.dispatchEvent(new CustomEvent(SEARCH_EVENT, { detail: { query } }));
}