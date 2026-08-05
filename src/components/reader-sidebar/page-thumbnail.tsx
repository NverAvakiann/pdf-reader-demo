import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

export function PageThumbnail({
  document,
  pageNumber,
  active,
  onSelect,
}: {
  document: PDFDocumentProxy;
  pageNumber: number;
  active: boolean;
  onSelect: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(pageNumber <= 3);

  useEffect(() => {
    if (visible || !wrapperRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { rootMargin: "180px" },
    );
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible || !canvasRef.current) return;
    let cancelled = false;
    let task: RenderTask | undefined;

    async function renderThumbnail() {
      try {
        const page = await document.getPage(pageNumber);
        if (cancelled || !canvasRef.current) return;
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: 150 / base.width });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        task = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform:
            pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
        });
        await task.promise;
      } catch {}
    }

    void renderThumbnail();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [document, pageNumber, visible]);

  return (
    <button
      ref={wrapperRef}
      type="button"
      onClick={onSelect}
      className="group flex w-full flex-col items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
      aria-label={`Go to page ${pageNumber}`}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={`thumbnail-frame relative block min-h-40 w-[168px] bg-white p-2 transition ${
          active ? "is-current" : ""
        }`}
      >
        <canvas
          ref={canvasRef}
          className="mx-auto block max-w-full bg-white"
          aria-hidden="true"
        />
      </span>
      <span
        className={`thumbnail-page-number text-xs tabular-nums ${
          active ? "is-current font-bold" : ""
        }`}
      >
        {pageNumber}
      </span>
    </button>
  );
}
