import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProductionReadiness } from "@/lib/env";

export function ProductionReadinessCard() {
  const checks = getProductionReadiness();
  const readyCount = checks.filter((item) => item.status === "ready").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Production readiness</CardTitle>
        <CardDescription>
          {readyCount}/{checks.length} checks ready for launch
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {checks.map((check) => (
          <div
            key={check.id}
            className="flex items-start justify-between gap-4 rounded-lg border px-4 py-3"
          >
            <div className="space-y-1">
              <p className="font-medium">{check.label}</p>
              <p className="text-sm text-muted-foreground">{check.detail}</p>
            </div>
            <Badge
              variant={
                check.status === "ready"
                  ? "default"
                  : check.status === "warning"
                    ? "secondary"
                    : "destructive"
              }
            >
              {check.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
