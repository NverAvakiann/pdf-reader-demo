import type { TextAnnotation } from "../../lib/reading-state";

export type SelectionAnchor = {
  page: number;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  prefix: string;
  suffix: string;
  left: number;
  top: number;
};

export type OpenAnnotation = {
  annotation: TextAnnotation;
  left: number;
  top: number;
  source: "direct" | "sidebar";
};
