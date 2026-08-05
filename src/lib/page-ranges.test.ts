import { describe, expect, it } from "vitest";
import { parsePageRanges } from "./page-ranges";

describe("page range parsing", () => {
  it("normalizes ranges and removes duplicate pages", () => {
    expect(parsePageRanges("1,1,2-3", 40)).toEqual({
      ok: true,
      pages: [1, 2, 3],
      normalized: "1-3",
    });
  });

  it("rejects malformed and descending ranges", () => {
    expect(parsePageRanges("1--3", 20)).toMatchObject({ ok: false });
    expect(parsePageRanges("4-2", 50)).toMatchObject({
      ok: false,
      message: "Range 4-2 must run from a lower page to a higher page.",
    });
  });

  it("rejects out of bounds pages", () => {
    expect(parsePageRanges("0", 20)).toMatchObject({ ok: false });
    expect(parsePageRanges("21", 20)).toMatchObject({ ok: false });
  });

  it("allows any number of pages within the document", () => {
    expect(parsePageRanges("1-20", 20)).toEqual({
      ok: true,
      pages: Array.from({ length: 20 }, (_, index) => index + 1),
      normalized: "1-20",
    });
  });
});
