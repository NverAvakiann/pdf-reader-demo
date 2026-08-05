import type { PDFDocumentProxy } from "pdfjs-dist";
import type { DocumentContentsItem } from "../data/documents";

export type ResolvedContentsItem = {
  id: string;
  title: string;
  page: number | null;
  children: ResolvedContentsItem[];
};

type PdfOutlineItem = {
  title?: string;
  dest?: string | unknown[] | null;
  items?: PdfOutlineItem[];
};

async function resolveDestinationPage(
  document: PDFDocumentProxy,
  destination: string | unknown[] | null | undefined,
) {
  if (!destination) return null;
  const explicit = typeof destination === "string"
    ? await document.getDestination(destination)
    : destination;
  if (!explicit?.length) return null;
  const reference = explicit[0];
  if (typeof reference === "number") return reference + 1;
  if (reference && typeof reference === "object") {
    try {
      return (await document.getPageIndex(reference as never)) + 1;
    } catch {
      return null;
    }
  }
  return null;
}

async function resolvePdfItems(
  document: PDFDocumentProxy,
  items: PdfOutlineItem[],
  path = "outline",
): Promise<ResolvedContentsItem[]> {
  return Promise.all(
    items.map(async (item, index) => ({
      id: `${path}-${index}`,
      title: item.title?.trim() || "Untitled section",
      page: await resolveDestinationPage(document, item.dest),
      children: await resolvePdfItems(document, item.items ?? [], `${path}-${index}`),
    })),
  );
}

function resolveManifestItems(
  items: DocumentContentsItem[],
  path = "manifest",
): ResolvedContentsItem[] {
  return items.map((item, index) => ({
    id: `${path}-${index}`,
    title: item.title,
    page: item.page,
    children: resolveManifestItems(item.children ?? [], `${path}-${index}`),
  }));
}

export async function loadDocumentContents(
  document: PDFDocumentProxy,
  fallback: DocumentContentsItem[] = [],
) {
  const outline = (await document.getOutline()) as PdfOutlineItem[] | null;
  return outline?.length
    ? resolvePdfItems(document, outline)
    : resolveManifestItems(fallback);
}

