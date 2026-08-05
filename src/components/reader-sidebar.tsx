import { Bookmark, BookmarkCheck, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createBookmarkSnippet } from "../lib/document-text";
import { ContentsPanel } from "./reader-sidebar/contents-panel";
import { PageThumbnail } from "./reader-sidebar/page-thumbnail";
import { SavedPanel } from "./reader-sidebar/saved-panel";
import { SearchPanel } from "./reader-sidebar/search-panel";
import { SidebarTabs } from "./reader-sidebar/sidebar-tabs";
import type { ReaderSidebarProps } from "./reader-sidebar/types";
import { useDocumentTextCache } from "./reader-sidebar/use-document-text-cache";

export function ReaderSidebar({
  document,
  fallbackContents,
  pageCount,
  currentPage,
  open,
  activeTab,
  bookmarks,
  annotations,
  matchCount,
  onTabChange,
  onPageSelect,
  onClose,
  onAddBookmark,
  onRemoveBookmark,
  onClearBookmarks,
  onUpdateAnnotation,
  onRemoveAnnotation,
  onClearAnnotations,
  onOpenAnnotation,
  onSearch,
  onSearchClose,
}: ReaderSidebarProps) {
  const sidebarRef = useRef<HTMLElement>(null);
  const getPageText = useDocumentTextCache(document);
  const currentIsBookmarked = bookmarks.some(
    (bookmark) => bookmark.page === currentPage,
  );

  useEffect(() => {
    function closeFromKeyboard(event: KeyboardEvent) {
      if (
        event.key === "Escape" &&
        sidebarRef.current?.contains(window.document.activeElement)
      ) {
        event.preventDefault();
        onClose();
      }
    }
    window.document.addEventListener("keydown", closeFromKeyboard);
    return () => window.document.removeEventListener("keydown", closeFromKeyboard);
  }, [onClose]);

  async function toggleCurrentBookmark() {
    if (currentIsBookmarked) {
      onRemoveBookmark(currentPage);
      return;
    }
    try {
      const text = await getPageText(currentPage);
      onAddBookmark({
        page: currentPage,
        snippet: createBookmarkSnippet(text, currentPage),
        createdAt: Date.now(),
      });
    } catch {
      onAddBookmark({
        page: currentPage,
        snippet: `Page ${currentPage}`,
        createdAt: Date.now(),
      });
    }
  }

  function selectPage(page: number) {
    onPageSelect(page);
    if (window.innerWidth < 768) onClose();
  }

  return (
    <>
      {open && (
        <button
          type="button"
          className="reader-sidebar-backdrop"
          aria-label="Close reader sidebar"
          onClick={onClose}
        />
      )}
      <aside
        ref={sidebarRef}
        className={`reader-sidebar ${open ? "is-open" : ""}`}
        aria-label="Document navigation"
        aria-hidden={!open}
      >
        {open && (
          <>
            <div className="reader-sidebar-top">
              <div className="flex min-w-0 items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-60">
                    Page
                  </p>
                  <p className="text-sm font-bold tabular-nums">
                    {currentPage} of {pageCount || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className={`sidebar-icon-button ${
                      currentIsBookmarked ? "is-active" : ""
                    }`}
                    onClick={() => void toggleCurrentBookmark()}
                    aria-label={
                      currentIsBookmarked
                        ? `Remove bookmark from page ${currentPage}`
                        : `Bookmark page ${currentPage}`
                    }
                    aria-pressed={currentIsBookmarked}
                    disabled={!document}
                  >
                    {currentIsBookmarked ? (
                      <BookmarkCheck className="size-[18px]" />
                    ) : (
                      <Bookmark className="size-[18px]" />
                    )}
                  </button>
                  <button
                    type="button"
                    className="sidebar-icon-button md:hidden"
                    onClick={onClose}
                    aria-label="Close reader sidebar"
                  >
                    <X className="size-[18px]" />
                  </button>
                </div>
              </div>
              <SidebarTabs activeTab={activeTab} onChange={onTabChange} />
            </div>

            <div
              id="sidebar-panel-thumbnails"
              role="tabpanel"
              aria-labelledby="sidebar-tab-thumbnails"
              className="reader-sidebar-panel"
              hidden={activeTab !== "thumbnails"}
            >
                <div className="space-y-6 px-4 py-5">
                  {document &&
                    Array.from({ length: pageCount }, (_, index) => (
                      <PageThumbnail
                        key={index + 1}
                        document={document}
                        pageNumber={index + 1}
                        active={currentPage === index + 1}
                        onSelect={() => selectPage(index + 1)}
                      />
                    ))}
                </div>
            </div>
            <div
              id="sidebar-panel-contents"
              role="tabpanel"
              aria-labelledby="sidebar-tab-contents"
              className="reader-sidebar-panel"
              hidden={activeTab !== "contents"}
            >
                <ContentsPanel
                  document={document}
                  fallbackContents={fallbackContents}
                  currentPage={currentPage}
                  onSelect={selectPage}
                />
            </div>
            <div
              id="sidebar-panel-search"
              role="tabpanel"
              aria-labelledby="sidebar-tab-search"
              className="reader-sidebar-panel is-search"
              hidden={activeTab !== "search"}
            >
                <SearchPanel
                  document={document}
                  active={activeTab === "search"}
                  pageCount={pageCount}
                  currentPage={currentPage}
                  matchCount={matchCount}
                  getPageText={getPageText}
                  onPageSelect={onPageSelect}
                  onSearch={onSearch}
                  onSearchClose={onSearchClose}
                />
            </div>
            <div
              id="sidebar-panel-bookmarks"
              role="tabpanel"
              aria-labelledby="sidebar-tab-bookmarks"
              className="reader-sidebar-panel"
              hidden={activeTab !== "bookmarks"}
            >
                <SavedPanel
                  bookmarks={bookmarks}
                  annotations={annotations}
                  currentPage={currentPage}
                  onSelectPage={selectPage}
                  onOpenAnnotation={onOpenAnnotation}
                  onUpdateAnnotation={onUpdateAnnotation}
                  onRemoveAnnotation={onRemoveAnnotation}
                  onClearAnnotations={onClearAnnotations}
                  onRemoveBookmark={onRemoveBookmark}
                  onClearBookmarks={onClearBookmarks}
                />
            </div>
          </>
        )}
      </aside>
    </>
  );
}

export type { SearchOptions } from "./reader-sidebar/types";
