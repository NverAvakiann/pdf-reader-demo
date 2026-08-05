import { describe, expect, it } from "vitest";
import {
  createBookmarkSnippet,
  createPageSnippet,
  findSearchResults,
  normalizePageText,
} from "./document-text";

describe("document text helpers", () => {
  it("normalizes text items into searchable page text", () => {
    expect(normalizePageText(["Public", "  institutions\n", "matter"])).toBe(
      "Public institutions matter",
    );
  });

  it("groups matches by page and respects matching options", () => {
    const pages = ["Public public publication", "A public square", "Private"];
    expect(findSearchResults(pages, "public", false, false)).toMatchObject([
      { page: 1, count: 3 },
      { page: 2, count: 1 },
    ]);
    expect(findSearchResults(pages, "public", true, true)).toMatchObject([
      { page: 1, count: 1 },
      { page: 2, count: 1 },
    ]);
  });

  it("creates concise snippets around a match", () => {
    const text = `${"Before ".repeat(30)}needle ${"after ".repeat(30)}`;
    const snippet = createPageSnippet(text, text.indexOf("needle"), 6, 20);
    expect(snippet).toContain("needle");
    expect(snippet.startsWith("…")).toBe(true);
    expect(snippet.endsWith("…")).toBe(true);
  });

  it("removes the repeated reader header from bookmark snippets", () => {
    expect(
      createBookmarkSnippet(
        "READ ROOM 01 03 Signals of confidence Section 02 Useful reading text",
        3,
      ),
    ).toBe("Signals of confidence Section 02 Useful reading text");
    expect(createBookmarkSnippet("", 4)).toBe("Page 4");
  });
});
