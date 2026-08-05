import { Bookmark, BookOpen, Image, Search } from "lucide-react";
import { useRef } from "react";
import type { KeyboardEvent } from "react";
import type { SidebarTabPreference } from "../../hooks/use-reader-preferences";

export const sidebarTabs: Array<{
  id: SidebarTabPreference;
  label: string;
  icon: typeof Image;
  iconClassName?: string;
}> = [
  { id: "thumbnails", label: "Pages", icon: Image },
  {
    id: "contents",
    label: "Contents",
    icon: BookOpen,
    iconClassName: "size-[14px]",
  },
  { id: "search", label: "Search", icon: Search },
  { id: "bookmarks", label: "Saved", icon: Bookmark },
];

export function SidebarTabs({
  activeTab,
  onChange,
}: {
  activeTab: SidebarTabPreference;
  onChange: (tab: SidebarTabPreference) => void;
}) {
  const tablistRef = useRef<HTMLDivElement>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = sidebarTabs.findIndex((tab) => tab.id === activeTab);
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? sidebarTabs.length - 1
          : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + sidebarTabs.length) %
            sidebarTabs.length;
    const next = sidebarTabs[nextIndex];
    onChange(next.id);
    window.requestAnimationFrame(() => {
      tablistRef.current
        ?.querySelector<HTMLButtonElement>(`#sidebar-tab-${next.id}`)
        ?.focus();
    });
  }

  return (
    <div
      ref={tablistRef}
      className="reader-sidebar-tabs"
      role="tablist"
      aria-label="Document navigation views"
      onKeyDown={handleKeyDown}
    >
      {sidebarTabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <button
            id={`sidebar-tab-${tab.id}`}
            key={tab.id}
            type="button"
            role="tab"
            tabIndex={active ? 0 : -1}
            aria-selected={active}
            aria-controls={`sidebar-panel-${tab.id}`}
            className={active ? "is-active" : ""}
            onClick={() => onChange(tab.id)}
          >
            <Icon
              className={`${tab.iconClassName ?? "size-3"} shrink-0`}
              aria-hidden="true"
            />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
