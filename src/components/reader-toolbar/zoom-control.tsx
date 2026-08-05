import { Check, ChevronDown } from "lucide-react";
import type { ReaderPreferences } from "../../hooks/use-reader-preferences";
import { useMenuKeyboard } from "../../hooks/use-menu-keyboard";

const zoomOptions = [
  { label: "Actual size", value: "page-actual" },
  { label: "Page fit", value: "page-fit" },
  { label: "Page width", value: "page-width" },
  { label: "50%", value: "0.5" },
  { label: "75%", value: "0.75" },
  { label: "100%", value: "1" },
  { label: "125%", value: "1.25" },
  { label: "150%", value: "1.5" },
  { label: "200%", value: "2" },
  { label: "300%", value: "3" },
  { label: "400%", value: "4" },
];

export function ZoomControl({
  open,
  scale,
  ready,
  preferences,
  onToggle,
  onChange,
}: {
  open: boolean;
  scale: number;
  ready: boolean;
  preferences: ReaderPreferences;
  onToggle: () => void;
  onChange: (zoom: string) => void;
}) {
  const { menuRef, onKeyDown } = useMenuKeyboard(onToggle, open);
  const numericZoom = Number(preferences.zoom);
  const usesNumericZoom = Number.isFinite(numericZoom);

  return (
    <div className="reader-zoom-control relative hidden sm:block">
      <button
        type="button"
        onClick={onToggle}
        disabled={!ready}
        className="reader-zoom-trigger flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-bold tabular-nums text-white/85 hover:bg-white/10 disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-amber"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {Math.round(scale * 100)}%
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </button>
      {open && (
        <div
          ref={menuRef}
          className="zoom-menu"
          role="menu"
          aria-label="Zoom level"
          onKeyDown={onKeyDown}
        >
          <p className="zoom-menu-label">Fit page</p>
          <div className="zoom-fit-options">
            {zoomOptions.slice(0, 3).map((option) => {
              const selected = !usesNumericZoom && preferences.zoom === option.value;
              return (
                <button
                  type="button"
                  key={option.value}
                  role="menuitemradio"
                  aria-checked={selected}
                  className={`zoom-menu-item ${selected ? "is-selected" : ""}`}
                  onClick={() => onChange(option.value)}
                >
                  <span>{option.label}</span>
                  {selected && <Check className="size-4" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <div className="zoom-scale-options">
            <p className="zoom-menu-label">Scale</p>
            <div className="zoom-preset-grid">
              {zoomOptions.slice(3).map((option) => {
                const selected =
                  usesNumericZoom &&
                  Math.abs(Number(option.value) - scale) < 0.01;
                return (
                  <button
                    type="button"
                    key={option.value}
                    role="menuitemradio"
                    aria-checked={selected}
                    className={`zoom-menu-item ${selected ? "is-selected" : ""}`}
                    onClick={() => onChange(option.value)}
                  >
                    <span>{option.label}</span>
                    {selected && (
                      <Check className="size-3.5" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
