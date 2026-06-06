"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  CircleX,
  Settings2,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import { AmazonIntegrationForm } from "@/components/admin/amazon-integration-form";
import { GeminiIntegrationForm } from "@/components/admin/gemini-integration-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBackdrop,
  DialogBody,
  DialogCloseButton,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminSettingSection } from "@/lib/admin/settings-status";
import { cn } from "@/lib/utils";

type IntegrationId = "amazon" | "gemini";

type IntegrationsPanelProps = {
  canEdit: boolean;
  sections: AdminSettingSection[];
  amazonInitial: {
    mock: boolean;
    region: string;
    partnerTag: string;
    hasAccessKey: boolean;
    hasSecretKey: boolean;
  };
  geminiInitial: {
    mock: boolean;
    modelDraft: string;
    modelFinal: string;
    hasApiKey: boolean;
  };
};

const integrationMeta: Record<
  IntegrationId,
  {
    icon: typeof ShoppingBag;
    configureLabel: string;
  }
> = {
  amazon: {
    icon: ShoppingBag,
    configureLabel: "Configure Amazon",
  },
  gemini: {
    icon: Sparkles,
    configureLabel: "Configure Gemini",
  },
};

function statusVariant(status: AdminSettingSection["status"]) {
  if (status === "ready") {
    return "default" as const;
  }

  if (status === "warning") {
    return "secondary" as const;
  }

  return "destructive" as const;
}

function FieldStatusIcon({
  status,
}: {
  status?: AdminSettingSection["fields"][number]["status"];
}) {
  if (status === "ready") {
    return <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden />;
  }

  if (status === "missing") {
    return <CircleX className="size-3.5 text-destructive" aria-hidden />;
  }

  return <CircleAlert className="size-3.5 text-amber-600" aria-hidden />;
}

function IntegrationRow({
  section,
  canEdit,
  onConfigure,
}: {
  section: AdminSettingSection;
  canEdit: boolean;
  onConfigure: () => void;
}) {
  const meta = integrationMeta[section.id as IntegrationId];
  const Icon = meta?.icon ?? Settings2;
  const trackedFields = section.fields.filter((field) => field.status);

  return (
    <article className="rounded-xl border bg-card px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold tracking-tight">{section.title}</h3>
              <Badge variant={statusVariant(section.status)}>{section.status}</Badge>
              <Badge variant="outline">
                {section.storage === "database"
                  ? "Encrypted DB"
                  : "Environment"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{section.summary}</p>
            <div className="flex flex-wrap gap-2">
              {trackedFields.map((field) => (
                <span
                  key={field.label}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
                    field.status === "ready" && "border-emerald-200 bg-emerald-50/80",
                    field.status === "missing" && "border-red-200 bg-red-50/80",
                    field.status === "warning" && "border-amber-200 bg-amber-50/80",
                  )}
                >
                  <FieldStatusIcon status={field.status} />
                  <span className="text-muted-foreground">{field.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {canEdit ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 self-start"
            onClick={onConfigure}
          >
            <Settings2 className="size-3.5" aria-hidden />
            Configure
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export function IntegrationsPanel({
  canEdit,
  sections,
  amazonInitial,
  geminiInitial,
}: IntegrationsPanelProps) {
  const router = useRouter();
  const [activeIntegration, setActiveIntegration] =
    useState<IntegrationId | null>(null);

  const amazonSection = sections.find((section) => section.id === "amazon");
  const geminiSection = sections.find((section) => section.id === "gemini");

  function closeDialog() {
    setActiveIntegration(null);
  }

  function handleSaved() {
    closeDialog();
    router.refresh();
  }

  return (
    <>
      <div className="space-y-3">
        {amazonSection ? (
          <IntegrationRow
            section={amazonSection}
            canEdit={canEdit}
            onConfigure={() => setActiveIntegration("amazon")}
          />
        ) : null}
        {geminiSection ? (
          <IntegrationRow
            section={geminiSection}
            canEdit={canEdit}
            onConfigure={() => setActiveIntegration("gemini")}
          />
        ) : null}
      </div>

      <Dialog
        open={activeIntegration !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
      >
        <DialogPortal>
          <DialogBackdrop />
          <DialogPopup>
            <DialogHeader>
              <div className="min-w-0 space-y-1 pr-2">
                <DialogTitle>
                  {activeIntegration === "amazon"
                    ? "Amazon Marketplace"
                    : "Gemini AI"}
                </DialogTitle>
                <DialogDescription>
                  {activeIntegration === "amazon"
                    ? "Credentials are encrypted in the database and apply immediately."
                    : "Update your Gemini API key and model settings."}
                </DialogDescription>
              </div>
              <DialogCloseButton />
            </DialogHeader>

            <DialogBody>
              {activeIntegration === "amazon" ? (
                <AmazonIntegrationForm
                  initial={amazonInitial}
                  onSaved={handleSaved}
                />
              ) : null}
              {activeIntegration === "gemini" ? (
                <GeminiIntegrationForm
                  initial={geminiInitial}
                  onSaved={handleSaved}
                />
              ) : null}
            </DialogBody>
          </DialogPopup>
        </DialogPortal>
      </Dialog>
    </>
  );
}
