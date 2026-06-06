import { AutomationSettingsForm } from "@/components/admin/automation-settings-form";
import { SettingSectionCard } from "@/components/admin/setting-section-card";
import { Button } from "@/components/ui/button";
import { getAdminSession } from "@/lib/auth/session";
import { getSystemSections } from "@/lib/admin/settings-status";
import { getAutomationSettingsSummary } from "@/lib/settings/runtime-config";
import Link from "next/link";

export default async function AdminSystemSettingsPage() {
  const session = await getAdminSession();
  const canEdit = session?.role === "superadmin";
  const sections = await getSystemSections();
  const automationSection = sections.find((section) => section.id === "automation");
  const otherSections = sections.filter((section) => section.id !== "automation");
  const automationSummary = await getAutomationSettingsSummary();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">System</h2>
          <p className="text-sm text-muted-foreground">
            Infrastructure bootstrap settings and encrypted automation secrets.
            Admin passwords remain per-user under Account.
          </p>
          {!canEdit ? (
            <p className="text-sm text-amber-800">
              Only superadmin accounts can update encrypted automation secrets.
            </p>
          ) : null}
        </div>
        <Button variant="outline" render={<Link href="/admin/account" />}>
          Account & password
        </Button>
      </div>

      {otherSections.map((section) => (
        <SettingSectionCard key={section.id} section={section} />
      ))}

      {automationSection ? (
        <SettingSectionCard section={automationSection}>
          {canEdit ? (
            <AutomationSettingsForm
              initial={{
                hasCronSecret: automationSummary.hasCronSecret,
              }}
            />
          ) : null}
        </SettingSectionCard>
      ) : null}
    </div>
  );
}
