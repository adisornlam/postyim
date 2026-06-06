"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { Menu } from "@base-ui/react/menu";

import { Button } from "@/components/ui/button";
import type { AdminSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

function getInitials(name: string, email: string) {
  const source = name.trim() || email.trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function AdminProfileMenu({ session }: { session: AdminSession }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const initials = getInitials(session.name, session.email);

  async function handleSignOut() {
    setSigningOut(true);

    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors",
          "hover:bg-muted focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        )}
        aria-label="Open profile menu"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initials}
        </span>
        <span className="hidden max-w-[160px] truncate sm:inline">
          {session.name}
        </span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={8}>
          <Menu.Popup
            className={cn(
              "z-50 min-w-56 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg",
              "origin-[var(--transform-origin)] transition-[transform,scale,opacity]",
              "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
              "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            )}
          >
            <div className="border-b border-border px-3 py-2.5">
              <p className="truncate text-sm font-medium">{session.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {session.email}
              </p>
              <p className="mt-1 text-xs capitalize text-muted-foreground">
                {session.role}
              </p>
            </div>

            <Menu.Item
              render={
                <Link
                  href="/admin/account"
                  className="flex w-full cursor-default items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-muted"
                />
              }
            >
              <UserRound className="size-4 text-muted-foreground" aria-hidden />
              Account & password
            </Menu.Item>

            <Menu.Item
              disabled={signingOut}
              onClick={handleSignOut}
              className="flex w-full cursor-default items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-muted disabled:opacity-50"
            >
              <LogOut className="size-4 text-muted-foreground" aria-hidden />
              {signingOut ? "Signing out..." : "Sign out"}
            </Menu.Item>

            <div className="border-t border-border px-3 py-2">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserRound className="size-3.5" aria-hidden />
                Postyim Admin
              </p>
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
