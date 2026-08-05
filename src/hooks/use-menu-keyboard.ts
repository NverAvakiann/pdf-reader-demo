import { useEffect, useRef, type KeyboardEvent } from "react";

export function useMenuKeyboard(onClose: () => void, active = true) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    menuRef.current
      ?.querySelector<HTMLButtonElement>(
        '[role^="menuitem"]:not(:disabled), [role="menuitem"]:not(:disabled)',
      )
      ?.focus();
  }, [active]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role^="menuitem"]:not(:disabled), [role="menuitem"]:not(:disabled)',
      ) ?? [],
    );
    if (!items.length) return;
    event.preventDefault();
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : (Math.max(currentIndex, 0) +
              (event.key === "ArrowDown" ? 1 : -1) +
              items.length) %
            items.length;
    items[nextIndex].focus();
  }

  return { menuRef, onKeyDown };
}
