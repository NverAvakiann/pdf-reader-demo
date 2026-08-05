import type { PDFDocumentProxy } from "pdfjs-dist";
import type { DocumentContentsItem } from "../../data/documents";
import type { SidebarTabPreference } from "../../hooks/use-reader-preferences";
import type { PageBookmark, TextAnnotation } from "../../lib/reading-state";

export type SearchOptions = {
  caseSensitive: boolean;
  entireWord: boolean;
  findPrevious?: boolean;
  again?: boolean;
  changeType?: "casechange" | "entirewordchange";
};

export type ReaderSidebarProps = {
  document: PDFDocumentProxy | null;
  fallbackContents?: DocumentContentsItem[];
  pageCount: number;
  currentPage: number;
  open: boolean;
  activeTab: SidebarTabPreference;
  bookmarks: PageBookmark[];
  annotations: TextAnnotation[];
  matchCount: { current: number; total: number };
  onTabChange: (tab: SidebarTabPreference) => void;
  onPageSelect: (page: number) => void;
  onClose: () => void;
  onAddBookmark: (bookmark: PageBookmark) => void;
  onRemoveBookmark: (page: number) => void;
  onClearBookmarks: () => void;
  onUpdateAnnotation: (annotationId: string, note: string) => void;
  onRemoveAnnotation: (annotationId: string) => void;
  onClearAnnotations: () => void;
  onOpenAnnotation: (annotation: TextAnnotation) => void;
  onSearch: (query: string, options: SearchOptions) => void;
  onSearchClose: () => void;
};
