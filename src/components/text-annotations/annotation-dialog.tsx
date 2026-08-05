import { MessageSquareText, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { SelectionAnchor } from "./types";

export function AnnotationDialog({
  selection,
  onSave,
  onClose,
}: {
  selection: SelectionAnchor;
  onSave: (note: string) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    dialogRef.current?.showModal();
    textareaRef.current?.focus();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="annotation-dialog"
      aria-labelledby="annotation-dialog-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <div className="annotation-dialog-inner">
        <div className="flex items-start justify-between gap-5">
          <div className="flex items-center gap-3">
            <span className="annotation-dialog-icon">
              <MessageSquareText className="size-[18px]" aria-hidden="true" />
            </span>
            <div>
              <p className="annotation-dialog-eyebrow text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                Page {selection.page}
              </p>
              <h2
                id="annotation-dialog-title"
                className="mt-0.5 font-serif text-xl"
              >
                Add a note
              </h2>
            </div>
          </div>
          <button
            type="button"
            className="annotation-dialog-close"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close annotation dialog"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <blockquote className="annotation-selection-preview">
          “{selection.selectedText}”
        </blockquote>
        <label
          htmlFor="annotation-note"
          className="mt-4 block text-xs font-bold"
        >
          Private note
        </label>
        <textarea
          ref={textareaRef}
          id="annotation-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What do you want to remember?"
          rows={4}
          maxLength={1000}
          className="annotation-note-input"
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="annotation-dialog-cancel"
            onClick={() => dialogRef.current?.close()}
          >
            Cancel
          </button>
          <button
            type="button"
            className="annotation-dialog-save"
            disabled={!note.trim()}
            onClick={() => onSave(note.trim())}
          >
            Save note
          </button>
        </div>
      </div>
    </dialog>
  );
}
