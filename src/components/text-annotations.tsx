import { Highlighter } from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
  type RefObject,
} from "react";
import type { TextAnnotation } from "../lib/reading-state";
import {
  annotationAtPoint,
  layerText,
  rangeForAnnotation,
  textOffsetWithin,
} from "./text-annotations/annotation-dom";
import { AnnotationDialog } from "./text-annotations/annotation-dialog";
import type {
  OpenAnnotation,
  SelectionAnchor,
} from "./text-annotations/types";
import { useAnnotationHighlightStyle } from "./text-annotations/use-annotation-highlight-style";

type HighlightRegistry = {
  set: (name: string, highlight: unknown) => void;
  delete: (name: string) => void;
};

const highlightName = "read-room-annotations";

export function TextAnnotations({
  containerRef,
  annotations,
  enabled,
  requestedAnnotation,
  onRequestedAnnotationHandled,
  onCreate,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  annotations: TextAnnotation[];
  enabled: boolean;
  requestedAnnotation: {
    annotation: TextAnnotation;
    token: number;
  } | null;
  onRequestedAnnotationHandled: () => void;
  onCreate: (annotation: TextAnnotation) => void;
}) {
  const [selection, setSelection] = useState<SelectionAnchor | null>(null);
  const [draft, setDraft] = useState<SelectionAnchor | null>(null);
  const [openAnnotation, setOpenAnnotation] = useState<OpenAnnotation | null>(
    null,
  );
  useAnnotationHighlightStyle();

  const renderHighlights = useCallback(() => {
    const container = containerRef.current;
    const registry = (CSS as unknown as { highlights?: HighlightRegistry }).highlights;
    const HighlightConstructor = (
      window as unknown as { Highlight?: new (...ranges: Range[]) => unknown }
    ).Highlight;
    if (!registry || !HighlightConstructor || !container) return;
    const ranges = annotations.flatMap((annotation) => {
      const range = rangeForAnnotation(container, annotation);
      return range ? [range] : [];
    });
    registry.delete(highlightName);
    if (ranges.length) registry.set(highlightName, new HighlightConstructor(...ranges));
  }, [annotations, containerRef]);

  useEffect(() => {
    renderHighlights();
    const container = containerRef.current;
    if (!container) return;
    let frame = 0;
    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(renderHighlights);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(container, { childList: true, subtree: true });
    window.addEventListener("resize", schedule);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
    };
  }, [containerRef, renderHighlights]);

  useEffect(() => {
    return () => {
      (CSS as unknown as { highlights?: HighlightRegistry }).highlights?.delete(
        highlightName,
      );
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) {
      setSelection(null);
      return;
    }

    function inspectSelection() {
      const selected = window.getSelection();
      if (!selected || selected.isCollapsed || selected.rangeCount !== 1) {
        setSelection(null);
        return;
      }
      const range = selected.getRangeAt(0);
      const startElement =
        range.startContainer.nodeType === Node.ELEMENT_NODE
          ? (range.startContainer as Element)
          : range.startContainer.parentElement;
      const endElement =
        range.endContainer.nodeType === Node.ELEMENT_NODE
          ? (range.endContainer as Element)
          : range.endContainer.parentElement;
      const startLayer = startElement?.closest<HTMLElement>(".textLayer");
      const endLayer = endElement?.closest<HTMLElement>(".textLayer");
      if (!startLayer || startLayer !== endLayer || !container?.contains(startLayer)) {
        setSelection(null);
        return;
      }
      const text = selected.toString();
      const trimmedText = text.trim();
      if (!trimmedText || trimmedText.length > 500) {
        setSelection(null);
        return;
      }
      const pageElement = startLayer.closest<HTMLElement>(".page");
      const page = Number(pageElement?.dataset.pageNumber);
      const rect = range.getBoundingClientRect();
      if (!page || !rect.width) {
        setSelection(null);
        return;
      }
      const rawStartOffset = textOffsetWithin(
        startLayer,
        range.startContainer,
        range.startOffset,
      );
      const rawEndOffset = textOffsetWithin(
        startLayer,
        range.endContainer,
        range.endOffset,
      );
      const startOffset = rawStartOffset + (text.length - text.trimStart().length);
      const endOffset = rawEndOffset - (text.length - text.trimEnd().length);
      const pageText = layerText(startLayer);
      setSelection({
        page,
        selectedText: trimmedText,
        startOffset,
        endOffset,
        prefix: pageText.slice(Math.max(0, startOffset - 48), startOffset),
        suffix: pageText.slice(endOffset, endOffset + 48),
        left: Math.min(Math.max(rect.left + rect.width / 2, 76), window.innerWidth - 76),
        top: Math.min(rect.bottom + 8, window.innerHeight - 52),
      });
    }

    const handlePointerUp = () => window.setTimeout(inspectSelection, 0);
    const clearSelectionAction = () => setSelection(null);
    container.addEventListener("pointerup", handlePointerUp);
    container.addEventListener("scroll", clearSelectionAction, { passive: true });
    return () => {
      container.removeEventListener("pointerup", handlePointerUp);
      container.removeEventListener("scroll", clearSelectionAction);
    };
  }, [containerRef, enabled]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !annotations.length) return;

    const findAnnotation = (event: MouseEvent) =>
      annotationAtPoint(container, annotations, event.clientX, event.clientY);
    let pointerFrame = 0;
    const handlePointerMove = (event: PointerEvent) => {
      const x = event.clientX;
      const y = event.clientY;
      window.cancelAnimationFrame(pointerFrame);
      pointerFrame = window.requestAnimationFrame(() => {
        container.classList.toggle(
          "is-over-text-annotation",
          Boolean(annotationAtPoint(container, annotations, x, y)),
        );
      });
    };
    const handleClick = (event: MouseEvent) => {
      if (!window.getSelection()?.isCollapsed) return;
      const annotation = findAnnotation(event);
      if (!annotation) {
        setOpenAnnotation(null);
        return;
      }
      setOpenAnnotation({
        annotation,
        left: Math.min(Math.max(event.clientX, 176), window.innerWidth - 176),
        top: Math.min(event.clientY + 14, window.innerHeight - 220),
        source: "direct",
      });
    };
    const closePopover = () =>
      setOpenAnnotation((current) =>
        current?.source === "sidebar" ? current : null,
      );
    const clearHover = () =>
      container.classList.remove("is-over-text-annotation");
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", clearHover);
    container.addEventListener("click", handleClick);
    container.addEventListener("scroll", closePopover, { passive: true });
    return () => {
      window.cancelAnimationFrame(pointerFrame);
      clearHover();
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", clearHover);
      container.removeEventListener("click", handleClick);
      container.removeEventListener("scroll", closePopover);
    };
  }, [annotations, containerRef]);

  useEffect(() => {
    if (!openAnnotation) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target as Element).closest(".annotation-note-popover")) {
        setOpenAnnotation(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenAnnotation(null);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openAnnotation]);

  useEffect(() => {
    if (!requestedAnnotation) return;
    const annotation =
      annotations.find(
        (item) => item.id === requestedAnnotation.annotation.id,
      ) ?? requestedAnnotation.annotation;
    const containerRect = containerRef.current?.getBoundingClientRect();
    const readerCenter = containerRect
      ? containerRect.left + containerRect.width / 2
      : window.innerWidth / 2;
    setOpenAnnotation({
      annotation,
      left: Math.min(Math.max(readerCenter, 176), window.innerWidth - 176),
      top: Math.min(
        Math.max(window.innerHeight / 2 - 80, (containerRect?.top ?? 0) + 24),
        window.innerHeight - 180,
      ),
      source: "sidebar",
    });
    onRequestedAnnotationHandled();
  }, [
    annotations,
    containerRef,
    onRequestedAnnotationHandled,
    requestedAnnotation,
  ]);

  return (
    <>
      {selection && !draft && (
        <button
          type="button"
          className="add-annotation-button"
          style={{ left: selection.left, top: selection.top }}
          onClick={() => {
            setDraft(selection);
            setSelection(null);
            window.getSelection()?.removeAllRanges();
          }}
        >
          <Highlighter className="size-4" aria-hidden="true" />
          Add note
        </button>
      )}
      {draft && (
        <AnnotationDialog
          selection={draft}
          onClose={() => setDraft(null)}
          onSave={(note) => {
            const now = Date.now();
            onCreate({
              id: crypto.randomUUID(),
              page: draft.page,
              selectedText: draft.selectedText.trim(),
              startOffset: draft.startOffset,
              endOffset: draft.endOffset,
              note,
              prefix: draft.prefix,
              suffix: draft.suffix,
              createdAt: now,
              updatedAt: now,
            });
            setDraft(null);
          }}
        />
      )}
      {openAnnotation && (
        <aside
          className="annotation-note-popover"
          style={{ left: openAnnotation.left, top: openAnnotation.top }}
          role="note"
          aria-label={`Private note on page ${openAnnotation.annotation.page}`}
        >
          <p className="annotation-note-popover-text">
            {openAnnotation.annotation.note}
          </p>
        </aside>
      )}
    </>
  );
}
