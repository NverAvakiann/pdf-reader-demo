import { useEffect, type RefObject } from "react";

type ReaderShortcutActions = {
  pageCount: number;
  setPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
};

export function useReaderKeyboardShortcuts(
  rootRef: RefObject<HTMLElement | null>,
  viewerRef: RefObject<HTMLElement | null>,
  actions: ReaderShortcutActions,
) {
  const {
    pageCount,
    setPage,
    nextPage,
    previousPage,
    zoomIn,
    zoomOut,
  } = actions;

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape" && document.fullscreenElement) {
        event.preventDefault();
        void document.exitFullscreen();
        return;
      }

      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const isTyping = target.matches(
        "input, textarea, select, [contenteditable='true']",
      );

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        rootRef.current
          ?.querySelector<HTMLButtonElement>('[aria-label="Search PDF"]')
          ?.click();
        return;
      }
      if (isTyping) return;

      if (
        (event.metaKey || event.ctrlKey) &&
        (event.key === "+" || event.key === "=")
      ) {
        event.preventDefault();
        zoomIn();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "-") {
        event.preventDefault();
        zoomOut();
        return;
      }

      const viewerOwnsFocus =
        target === document.body || Boolean(viewerRef.current?.contains(target));
      if (!viewerOwnsFocus) return;

      if (event.key === "PageDown" || event.key === "ArrowRight") {
        event.preventDefault();
        nextPage();
      } else if (event.key === "PageUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        previousPage();
      } else if (event.key === "Home") {
        event.preventDefault();
        setPage(1);
      } else if (event.key === "End") {
        event.preventDefault();
        setPage(pageCount);
      }
    }

    document.addEventListener("keydown", handleKeyboard);
    return () => document.removeEventListener("keydown", handleKeyboard);
  }, [
    nextPage,
    pageCount,
    previousPage,
    rootRef,
    setPage,
    viewerRef,
    zoomIn,
    zoomOut,
  ]);
}
