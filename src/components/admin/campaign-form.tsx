"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildCampaignSlug } from "@/lib/campaigns/slug";

interface CategoryOption {
  id: string;
  name: string;
}

interface CampaignFormValues {
  name: string;
  slug: string;
  categoryId: string;
  status: "active" | "paused" | "archived";
  keywordsText: string;
  searchIndex: string;
  minPrice: string;
  maxPrice: string;
  itemCount: string;
  dailyProductLimit: string;
  priority: string;
}

interface CampaignFormProps {
  mode: "create" | "edit";
  campaignId?: string;
  categories: CategoryOption[];
  initialValues?: Partial<CampaignFormValues>;
}

const defaultValues: CampaignFormValues = {
  name: "",
  slug: "",
  categoryId: "",
  status: "active",
  keywordsText: "",
  searchIndex: "HomeGarden",
  minPrice: "",
  maxPrice: "",
  itemCount: "5",
  dailyProductLimit: "10",
  priority: "0",
};

export function CampaignForm({
  mode,
  campaignId,
  categories,
  initialValues,
}: CampaignFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<CampaignFormValues>({
    ...defaultValues,
    ...initialValues,
  });
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = useMemo(
    () =>
      mode === "create"
        ? "/api/admin/campaigns"
        : `/api/admin/campaigns/${campaignId}`,
    [campaignId, mode],
  );

  function updateField<K extends keyof CampaignFormValues>(
    key: K,
    value: CampaignFormValues[K],
  ) {
    setValues((current) => {
      const next = { ...current, [key]: value };

      if (key === "name" && !slugTouched) {
        next.slug = buildCampaignSlug(value);
      }

      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const keywords = values.keywordsText
      .split(/[\n,]/)
      .map((keyword) => keyword.trim())
      .filter(Boolean);

    const payload = {
      name: values.name.trim(),
      slug: values.slug.trim(),
      categoryId: values.categoryId || null,
      status: values.status,
      keywords,
      config: {
        searchIndex: values.searchIndex.trim() || undefined,
        minPrice: values.minPrice ? Number(values.minPrice) : undefined,
        maxPrice: values.maxPrice ? Number(values.maxPrice) : undefined,
        itemCount: values.itemCount ? Number(values.itemCount) : undefined,
      },
      dailyProductLimit: Number(values.dailyProductLimit),
      priority: Number(values.priority),
    };

    try {
      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        error?: string;
        campaign?: { id: string };
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Save failed");
      }

      if (mode === "create" && data.campaign?.id) {
        router.push(`/admin/campaigns/${data.campaign.id}`);
      } else {
        router.refresh();
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Save failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Campaign name</Label>
          <Input
            id="name"
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={values.slug}
            onChange={(event) => {
              setSlugTouched(true);
              updateField("slug", event.target.value);
            }}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={values.categoryId}
            onChange={(event) => updateField("categoryId", event.target.value)}
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={values.status}
            onChange={(event) =>
              updateField(
                "status",
                event.target.value as CampaignFormValues["status"],
              )
            }
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="keywordsText">Keywords</Label>
        <textarea
          id="keywordsText"
          className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="One keyword per line or comma-separated"
          value={values.keywordsText}
          onChange={(event) => updateField("keywordsText", event.target.value)}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="searchIndex">Amazon search index</Label>
          <Input
            id="searchIndex"
            value={values.searchIndex}
            onChange={(event) => updateField("searchIndex", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minPrice">Min price</Label>
          <Input
            id="minPrice"
            type="number"
            min="0"
            value={values.minPrice}
            onChange={(event) => updateField("minPrice", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxPrice">Max price</Label>
          <Input
            id="maxPrice"
            type="number"
            min="0"
            value={values.maxPrice}
            onChange={(event) => updateField("maxPrice", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="itemCount">Items per keyword</Label>
          <Input
            id="itemCount"
            type="number"
            min="1"
            max="20"
            value={values.itemCount}
            onChange={(event) => updateField("itemCount", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dailyProductLimit">Daily product limit</Label>
          <Input
            id="dailyProductLimit"
            type="number"
            min="1"
            max="100"
            value={values.dailyProductLimit}
            onChange={(event) =>
              updateField("dailyProductLimit", event.target.value)
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Input
            id="priority"
            type="number"
            min="0"
            max="100"
            value={values.priority}
            onChange={(event) => updateField("priority", event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : mode === "create" ? "Create campaign" : "Save changes"}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
