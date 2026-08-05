import { Bookmark, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import type { PageBookmark, TextAnnotation } from "../../lib/reading-state";

export function SavedPanel({
  bookmarks,
  annotations,
  currentPage,
  onSelectPage,
  onOpenAnnotation,
  onUpdateAnnotation,
  onRemoveAnnotation,
  onClearAnnotations,
  onRemoveBookmark,
  onClearBookmarks,
}: {
  bookmarks: PageBookmark[];
  annotations: TextAnnotation[];
  currentPage: number;
  onSelectPage: (page: number) => void;
  onOpenAnnotation: (annotation: TextAnnotation) => void;
  onUpdateAnnotation: (annotationId: string, note: string) => void;
  onRemoveAnnotation: (annotationId: string) => void;
  onClearAnnotations: () => void;
  onRemoveBookmark: (page: number) => void;
  onClearBookmarks: () => void;
}) {
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState("");

  if (!annotations.length && !bookmarks.length) {
    return (
      <div className="bookmarks-panel">
        <div className="sidebar-empty">
          <Bookmark className="size-6" />
          <p className="font-semibold">Nothing saved yet</p>
          <p>Bookmark a page or select text in the paper to add a private note.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bookmarks-panel">
      {annotations.length > 0 && (
        <section aria-labelledby="saved-notes-heading">
          <div className="saved-section-heading">
            <p id="saved-notes-heading">
              {annotations.length} text {annotations.length === 1 ? "note" : "notes"}
            </p>
            <button type="button" onClick={onClearAnnotations}>
              Clear notes
            </button>
          </div>
          <ul className="annotation-list">
            {annotations.map((annotation) => (
              <li
                key={annotation.id}
                className={annotation.page === currentPage ? "is-current" : ""}
              >
                <button
                  type="button"
                  className="annotation-jump"
                  onClick={() => {
                    onSelectPage(annotation.page);
                    onOpenAnnotation(annotation);
                  }}
                >
                  <span className="bookmark-page">Page {annotation.page}</span>
                  <span className="annotation-quote">
                    “{annotation.selectedText}”
                  </span>
                </button>
                {editingAnnotation === annotation.id ? (
                  <div className="annotation-edit">
                    <label
                      htmlFor={`annotation-edit-${annotation.id}`}
                      className="sr-only"
                    >
                      Edit note
                    </label>
                    <textarea
                      id={`annotation-edit-${annotation.id}`}
                      value={editingNote}
                      onChange={(event) => setEditingNote(event.target.value)}
                      rows={3}
                      maxLength={1000}
                    />
                    <div>
                      <button
                        type="button"
                        onClick={() => setEditingAnnotation(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!editingNote.trim()}
                        onClick={() => {
                          onUpdateAnnotation(annotation.id, editingNote.trim());
                          setEditingAnnotation(null);
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="annotation-note"
                    onClick={() => {
                      onSelectPage(annotation.page);
                      onOpenAnnotation(annotation);
                    }}
                  >
                    {annotation.note}
                  </button>
                )}
                <div className="annotation-actions">
                  <button
                    type="button"
                    aria-label={`Edit note on page ${annotation.page}`}
                    onClick={() => {
                      setEditingAnnotation(annotation.id);
                      setEditingNote(annotation.note);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete note on page ${annotation.page}`}
                    onClick={() => onRemoveAnnotation(annotation.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {bookmarks.length > 0 && (
        <section aria-labelledby="saved-pages-heading">
          <div className="saved-section-heading">
            <p id="saved-pages-heading">
              {bookmarks.length} saved {bookmarks.length === 1 ? "page" : "pages"}
            </p>
            <button type="button" onClick={onClearBookmarks}>
              Clear pages
            </button>
          </div>
          <ul>
            {bookmarks.map((bookmark) => (
              <li
                key={bookmark.page}
                className={bookmark.page === currentPage ? "is-current" : ""}
              >
                <button
                  type="button"
                  className="bookmark-jump"
                  onClick={() => onSelectPage(bookmark.page)}
                >
                  <span className="bookmark-page">Page {bookmark.page}</span>
                  <span>{bookmark.snippet}</span>
                </button>
                <button
                  type="button"
                  className="remove-bookmark-button"
                  onClick={() => onRemoveBookmark(bookmark.page)}
                  aria-label={`Remove bookmark from page ${bookmark.page}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
