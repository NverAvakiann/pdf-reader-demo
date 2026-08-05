import type { TextAnnotation } from "../../lib/reading-state";

export function textNodesFor(root: Node) {
  const nodes: Text[] = [];
  const walker = window.document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    nodes.push(node as Text);
    node = walker.nextNode();
  }
  return nodes;
}

export function layerText(root: Node) {
  const range = window.document.createRange();
  range.selectNodeContents(root);
  return range.toString();
}

export function textOffsetWithin(root: Node, node: Node, offset: number) {
  const range = window.document.createRange();
  range.selectNodeContents(root);
  try {
    range.setEnd(node, offset);
    return range.toString().length;
  } catch {
    return 0;
  }
}

function pointAtOffset(nodes: Text[], offset: number) {
  if (offset < 0) return null;
  let remaining = offset;
  for (const node of nodes) {
    const length = node.data.length;
    if (remaining <= length) return { node, offset: remaining };
    remaining -= length;
  }
  return remaining === 0 && nodes.length
    ? { node: nodes.at(-1) as Text, offset: nodes.at(-1)?.data.length ?? 0 }
    : null;
}

function resolveOffsets(text: string, annotation: TextAnnotation) {
  const direct = text.slice(annotation.startOffset, annotation.endOffset);
  if (direct === annotation.selectedText) {
    return { start: annotation.startOffset, end: annotation.endOffset };
  }

  const candidates: number[] = [];
  let from = 0;
  while (from <= text.length) {
    const index = text.indexOf(annotation.selectedText, from);
    if (index < 0) break;
    candidates.push(index);
    from = index + Math.max(annotation.selectedText.length, 1);
  }
  if (!candidates.length) return null;

  const scored = candidates.map((start) => {
    const prefix = annotation.prefix ?? "";
    const suffix = annotation.suffix ?? "";
    const prefixMatch =
      !prefix || text.slice(Math.max(0, start - prefix.length), start) === prefix;
    const end = start + annotation.selectedText.length;
    const suffixMatch = !suffix || text.slice(end, end + suffix.length) === suffix;
    const distance = Math.abs(start - annotation.startOffset);
    return {
      start,
      end,
      score: Number(prefixMatch) + Number(suffixMatch),
      distance,
    };
  });
  scored.sort((a, b) => b.score - a.score || a.distance - b.distance);
  return { start: scored[0].start, end: scored[0].end };
}

export function rangeForAnnotation(
  container: HTMLElement,
  annotation: TextAnnotation,
) {
  const page = container.querySelector<HTMLElement>(
    `.page[data-page-number="${annotation.page}"]`,
  );
  const textLayer = page?.querySelector<HTMLElement>(".textLayer");
  if (!textLayer) return null;
  const nodes = textNodesFor(textLayer);
  const offsets = resolveOffsets(layerText(textLayer), annotation);
  if (!offsets) return null;
  const start = pointAtOffset(nodes, offsets.start);
  const end = pointAtOffset(nodes, offsets.end);
  if (!start || !end) return null;
  const range = window.document.createRange();
  try {
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    return range.collapsed ? null : range;
  } catch {
    return null;
  }
}

export function annotationAtPoint(
  container: HTMLElement,
  annotations: TextAnnotation[],
  clientX: number,
  clientY: number,
) {
  const documentWithCaret = document as Document & {
    caretPositionFromPoint?: (
      x: number,
      y: number,
    ) => { offsetNode: Node; offset: number } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  const caretPosition = documentWithCaret.caretPositionFromPoint?.(
    clientX,
    clientY,
  );
  const fallbackRange = caretPosition
    ? null
    : documentWithCaret.caretRangeFromPoint?.(clientX, clientY);
  const node = caretPosition?.offsetNode ?? fallbackRange?.startContainer;
  const nodeOffset = caretPosition?.offset ?? fallbackRange?.startOffset;
  if (!node || nodeOffset === undefined) return null;
  const element =
    node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  const textLayer = element?.closest<HTMLElement>(".textLayer");
  if (!textLayer || !container.contains(textLayer)) return null;
  const page = Number(
    textLayer.closest<HTMLElement>(".page")?.dataset.pageNumber,
  );
  if (!page) return null;
  const offset = textOffsetWithin(textLayer, node, nodeOffset);

  return (
    annotations.find((annotation) => {
      if (annotation.page !== page) return false;
      const range = rangeForAnnotation(container, annotation);
      if (!range) return false;
      const start = textOffsetWithin(
        textLayer,
        range.startContainer,
        range.startOffset,
      );
      const end = textOffsetWithin(
        textLayer,
        range.endContainer,
        range.endOffset,
      );
      return offset >= start && offset <= end;
    }) ?? null
  );
}
