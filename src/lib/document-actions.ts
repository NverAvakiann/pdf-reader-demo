import { PDFDocument } from "pdf-lib";

export async function createPdfSubset(sourceUrl: string, pages: number[]) {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error("The source PDF could not be loaded.");
  }

  const source = await PDFDocument.load(await response.arrayBuffer());
  const subset = await PDFDocument.create();
  const copiedPages = await subset.copyPages(
    source,
    pages.map((page) => page - 1),
  );
  copiedPages.forEach((page) => subset.addPage(page));
  const savedBytes = await subset.save();
  const copiedBytes = new Uint8Array(savedBytes.byteLength);
  copiedBytes.set(savedBytes);
  return new Blob([copiedBytes.buffer], { type: "application/pdf" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export async function printBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.width = "1px";
  frame.style.height = "1px";
  frame.style.opacity = "0";
  frame.src = url;
  document.body.append(frame);

  let cleanupScheduled = false;
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(
        () => reject(new Error("Print preparation timed out.")),
        15_000,
      );
      frame.addEventListener(
        "load",
        () => {
          window.clearTimeout(timeout);
          resolve();
        },
        { once: true },
      );
    });

    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    cleanupScheduled = true;
    window.setTimeout(() => {
      frame.remove();
      URL.revokeObjectURL(url);
    }, 30_000);
  } finally {
    if (!cleanupScheduled) {
      frame.remove();
      URL.revokeObjectURL(url);
    }
  }
}
