"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CampaignOption = {
  id: string;
  name: string;
  slug: string;
};

export function ManualProductForm({
  campaigns,
  partnerTag,
}: {
  campaigns: CampaignOption[];
  partnerTag: string;
}) {
  const router = useRouter();
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? "");
  const [externalId, setExternalId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const previewLink = useMemo(() => {
    if (!externalId.trim() || !partnerTag) {
      return "";
    }

    return `https://www.amazon.com/dp/${externalId.trim().toUpperCase()}?tag=${partnerTag}`;
  }, [externalId, partnerTag]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          externalId,
          title,
          description: description || undefined,
          price: price ? Number(price) : undefined,
          targetKeyword: targetKeyword || undefined,
          imageUrl: imageUrl || undefined,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        product?: { id: string; title: string };
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create product");
      }

      setSuccess(`Saved ${data.product?.title ?? "product"} with affiliate link.`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create product",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="campaignId">Campaign</Label>
          <select
            id="campaignId"
            value={campaignId}
            onChange={(event) => setCampaignId(event.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          >
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="externalId">Amazon ASIN</Label>
          <Input
            id="externalId"
            value={externalId}
            onChange={(event) => setExternalId(event.target.value.toUpperCase())}
            placeholder="B0XXXXXXXX"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetKeyword">Target keyword</Label>
          <Input
            id="targetKeyword"
            value={targetKeyword}
            onChange={(event) => setTargetKeyword(event.target.value)}
            placeholder="best LED desk lamp for home office"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Product title</Label>
          <Input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Exact or cleaned Amazon product title"
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Short description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="One paragraph summary from the Amazon listing or your research notes."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Reference price (optional)</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="49.99"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl">Editorial image URL (optional)</Label>
          <Input
            id="imageUrl"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://images.unsplash.com/..."
          />
        </div>
      </div>

      {previewLink ? (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
          <p className="font-medium">Affiliate link preview</p>
          <p className="mt-1 break-all text-muted-foreground">{previewLink}</p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <Button type="submit" disabled={loading || !campaignId}>
        {loading ? "Saving..." : "Save manual product"}
      </Button>
    </form>
  );
}
