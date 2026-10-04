import MiniSearch from "minisearch";
import { withBase } from "../urls";
import { processTerm } from "./stemmer";
import { expandTerm } from "./translit";

export interface SearchDocument {
  id: string;
  title: string;
  tags: string[];
  text: string;
  description?: string;
  url: string;
  section: string;
  sectionLabel: string;
  order: number;
  questionCount: number;
}

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  url: string;
  sectionLabel: string;
  order: number;
  questionCount: number;
  score: number;
}

interface MiniSearchHit {
  id: string;
  score: number;
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/\s+/).filter(Boolean);
}

let documentsPromise: Promise<SearchDocument[]> | null = null;
let miniSearchPromise: Promise<MiniSearch> | null = null;

function loadDocuments(): Promise<SearchDocument[]> {
  if (!documentsPromise) {
    documentsPromise = fetch(withBase("/search-index.json"))
      .then((res) => {
        if (!res.ok) throw new Error(`Search index: ${res.status}`);
        return res.json();
      })
      .then((data) => data as SearchDocument[]);
  }
  return documentsPromise;
}

function buildSearch(): Promise<MiniSearch> {
  if (!miniSearchPromise) {
    miniSearchPromise = loadDocuments().then((documents) => {
      const miniSearch = new MiniSearch({
        idField: "id",
        fields: ["title", "tags", "text"],
        storeFields: [
          "title",
          "description",
          "url",
          "section",
          "sectionLabel",
          "order",
          "questionCount",
        ],
        processTerm,
        tokenize,
        searchOptions: {
          prefix: false,
          fuzzy: false,
          combineWith: "OR",
        },
      });
      miniSearch.addAll(
        documents.map((doc) => ({ ...doc, tags: (doc.tags ?? []).join(" ") })),
      );
      return miniSearch;
    });
  }
  return miniSearchPromise;
}

const BOOST = { title: 2, tags: 3, text: 1 };

export async function search(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const terms = tokenize(trimmed);
  const queries = [...new Set(terms.flatMap(expandTerm))].filter(Boolean);
  if (queries.length === 0) return [];

  const [miniSearch, documents] = await Promise.all([buildSearch(), loadDocuments()]);
  const byId = new Map(documents.map((doc) => [doc.id, doc]));

  const hits = miniSearch.search({ queries, combineWith: "OR" }, {
    prefix: false,
    fuzzy: false,
    boost: BOOST,
  }) as unknown as MiniSearchHit[];

  return hits
    .filter((hit) => byId.has(hit.id))
    .map((hit) => {
      const doc = byId.get(hit.id)!;
      return {
        id: doc.id,
        title: doc.title,
        description: doc.description,
        url: doc.url,
        sectionLabel: doc.sectionLabel,
        order: doc.order,
        questionCount: doc.questionCount,
        score: hit.score,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.order !== b.order) return a.order - b.order;
      return a.sectionLabel.localeCompare(b.sectionLabel, "ru");
    })
    .slice(0, 5);
}