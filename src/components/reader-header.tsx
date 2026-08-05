import { Check, ChevronDown, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReadRoomDocument } from "../data/documents";
import { documents } from "../data/documents";
import { Link } from "../lib/router";
import { Brand } from "./brand";

type ReaderHeaderProps = {
  currentDocument: ReadRoomDocument;
};

function DocumentMenu({
  currentDocument,
  onSelect,
  compact = false,
}: {
  currentDocument: ReadRoomDocument;
  onSelect: () => void;
  compact?: boolean;
}) {
  return (
    <nav
      className={`document-switcher ${compact ? "document-switcher-compact" : ""}`}
      aria-label="Choose another PDF"
    >
      <div className="border-b border-ink/10 px-4 py-3">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted">
          Switch paper
        </p>
      </div>
      {documents.map((item) => (
        <Link
          key={item.id}
          to={`/reader/${item.id}`}
          aria-current={item.id === currentDocument.id ? "page" : undefined}
          className="flex items-center gap-3 border-b border-ink/8 px-4 py-3 last:border-0 hover:bg-fog focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-cobalt"
          onClick={onSelect}
        >
          <span
            className="grid size-9 shrink-0 place-items-center bg-white font-serif text-xs font-bold shadow-sm"
            style={{ borderLeft: `3px solid ${item.accent}` }}
          >
            {item.index}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">{item.title}</span>
            <span className="mt-0.5 block truncate text-xs text-muted">{item.category}</span>
          </span>
          {item.id === currentDocument.id && <Check className="size-4 text-cobalt" aria-hidden="true" />}
        </Link>
      ))}
    </nav>
  );
}

export function ReaderHeader({ currentDocument }: ReaderHeaderProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointer(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <header className="reader-header">
      <div className="flex min-w-0 items-center gap-5">
        <Brand compact />
        <span className="hidden h-10 w-px bg-ink/12 sm:block" aria-hidden="true" />
        <Link
          to="/"
          className="hidden text-xs font-bold uppercase tracking-[0.15em] text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt xl:block"
        >
          Research collection
        </Link>
      </div>

      <div ref={wrapperRef} className="contents">
        <div className="reader-document-select hidden lg:block">
          <button
            type="button"
            className="flex w-full min-w-0 items-center gap-3 rounded-sm border border-transparent px-2 py-2 text-left transition hover:border-ink/12 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-haspopup="true"
          >
            <span
              className="relative grid size-10 shrink-0 place-items-center overflow-hidden bg-white shadow-[0_2px_8px_rgba(25,32,34,0.14)]"
              aria-hidden="true"
            >
              <span className="absolute left-0 top-0 h-full w-1" style={{ background: currentDocument.accent }} />
              <span className="font-serif text-sm font-bold">{currentDocument.index}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-ink">{currentDocument.title}</span>
              <span className="mt-0.5 block truncate text-xs text-muted">
                {currentDocument.author} · {currentDocument.year}
              </span>
            </span>
            <ChevronDown
              className={`size-4 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
          {open && <DocumentMenu currentDocument={currentDocument} onSelect={() => setOpen(false)} />}
        </div>

        <div className="relative ml-auto lg:hidden">
          <button
            type="button"
            className="grid size-11 place-items-center rounded-sm text-ink transition hover:bg-ink/6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
            onClick={() => setOpen((current) => !current)}
            aria-label="Choose another paper"
            aria-expanded={open}
            aria-haspopup="true"
          >
            <Menu className="size-6" aria-hidden="true" />
          </button>
          {open && (
            <DocumentMenu
              currentDocument={currentDocument}
              onSelect={() => setOpen(false)}
              compact
            />
          )}
        </div>
      </div>
    </header>
  );
}
