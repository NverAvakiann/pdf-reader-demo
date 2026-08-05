import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Read Room", () => {
  test("loads authored contents for every paper", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Collection-wide reader check");
    const papers = [
      ["digital-trust", "A new public square"],
      ["civic-data", "What a dataset remembers"],
      ["energy-transition", "The coordination problem"],
      ["modern-city", "A city within reach"],
      ["networks-of-care", "Care as infrastructure"],
    ] as const;

    for (const [id, section] of papers) {
      await page.goto(`/reader/${id}`);
      await expect(page.getByText("/ 16")).toBeVisible({ timeout: 15_000 });
      await page.getByRole("tab", { name: "Contents" }).click();
      await expect(page.getByRole("treeitem").filter({ hasText: section })).toBeVisible();
    }
  });

  test("creates and restores a text-anchored private note", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Desktop annotation flow");
    await page.goto("/reader/digital-trust");
    await expect(page.getByText("/ 16")).toBeVisible({ timeout: 15_000 });
    const firstTextLayer = page.locator(".pdfViewer .page").first().locator(".textLayer");
    await expect(firstTextLayer).toBeVisible();

    await firstTextLayer.evaluate((layer) => {
      const span = [...layer.querySelectorAll("span")].find(
        (candidate) => (candidate.textContent?.trim().length ?? 0) >= 8,
      );
      const node = span?.firstChild;
      if (!node?.textContent) throw new Error("No selectable PDF text was rendered");
      const range = document.createRange();
      range.setStart(node, 0);
      range.setEnd(node, Math.min(node.textContent.length, 12));
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      layer.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    });

    await page.getByRole("button", { name: "Add note" }).click();
    await expect(page.getByRole("heading", { name: "Add a note" })).toBeVisible();
    await page.getByLabel("Private note").fill("Useful framing for the introduction.");
    await page.getByRole("button", { name: "Save note" }).click();

    await expect(page.getByRole("tab", { name: "Saved" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByText("Useful framing for the introduction.")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              CSS as unknown as {
                highlights?: { has: (name: string) => boolean };
              }
            ).highlights?.has("read-room-annotations") ?? false,
        ),
      )
      .toBe(true);
    const annotatedText = firstTextLayer.locator("span").filter({
      hasText: "READ ROOM 01",
    });
    await annotatedText.click();
    const notePopover = page.getByRole("note", {
      name: "Private note on page 1",
    });
    await expect(notePopover).toContainText("Useful framing for the introduction.");
    await expect(notePopover).not.toContainText("READ ROOM 01");
    await page.mouse.click(5, 5);
    await expect(notePopover).toHaveCount(0);
    await page.evaluate(() => {
      const key = "read-room-document-state";
      const store = JSON.parse(localStorage.getItem(key) ?? "{}");
      store.documents["digital-trust"].annotations.push({
        id: "heading-annotation",
        page: 4,
        selectedText: "The limits of measurement",
        startOffset: 999_999,
        endOffset: 1_000_024,
        note: "Heading note opens from the sidebar.",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      localStorage.setItem(key, JSON.stringify(store));
    });

    await page.reload();
    await expect(page.getByText("/ 16")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("tab", { name: "Saved" }).click();
    await expect(page.getByText("Useful framing for the introduction.")).toBeVisible();
    await page
      .getByRole("button", { name: "Heading note opens from the sidebar." })
      .click();
    await expect(page.getByLabel("Page number")).toHaveValue("4");
    await expect(
      page.getByRole("note", { name: "Private note on page 4" }),
    ).toContainText("Heading note opens from the sidebar.");
    await page.getByLabel("Page number").click();
    await page
      .getByRole("button", { name: "Useful framing for the introduction." })
      .click();
    await expect(page.getByLabel("Page number")).toHaveValue("1");
    await expect(
      page.getByRole("note", { name: "Private note on page 1" }),
    ).toContainText("Useful framing for the introduction.");
    await page.getByLabel("Page number").click();
    await page.getByLabel("Edit note on page 1").click();
    await page.getByLabel("Edit note", { exact: true }).fill("Updated local note.");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Updated local note.")).toBeVisible();
  });

  test("opens a paper and exercises the core reader", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Desktop reader flow");
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await page.goto("/");
    await expect(page).toHaveTitle(/Read Room/);
    await expect(page.getByRole("heading", { name: "Keep the paper in view." })).toBeVisible();
    await expect(page.locator("article")).toHaveCount(5);
    await expect
      .poll(() => page.locator("article canvas").first().evaluate((canvas) => canvas.width))
      .toBeGreaterThan(300);
    const libraryAccessibility = await new AxeBuilder({ page }).analyze();
    expect(libraryAccessibility.violations).toEqual([]);
    await page.screenshot({
      path: testInfo.outputPath("library-desktop.png"),
      fullPage: true,
    });

    await page.getByRole("link", { name: /Open Public Institutions and Digital Trust/ }).click();
    await expect(page).toHaveURL(/reader\/digital-trust/);
    await expect(page.getByLabel("Page number")).toHaveValue("1");
    await expect(page.getByText("/ 16")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".pdfViewer .page").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "100%" })).toBeVisible();
    await expect(page.locator(".reader-sidebar")).toHaveCSS("background-color", "rgb(238, 241, 243)");
    await expect(page.locator(".reader-header")).toHaveCSS("height", "84px");
    await expect(page.getByText("Five papers")).toHaveCount(0);
    await expect(page.locator(".reader-toolbar")).toHaveCSS("height", "48px");
    await expect(page.locator(".reader-toolbar")).toHaveCSS("background-color", "rgb(244, 246, 247)");
    const printButton = page.getByLabel("Print selected pages");
    await printButton.hover();
    await expect(printButton).toHaveCSS("border-radius", "8px");
    await expect(printButton).toHaveCSS("width", "36px");
    await expect(printButton).toHaveCSS("height", "36px");

    await page.getByRole("button", { name: "100%" }).click();
    const zoomMenu = page.getByRole("menu", { name: "Zoom level" });
    await expect(zoomMenu).toBeVisible();
    await expect(zoomMenu).toHaveCSS("border-radius", "12px");
    await expect(zoomMenu).toHaveCSS("background-color", "rgb(249, 250, 249)");
    expect(await zoomMenu.evaluate((menu) => menu.getBoundingClientRect().height)).toBeLessThan(400);
    await expect(zoomMenu.getByRole("menuitemradio", { name: "100%" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await page.screenshot({
      path: testInfo.outputPath("zoom-popover-desktop.png"),
      fullPage: false,
    });
    await page.locator(".reader-stage").click({ position: { x: 8, y: 8 } });
    await expect(zoomMenu).toHaveCount(0);

    const paperSelector = page.locator('.reader-header button[aria-haspopup="listbox"]:visible');
    await paperSelector.click();
    const paperOptions = page.getByRole("listbox", { name: "Choose another PDF" });
    await expect(paperOptions).toBeVisible();
    const selectorMetrics = await page.evaluate(() => {
      const trigger = document.querySelector<HTMLElement>(
        '.reader-header button[aria-haspopup="listbox"]:not([style*="display: none"])',
      );
      const options = document.querySelector<HTMLElement>(".document-switcher");
      const triggerBounds = trigger?.getBoundingClientRect();
      return {
        trigger: triggerBounds?.width ?? 0,
        triggerCenter: triggerBounds ? triggerBounds.left + triggerBounds.width / 2 : 0,
        options: options?.getBoundingClientRect().width ?? 0,
        viewportCenter: window.innerWidth / 2,
      };
    });
    expect(Math.abs(selectorMetrics.trigger - selectorMetrics.options)).toBeLessThanOrEqual(1);
    expect(Math.abs(selectorMetrics.triggerCenter - selectorMetrics.viewportCenter)).toBeLessThanOrEqual(1);
    expect(selectorMetrics.trigger).toBeLessThanOrEqual(440);
    await page.keyboard.press("Escape");

    const readerAccessibility = await new AxeBuilder({ page }).analyze();
    expect(readerAccessibility.violations).toEqual([]);

    await page.getByRole("tab", { name: "Contents" }).click();
    await expect(page.getByRole("treeitem").filter({ hasText: "Overview" })).toBeVisible();
    await page.getByRole("treeitem").filter({ hasText: "Signals of confidence" }).getByRole("button").click();
    await expect(page.getByLabel("Page number")).toHaveValue("3");

    await page.getByLabel("Bookmark page 3").click();
    await page.getByRole("tab", { name: "Saved" }).click();
    await expect(page.getByRole("button", { name: /Page 3/ })).toBeVisible();

    await page.getByLabel("Search PDF").click();
    const searchInput = page.getByLabel("Find in paper");
    await expect(searchInput).toHaveCSS("border-radius", "8px");
    await searchInput.fill("pub");
    await expect(page.locator(".reader-sidebar")).toContainText(/[1-9]\d* matches? on/, { timeout: 10_000 });
    await expect(page.locator(".search-result-list > button").first()).toBeVisible();
    const searchControlsTop = await page.locator(".sidebar-search-controls").evaluate(
      (controls) => controls.getBoundingClientRect().top,
    );
    await expect
      .poll(() =>
        page.locator(".search-result-list").evaluate((list) => list.scrollHeight > list.clientHeight),
      )
      .toBe(true);
    await page.locator(".search-result-list").evaluate((list) => {
      list.scrollTop = list.scrollHeight;
    });
    await expect
      .poll(() =>
        page.locator(".sidebar-search-controls").evaluate(
          (controls) => controls.getBoundingClientRect().top,
        ),
      )
      .toBe(searchControlsTop);
    await page.getByText("Whole words", { exact: true }).click();
    await expect(page.locator(".reader-sidebar")).toContainText("0 matches on", { timeout: 10_000 });
    await page.getByRole("tab", { name: "Pages" }).click();

    await page.getByLabel("More reader options").click();
    const readerOptionsMenu = page.getByRole("menu", { name: "Reader options" });
    await expect(readerOptionsMenu).toHaveCSS(
      "background-color",
      "rgb(249, 250, 249)",
    );
    expect(await readerOptionsMenu.evaluate((menu) => menu.getBoundingClientRect().width)).toBeLessThanOrEqual(260);
    await expect(page.locator(".reader-navigation-group")).toHaveCSS("border-top-width", "0px");
    await expect(page.getByRole("menuitem", { name: "First page" })).toHaveCSS("min-height", "38px");
    await expect(page.getByRole("menuitem", { name: "First page" })).toHaveCSS("font-size", "14px");
    await expect(page.getByTestId("single-page-icon")).toHaveCSS("width", "18px");
    await expect(page.getByTestId("single-page-icon").locator("rect")).toHaveAttribute("rx", "2");
    await page.locator(".reader-stage").click({ position: { x: 8, y: 8 } });
    await expect(readerOptionsMenu).toHaveCount(0);

    await page.getByLabel("More reader options").click();
    await page.getByRole("menuitemcheckbox", { name: "Wrapped scrolling" }).click();
    await expect(page.locator(".pdfViewer")).toHaveClass(/scrollWrapped/);
    await page.getByRole("menuitemcheckbox", { name: "Dual page with cover" }).click();
    await expect(
      page.getByRole("menuitemcheckbox", { name: "Dual page with cover" }),
    ).toHaveAttribute("aria-checked", "true");
    await page.getByRole("menuitemcheckbox", { name: "Hand tool" }).click();
    await expect
      .poll(() =>
        page.locator(".textLayer span").first().evaluate((text) => getComputedStyle(text).cursor),
      )
      .toBe("grab");
    await page.getByLabel("More reader options").click();

    await page.getByLabel("Switch to dark theme").click();
    await expect(page.getByTestId("reader-shell")).toHaveClass(/theme-dark/);
    await expect(page.locator(".reader-sidebar")).toHaveCSS("background-color", "rgb(25, 30, 35)");
    await expect(page.locator(".reader-toolbar")).toHaveCSS("background-color", "rgb(46, 53, 60)");
    await page.getByRole("button", { name: "100%" }).click();
    await expect(zoomMenu).toHaveCSS("background-color", "rgb(53, 61, 69)");
    await zoomMenu.getByRole("menuitemradio", { name: "100%" }).click();

    await page.getByLabel("Full screen").click();
    await expect(page.locator(".reader-header")).toBeHidden();
    await expect(page.locator(".reader-toolbar")).toBeHidden();
    await expect(page.locator(".reader-sidebar")).toBeHidden();
    await expect(page.getByLabel("Exit full screen")).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("reader-fullscreen-desktop.png"),
      fullPage: false,
    });
    await page.getByLabel("Exit full screen").click();
    await expect(page.locator(".reader-header")).toBeVisible();
    await expect(page.locator(".reader-toolbar")).toBeVisible();

    await page.getByLabel("Full screen").click();
    await expect(page.getByLabel("Exit full screen")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByLabel("Exit full screen")).toHaveCount(0);
    await expect(page.locator(".reader-header")).toBeVisible();
    expect(await page.evaluate(() => document.fullscreenElement === null)).toBe(true);

    await page.reload();
    await expect(page.getByLabel("Page number")).toHaveValue("3", { timeout: 15_000 });
    await page.getByRole("tab", { name: "Saved" }).click();
    await expect(page.getByRole("button", { name: /Page 3/ })).toBeVisible();

    await page.screenshot({
      path: testInfo.outputPath("reader-dark-desktop.png"),
      fullPage: false,
    });

    await page.getByLabel("Download selected pages").click();
    const rangeDialog = page.locator("dialog.range-dialog");
    await expect(rangeDialog).toBeVisible();
    await page.mouse.click(8, 8);
    await expect(rangeDialog).toHaveCount(0);

    await page.getByLabel("Download selected pages").click();
    await expect(rangeDialog).toBeVisible();
    await expect(page.locator(".range-dialog-inner")).toHaveCSS(
      "background-color",
      "rgb(32, 37, 43)",
    );
    await expect(page.getByRole("button", { name: "Cancel" })).toHaveCSS(
      "background-color",
      "rgb(53, 61, 69)",
    );
    await expect(page.getByRole("button", { name: "Cancel" })).toHaveCSS(
      "color",
      "rgb(247, 247, 246)",
    );
    await expect(page.getByRole("button", { name: "Cancel" })).toHaveCSS(
      "border-top-width",
      "0px",
    );
    const downloadPagesButton = page.getByRole("button", { name: "Download pages" });
    await expect(downloadPagesButton).toBeDisabled();
    await expect(downloadPagesButton).toHaveCSS("background-color", "rgb(42, 48, 54)");
    const dialogMetrics = await rangeDialog.evaluate((dialog) => {
      const bounds = dialog.getBoundingClientRect();
      return {
        horizontalOffset: Math.abs(bounds.left + bounds.width / 2 - window.innerWidth / 2),
        verticalOffset: Math.abs(bounds.top + bounds.height / 2 - window.innerHeight / 2),
      };
    });
    expect(dialogMetrics.horizontalOffset).toBeLessThanOrEqual(1);
    expect(dialogMetrics.verticalOffset).toBeLessThanOrEqual(1);
    await expect(page.locator(".range-dialog-inner")).toHaveCSS("border-radius", "12px");
    await expect(page.getByTestId("modal-action-icon")).toHaveCSS("border-radius", "8px");
    const closeDialogButton = page.getByLabel("Close dialog");
    await closeDialogButton.hover();
    await expect(closeDialogButton).toHaveCSS("border-radius", "8px");
    await page.getByLabel("Page range").fill("17");
    await expect(downloadPagesButton).toBeDisabled();
    await expect(page.getByText("Choose pages between 1 and 16.")).toBeVisible();
    await page.getByLabel("Page range").fill("1-2");
    await expect(downloadPagesButton).toBeEnabled();
    const downloadPromise = page.waitForEvent("download");
    await downloadPagesButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("digital-trust-pages-1-2.pdf");

    await page.goto("/");
    await expect(page.getByRole("link", { name: /Read Public Institutions and Digital Trust/ })).toContainText(
      "Continue on page 3",
    );
    await page.getByRole("button", { name: "Start over" }).first().click();
    await expect(page.getByRole("link", { name: /Read Public Institutions and Digital Trust/ })).toContainText(
      "Read paper",
    );

    expect(consoleErrors).toEqual([]);
  });

  test("keeps the mobile reader usable", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Mobile reader flow");
    await page.goto("/reader/civic-data");
    await expect(page.getByText("/ 16")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".pdfViewer .page").first()).toBeVisible();
    await page.getByLabel("More reader options").click();
    await expect(page.getByRole("menuitem", { name: "Print selected pages" })).toBeVisible();
    await page.getByRole("menuitemcheckbox", { name: "Document navigation" }).click();
    await expect(page.locator(".reader-sidebar")).toHaveClass(/is-open/);
    await page.screenshot({
      path: testInfo.outputPath("reader-mobile-menu.png"),
      fullPage: false,
    });
    await page.getByLabel("More reader options").click();
    await page.getByRole("button", { name: "Close reader sidebar" }).last().click();
    await expect(page.locator(".reader-sidebar")).not.toHaveClass(/is-open/);
  });

  test("uses the compact reader chrome below 1024px", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "tablet", "Tablet reader flow");
    await page.goto("/reader/digital-trust");
    await expect(page.getByText("/ 16")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".pdfViewer .page").first()).toBeVisible();

    await expect(page.getByLabel("Choose another paper")).toBeVisible();
    await expect(page.getByLabel("Hide document navigation")).toBeHidden();
    await expect(page.getByLabel("Print selected pages")).toBeHidden();
    await expect(page.getByLabel("Zoom out")).toBeVisible();

    await page.getByLabel("Choose another paper").click();
    const documentSwitcher = page.getByRole("listbox", { name: "Choose another PDF" });
    await expect(documentSwitcher).toBeVisible();
    expect(
      await documentSwitcher.evaluate((switcher) => {
        const bounds = switcher.getBoundingClientRect();
        const topmostElement = document.elementFromPoint(bounds.left + 20, bounds.top + 20);
        return topmostElement ? switcher.contains(topmostElement) : false;
      }),
    ).toBe(true);
    await page.keyboard.press("Escape");

    await page.getByLabel("More reader options").click();
    await expect(page.getByRole("menuitemcheckbox", { name: "Document navigation" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.getByRole("menuitem", { name: "Print selected pages" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Switch to dark theme" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Full screen" })).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("reader-tablet-menu.png"),
      fullPage: false,
    });
  });
});
