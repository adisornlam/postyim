import { Badge } from "@/components/ui/badge";
import type { AdminSettingSection } from "@/lib/admin/settings-status";
import type { ReactNode } from "react";

function statusVariant(status: AdminSettingSection["status"]) {
  if (status === "ready") {
    return "default" as const;
  }

  if (status === "warning") {
    return "secondary" as const;
  }

  return "destructive" as const;
}

function fieldStatusVariant(status?: AdminSettingSection["status"]) {
  if (!status) {
    return "secondary" as const;
  }

  return statusVariant(status);
}

export function SettingSectionCard({
  section,
  children,
}: {
  section: AdminSettingSection;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card text-card-foreground">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
          <p className="text-sm text-muted-foreground">{section.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {section.storage === "database"
              ? "Database (encrypted)"
              : "Environment"}
          </Badge>
          <Badge variant={statusVariant(section.status)}>{section.status}</Badge>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        <p className="text-sm text-muted-foreground">{section.summary}</p>

        <dl className="divide-y rounded-lg border">
          {section.fields.map((field) => (
            <div
              key={field.label}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <dt className="text-muted-foreground">{field.label}</dt>
              <dd className="flex items-center gap-2 font-medium">
                {field.value}
                {field.status ? (
                  <Badge variant={fieldStatusVariant(field.status)} className="text-[10px]">
                    {field.status}
                  </Badge>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>

        {children}

        {section.envKeys.length > 0 ? (
          <div className="rounded-lg bg-muted/50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Bootstrap environment only
            </p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {section.envKeys.join(" · ")}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              These values are infrastructure bootstrap settings and still load
              from environment variables.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
