import { describe, expect, it } from "vitest";
import {
  normalizeReadingState,
  updateDocumentState,
  type DocumentReadingState,
} from "./reading-state";

const state: DocumentReadingState = {
  page: 12,
  pageCount: 16,
  updatedAt: 10,
  completed: false,
  bookmarks: [
    { page: 12, snippet: "Twelve", createdAt: 2 },
    { page: 3, snippet: "Three", createdAt: 1 },
    { page: 12, snippet: "Duplicate", createdAt: 3 },
    { page: 20, snippet: "Gone", createdAt: 4 },
  ],
  annotations: [
    {
      id: "later",
      page: 5,
      selectedText: "Later passage",
      startOffset: 20,
      endOffset: 33,
      note: "Second",
      createdAt: 2,
      updatedAt: 2,
    },
    {
      id: "first",
      page: 3,
      selectedText: "First passage",
      startOffset: 4,
      endOffset: 17,
      note: "First",
      createdAt: 1,
      updatedAt: 1,
    },
    {
      id: "invalid-page",
      page: 20,
      selectedText: "Gone",
      startOffset: 0,
      endOffset: 4,
      note: "Outside the replacement PDF",
      createdAt: 3,
      updatedAt: 3,
    },
    {
      id: "invalid-range",
      page: 2,
      selectedText: "Collapsed",
      startOffset: 8,
      endOffset: 8,
      note: "Invalid",
      createdAt: 4,
      updatedAt: 4,
    },
  ],
};

describe("reading state", () => {
  it("clamps progress and cleans invalid or duplicate bookmarks", () => {
    expect(normalizeReadingState(state, 8)).toMatchObject({
      page: 8,
      pageCount: 8,
      completed: true,
      bookmarks: [{ page: 3, snippet: "Three" }],
      annotations: [
        expect.objectContaining({ id: "first", page: 3 }),
        expect.objectContaining({ id: "later", page: 5 }),
      ],
    });
  });

  it("updates one document without replacing the rest of the store", () => {
    const result = updateDocumentState(
      { version: 1, documents: { first: state } },
      "second",
      (current) => ({ ...current, page: 2 }),
    );
    expect(result.documents.first).toBe(state);
    expect(result.documents.second.page).toBe(2);
  });
});
