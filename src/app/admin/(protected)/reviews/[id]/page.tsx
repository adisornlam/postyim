import Link from "next/link";
import { notFound } from "next/navigation";

import { ReviewActionButtons } from "@/components/admin/review-action-buttons";
import { ReviewQcPanel } from "@/components/admin/review-qc-panel";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getReviewDetailForAdmin } from "@/lib/reviews/queries";
import { evaluateReviewById } from "@/lib/ai/review-qc";

export default async function AdminReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getReviewDetailForAdmin(id);

  if (!detail) {
    notFound();
  }

  const { review, product, author, keyword, campaign, qualityScore } = detail;
  const qcReport = await evaluateReviewById(id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Badge variant="secondary">{review.status}</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">
            {review.title}
          </h1>
          <p className="text-muted-foreground">{product.title}</p>
        </div>
        <ReviewActionButtons reviewId={review.id} status={review.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Review content</CardTitle>
            <CardDescription>
              {review.wordCount ?? 0} words · rating {review.rating ?? "—"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/20 p-4 text-sm">
              {review.content}
            </pre>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <ReviewQcPanel
            passed={qcReport.passed}
            overallScore={qcReport.overallScore}
            seoScore={qcReport.seoScore}
            wordCount={qcReport.wordCount}
            targetKeyword={qcReport.targetKeyword}
            checklist={qcReport.checklist}
            failures={qcReport.failures}
          />

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Author:</span>{" "}
                {author?.name ?? "Unassigned"}
              </p>
              <p>
                <span className="text-muted-foreground">Keyword:</span>{" "}
                {keyword?.keyword ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Campaign:</span>{" "}
                {campaign?.name ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Quality score:</span>{" "}
                {qualityScore?.overallScore ?? "—"} (
                {qualityScore?.passed ? "passed" : "failed"})
              </p>
              {review.status === "published" ? (
                <Link
                  href={`/reviews/${review.slug}`}
                  className="inline-block text-primary hover:underline"
                >
                  View public page
                </Link>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meta description</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {review.metaDescription}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
