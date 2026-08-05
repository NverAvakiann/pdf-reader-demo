import type { PDFDocumentProxy } from "pdfjs-dist";
import { pdfjsLib } from "./pdf-engine";

const documentCache = new Map<string, Promise<PDFDocumentProxy>>();
const maxCachedDocuments = 5;

export function getCachedPdfDocument(url: string) {
  const cached = documentCache.get(url);
  if (cached) return cached;

  const request = pdfjsLib
    .getDocument({ url })
    .promise.catch((error) => {
      documentCache.delete(url);
      throw error;
    });
  documentCache.set(url, request);

  if (documentCache.size > maxCachedDocuments) {
    const oldest = documentCache.keys().next().value;
    if (oldest && oldest !== url) {
      documentCache.delete(oldest);
    }
  }
  return request;
}
