import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
  loadPdfViewerModule,
  pdfjsLib,
  clearPdfViewerDocument,
  type PdfEventBusInstance,
  type PdfViewerInstance,
} from "../lib/pdf-engine";

type SearchOptions = {
  caseSensitive: boolean;
  entireWord: boolean;
  findPrevious?: boolean;
  again?: boolean;
  changeType?: "casechange" | "entirewordchange";
};

type MatchCount = {
  current: number;
  total: number;
};

export function usePdfViewer(file: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<PdfViewerInstance | null>(null);
  const eventBusRef = useRef<PdfEventBusInstance | null>(null);
  const modeValuesRef = useRef({
    scroll: { vertical: 0, horizontal: 1, wrapped: 2 },
    spread: { single: 0, dual: 1, cover: 2 },
  });
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [page, setPageState] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(1);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [matchCount, setMatchCount] = useState<MatchCount>({ current: 0, total: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const viewerElement = container.firstElementChild as HTMLDivElement | null;
    if (!viewerElement) return;
    const viewerContainer = container;
    const viewerNode = viewerElement;

    let disposed = false;
    const abortController = new AbortController();
    let loadingTask: ReturnType<typeof pdfjsLib.getDocument> | null = null;
    let viewer: PdfViewerInstance | null = null;
    let eventBus: PdfEventBusInstance | null = null;

    setLoading(true);
    setReady(false);
    setError("");
    setPageState(1);
    setPageCount(0);
    setMatchCount({ current: 0, total: 0 });

    const onPagesInit = () => {
      if (disposed || !viewer) return;
      viewer.currentPageNumber = 1;
      setPageState(1);
      setPageCount(viewer.pagesCount);
      setReady(true);
    };

    const onPageChanging = (event: Record<string, unknown>) => {
      setPageState(Number(event.pageNumber) || 1);
    };

    const onScaleChanging = (event: Record<string, unknown>) => {
      setScale(Number(event.scale) || 1);
    };

    const onPageRendered = () => setLoading(false);

    const onMatches = (event: Record<string, unknown>) => {
      const matches = event.matchesCount as MatchCount | undefined;
      if (matches) setMatchCount({ current: matches.current || 0, total: matches.total || 0 });
    };

    async function initialise() {
      try {
        const viewerModule = await loadPdfViewerModule();
        if (disposed) return;

        eventBus = new viewerModule.EventBus();
        modeValuesRef.current = {
          scroll: {
            vertical: viewerModule.ScrollMode.VERTICAL,
            horizontal: viewerModule.ScrollMode.HORIZONTAL,
            wrapped: viewerModule.ScrollMode.WRAPPED,
          },
          spread: {
            single: viewerModule.SpreadMode.NONE,
            dual: viewerModule.SpreadMode.ODD,
            cover: viewerModule.SpreadMode.EVEN,
          },
        };
        const linkService = new viewerModule.PDFLinkService({
          eventBus: eventBus as never,
          externalLinkTarget: viewerModule.LinkTarget.BLANK,
        });
        const findController = new viewerModule.PDFFindController({
          eventBus: eventBus as never,
          linkService,
          updateMatchesCountOnProgress: true,
        });

        viewer = new viewerModule.PDFViewer({
          container: viewerContainer,
          viewer: viewerNode,
          eventBus: eventBus as never,
          linkService,
          findController,
          removePageBorders: true,
          enableSelectionRendering: true,
          abortSignal: abortController.signal,
        } as never);

        linkService.setViewer(viewer as never);
        eventBus.on("pagesinit", onPagesInit);
        eventBus.on("pagechanging", onPageChanging);
        eventBus.on("scalechanging", onScaleChanging);
        eventBus.on("pagerendered", onPageRendered);
        eventBus.on("updatefindmatchescount", onMatches);
        eventBus.on("updatefindcontrolstate", onMatches);

        viewerRef.current = viewer;
        eventBusRef.current = eventBus;

        loadingTask = pdfjsLib.getDocument({ url: file });
        const loadedDocument = await loadingTask.promise;
        if (disposed) {
          await loadingTask?.destroy();
          return;
        }

        setPdfDocument(loadedDocument);
        linkService.setDocument(loadedDocument);
        viewer.setDocument(loadedDocument);
      } catch (initialiseError) {
        if (!disposed) {
          setLoading(false);
          setError(
            initialiseError instanceof Error
              ? initialiseError.message
              : "The PDF could not be opened.",
          );
        }
      }
    }

    void initialise();

    return () => {
      disposed = true;
      abortController.abort();
      eventBus?.off("pagesinit", onPagesInit);
      eventBus?.off("pagechanging", onPageChanging);
      eventBus?.off("scalechanging", onScaleChanging);
      eventBus?.off("pagerendered", onPageRendered);
      eventBus?.off("updatefindmatchescount", onMatches);
      eventBus?.off("updatefindcontrolstate", onMatches);
      if (viewer) clearPdfViewerDocument(viewer);
      viewer?.cleanup();
      viewerRef.current = null;
      eventBusRef.current = null;
      setPdfDocument(null);
      void loadingTask?.destroy();
      viewerNode.replaceChildren();
    };
  }, [file]);

  const setPage = useCallback((nextPage: number) => {
    const viewer = viewerRef.current;
    if (!viewer || !Number.isFinite(nextPage)) return;
    viewer.currentPageNumber = Math.min(Math.max(Math.round(nextPage), 1), viewer.pagesCount);
  }, []);

  const setZoom = useCallback((value: string) => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.currentScaleValue = value;
  }, []);

  const zoomIn = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.increaseScale();
    setScale(viewer.currentScale);
    return viewer.currentScale;
  }, []);
  const zoomOut = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.decreaseScale();
    setScale(viewer.currentScale);
    return viewer.currentScale;
  }, []);
  const nextPage = useCallback(() => viewerRef.current?.nextPage(), []);
  const previousPage = useCallback(() => viewerRef.current?.previousPage(), []);

  const rotate = useCallback((direction: "clockwise" | "counterclockwise") => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const change = direction === "clockwise" ? 90 : -90;
    viewer.pagesRotation = (viewer.pagesRotation + change + 360) % 360;
  }, []);

  const setScrollMode = useCallback((mode: "vertical" | "horizontal" | "wrapped") => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.scrollMode = modeValuesRef.current.scroll[mode];
  }, []);

  const setSpreadMode = useCallback((mode: "single" | "dual" | "cover") => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.spreadMode = modeValuesRef.current.spread[mode];
  }, []);

  const search = useCallback((query: string, options: SearchOptions) => {
    if (options.changeType) {
      setMatchCount({ current: 0, total: 0 });
    }
    eventBusRef.current?.dispatch("find", {
      source: window,
      type: options.changeType ?? (options.again ? "again" : ""),
      query,
      caseSensitive: options.caseSensitive,
      entireWord: options.entireWord,
      highlightAll: true,
      findPrevious: options.findPrevious ?? false,
      matchDiacritics: false,
    });
  }, []);

  const closeSearch = useCallback(() => {
    eventBusRef.current?.dispatch("findbarclose", { source: window });
    setMatchCount({ current: 0, total: 0 });
  }, []);

  return {
    containerRef,
    pdfDocument,
    page,
    pageCount,
    scale,
    ready,
    loading,
    error,
    matchCount,
    setPage,
    setZoom,
    zoomIn,
    zoomOut,
    nextPage,
    previousPage,
    rotate,
    setScrollMode,
    setSpreadMode,
    search,
    closeSearch,
  };
}
