import { ReviewsIndexView } from "@/components/reviews/reviews-index-view";
import { getFeaturedPublishedReviews } from "@/lib/reviews/queries";

export default async function ReviewsIndexPage() {
  const reviews = await getFeaturedPublishedReviews(24);

  return (
    <ReviewsIndexView
      reviews={reviews}
      heading="All reviews"
      description="Hands-on product reviews and buying guides, sorted by most recent."
    />
  );
}
