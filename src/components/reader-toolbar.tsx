import {
  Download,
  Maximize,
  Moon,
  MoreVertical,
  PanelLeft,
  Printer,
  Search,
  Sun,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { OptionsMenu } from "./reader-toolbar/options-menu";
import { ToolbarButton } from "./reader-toolbar/toolbar-button";
import type { ReaderToolbarProps } from "./reader-toolbar/types";
import { ZoomControl } from "./reader-toolbar/zoom-control";

type OpenMenu = "zoom" | "options" | null;

export function ReaderToolbar(props: ReaderToolbarProps) {
  const {
    page,
    pageCount,
    scale,
    ready,
    preferences,
    onPageChange,
    onNextPage,
    onPreviousPage,
    onZoomChange,
    onZoomIn,
    onZoomOut,
    onSidebarToggle,
    onSearchOpen,
    onThemeChange,
    onPrint,
    onDownload,
    onFullscreen,
  } = props;

  const [pageInput, setPageInput] = useState("1");
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => setPageInput(String(page)), [page]);

  useEffect(() => {
    function handlePointer(event: PointerEvent) {
      const target = event.target;
      if (
        target instanceof Node &&
        !toolbarRef.current?.contains(target)
      ) {
        setOpenMenu(null);
        return;
      }
      if (
        target instanceof Element &&
        !target.closest(".reader-zoom-control") &&
        !target.closest(".overflow-menu") &&
        !target.closest('[aria-label="More reader options"]')
      ) {
        setOpenMenu(null);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu(null);
    }
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  function applyZoom(zoom: string) {
    onZoomChange(zoom);
    setOpenMenu(null);
  }

  return (
    <div
      ref={toolbarRef}
      className="reader-toolbar"
      role="toolbar"
      aria-label="PDF controls"
    >
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          label="Search PDF"
          active={
            preferences.sidebarOpen && preferences.sidebarTab === "search"
          }
          onClick={() => {
            onSearchOpen();
            setOpenMenu(null);
          }}
        >
          <Search className="size-[19px]" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label={
            preferences.sidebarOpen
              ? "Hide document navigation"
              : "Show document navigation"
          }
          active={preferences.sidebarOpen}
          onClick={onSidebarToggle}
          className="hidden lg:grid"
        >
          <PanelLeft className="size-[19px]" aria-hidden="true" />
        </ToolbarButton>
      </div>

      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-0.5">
        <ToolbarButton
          label="Previous page"
          onClick={onPreviousPage}
          disabled={!ready || page <= 1}
          className="hidden lg:grid"
        >
          <ChevronLeft className="size-[18px]" aria-hidden="true" />
        </ToolbarButton>
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onPageChange(Number(pageInput));
          }}
        >
          <label htmlFor="page-number" className="sr-only">
            Page number
          </label>
          <input
            id="page-number"
            inputMode="numeric"
            value={pageInput}
            onChange={(event) =>
              setPageInput(event.target.value.replace(/\D/g, ""))
            }
            onBlur={() => {
              if (pageInput) onPageChange(Number(pageInput));
              else setPageInput(String(page));
            }}
            disabled={!ready}
            className="reader-page-input h-8 w-12 rounded-md border border-white/16 bg-[#20252b] px-2 text-center text-sm font-bold tabular-nums text-white outline-none focus:border-amber sm:w-14"
          />
          <span className="reader-page-count whitespace-nowrap text-sm font-semibold tabular-nums text-white/78">
            / {pageCount || "—"}
          </span>
        </form>
        <ToolbarButton
          label="Next page"
          onClick={onNextPage}
          disabled={!ready || page >= pageCount}
          className="hidden lg:grid"
        >
          <ChevronRight className="size-[18px]" aria-hidden="true" />
        </ToolbarButton>
        <span
          className="reader-toolbar-divider mx-1 hidden h-6 w-px bg-white/12 sm:block"
          aria-hidden="true"
        />
        <ToolbarButton
          label="Zoom out"
          onClick={onZoomOut}
          disabled={!ready}
          className="hidden sm:grid"
        >
          <ZoomOut className="size-[19px]" aria-hidden="true" />
        </ToolbarButton>
        <ZoomControl
          open={openMenu === "zoom"}
          scale={scale}
          ready={ready}
          preferences={preferences}
          onToggle={() =>
            setOpenMenu((current) => (current === "zoom" ? null : "zoom"))
          }
          onChange={applyZoom}
        />
        <ToolbarButton
          label="Zoom in"
          onClick={onZoomIn}
          disabled={!ready}
          className="hidden sm:grid"
        >
          <ZoomIn className="size-[19px]" aria-hidden="true" />
        </ToolbarButton>
      </div>

      <div className="ml-auto flex items-center gap-0.5">
        <ToolbarButton
          label="Print selected pages"
          onClick={onPrint}
          disabled={!ready}
          className="hidden lg:grid"
        >
          <Printer className="size-[19px]" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Download selected pages"
          onClick={onDownload}
          disabled={!ready}
          className="hidden lg:grid"
        >
          <Download className="size-[19px]" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label={
            preferences.theme === "dark"
              ? "Switch to light theme"
              : "Switch to dark theme"
          }
          onClick={() =>
            onThemeChange(preferences.theme === "dark" ? "light" : "dark")
          }
          className="hidden lg:grid"
        >
          {preferences.theme === "dark" ? (
            <Sun className="size-[19px]" aria-hidden="true" />
          ) : (
            <Moon className="size-[19px]" aria-hidden="true" />
          )}
        </ToolbarButton>
        <ToolbarButton
          label="Full screen"
          onClick={onFullscreen}
          className="hidden lg:grid"
        >
          <Maximize className="size-[19px]" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="More reader options"
          active={openMenu === "options"}
          onClick={() =>
            setOpenMenu((current) => (current === "options" ? null : "options"))
          }
        >
          <MoreVertical className="size-[19px]" aria-hidden="true" />
        </ToolbarButton>
      </div>

      {openMenu === "options" && (
        <OptionsMenu {...props} onClose={() => setOpenMenu(null)} />
      )}
    </div>
  );
}

export type { ReaderToolbarProps } from "./reader-toolbar/types";
