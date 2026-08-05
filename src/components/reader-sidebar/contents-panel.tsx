import { BookOpenText, ChevronDown, ChevronRight, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { DocumentContentsItem } from "../../data/documents";
import {
  loadDocumentContents,
  type ResolvedContentsItem,
} from "../../lib/pdf-outline";

function ContentsTree({
  items,
  currentPage,
  onSelect,
  depth = 0,
}: {
  items: ResolvedContentsItem[];
  currentPage: number;
  onSelect: (page: number) => void;
  depth?: number;
}) {
  return (
    <ul className="contents-tree" role={depth === 0 ? "tree" : "group"}>
      {items.map((item) => (
        <ContentsTreeItem
          key={item.id}
          item={item}
          currentPage={currentPage}
          onSelect={onSelect}
          depth={depth}
        />
      ))}
    </ul>
  );
}

function ContentsTreeItem({
  item,
  currentPage,
  onSelect,
  depth,
}: {
  item: ResolvedContentsItem;
  currentPage: number;
  onSelect: (page: number) => void;
  depth: number;
}) {
  const hasChildren = item.children.length > 0;
  const active = item.page === currentPage;
  const [expanded, setExpanded] = useState(true);

  return (
    <li role="treeitem" aria-expanded={hasChildren ? expanded : undefined}>
      <div
        className={`contents-row ${active ? "is-current" : ""}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="contents-expand-button"
            onClick={() => setExpanded((current) => !current)}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${item.title}`}
          >
            {expanded ? (
              <ChevronDown className="size-3.5" aria-hidden="true" />
            ) : (
              <ChevronRight className="size-3.5" aria-hidden="true" />
            )}
          </button>
        ) : (
          <span className="w-6 shrink-0" aria-hidden="true" />
        )}
        <button
          type="button"
          disabled={item.page === null}
          onClick={() => item.page && onSelect(item.page)}
          className="min-w-0 flex-1 py-2 text-left"
          aria-current={active ? "page" : undefined}
        >
          <span className="block truncate text-sm font-semibold">{item.title}</span>
          {item.page && (
            <span className="mt-0.5 block text-[11px] tabular-nums opacity-65">
              Page {item.page}
            </span>
          )}
        </button>
      </div>
      {hasChildren && expanded && (
        <ContentsTree
          items={item.children}
          currentPage={currentPage}
          onSelect={onSelect}
          depth={depth + 1}
        />
      )}
    </li>
  );
}

export function ContentsPanel({
  document,
  fallbackContents,
  currentPage,
  onSelect,
}: {
  document: PDFDocumentProxy | null;
  fallbackContents?: DocumentContentsItem[];
  currentPage: number;
  onSelect: (page: number) => void;
}) {
  const [contents, setContents] = useState<ResolvedContentsItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!document) {
      setContents([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadDocumentContents(document, fallbackContents)
      .then((items) => {
        if (!cancelled) setContents(items);
      })
      .catch(() => {
        if (!cancelled) setContents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [document, fallbackContents]);

  return (
    <div className="py-3">
      {loading ? (
        <div className="sidebar-empty" role="status">
          <LoaderCircle className="size-5 animate-spin" />
          Loading contents…
        </div>
      ) : contents.length ? (
        <ContentsTree
          items={contents}
          currentPage={currentPage}
          onSelect={onSelect}
        />
      ) : (
        <div className="sidebar-empty">
          <BookOpenText className="size-6" />
          <p className="font-semibold">No contents available</p>
          <p>This paper does not include a table of contents.</p>
        </div>
      )}
    </div>
  );
}
