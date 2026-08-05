import { ArrowRight, BookOpen, FileText } from "lucide-react";
import { Brand } from "../components/brand";
import { DocumentCover } from "../components/document-cover";
import { documents } from "../data/documents";
import { useReadingStore } from "../hooks/use-reading-state";
import { Link } from "../lib/router";

export function LibraryPage() {
  const { store, resetProgress } = useReadingStore();

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="library-header border-b border-ink/12">
        <div className="library-header-inner mx-auto flex max-w-[1480px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Brand compact />
          <div className="flex items-center gap-3 text-sm font-semibold text-muted">
            <BookOpen className="size-4" aria-hidden="true" />
            <span>The reading room</span>
            <span className="mx-1 h-4 w-px bg-ink/15" aria-hidden="true" />
            <span className="tabular-nums">05 papers</span>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="relative overflow-hidden border-b border-ink/12">
          <div className="mx-auto grid max-w-[1480px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-12 lg:py-24">
            <div className="max-w-4xl">
              <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-cobalt">
                <span className="h-px w-10 bg-cobalt" />
                Independent reading, in the browser
              </p>
              <h1 className="max-w-[900px] font-serif text-[clamp(3.8rem,8vw,7.8rem)] leading-[0.84] tracking-[-0.055em]">
                Keep the paper in view.
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
                Five research papers, one calm reading surface. Search, compare pages and keep
                your place without sending a document anywhere else.
              </p>
              <Link
                to={`/reader/${documents[0].id}`}
                className="mt-9 inline-flex items-center gap-3 bg-ink px-5 py-3.5 text-sm font-bold text-white transition hover:bg-cobalt focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt"
              >
                Open the first paper
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="relative hidden min-h-[370px] lg:block" aria-hidden="true">
              <div className="absolute right-[9%] top-0 h-[340px] w-[238px] rotate-[5deg] border border-ink/15 bg-white p-3 shadow-[0_30px_80px_rgba(24,32,35,0.14)]">
                <DocumentCover document={documents[2]} eager className="h-full w-full" />
              </div>
              <div className="absolute right-[28%] top-10 h-[340px] w-[238px] -rotate-[5deg] border border-ink/15 bg-white p-3 shadow-[0_25px_60px_rgba(24,32,35,0.16)]">
                <DocumentCover document={documents[0]} eager className="h-full w-full" />
              </div>
              <div className="absolute bottom-1 right-0 flex h-14 w-52 items-center gap-3 bg-amber px-4 text-sm font-bold text-ink shadow-lg">
                <span className="grid size-7 place-items-center rounded-full border border-ink/35 font-serif">
                  05
                </span>
                Indexed for reading
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1480px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="mb-10 flex flex-col justify-between gap-4 border-b border-ink/15 pb-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Collection</p>
              <h2 className="mt-2 font-serif text-4xl tracking-[-0.035em] sm:text-5xl">
                Current papers
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted">
              Demonstration documents are included now and can be replaced one-for-one in the
              local PDF folder.
            </p>
          </div>

          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {documents.map((document) => {
              const progress = store.documents[document.id];
              const hasProgress = Boolean(progress?.updatedAt);
              const percentage = progress?.pageCount
                ? Math.min(100, Math.round((progress.page / progress.pageCount) * 100))
                : 0;
              const action = progress?.completed
                ? "Read again"
                : hasProgress && progress.page > 1
                  ? `Continue on page ${progress.page}`
                  : "Read paper";

              return (
              <article key={document.id} className="group flex flex-col">
                <Link
                  to={`/reader/${document.id}`}
                  className="relative block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt"
                  aria-label={`Open ${document.title}`}
                >
                  <div className="absolute -right-2 top-5 h-20 w-2" style={{ background: document.accent }} />
                  <div className="overflow-hidden border border-ink/15 bg-white p-2.5 shadow-[0_14px_35px_rgba(24,32,35,0.08)] transition duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_22px_48px_rgba(24,32,35,0.15)] motion-reduce:transform-none">
                    <DocumentCover document={document} className="aspect-[612/792] w-full" />
                  </div>
                </Link>
                <div className="mt-5 flex items-center justify-between text-xs font-bold uppercase tracking-[0.15em] text-muted">
                  <span>{document.category}</span>
                  <span className="tabular-nums">{document.index}</span>
                </div>
                <h3 className="mt-3 font-serif text-[1.7rem] leading-[1.02] tracking-[-0.03em]">
                  <Link
                    to={`/reader/${document.id}`}
                    className="decoration-1 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                  >
                    {document.title}
                  </Link>
                </h3>
                <p className="mt-3 text-sm font-semibold text-ink/75">{document.author}</p>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{document.description}</p>
                {hasProgress && (
                  <div className="mt-4" aria-label={`${percentage}% read`}>
                    <div className="h-1 overflow-hidden rounded-full bg-ink/10">
                      <div
                        className="h-full rounded-full bg-amber"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-muted">
                      <span>{progress.completed ? "Finished" : `${percentage}% read`}</span>
                      <button
                        type="button"
                        className="rounded-md px-1.5 py-1 font-bold text-ink/70 hover:bg-ink/8 hover:text-ink focus-visible:outline-2 focus-visible:outline-cobalt"
                        onClick={() => resetProgress(document.id)}
                      >
                        Start over
                      </button>
                    </div>
                  </div>
                )}
                <Link
                  to={`/reader/${document.id}`}
                  className="group/read mt-auto flex w-fit items-center gap-2 rounded-sm pt-5 text-sm font-bold text-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                  aria-label={`Read ${document.title}`}
                >
                  <FileText className="size-4" aria-hidden="true" />
                  <span className="underline-offset-4 group-hover/read:underline">{action}</span>
                </Link>
              </article>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-ink/12 bg-ink text-white">
        <div className="mx-auto flex max-w-[1480px] flex-col justify-between gap-5 px-5 py-8 sm:flex-row sm:items-center sm:px-8 lg:px-12">
          <Brand compact inverse />
          <p className="max-w-xl text-sm leading-6 text-white/62">
            Your reading stays in your browser.
          </p>
        </div>
      </footer>
    </div>
  );
}
