import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type PdfViewerModule = typeof import("pdfjs-dist/web/pdf_viewer.mjs");
export type PdfViewerInstance = InstanceType<PdfViewerModule["PDFViewer"]>;
export type PdfEventBusInstance = InstanceType<PdfViewerModule["EventBus"]>;

let viewerModulePromise: Promise<PdfViewerModule> | null = null;

export function loadPdfViewerModule() {
  if (!viewerModulePromise) {
    Object.assign(globalThis, { pdfjsLib });
    viewerModulePromise = import("pdfjs-dist/web/pdf_viewer.mjs");
  }
  return viewerModulePromise;
}

export function clearPdfViewerDocument(viewer: PdfViewerInstance) {
  (
    viewer as unknown as {
      setDocument: (document: null) => void;
    }
  ).setDocument(null);
}

export { pdfjsLib };
