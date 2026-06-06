import { AdminSettingsNav } from "@/components/admin/admin-settings-nav";

export default function AdminSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure marketplace connections, AI services, and core system
          infrastructure.
        </p>
      </div>

      <AdminSettingsNav />

      {children}
    </div>
  );
}
