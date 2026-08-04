"use client";

import type { PlatformNavigationItem } from "@yosseuf/platform";

export function PlatformNavigation({ items, active, onNavigate }: {
  items: readonly PlatformNavigationItem[];
  active?: string;
  onNavigate: (item: PlatformNavigationItem) => void;
}) {
  return <nav aria-label="Platform modules" className="platform-navigation">
    {items.map((item) => <button key={item.id} type="button" aria-current={active === item.id ? "page" : undefined} onClick={() => onNavigate(item)}>
      {item.label}
    </button>)}
  </nav>;
}
