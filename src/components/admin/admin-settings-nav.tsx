"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const settingsTabs = [
  {
    href: "/admin/settings/integrations",
    label: "Integrations",
    description: "Marketplace & AI",
  },
  {
    href: "/admin/settings/system",
    label: "System",
    description: "Infrastructure & site",
  },
];

export function AdminSettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 rounded-xl border bg-muted/40 p-1">
      {settingsTabs.map((tab) => {
        const active = pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex min-w-[140px] flex-1 flex-col rounded-lg px-4 py-2.5 transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
            )}
          >
            <span className="text-sm font-medium">{tab.label}</span>
            <span className="text-xs">{tab.description}</span>
          </Link>
        );
      })}
    </nav>
  );
}
