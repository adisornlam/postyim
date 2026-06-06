import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LaunchCheckItem, LaunchCheckStatus } from "@/lib/admin/launch-checklist";
import { cn } from "@/lib/utils";

function statusVariant(status: LaunchCheckStatus) {
  if (status === "ready") {
    return "default" as const;
  }

  if (status === "manual") {
    return "outline" as const;
  }

  if (status === "warning") {
    return "secondary" as const;
  }

  return "destructive" as const;
}

const sectionTitles: Record<LaunchCheckItem["section"], string> = {
  A: "Site & credentials",
  B: "Real product setup",
  C: "Campaign & generation",
  D: "Quality gate",
  E: "Amazon compliance",
  F: "SEO technical",
  G: "Pre-publish verification",
  H: "Post-publish (manual)",
};

export function LaunchChecklistPanel({
  checks,
}: {
  checks: LaunchCheckItem[];
}) {
  const sections = Object.keys(sectionTitles) as LaunchCheckItem["section"][];

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const items = checks.filter((item) => item.section === section);

        if (items.length === 0) {
          return null;
        }

        return (
          <section key={section} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{section}</Badge>
              <h3 className="font-semibold">{sectionTitles[section]}</h3>
            </div>

            <div className="space-y-2">
              {items.map((item) => (
                <article
                  key={item.id}
                  className={cn(
                    "rounded-xl border px-4 py-3",
                    item.status === "ready" && "border-emerald-200 bg-emerald-50/40",
                    item.status === "warning" && "border-amber-200 bg-amber-50/40",
                    item.status === "missing" && "border-red-200 bg-red-50/40",
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{item.label}</p>
                        <Badge variant={statusVariant(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.detail}</p>
                    </div>

                    {item.actionHref ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 self-start"
                        render={
                          item.actionHref.startsWith("http") ||
                          item.actionHref.startsWith("/reviews/") ? (
                            <a
                              href={item.actionHref}
                              target="_blank"
                              rel="noreferrer"
                            />
                          ) : (
                            <Link href={item.actionHref} />
                          )
                        }
                      >
                        Open
                        {item.actionHref.startsWith("/reviews/") ? (
                          <ExternalLink className="size-3.5" aria-hidden />
                        ) : null}
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
