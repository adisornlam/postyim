import Link from "next/link";

import { ProductGenerateReviewButton } from "@/components/admin/product-generate-review-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { listProductsForAdmin } from "@/lib/reviews/queries";

export default async function AdminProductsPage() {
  const products = await listProductsForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Synced or manually added affiliate catalog ready for review generation.
          </p>
        </div>
        <Button render={<Link href="/admin/products/new" />}>
          Discover products
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product catalog</CardTitle>
          <CardDescription>{products.length} products</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>ASIN</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Review</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(({ product, campaign, reviewStatus }) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.title}</TableCell>
                  <TableCell>{product.externalId}</TableCell>
                  <TableCell>{campaign.name}</TableCell>
                  <TableCell>
                    {product.price
                      ? `$${product.price} ${product.currency}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {reviewStatus ?? "none"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ProductGenerateReviewButton
                      productId={product.id}
                      reviewStatus={reviewStatus}
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
