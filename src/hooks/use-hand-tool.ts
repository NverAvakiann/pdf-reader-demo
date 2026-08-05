import { useEffect, type RefObject } from "react";
import type { ToolPreference } from "./use-reader-preferences";

export function useHandTool(
  containerRef: RefObject<HTMLDivElement | null>,
  tool: ToolPreference,
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || tool !== "hand") return;
    const viewerContainer = container;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startScrollLeft = 0;
    let startScrollTop = 0;

    function handlePointerDown(event: PointerEvent) {
      if (event.button !== 0) return;
      const target = event.target as HTMLElement;
      if (target.closest("a, button, input, textarea, select")) return;
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      startScrollLeft = viewerContainer.scrollLeft;
      startScrollTop = viewerContainer.scrollTop;
      viewerContainer.setPointerCapture(event.pointerId);
      viewerContainer.classList.add("is-dragging");
      event.preventDefault();
    }

    function handlePointerMove(event: PointerEvent) {
      if (!dragging) return;
      viewerContainer.scrollLeft =
        startScrollLeft - (event.clientX - startX);
      viewerContainer.scrollTop = startScrollTop - (event.clientY - startY);
    }

    function stopDragging(event: PointerEvent) {
      if (!dragging) return;
      dragging = false;
      if (viewerContainer.hasPointerCapture(event.pointerId)) {
        viewerContainer.releasePointerCapture(event.pointerId);
      }
      viewerContainer.classList.remove("is-dragging");
    }

    viewerContainer.classList.add("hand-tool");
    viewerContainer.addEventListener("pointerdown", handlePointerDown);
    viewerContainer.addEventListener("pointermove", handlePointerMove);
    viewerContainer.addEventListener("pointerup", stopDragging);
    viewerContainer.addEventListener("pointercancel", stopDragging);
    viewerContainer.addEventListener("lostpointercapture", stopDragging);
    return () => {
      viewerContainer.classList.remove("hand-tool", "is-dragging");
      viewerContainer.removeEventListener("pointerdown", handlePointerDown);
      viewerContainer.removeEventListener("pointermove", handlePointerMove);
      viewerContainer.removeEventListener("pointerup", stopDragging);
      viewerContainer.removeEventListener("pointercancel", stopDragging);
      viewerContainer.removeEventListener("lostpointercapture", stopDragging);
    };
  }, [containerRef, tool]);
}
