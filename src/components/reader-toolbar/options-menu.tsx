import {
  Check,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Download,
  Hand,
  LayoutGrid,
  Maximize,
  Moon,
  MousePointer2,
  PanelLeft,
  PanelsTopLeft,
  Printer,
  RotateCcw,
  RotateCw,
  Rows3,
  Square,
  Sun,
} from "lucide-react";
import type { ReaderToolbarProps } from "./types";
import { useMenuKeyboard } from "../../hooks/use-menu-keyboard";

function MenuItem({
  icon,
  label,
  checked,
  disabled = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  checked?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role={checked === undefined ? "menuitem" : "menuitemcheckbox"}
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className="overflow-menu-item"
    >
      <span className="grid size-6 shrink-0 place-items-center" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left">{label}</span>
      {checked && <Check className="size-4 shrink-0" aria-hidden="true" />}
    </button>
  );
}

export function OptionsMenu({
  page,
  pageCount,
  ready,
  preferences,
  onPageChange,
  onNextPage,
  onPreviousPage,
  onSidebarToggle,
  onThemeChange,
  onToolChange,
  onScrollChange,
  onSpreadChange,
  onRotate,
  onPrint,
  onDownload,
  onFullscreen,
  onClose,
}: ReaderToolbarProps & { onClose: () => void }) {
  const { menuRef, onKeyDown } = useMenuKeyboard(onClose);
  return (
    <div
      ref={menuRef}
      className="overflow-menu"
      role="menu"
      aria-label="Reader options"
      onKeyDown={onKeyDown}
    >
      <div className="lg:hidden">
        <MenuItem
          icon={<PanelLeft className="size-5" />}
          label="Document navigation"
          checked={preferences.sidebarOpen}
          onClick={onSidebarToggle}
        />
        <div className="overflow-menu-group">
          <MenuItem
            icon={<Printer className="size-5" />}
            label="Print selected pages"
            disabled={!ready}
            onClick={onPrint}
          />
          <MenuItem
            icon={<Download className="size-5" />}
            label="Download selected pages"
            disabled={!ready}
            onClick={onDownload}
          />
          <MenuItem
            icon={
              preferences.theme === "dark" ? (
                <Sun className="size-5" />
              ) : (
                <Moon className="size-5" />
              )
            }
            label={
              preferences.theme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
            onClick={() =>
              onThemeChange(preferences.theme === "dark" ? "light" : "dark")
            }
          />
          <MenuItem
            icon={<Maximize className="size-5" />}
            label="Full screen"
            onClick={onFullscreen}
          />
        </div>
      </div>

      <div className="overflow-menu-group reader-navigation-group">
        <MenuItem
          icon={<ChevronFirst className="size-5" />}
          label="First page"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
        />
        <MenuItem
          icon={<ChevronLeft className="size-5" />}
          label="Previous page"
          disabled={page <= 1}
          onClick={onPreviousPage}
        />
        <MenuItem
          icon={<ChevronRight className="size-5" />}
          label="Next page"
          disabled={page >= pageCount}
          onClick={onNextPage}
        />
        <MenuItem
          icon={<ChevronLast className="size-5" />}
          label="Last page"
          disabled={page >= pageCount}
          onClick={() => onPageChange(pageCount)}
        />
      </div>

      <div className="overflow-menu-group">
        <MenuItem
          icon={<RotateCw className="size-5" />}
          label="Rotate clockwise"
          onClick={() => onRotate("clockwise")}
        />
        <MenuItem
          icon={<RotateCcw className="size-5" />}
          label="Rotate counterclockwise"
          onClick={() => onRotate("counterclockwise")}
        />
      </div>

      <div className="overflow-menu-group">
        <MenuItem
          icon={<MousePointer2 className="size-5" />}
          label="Text selection tool"
          checked={preferences.tool === "select"}
          onClick={() => onToolChange("select")}
        />
        <MenuItem
          icon={<Hand className="size-5" />}
          label="Hand tool"
          checked={preferences.tool === "hand"}
          onClick={() => onToolChange("hand")}
        />
      </div>

      <div className="overflow-menu-group">
        <MenuItem
          icon={<Rows3 className="size-5" />}
          label="Vertical scrolling"
          checked={preferences.scroll === "vertical"}
          onClick={() => onScrollChange("vertical")}
        />
        <MenuItem
          icon={<Columns2 className="size-5" />}
          label="Horizontal scrolling"
          checked={preferences.scroll === "horizontal"}
          onClick={() => onScrollChange("horizontal")}
        />
        <MenuItem
          icon={<LayoutGrid className="size-5" />}
          label="Wrapped scrolling"
          checked={preferences.scroll === "wrapped"}
          onClick={() => onScrollChange("wrapped")}
        />
      </div>

      <div className="overflow-menu-group">
        <MenuItem
          icon={<Square className="size-5" data-testid="single-page-icon" />}
          label="Single page"
          checked={preferences.spread === "single"}
          onClick={() => onSpreadChange("single")}
        />
        <MenuItem
          icon={<Columns2 className="size-5" />}
          label="Dual page"
          checked={preferences.spread === "dual"}
          onClick={() => onSpreadChange("dual")}
        />
        <MenuItem
          icon={<PanelsTopLeft className="size-5" />}
          label="Dual page with cover"
          checked={preferences.spread === "cover"}
          onClick={() => onSpreadChange("cover")}
        />
      </div>
    </div>
  );
}
