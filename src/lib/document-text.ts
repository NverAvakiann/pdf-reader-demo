import type { PDFDocumentProxy } from "pdfjs-dist";

export type SearchPageResult = {
  page: number;
  snippet: string;
  count: number;
  matchStart: number;
  matchLength: number;
};

export function normalizePageText(parts: string[]) {
  return parts
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createPageSnippet(text: string, start = 0, length = 0, radius = 68) {
  if (!text) return "";
  const from = Math.max(0, start - radius);
  const to = Math.min(text.length, start + Math.max(length, 1) + radius);
  const prefix = from > 0 ? "…" : "";
  const suffix = to < text.length ? "…" : "";
  return `${prefix}${text.slice(from, to).trim()}${suffix}`;
}

export function createBookmarkSnippet(text: string, page: number) {
  const meaningful = text
    .replace(/^READ ROOM\s+\d+\s+\d+\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!meaningful) return `Page ${page}`;
  return meaningful.length > 100
    ? `${meaningful.slice(0, 99).trimEnd()}…`
    : meaningful;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function findSearchResults(
  pages: string[],
  query: string,
  caseSensitive: boolean,
  wholeWords: boolean,
): SearchPageResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const boundary = wholeWords ? "\\b" : "";
  const expression = new RegExp(
    `${boundary}${escapeRegExp(trimmed)}${boundary}`,
    caseSensitive ? "g" : "gi",
  );

  return pages.flatMap((text, index) => {
    const matches = Array.from(text.matchAll(expression));
    if (!matches.length) return [];
    const first = matches[0];
    const start = first.index ?? 0;
    const snippetStart = Math.max(0, start - 68);
    const ellipsisOffset = snippetStart > 0 ? 1 : 0;
    return [{
      page: index + 1,
      snippet: createPageSnippet(text, start, first[0].length),
      count: matches.length,
      matchStart: start - snippetStart + ellipsisOffset,
      matchLength: first[0].length,
    }];
  });
}

export async function extractPageText(document: PDFDocumentProxy, page: number) {
  const pdfPage = await document.getPage(page);
  const content = await pdfPage.getTextContent();
  return normalizePageText(
    content.items.flatMap((item) =>
      "str" in item && typeof item.str === "string" ? [item.str] : [],
    ),
  );
}
