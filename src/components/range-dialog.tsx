import { AlertCircle, Download, LoaderCircle, Printer, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReadRoomDocument } from "../data/documents";
import { parsePageRanges } from "../lib/page-ranges";

type RangeDialogProps = {
  action: "print" | "download";
  document: ReadRoomDocument;
  totalPages: number;
  onClose: () => void;
};

export function RangeDialog({ action, document, totalPages, onClose }: RangeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [processingError, setProcessingError] = useState("");
  const result = useMemo(
    () => parsePageRanges(value, totalPages),
    [totalPages, value],
  );
  const showRangeError = !result.ok && (attempted || Boolean(value.trim()));

  useEffect(() => {
    dialogRef.current?.showModal();
    inputRef.current?.focus();
  }, []);

  async function handleAction() {
    setAttempted(true);
    setProcessingError("");
    if (!result.ok || busy) return;

    setBusy(true);
    try {
      const { createPdfSubset, downloadBlob, printBlob } = await import(
        "../lib/document-actions"
      );
      const blob = await createPdfSubset(document.file, result.pages);
      if (action === "download") {
        downloadBlob(blob, `${document.id}-pages-${result.normalized.replaceAll(",", "_")}.pdf`);
      } else {
        await printBlob(blob);
      }
      dialogRef.current?.close();
    } catch (error) {
      setProcessingError(
        error instanceof Error ? error.message : `The PDF could not be prepared for ${action}.`,
      );
    } finally {
      setBusy(false);
    }
  }

  const actionLabel = action === "print" ? "Print pages" : "Download pages";
  const Icon = action === "print" ? Printer : Download;

  return (
    <dialog
      ref={dialogRef}
      className="range-dialog"
      aria-labelledby="range-dialog-title"
      onClose={onClose}
      onClick={(event) => {
        if (!busy && event.target === event.currentTarget) {
          event.currentTarget.close();
        }
      }}
      onCancel={(event) => {
        if (busy) event.preventDefault();
      }}
    >
      <div className="range-dialog-inner">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <span
              className="grid size-9 place-items-center rounded-lg bg-amber/30 text-ink"
              data-testid="modal-action-icon"
            >
              <Icon className="size-[1.125rem]" aria-hidden="true" />
            </span>
            <h2 id="range-dialog-title" className="font-serif text-2xl tracking-[-0.025em]">
              {action === "print" ? "Printing PDF" : "Downloading PDF"}
            </h2>
          </div>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg text-muted hover:bg-fog hover:text-ink focus-visible:outline-2 focus-visible:outline-cobalt"
            onClick={() => dialogRef.current?.close()}
            disabled={busy}
            aria-label="Close dialog"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <p className="range-dialog-copy mt-5 max-w-2xl text-sm leading-6 text-ink/82">
          Enter the pages you want to {action}, for example 1-3 or 2,4,5. You can
          choose any pages in this document.
        </p>

        <label htmlFor="page-range" className="range-dialog-label mt-5 block text-sm font-bold text-ink">
          Page range
        </label>
        <input
          ref={inputRef}
          id="page-range"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setAttempted(false);
            setProcessingError("");
          }}
          onKeyDown={(event) => event.key === "Enter" && void handleAction()}
          placeholder="Enter page range"
          className="mt-2 h-12 w-full rounded-lg border border-ink/25 bg-white px-4 text-base outline-none transition placeholder:text-muted/70 focus:border-cobalt focus:ring-2 focus:ring-cobalt/20"
          aria-invalid={showRangeError || Boolean(processingError)}
          aria-describedby="range-hint range-error"
          disabled={busy}
        />
        <div id="range-hint" className="range-dialog-hint mt-3 flex justify-between gap-4 text-sm text-muted">
          <span>Total pages: {totalPages}</span>
          {result.ok && value && <span>{result.pages.length} selected</span>}
        </div>

        {showRangeError || processingError ? (
          <p id="range-error" className="mt-4 flex items-start gap-2 text-sm font-semibold text-[#a53028]">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {processingError || (!result.ok && result.message)}
          </p>
        ) : (
          <p id="range-error" className="range-dialog-helper mt-4 text-xs leading-5 text-muted">
            Use commas to combine individual pages and ranges.
          </p>
        )}

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            className="range-dialog-cancel rounded-lg bg-fog px-5 py-2.5 text-sm font-bold text-ink hover:bg-ink/10 focus-visible:outline-2 focus-visible:outline-cobalt"
            onClick={() => dialogRef.current?.close()}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="range-dialog-action inline-flex min-w-36 items-center justify-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
            onClick={() => void handleAction()}
            disabled={busy || !result.ok}
          >
            {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Icon className="size-4" aria-hidden="true" />}
            {busy ? "Preparing…" : actionLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
