import { describe, expect, it, vi } from "vitest";
import { loadDocumentContents } from "./pdf-outline";

describe("document contents", () => {
  it("uses authored contents when the PDF has no outline", async () => {
    const document = {
      getOutline: vi.fn().mockResolvedValue(null),
    };
    await expect(
      loadDocumentContents(document as never, [{ title: "Overview", page: 1 }]),
    ).resolves.toEqual([
      {
        id: "manifest-0",
        title: "Overview",
        page: 1,
        children: [],
      },
    ]);
  });

  it("prefers and resolves an embedded outline", async () => {
    const document = {
      getOutline: vi.fn().mockResolvedValue([
        { title: "Chapter", dest: [{ num: 7 }, { name: "XYZ" }] },
      ]),
      getPageIndex: vi.fn().mockResolvedValue(4),
    };
    const contents = await loadDocumentContents(
      document as never,
      [{ title: "Fallback", page: 1 }],
    );
    expect(contents[0]).toMatchObject({ title: "Chapter", page: 5 });
  });
});

