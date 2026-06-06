import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getAdminSession } from "@/lib/auth/session";

const ADMIN_LOGIN_IMAGE =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1800&q=80";

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  if (session) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <div className="relative hidden min-h-screen overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ADMIN_LOGIN_IMAGE}
          alt="Modern editorial workspace with desk and natural light"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/45 to-slate-900/20" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
              Postyim
            </p>
            <h2 className="mt-4 max-w-md font-[family-name:var(--font-display)] text-4xl font-bold leading-tight">
              Editorial control for affiliate reviews
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80">
              Manage campaigns, approve AI drafts, and publish SEO-ready product
              reviews from one secure dashboard.
            </p>
          </div>
          <p className="text-xs text-white/60">
            Hands-on editorial workflow with quality gates before publish.
          </p>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground lg:hidden">
              Postyim Admin
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              Use your admin email and password to access the editorial dashboard.
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
    </div>
  );
}
