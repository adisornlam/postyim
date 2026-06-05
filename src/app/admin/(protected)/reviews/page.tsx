import Link from "next/link";

import { ReviewActionButtons } from "@/components/admin/review-action-buttons";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listReviewsForAdmin } from "@/lib/reviews/queries";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const reviews = await listReviewsForAdmin(params.status);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Review queue</h1>
        <p className="text-muted-foreground">
          Approve, reject, publish, or regenerate AI-assisted reviews.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          "all",
          "pending_review",
          "approved",
          "published",
          "failed",
          "rejected",
        ].map((status) => (
          <Link
            key={status}
            href={status === "all" ? "/admin/reviews" : `/admin/reviews?status=${status}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {status.replaceAll("_", " ")}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
          <CardDescription>{reviews.length} items</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Words</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map(({ review, product }) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <Link
                      href={`/admin/reviews/${review.id}`}
                      className="font-medium hover:underline"
                    >
                      {review.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{review.status}</Badge>
                  </TableCell>
                  <TableCell>{review.wordCount ?? "—"}</TableCell>
                  <TableCell>
                    <ReviewActionButtons
                      reviewId={review.id}
                      status={review.status}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
