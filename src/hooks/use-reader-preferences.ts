import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark";
export type ToolPreference = "select" | "hand";
export type ScrollPreference = "vertical" | "horizontal" | "wrapped";
export type SpreadPreference = "single" | "dual" | "cover";
export type SidebarTabPreference = "thumbnails" | "contents" | "search" | "bookmarks";

export type ReaderPreferences = {
  theme: ThemePreference;
  tool: ToolPreference;
  scroll: ScrollPreference;
  spread: SpreadPreference;
  zoom: string;
  sidebarOpen: boolean;
  sidebarTab: SidebarTabPreference;
};

const storageKey = "read-room-reader-preferences";
const legacyStorageKey = "folio-reader-preferences";
const defaults: ReaderPreferences = {
  theme: "light",
  tool: "select",
  scroll: "vertical",
  spread: "single",
  zoom: "1",
  sidebarOpen: true,
  sidebarTab: "thumbnails",
};

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === "string" && options.includes(value as T);
}

function sanitizePreferences(value: unknown): Partial<ReaderPreferences> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const candidate = value as Record<string, unknown>;
  const preferences: Partial<ReaderPreferences> = {};

  if (isOneOf(candidate.theme, ["light", "dark"])) preferences.theme = candidate.theme;
  if (isOneOf(candidate.tool, ["select", "hand"])) preferences.tool = candidate.tool;
  if (isOneOf(candidate.scroll, ["vertical", "horizontal", "wrapped"])) {
    preferences.scroll = candidate.scroll;
  }
  if (isOneOf(candidate.spread, ["single", "dual", "cover"])) {
    preferences.spread = candidate.spread;
  }
  if (
    typeof candidate.zoom === "string" &&
    (["page-actual", "page-fit", "page-width"].includes(candidate.zoom) ||
      (Number.isFinite(Number(candidate.zoom)) &&
        Number(candidate.zoom) >= 0.5 &&
        Number(candidate.zoom) <= 4))
  ) {
    preferences.zoom = candidate.zoom;
  }
  if (typeof candidate.sidebarOpen === "boolean") {
    preferences.sidebarOpen = candidate.sidebarOpen;
  }
  if (
    isOneOf(candidate.sidebarTab, [
      "thumbnails",
      "contents",
      "search",
      "bookmarks",
    ])
  ) {
    preferences.sidebarTab = candidate.sidebarTab;
  }

  return preferences;
}

function readStoredPreferences(): ReaderPreferences {
  try {
    const stored = localStorage.getItem(storageKey) ?? localStorage.getItem(legacyStorageKey);
    const responsiveDefaults = {
      ...defaults,
      sidebarOpen: window.innerWidth >= 768,
    };
    if (!stored) return responsiveDefaults;

    const storedPreferences = sanitizePreferences(JSON.parse(stored));

    if (storedPreferences.zoom === "page-width") storedPreferences.zoom = "1";

    return { ...responsiveDefaults, ...storedPreferences };
  } catch {
    return { ...defaults, sidebarOpen: window.innerWidth >= 768 };
  }
}

export function useReaderPreferences() {
  const [preferences, setPreferences] = useState<ReaderPreferences>(readStoredPreferences);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(preferences));
      localStorage.removeItem(legacyStorageKey);
    } catch {}
  }, [preferences]);

  const updatePreference = useCallback(
    <K extends keyof ReaderPreferences>(key: K, value: ReaderPreferences[K]) => {
      setPreferences((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  return { preferences, updatePreference };
}
