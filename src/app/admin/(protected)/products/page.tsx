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
import { listProductsForAdmin } from "@/lib/reviews/queries";

export default async function AdminProductsPage() {
  const products = await listProductsForAdmin();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          Synced affiliate catalog ready for review generation.
        </p>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
