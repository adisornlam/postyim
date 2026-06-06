"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Menu, X } from "lucide-react";

import { AdminProfileMenu } from "@/components/admin/admin-profile-menu";
import { Button } from "@/components/ui/button";
import type { AdminSession } from "@/lib/auth/session";
import {
  adminNavGroups,
  getAdminPageTitle,
  isAdminNavItemActive,
} from "@/lib/admin/nav";
import { cn } from "@/lib/utils";

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {adminNavGroups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/55">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isAdminNavItemActive(
                pathname,
                item.href,
                item.exact,
              );
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({
  session,
  children,
}: {
  session: AdminSession;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/20">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <div>
            <Link
              href="/admin"
              className="text-base font-semibold tracking-tight"
              onClick={() => setMobileOpen(false)}
            >
              Postyim
            </Link>
            <p className="text-xs text-sidebar-foreground/60">Admin Console</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="size-4" />
          </Button>
        </div>

        <SidebarNav
          pathname={pathname}
          onNavigate={() => setMobileOpen(false)}
        />

        <div className="border-t border-sidebar-border p-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
          >
            <ExternalLink className="size-4" aria-hidden />
            View public site
          </Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="size-4" />
            </Button>
            <p className="text-sm font-medium text-muted-foreground">
              {getAdminPageTitle(pathname)}
            </p>
          </div>

          <AdminProfileMenu session={session} />
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
