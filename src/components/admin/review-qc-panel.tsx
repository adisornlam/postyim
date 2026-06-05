import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CHECK_LABELS: Record<string, string> = {
  wordCountMin1500: "Word count ≥ 1,500",
  hasProsCons: "Pros and cons complete",
  hasDisclosure: "Affiliate disclosure present",
  noProhibitedPhrases: "No prohibited AI phrases",
  metaDescriptionLength: "Meta description length",
  ratingWithJustification: "Rating with justification",
  uniquenessThreshold: "Uniqueness ≥ 85%",
  specAccuracyPresent: "Spec accuracy",
  keywordRelevance: "Keyword matches product",
  seoKeywordInTitle: "Keyword in title",
  seoKeywordInContent: "Keyword in body",
};

export function ReviewQcPanel({
  passed,
  overallScore,
  seoScore,
  wordCount,
  targetKeyword,
  checklist,
  failures,
}: {
  passed: boolean;
  overallScore: number;
  seoScore: number;
  wordCount: number;
  targetKeyword: string;
  checklist: Record<string, boolean>;
  failures: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          SEO / Editorial QC
          <Badge variant={passed ? "default" : "destructive"}>
            {passed ? "Passed" : "Blocked"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Overall {overallScore}/100 · SEO {seoScore}/100 · {wordCount} words ·
          keyword: {targetKeyword}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          {Object.entries(CHECK_LABELS).map(([key, label]) => {
            const ok = checklist[key] ?? false;
            return (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <span>{label}</span>
                <Badge variant={ok ? "secondary" : "destructive"}>
                  {ok ? "pass" : "fail"}
                </Badge>
              </div>
            );
          })}
        </div>
        {failures.length > 0 ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <p className="font-medium">Publish blockers</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {failures.map((failure) => (
                <li key={failure}>{failure}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
