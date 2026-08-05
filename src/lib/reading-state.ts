export type PageBookmark = {
  page: number;
  snippet: string;
  createdAt: number;
};

export type TextAnnotation = {
  id: string;
  page: number;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  note: string;
  prefix?: string;
  suffix?: string;
  createdAt: number;
  updatedAt: number;
};

export type DocumentReadingState = {
  page: number;
  pageCount: number;
  updatedAt: number;
  completed: boolean;
  bookmarks: PageBookmark[];
  annotations: TextAnnotation[];
};

export type ReadingStateStore = {
  version: 1;
  documents: Record<string, DocumentReadingState>;
};

export const readingStateStorageKey = "read-room-document-state";
export const emptyReadingStore: ReadingStateStore = { version: 1, documents: {} };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function finiteNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function sanitizeBookmark(value: unknown): PageBookmark | null {
  if (!isRecord(value) || typeof value.snippet !== "string") return null;
  const page = Math.floor(finiteNumber(value.page));
  if (page < 1) return null;
  return {
    page,
    snippet: value.snippet.slice(0, 500),
    createdAt: finiteNumber(value.createdAt),
  };
}

function sanitizeAnnotation(value: unknown): TextAnnotation | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.selectedText !== "string" ||
    typeof value.note !== "string"
  ) {
    return null;
  }
  const page = Math.floor(finiteNumber(value.page));
  const startOffset = Math.floor(finiteNumber(value.startOffset, -1));
  const endOffset = Math.floor(finiteNumber(value.endOffset, -1));
  if (!value.id || page < 1 || startOffset < 0 || endOffset <= startOffset) return null;
  return {
    id: value.id.slice(0, 200),
    page,
    selectedText: value.selectedText.slice(0, 1_000),
    startOffset,
    endOffset,
    note: value.note.slice(0, 10_000),
    prefix: typeof value.prefix === "string" ? value.prefix.slice(-80) : undefined,
    suffix: typeof value.suffix === "string" ? value.suffix.slice(0, 80) : undefined,
    createdAt: finiteNumber(value.createdAt),
    updatedAt: finiteNumber(value.updatedAt),
  };
}

function sanitizeDocumentState(value: unknown): DocumentReadingState | undefined {
  if (!isRecord(value)) return undefined;
  return {
    page: Math.floor(finiteNumber(value.page, 1)),
    pageCount: Math.max(0, Math.floor(finiteNumber(value.pageCount))),
    updatedAt: finiteNumber(value.updatedAt),
    completed: value.completed === true,
    bookmarks: Array.isArray(value.bookmarks)
      ? value.bookmarks.flatMap((item) => {
          const bookmark = sanitizeBookmark(item);
          return bookmark ? [bookmark] : [];
        })
      : [],
    annotations: Array.isArray(value.annotations)
      ? value.annotations.flatMap((item) => {
          const annotation = sanitizeAnnotation(item);
          return annotation ? [annotation] : [];
        })
      : [],
  };
}

export function readReadingStore(): ReadingStateStore {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(readingStateStorageKey) ?? "");
    if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.documents)) {
      return emptyReadingStore;
    }
    const documents = Object.fromEntries(
      Object.entries(parsed.documents).flatMap(([id, value]) => {
        const state = sanitizeDocumentState(value);
        return state ? [[id, state]] : [];
      }),
    );
    return { version: 1, documents };
  } catch {
    return emptyReadingStore;
  }
}

export function normalizeReadingState(
  state: DocumentReadingState | undefined,
  pageCount: number,
): DocumentReadingState {
  const safeCount = Math.max(0, Math.floor(pageCount));
  const page = safeCount
    ? Math.min(Math.max(Math.floor(state?.page ?? 1), 1), safeCount)
    : 1;
  const bookmarks = (state?.bookmarks ?? [])
    .filter((bookmark, index, items) => {
      return (
        bookmark.page >= 1 &&
        (!safeCount || bookmark.page <= safeCount) &&
        items.findIndex((item) => item.page === bookmark.page) === index
      );
    })
    .sort((a, b) => a.page - b.page);
  const annotations = (state?.annotations ?? [])
    .filter((annotation) => {
      return (
        annotation.id &&
        annotation.page >= 1 &&
        (!safeCount || annotation.page <= safeCount) &&
        annotation.startOffset >= 0 &&
        annotation.endOffset > annotation.startOffset
      );
    })
    .sort((a, b) => a.page - b.page || a.startOffset - b.startOffset);

  return {
    page,
    pageCount: safeCount,
    updatedAt: state?.updatedAt ?? 0,
    completed: safeCount > 0 && page >= safeCount,
    bookmarks,
    annotations,
  };
}

export function writeReadingStore(store: ReadingStateStore) {
  try {
    localStorage.setItem(readingStateStorageKey, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent("read-room-reading-state"));
    return true;
  } catch {
    return false;
  }
}

export function updateDocumentState(
  store: ReadingStateStore,
  documentId: string,
  update: (current: DocumentReadingState) => DocumentReadingState,
): ReadingStateStore {
  const current = normalizeReadingState(store.documents[documentId], store.documents[documentId]?.pageCount ?? 0);
  return {
    version: 1,
    documents: {
      ...store.documents,
      [documentId]: update(current),
    },
  };
}
