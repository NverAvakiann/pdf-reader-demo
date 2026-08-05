import { useEffect, useRef, useState } from "react";
import type { RenderTask } from "pdfjs-dist";
import type { ReadRoomDocument } from "../data/documents";
import { getCachedPdfDocument } from "../lib/pdf-document-cache";

type DocumentCoverProps = {
  document: ReadRoomDocument;
  className?: string;
  eager?: boolean;
};

export function DocumentCover({ document, className = "", eager = false }: DocumentCoverProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(eager);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (eager || !wrapperRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [eager]);

  useEffect(() => {
    if (!visible || !canvasRef.current) return;

    let cancelled = false;
    let renderTask: RenderTask | undefined;
    async function renderCover() {
      try {
        const pdf = await getCachedPdfDocument(document.file);
        const page = await pdf.getPage(1);
        if (cancelled || !canvasRef.current) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const displayWidth = 360;
        const scale = displayWidth / baseViewport.width;
        const viewport = page.getViewport({ scale });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
        });
        await renderTask.promise;
        if (!cancelled) setStatus("ready");
      } catch (error) {
        if (!cancelled && !(error instanceof Error && error.name === "RenderingCancelledException")) {
          setStatus("error");
        }
      }
    }

    void renderCover();
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [document.file, visible]);

  return (
    <div
      ref={wrapperRef}
      className={`relative flex items-start justify-center overflow-hidden bg-[#e7e7e1] ${className}`}
    >
      {status === "loading" && <div className="cover-shimmer absolute inset-0" aria-hidden="true" />}
      {status === "error" && (
        <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-muted">
          Preview unavailable
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`block h-auto w-full bg-white transition-opacity duration-300 ${
          status === "ready" ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />
    </div>
  );
}
