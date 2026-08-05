import type {
  ReaderPreferences,
  ScrollPreference,
  SpreadPreference,
  ThemePreference,
  ToolPreference,
} from "../../hooks/use-reader-preferences";

export type ReaderToolbarProps = {
  page: number;
  pageCount: number;
  scale: number;
  ready: boolean;
  preferences: ReaderPreferences;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onZoomChange: (zoom: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSidebarToggle: () => void;
  onSearchOpen: () => void;
  onThemeChange: (theme: ThemePreference) => void;
  onToolChange: (tool: ToolPreference) => void;
  onScrollChange: (scroll: ScrollPreference) => void;
  onSpreadChange: (spread: SpreadPreference) => void;
  onRotate: (direction: "clockwise" | "counterclockwise") => void;
  onPrint: () => void;
  onDownload: () => void;
  onFullscreen: () => void;
};
