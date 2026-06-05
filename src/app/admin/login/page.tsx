import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getAdminSession } from "@/lib/auth/session";

export default async function AdminLoginPage() {
  const authenticated = await getAdminSession();

  if (authenticated) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-background p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Admin Login</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage campaigns, reviews, and publishing.
          </p>
        </div>
        <AdminLoginForm />
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">
            Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
