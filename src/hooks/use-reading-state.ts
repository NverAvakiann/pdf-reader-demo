import { useCallback, useEffect, useState } from "react";
import {
  type PageBookmark,
  type TextAnnotation,
  type ReadingStateStore,
  emptyReadingStore,
  normalizeReadingState,
  readReadingStore,
  updateDocumentState,
  writeReadingStore,
} from "../lib/reading-state";

export function useReadingStore() {
  const [store, setStore] = useState<ReadingStateStore>(() =>
    typeof localStorage === "undefined" ? emptyReadingStore : readReadingStore(),
  );

  useEffect(() => {
    const sync = () => setStore(readReadingStore());
    window.addEventListener("storage", sync);
    window.addEventListener("read-room-reading-state", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("read-room-reading-state", sync);
    };
  }, []);

  const commit = useCallback((next: ReadingStateStore) => {
    writeReadingStore(next);
    setStore(next);
  }, []);

  const saveProgress = useCallback(
    (documentId: string, page: number, pageCount: number) => {
      const next = updateDocumentState(readReadingStore(), documentId, (current) => ({
        ...normalizeReadingState(current, pageCount),
        page: Math.min(Math.max(page, 1), pageCount),
        pageCount,
        updatedAt: Date.now(),
        completed: page >= pageCount,
      }));
      commit(next);
    },
    [commit],
  );

  const resetProgress = useCallback(
    (documentId: string) => {
      const next = updateDocumentState(readReadingStore(), documentId, (current) => ({
        ...current,
        page: 1,
        updatedAt: Date.now(),
        completed: false,
      }));
      commit(next);
    },
    [commit],
  );

  const addBookmark = useCallback(
    (documentId: string, bookmark: PageBookmark, pageCount: number) => {
      const next = updateDocumentState(readReadingStore(), documentId, (current) => ({
        ...normalizeReadingState(current, pageCount),
        bookmarks: current.bookmarks.some((item) => item.page === bookmark.page)
          ? current.bookmarks
          : [...current.bookmarks, bookmark].sort((a, b) => a.page - b.page),
      }));
      commit(next);
    },
    [commit],
  );

  const removeBookmark = useCallback(
    (documentId: string, page: number) => {
      const next = updateDocumentState(readReadingStore(), documentId, (current) => ({
        ...current,
        bookmarks: current.bookmarks.filter((bookmark) => bookmark.page !== page),
      }));
      commit(next);
    },
    [commit],
  );

  const clearBookmarks = useCallback(
    (documentId: string) => {
      const next = updateDocumentState(readReadingStore(), documentId, (current) => ({
        ...current,
        bookmarks: [],
      }));
      commit(next);
    },
    [commit],
  );

  const addAnnotation = useCallback(
    (documentId: string, annotation: TextAnnotation, pageCount: number) => {
      const next = updateDocumentState(readReadingStore(), documentId, (current) => ({
        ...normalizeReadingState(current, pageCount),
        annotations: [...current.annotations, annotation].sort(
          (a, b) => a.page - b.page || a.startOffset - b.startOffset,
        ),
      }));
      commit(next);
    },
    [commit],
  );

  const updateAnnotation = useCallback(
    (documentId: string, annotationId: string, note: string) => {
      const next = updateDocumentState(readReadingStore(), documentId, (current) => ({
        ...current,
        annotations: current.annotations.map((annotation) =>
          annotation.id === annotationId
            ? { ...annotation, note, updatedAt: Date.now() }
            : annotation,
        ),
      }));
      commit(next);
    },
    [commit],
  );

  const removeAnnotation = useCallback(
    (documentId: string, annotationId: string) => {
      const next = updateDocumentState(readReadingStore(), documentId, (current) => ({
        ...current,
        annotations: current.annotations.filter(
          (annotation) => annotation.id !== annotationId,
        ),
      }));
      commit(next);
    },
    [commit],
  );

  const clearAnnotations = useCallback(
    (documentId: string) => {
      const next = updateDocumentState(readReadingStore(), documentId, (current) => ({
        ...current,
        annotations: [],
      }));
      commit(next);
    },
    [commit],
  );

  return {
    store,
    saveProgress,
    resetProgress,
    addBookmark,
    removeBookmark,
    clearBookmarks,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    clearAnnotations,
  };
}
