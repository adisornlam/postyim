import { AmazonIntegrationForm } from "@/components/admin/amazon-integration-form";
import { GeminiIntegrationForm } from "@/components/admin/gemini-integration-form";
import { SettingSectionCard } from "@/components/admin/setting-section-card";
import { getAdminSession } from "@/lib/auth/session";
import { getIntegrationSections } from "@/lib/admin/settings-status";
import {
  getAmazonSettingsSummary,
  getGeminiSettingsSummary,
} from "@/lib/settings/runtime-config";

export default async function AdminIntegrationsSettingsPage() {
  const session = await getAdminSession();
  const canEdit = session?.role === "superadmin";
  const sections = await getIntegrationSections();
  const [amazonSection, geminiSection] = sections;
  const [amazonSummary, geminiSummary] = await Promise.all([
    getAmazonSettingsSummary(),
    getGeminiSettingsSummary(),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Connect marketplace and AI services here. Secrets are encrypted in the
          database and take effect immediately without rebuilding the app.
        </p>
        {!canEdit ? (
          <p className="text-sm text-amber-800">
            Only superadmin accounts can update integration credentials.
          </p>
        ) : null}
      </div>

      <SettingSectionCard section={amazonSection}>
        {canEdit ? (
          <AmazonIntegrationForm
            initial={{
              mock: amazonSummary.mock,
              region: amazonSummary.region,
              partnerTag: amazonSummary.partnerTag,
              hasAccessKey: amazonSummary.hasAccessKey,
              hasSecretKey: amazonSummary.hasSecretKey,
            }}
          />
        ) : null}
      </SettingSectionCard>

      <SettingSectionCard section={geminiSection}>
        {canEdit ? (
          <GeminiIntegrationForm
            initial={{
              mock: geminiSummary.mock,
              modelDraft: geminiSummary.modelDraft,
              modelFinal: geminiSummary.modelFinal,
              hasApiKey: geminiSummary.hasApiKey,
            }}
          />
        ) : null}
      </SettingSectionCard>
    </div>
  );
}
