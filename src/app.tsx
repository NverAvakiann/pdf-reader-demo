import { lazy, Suspense } from "react";
import { AppErrorBoundary } from "./components/app-error-boundary";
import { getDocumentById } from "./data/documents";
import { Redirect, useRouter } from "./lib/router";

const LibraryPage = lazy(() =>
  import("./pages/library-page").then((module) => ({ default: module.LibraryPage })),
);
const ReaderPage = lazy(() =>
  import("./pages/reader-page").then((module) => ({ default: module.ReaderPage })),
);

export function App() {
  const { path } = useRouter();
  const readerMatch = path.match(/^\/reader\/([^/]+)$/);
  let page = <LibraryPage />;

  if (readerMatch) {
    let documentId = "";
    try {
      documentId = decodeURIComponent(readerMatch[1]);
    } catch {
      documentId = "";
    }
    page = getDocumentById(documentId) ? (
      <ReaderPage documentId={documentId} />
    ) : (
      <Redirect to="/" />
    );
  } else if (path !== "/") {
    page = <Redirect to="/" />;
  }

  return (
    <AppErrorBoundary>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Suspense fallback={null}>{page}</Suspense>
    </AppErrorBoundary>
  );
}
