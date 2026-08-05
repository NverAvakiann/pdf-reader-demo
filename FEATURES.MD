# Read Room Features

## Library

- Five-document library generated from a typed local manifest.
- First-page PDF cover previews rendered in the browser.
- Responsive document cards with title, author, category, year, and description.
- Continue-reading progress and completion indicators.
- Start-over action that preserves bookmarks and notes.
- Loading placeholders and missing-preview states.

## PDF reader

- Client-side PDF rendering powered by PDF.js.
- Text and link layers with selectable text and working PDF links.
- Previous, next, first, last, and direct page navigation.
- Current page and total-page display.
- Zoom in, zoom out, actual size, page fit, page width, and preset scales.
- Clockwise and counterclockwise page rotation.
- Text-selection and hand/pan tools.
- Vertical, horizontal, and wrapped scrolling.
- Single-page, dual-page, and dual-page-with-cover layouts.
- Fullscreen reading with a compact exit control and Escape support.
- Light and dark reader themes without changing PDF page colors.

## Reader sidebar

- Responsive desktop sidebar and mobile/tablet overlay drawer.
- Pages tab with lazy-rendered thumbnails and current-page indication.
- Contents tab using embedded PDF outlines when available.
- Authored fallback contents for PDFs without an embedded outline.
- Nested and expandable table-of-contents entries.
- Saved tab for text notes and page bookmarks.
- Last selected sidebar tab and open state are remembered.
- Sidebar is hidden automatically in fullscreen mode.

## Search

- Full-document text search with highlighted PDF matches.
- Results grouped by page with snippets and per-page match counts.
- Current match and total match counter.
- Previous and next match navigation.
- Match-case and whole-word filters.
- Search indexing progress and reusable in-memory page-text caching.

## Text notes

- Text-anchored private notes created from PDF selections.
- Highlighted annotated text inside the PDF.
- Clickable highlights that display their saved note.
- Notes can be opened from the Saved sidebar.
- Edit, delete, and clear-all note actions.
- Quote-and-context anchoring for more reliable note restoration.
- Notes are stored locally in the current browser.

## Page bookmarks

- Bookmark or unbookmark the current page.
- Automatically generated bookmark snippets.
- Jump to a bookmarked page from the Saved sidebar.
- Delete individual bookmarks or clear all bookmarks.
- Duplicate bookmarks for the same page are prevented.
- Bookmarks remain when reading progress is reset.

## Print and download

- Print any valid selection of PDF pages.
- Download selected pages as a new PDF.
- Page ranges support entries such as `1-3,5,7-8`.
- Client-side page extraction powered by pdf-lib.
- Validation for malformed ranges, duplicates, and page bounds.
- Native browser print dialog integration.

## Documents and navigation

- Header document switcher for moving between all five papers.
- Client-side library and reader routes.
- Direct URLs using `/reader/:documentId`.
- Shared PDF cover cache to avoid duplicate document loading.
- Helpful loading and PDF-opening error states.

## Persistence and privacy

- Reading progress is remembered separately for every document.
- Papers automatically resume at the last read page.
- Completed papers are marked when the final page is reached.
- Theme, zoom, tool, layout, scrolling, and sidebar preferences persist.
- Runtime validation protects against malformed browser storage.
- All documents and reading data remain client-side.
- No backend, account, database, or upload service is required.

## Responsive and accessible behavior

- Desktop, tablet, and mobile reader layouts.
- Responsive toolbar with secondary actions in an overflow menu.
- Keyboard shortcuts for search, page navigation, zoom, and fullscreen exit.
- Keyboard-operable tabs, menus, dialogs, contents, and document controls.
- Outside-click and Escape dismissal for menus and dialogs.
- Semantic labels, focus styles, live statuses, and reduced-motion support.
- Application error boundary with a reload recovery action.

## Performance

- Separate production chunks for the library, reader, range dialog, PDF.js
  viewer, and PDF generation actions.
- Lazy PDF thumbnails and cover rendering.
- On-demand loading of print and download processing.
- Cached page text for search and bookmark snippets.
