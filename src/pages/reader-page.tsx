import { AlertTriangle, ArrowLeft, LoaderCircle, Minimize2 } from "lucide-react";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ReaderHeader } from "../components/reader-header";
import { ReaderSidebar } from "../components/reader-sidebar";
import { ReaderToolbar } from "../components/reader-toolbar";
import { TextAnnotations } from "../components/text-annotations";
import { getDocumentById } from "../data/documents";
import { usePdfViewer } from "../hooks/use-pdf-viewer";
import { useFullscreen } from "../hooks/use-fullscreen";
import { useHandTool } from "../hooks/use-hand-tool";
import { useReaderKeyboardShortcuts } from "../hooks/use-reader-keyboard-shortcuts";
import { useReadingStore } from "../hooks/use-reading-state";
import {
  type ScrollPreference,
  type SpreadPreference,
  type ThemePreference,
  type ToolPreference,
  useReaderPreferences,
} from "../hooks/use-reader-preferences";
import { Link } from "../lib/router";
import {
  normalizeReadingState,
  type TextAnnotation,
} from "../lib/reading-state";

const RangeDialog = lazy(() =>
  import("../components/range-dialog").then((module) => ({
    default: module.RangeDialog,
  })),
);

export function ReaderPage({ documentId }: { documentId: string }) {
  const currentDocument = getDocumentById(documentId);

  if (!currentDocument) return null;
  return <ReaderView key={currentDocument.id} currentDocument={currentDocument} />;
}

function ReaderView({
  currentDocument,
}: {
  currentDocument: NonNullable<ReturnType<typeof getDocumentById>>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const resumeAppliedRef = useRef(false);
  const pendingResumeRef = useRef<number | null>(null);
  const latestPageRef = useRef(1);
  const { preferences, updatePreference } = useReaderPreferences();
  const {
    store,
    saveProgress,
    addBookmark,
    removeBookmark,
    clearBookmarks,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    clearAnnotations,
  } = useReadingStore();
  const viewer = usePdfViewer(currentDocument.file);
  const [dialogAction, setDialogAction] = useState<"print" | "download" | null>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen(rootRef);
  const [annotationRequest, setAnnotationRequest] = useState<{
    annotation: TextAnnotation;
    token: number;
  } | null>(null);
  const documentState = normalizeReadingState(
    store.documents[currentDocument.id],
    viewer.pageCount,
  );

  useEffect(() => {
    latestPageRef.current = viewer.page;
  }, [viewer.page]);

  useEffect(() => {
    if (!viewer.ready || !viewer.pageCount || resumeAppliedRef.current) return;
    const saved = normalizeReadingState(
      store.documents[currentDocument.id],
      viewer.pageCount,
    );
    resumeAppliedRef.current = true;
    pendingResumeRef.current = saved.page;
    viewer.setPage(saved.page);
  }, [
    currentDocument.id,
    store.documents,
    viewer.pageCount,
    viewer.ready,
    viewer.setPage,
  ]);

  useEffect(() => {
    if (!viewer.ready || !viewer.pageCount || !resumeAppliedRef.current) return;
    if (pendingResumeRef.current !== null) {
      if (viewer.page !== pendingResumeRef.current) return;
      pendingResumeRef.current = null;
    }
    const timer = window.setTimeout(() => {
      saveProgress(currentDocument.id, viewer.page, viewer.pageCount);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [
    currentDocument.id,
    saveProgress,
    viewer.page,
    viewer.pageCount,
    viewer.ready,
  ]);

  useEffect(() => {
    function flushProgress() {
      if (
        resumeAppliedRef.current &&
        pendingResumeRef.current === null &&
        viewer.pageCount
      ) {
        saveProgress(currentDocument.id, latestPageRef.current, viewer.pageCount);
      }
    }
    window.addEventListener("pagehide", flushProgress);
    return () => window.removeEventListener("pagehide", flushProgress);
  }, [currentDocument.id, saveProgress, viewer.pageCount]);

  useEffect(() => {
    if (!viewer.ready) return;
    viewer.setZoom(preferences.zoom);
    viewer.setScrollMode(preferences.scroll);
    viewer.setSpreadMode(preferences.spread);
  }, [
    preferences.scroll,
    preferences.spread,
    preferences.zoom,
    viewer.ready,
    viewer.setScrollMode,
    viewer.setSpreadMode,
    viewer.setZoom,
  ]);

  useHandTool(viewer.containerRef, preferences.tool);
  const zoomIn = useCallback(() => {
    const nextScale = viewer.zoomIn();
    if (nextScale) updatePreference("zoom", String(nextScale));
  }, [updatePreference, viewer.zoomIn]);

  const zoomOut = useCallback(() => {
    const nextScale = viewer.zoomOut();
    if (nextScale) updatePreference("zoom", String(nextScale));
  }, [updatePreference, viewer.zoomOut]);

  useReaderKeyboardShortcuts(rootRef, viewer.containerRef, {
    pageCount: viewer.pageCount,
    setPage: viewer.setPage,
    nextPage: viewer.nextPage,
    previousPage: viewer.previousPage,
    zoomIn,
    zoomOut,
  });

  function handleTheme(theme: ThemePreference) {
    updatePreference("theme", theme);
  }

  function handleTool(tool: ToolPreference) {
    updatePreference("tool", tool);
  }

  function handleScroll(scroll: ScrollPreference) {
    updatePreference("scroll", scroll);
    viewer.setScrollMode(scroll);
  }

  function handleSpread(spread: SpreadPreference) {
    updatePreference("spread", spread);
    viewer.setSpreadMode(spread);
  }

  return (
    <div
      ref={rootRef}
      className={`reader-shell ${preferences.theme === "dark" ? "theme-dark" : ""} ${
        isFullscreen ? "is-fullscreen" : ""
      }`}
      data-testid="reader-shell"
    >
      <ReaderHeader currentDocument={currentDocument} />
      <nav className="reader-toolbar-landmark" aria-label="Document controls">
        <ReaderToolbar
          page={viewer.page}
          pageCount={viewer.pageCount}
          scale={viewer.scale}
          ready={viewer.ready}
          preferences={preferences}
          onPageChange={viewer.setPage}
          onNextPage={viewer.nextPage}
          onPreviousPage={viewer.previousPage}
          onZoomChange={(zoom) => {
            updatePreference("zoom", zoom);
            viewer.setZoom(zoom);
          }}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onSidebarToggle={() => updatePreference("sidebarOpen", !preferences.sidebarOpen)}
          onSearchOpen={() => {
            updatePreference("sidebarTab", "search");
            updatePreference("sidebarOpen", true);
          }}
          onThemeChange={handleTheme}
          onToolChange={handleTool}
          onScrollChange={handleScroll}
          onSpreadChange={handleSpread}
          onRotate={viewer.rotate}
          onPrint={() => setDialogAction("print")}
          onDownload={() => setDialogAction("download")}
          onFullscreen={() => void toggleFullscreen()}
        />
      </nav>

      <div className="reader-workspace">
        <ReaderSidebar
          document={viewer.pdfDocument}
          fallbackContents={currentDocument.contents}
          pageCount={viewer.pageCount}
          currentPage={viewer.page}
          open={!isFullscreen && preferences.sidebarOpen}
          activeTab={preferences.sidebarTab}
          bookmarks={documentState.bookmarks}
          annotations={documentState.annotations}
          matchCount={viewer.matchCount}
          onTabChange={(tab) => updatePreference("sidebarTab", tab)}
          onPageSelect={viewer.setPage}
          onClose={() => updatePreference("sidebarOpen", false)}
          onAddBookmark={(bookmark) =>
            addBookmark(currentDocument.id, bookmark, viewer.pageCount)
          }
          onRemoveBookmark={(page) => removeBookmark(currentDocument.id, page)}
          onClearBookmarks={() => clearBookmarks(currentDocument.id)}
          onUpdateAnnotation={(annotationId, note) =>
            updateAnnotation(currentDocument.id, annotationId, note)
          }
          onRemoveAnnotation={(annotationId) =>
            removeAnnotation(currentDocument.id, annotationId)
          }
          onClearAnnotations={() => clearAnnotations(currentDocument.id)}
          onOpenAnnotation={(annotation) =>
            setAnnotationRequest({ annotation, token: Date.now() })
          }
          onSearch={viewer.search}
          onSearchClose={viewer.closeSearch}
        />

        <main id="main-content" className="reader-stage" aria-label={`${currentDocument.title} PDF`}>
          <h1 className="sr-only">{currentDocument.title}</h1>
          <div ref={viewer.containerRef} className="pdf-viewer-container" tabIndex={0}>
            <div className="pdfViewer" />
          </div>
          <TextAnnotations
            containerRef={viewer.containerRef}
            annotations={documentState.annotations}
            enabled={preferences.tool === "select" && !isFullscreen}
            requestedAnnotation={annotationRequest}
            onRequestedAnnotationHandled={() => setAnnotationRequest(null)}
            onCreate={(annotation) => {
              addAnnotation(currentDocument.id, annotation, viewer.pageCount);
              updatePreference("sidebarTab", "bookmarks");
              updatePreference("sidebarOpen", true);
            }}
          />

          {viewer.loading && !viewer.error && (
            <div className="reader-status" role="status" aria-live="polite">
              <LoaderCircle className="size-6 animate-spin text-cobalt" aria-hidden="true" />
              <div>
                <p className="font-bold text-ink">Preparing the paper</p>
                <p className="mt-1 text-sm text-muted">Rendering pages in your browser…</p>
              </div>
            </div>
          )}

          {viewer.error && (
            <div className="reader-status max-w-lg" role="alert" aria-live="assertive">
              <AlertTriangle className="size-7 shrink-0 text-[#b54032]" aria-hidden="true" />
              <div>
                <p className="font-bold text-ink">This PDF could not be opened</p>
                <p className="mt-1 text-sm leading-6 text-muted">{viewer.error}</p>
                <Link
                  to="/"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-cobalt underline underline-offset-4"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Return to the collection
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>

      {isFullscreen && (
        <button
          type="button"
          className="fullscreen-exit-button"
          aria-label="Exit full screen"
          aria-keyshortcuts="Escape"
          title="Exit full screen"
          onClick={() => void toggleFullscreen()}
        >
          <Minimize2 className="size-4" aria-hidden="true" />
        </button>
      )}

      {dialogAction && viewer.pageCount > 0 && (
        <Suspense fallback={null}>
          <RangeDialog
            action={dialogAction}
            document={currentDocument}
            totalPages={viewer.pageCount}
            onClose={() => setDialogAction(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
