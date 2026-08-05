export type PageRangeResult =
  | { ok: true; pages: number[]; normalized: string }
  | { ok: false; message: string };

export function parsePageRanges(input: string, totalPages: number): PageRangeResult {
  const value = input.replace(/\s/g, "");

  if (!value) {
    return { ok: false, message: "Enter at least one page." };
  }

  if (!/^\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*$/.test(value)) {
    return {
      ok: false,
      message: "Use page numbers and ranges such as 1-3,5,7-8.",
    };
  }

  const pages = new Set<number>();

  for (const segment of value.split(",")) {
    const [startText, endText] = segment.split("-");
    const start = Number(startText);
    const end = endText ? Number(endText) : start;

    if (start < 1 || end < 1 || start > totalPages || end > totalPages) {
      return {
        ok: false,
        message: `Choose pages between 1 and ${totalPages}.`,
      };
    }

    if (end < start) {
      return {
        ok: false,
        message: `Range ${segment} must run from a lower page to a higher page.`,
      };
    }

    for (let page = start; page <= end; page += 1) {
      pages.add(page);
    }
  }

  const sortedPages = [...pages].sort((a, b) => a - b);

  return {
    ok: true,
    pages: sortedPages,
    normalized: collapsePages(sortedPages),
  };
}

function collapsePages(pages: number[]) {
  const ranges: string[] = [];
  let start = pages[0];
  let previous = pages[0];

  for (let index = 1; index <= pages.length; index += 1) {
    const page = pages[index];
    if (page === previous + 1) {
      previous = page;
      continue;
    }

    ranges.push(start === previous ? String(start) : `${start}-${previous}`);
    start = page;
    previous = page;
  }

  return ranges.join(",");
}
