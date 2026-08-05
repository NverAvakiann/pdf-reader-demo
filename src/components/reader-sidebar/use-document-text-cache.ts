import { useCallback, useEffect, useRef } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { extractPageText } from "../../lib/document-text";

export function useDocumentTextCache(document: PDFDocumentProxy | null) {
  const cache = useRef(new Map<number, string>());
  const inFlight = useRef(new Map<number, Promise<string>>());

  useEffect(() => {
    cache.current.clear();
    inFlight.current.clear();
  }, [document]);

  return useCallback(
    async (page: number) => {
      const cached = cache.current.get(page);
      if (cached !== undefined) return cached;
      if (!document) return "";

      let request = inFlight.current.get(page);
      if (!request) {
        request = extractPageText(document, page)
          .then((text) => {
            cache.current.set(page, text);
            return text;
          })
          .finally(() => inFlight.current.delete(page));
        inFlight.current.set(page, request);
      }
      return request;
    },
    [document],
  );
}
