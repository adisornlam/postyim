import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { DEFAULT_DISCLOSURE } from "@/lib/ai/constants";

export default function DisclosurePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 prose prose-neutral dark:prose-invert">
        <h1>Affiliate Disclosure</h1>
        <p>
          Postyim participates in affiliate programs. When you click links on
          this site and make a purchase, we may earn a commission at no
          additional cost to you.
        </p>
        <p>{DEFAULT_DISCLOSURE}</p>
        <p>
          We only recommend products we believe may provide value to readers.
          Editorial opinions remain independent from affiliate partnerships.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
