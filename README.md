# Read Room

Read Room is a client-side PDF library and reader built with React, TypeScript,
Vite, Tailwind CSS, PDF.js, and pdf-lib. Documents, reading progress, bookmarks,
and private text notes stay in the browser.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0`
- npm `10` or newer
- A current version of Chrome, Edge, Firefox, or Safari

Node.js `22.12+` is the recommended baseline. The project has also been
verified with Node.js `24.11.0` and npm `11.6.1`.

No backend, database, environment variables, or external services are needed.
All PDFs are served as static files and processed in the browser.

Check the versions installed on your machine:

```sh
node --version
npm --version
```

## Install and run locally

From the project directory, install the exact dependency versions recorded in
`package-lock.json`:

```sh
npm ci
```

Start the Vite development server:

```sh
npm run dev
```

Open the local URL printed by Vite, normally:

```text
http://localhost:5173
```

Changes under `src/` are reflected automatically while the development server
is running.

## Production build

Create an optimized production build:

```sh
npm run build
```

This runs the TypeScript compiler first and writes the deployable application
to `dist/`.

Preview the production build locally:

```sh
npm run preview
```

Open the URL printed by Vite, normally `http://localhost:4173`.

## Available commands

```sh
npm run dev          # Start the development server
npm run typecheck    # Check TypeScript without creating a build
npm run build        # Type-check and create the production build
npm run preview      # Serve the production build locally
npm test             # Run the existing unit tests
npm run test:e2e     # Run the existing Playwright browser suite
npm run generate:pdfs # Regenerate the bundled demonstration PDFs
```

## Architecture

- `src/pages/` contains the library and reader route compositions.
- `src/components/reader-sidebar/` contains the four independent navigation
  panels and their shared document-text cache.
- `src/components/reader-toolbar/` contains the toolbar primitives and menus.
- `src/components/text-annotations/` contains annotation anchoring, dialogs,
  and text-layer integration.
- `src/hooks/` owns PDF.js lifecycle, reader preferences, progress,
  fullscreen, hand-tool behavior, and keyboard commands.
- `src/lib/` contains browser/PDF services and pure document utilities.
- `src/data/documents.ts` is the typed document manifest.
- `public/pdfs/` contains the five static source documents.

The library page, reader page, range dialog, PDF.js viewer, and pdf-lib actions
are loaded as separate production chunks.

## Replacing PDFs

Keep manifest IDs stable so local reading progress remains associated with the
correct paper. Update the corresponding manifest metadata and fallback
contents when a document changes. Text search and annotations require PDFs with
extractable text.

PDF files belong in `public/pdfs/`. Their metadata and public paths are defined
in `src/data/documents.ts`.

## Browser storage

Reader preferences and per-document reading state use versioned, runtime
validated `localStorage` records. Private notes are local to the current
browser and do not sync between devices.

## Static deployment

The host must serve `index.html` as the fallback for `/reader/:documentId`
routes. No backend or server rendering is required.

Deploy the contents of `dist/`, not the repository root. Direct requests such
as `/reader/digital-trust` must fall back to `dist/index.html` so the
client-side router can resolve the document.
