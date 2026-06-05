import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminSignOutButton } from "@/components/admin/admin-sign-out-button";
import { getAdminSession } from "@/lib/auth/session";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await getAdminSession();

  if (!authenticated) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-lg font-semibold">Postyim Admin</p>
            <p className="text-sm text-muted-foreground">
              Editorial control panel
            </p>
          </div>
          <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
            <nav className="flex flex-wrap justify-end gap-4 text-sm">
              <Link href="/admin" className="hover:underline">
                Dashboard
              </Link>
              <Link href="/admin/reviews" className="hover:underline">
                Reviews
              </Link>
              <Link href="/admin/products" className="hover:underline">
                Products
              </Link>
              <Link href="/admin/campaigns" className="hover:underline">
                Campaigns
              </Link>
              <Link href="/admin/jobs" className="hover:underline">
                Jobs
              </Link>
            </nav>
            <AdminSignOutButton />
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}
