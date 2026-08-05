import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileSearch,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { findSearchResults, type SearchPageResult } from "../../lib/document-text";
import type { SearchOptions } from "./types";

function HighlightedSnippet({
  result,
}: {
  result: SearchPageResult;
}) {
  const start = Math.min(Math.max(result.matchStart, 0), result.snippet.length);
  const end = Math.min(start + result.matchLength, result.snippet.length);
  if (end <= start) return result.snippet;
  return (
    <>
      {result.snippet.slice(0, start)}
      <mark>{result.snippet.slice(start, end)}</mark>
      {result.snippet.slice(end)}
    </>
  );
}

export function SearchPanel({
  document,
  active,
  pageCount,
  currentPage,
  matchCount,
  getPageText,
  onPageSelect,
  onSearch,
  onSearchClose,
}: {
  document: PDFDocumentProxy | null;
  active: boolean;
  pageCount: number;
  currentPage: number;
  matchCount: { current: number; total: number };
  getPageText: (page: number) => Promise<string>;
  onPageSelect: (page: number) => void;
  onSearch: (query: string, options: SearchOptions) => void;
  onSearchClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWords, setWholeWords] = useState(false);
  const [results, setResults] = useState<SearchPageResult[]>([]);
  const [indexProgress, setIndexProgress] = useState({ done: 0, total: 0 });
  const [indexError, setIndexError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active]);

  useEffect(() => {
    setQuery("");
    setResults([]);
    setIndexError("");
    onSearchClose();
  }, [document, onSearchClose]);

  useEffect(() => {
    if (!document || !query.trim()) {
      setResults([]);
      setIndexProgress({ done: 0, total: 0 });
      setIndexError("");
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      async function indexDocument() {
        setIndexProgress({ done: 0, total: pageCount });
        setIndexError("");
        const pages: string[] = [];
        try {
          for (let page = 1; page <= pageCount; page += 1) {
            const text = await getPageText(page);
            if (cancelled) return;
            pages.push(text);
            setIndexProgress({ done: page, total: pageCount });
          }
          if (!cancelled) {
            setResults(findSearchResults(pages, query, caseSensitive, wholeWords));
          }
        } catch {
          if (!cancelled) {
            setResults([]);
            setIndexProgress({ done: pageCount, total: pageCount });
            setIndexError("Search could not index this paper.");
          }
        }
      }
      void indexDocument();
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [caseSensitive, document, getPageText, pageCount, query, wholeWords]);

  function runPdfSearch(
    nextQuery: string,
    options: Partial<SearchOptions> = {},
    nextCaseSensitive = caseSensitive,
    nextWholeWords = wholeWords,
  ) {
    if (!nextQuery.trim()) {
      onSearchClose();
      return;
    }
    onSearch(nextQuery, {
      caseSensitive: nextCaseSensitive,
      entireWord: nextWholeWords,
      ...options,
    });
  }

  const resultTotal = useMemo(
    () => results.reduce((total, result) => total + result.count, 0),
    [results],
  );
  const indexing = Boolean(query.trim()) && indexProgress.done < indexProgress.total;

  return (
    <div className="sidebar-search">
      <div className="sidebar-search-controls">
        <label htmlFor="sidebar-pdf-search" className="sr-only">
          Find in paper
        </label>
        <div className="sidebar-search-input">
          <FileSearch className="size-4" aria-hidden="true" />
          <input
            ref={inputRef}
            id="sidebar-pdf-search"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              runPdfSearch(event.target.value);
            }}
            placeholder="Find in paper"
          />
          <span className="tabular-nums">
            {matchCount.current}/{matchCount.total}
          </span>
        </div>
        <fieldset className="sidebar-search-options">
          <legend className="sr-only">Search matching options</legend>
          <div className="sidebar-search-filters">
            {[
              {
                label: "Match case",
                checked: caseSensitive,
                change: (checked: boolean) => {
                  setCaseSensitive(checked);
                  runPdfSearch(
                    query,
                    { changeType: "casechange" },
                    checked,
                    wholeWords,
                  );
                },
              },
              {
                label: "Whole words",
                checked: wholeWords,
                change: (checked: boolean) => {
                  setWholeWords(checked);
                  runPdfSearch(
                    query,
                    { changeType: "entirewordchange" },
                    caseSensitive,
                    checked,
                  );
                },
              },
            ].map((option) => (
              <label key={option.label}>
                <input
                  type="checkbox"
                  checked={option.checked}
                  onChange={(event) => option.change(event.target.checked)}
                />
                <span className="sidebar-checkbox" aria-hidden="true">
                  {option.checked && <Check className="size-3" />}
                </span>
                {option.label}
              </label>
            ))}
          </div>
          <div
            className="sidebar-search-navigation"
            aria-label="Search result navigation"
          >
            <button
              type="button"
              title="Previous result"
              aria-label="Previous search result"
              disabled={!matchCount.total}
              onClick={() =>
                runPdfSearch(query, { again: true, findPrevious: true })
              }
            >
              <ChevronUp className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              title="Next result"
              aria-label="Next search result"
              disabled={!matchCount.total}
              onClick={() => runPdfSearch(query, { again: true })}
            >
              <ChevronDown className="size-4" aria-hidden="true" />
            </button>
          </div>
        </fieldset>
        <div className="sidebar-search-summary" aria-live="polite">
          {indexError ||
            (indexing
              ? `Indexing page ${indexProgress.done + 1} of ${indexProgress.total}…`
              : query.trim()
                ? `${resultTotal} ${resultTotal === 1 ? "match" : "matches"} on ${
                    results.length
                  } ${results.length === 1 ? "page" : "pages"}`
                : "Enter a word or phrase to search this paper.")}
        </div>
      </div>
      {query.trim() && !indexing && !indexError && (
        <div className="search-result-list">
          {results.map((result) => (
            <button
              type="button"
              key={result.page}
              className={result.page === currentPage ? "is-current" : ""}
              onClick={() => {
                onPageSelect(result.page);
                runPdfSearch(query);
              }}
            >
              <span className="search-result-page">Page {result.page}</span>
              <span className="search-result-count">
                {result.count} {result.count === 1 ? "match" : "matches"}
              </span>
              <span className="search-result-snippet">
                <HighlightedSnippet result={result} />
              </span>
              <ChevronRight
                className="search-result-chevron size-4"
                aria-hidden="true"
              />
            </button>
          ))}
          {!results.length && (
            <div className="sidebar-empty py-8">
              <FileSearch className="size-6" />
              <p className="font-semibold">No matches</p>
              <p>Try a different phrase or matching option.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
