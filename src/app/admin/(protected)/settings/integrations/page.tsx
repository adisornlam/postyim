import { IntegrationsPanel } from "@/components/admin/integrations-panel";
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
  const [amazonSummary, geminiSummary] = await Promise.all([
    getAmazonSettingsSummary(),
    getGeminiSettingsSummary(),
  ]);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Connected services for product ingestion and AI review generation.
          Select Configure to update credentials in an encrypted database store.
        </p>
        {!canEdit ? (
          <p className="text-sm text-amber-800">
            Only superadmin accounts can update integration credentials.
          </p>
        ) : null}
      </div>

      <IntegrationsPanel
        canEdit={canEdit}
        sections={sections}
        amazonInitial={{
          mock: amazonSummary.mock,
          region: amazonSummary.region,
          partnerTag: amazonSummary.partnerTag,
          hasAccessKey: amazonSummary.hasAccessKey,
          hasSecretKey: amazonSummary.hasSecretKey,
        }}
        geminiInitial={{
          mock: geminiSummary.mock,
          modelDraft: geminiSummary.modelDraft,
          modelFinal: geminiSummary.modelFinal,
          hasApiKey: geminiSummary.hasApiKey,
        }}
      />
    </div>
  );
}
