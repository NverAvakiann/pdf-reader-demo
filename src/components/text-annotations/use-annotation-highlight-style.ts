import { useEffect } from "react";

const styleSelector = "style[data-read-room-annotations]";

export function useAnnotationHighlightStyle() {
  useEffect(() => {
    if (document.head.querySelector(styleSelector)) return;
    const style = document.createElement("style");
    style.dataset.readRoomAnnotations = "true";
    style.textContent =
      "::highlight(read-room-annotations) { background-color: rgba(240, 189, 44, 0.56); color: inherit; }";
    document.head.append(style);
    return () => style.remove();
  }, []);
}
