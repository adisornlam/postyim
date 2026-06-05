import { GadgetReviewTemplate } from "@/components/reviews/gadget-review-template";

interface ReviewPageProps {
  review: {
    title: string;
    slug: string;
    content: string;
    metaDescription?: string | null;
    rating?: string | null;
    pros: unknown;
    cons: unknown;
    publishedAt?: Date | null;
    updatedAt?: Date | null;
  };
  product: {
    id: string;
    title: string;
    externalId?: string | null;
    description?: string | null;
    price?: string | null;
    currency: string;
    imageUrl?: string | null;
    affiliateLink: string;
    lastSyncedAt?: Date | null;
    specs?: unknown;
  };
  author?: {
    name: string;
    title?: string | null;
    slug: string;
    bio?: string | null;
  } | null;
  mediaAssets?: Array<{
    url: string;
    altText?: string | null;
  }>;
  related?: Array<{
    review: { slug: string; title: string; rating?: string | null };
    product: { title: string; imageUrl?: string | null };
  }>;
}

export function ReviewPageView(props: ReviewPageProps) {
  return <GadgetReviewTemplate {...props} />;
}
