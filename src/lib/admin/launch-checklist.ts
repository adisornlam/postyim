import { count, eq, ilike, not } from "drizzle-orm";

import { db } from "@/db";
import { campaigns, products, reviews } from "@/db/schema";
import { isLikelyMockAsin } from "@/lib/affiliate/links";
import { evaluateReviewById } from "@/lib/ai/review-qc";
import {
  AFFILIATE_DISCLOSURE_MARKERS,
  DEFAULT_DISCLOSURE,
  QUALITY_THRESHOLDS,
} from "@/lib/ai/constants";
import { getSiteUrl } from "@/lib/env";
import { getRemoteSyncConfig } from "@/lib/sync/config";
import {
  getAmazonPartnerTag,
  getAmazonSettingsSummary,
  getGeminiSettingsSummary,
  shouldUseGeminiMock,
} from "@/lib/settings/runtime-config";

export type LaunchCheckStatus = "ready" | "warning" | "missing" | "manual";

export interface LaunchCheckItem {
  id: string;
  section: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";
  label: string;
  status: LaunchCheckStatus;
  detail: string;
  actionHref?: string;
}

function disclosurePresent(content: string): boolean {
  const normalized = content.toLowerCase();
  return AFFILIATE_DISCLOSURE_MARKERS.some((marker) =>
    normalized.includes(marker),
  );
}

async function fetchPublicPage(path: string, baseUrl: string) {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      cache: "no-store",
    });

    return {
      ok: response.ok,
      status: response.status,
      body: response.ok ? await response.text() : "",
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: "",
      error: error instanceof Error ? error.message : "Fetch failed",
    };
  }
}

export async function getLaunchChecklist(): Promise<LaunchCheckItem[]> {
  const siteUrl = getSiteUrl();
  const remote = getRemoteSyncConfig();
  const publicBaseUrl = remote.remoteUrl ?? siteUrl;
  const isLocalhost =
    siteUrl.includes("localhost") || siteUrl.includes("127.0.0.1");

  const [
    amazonSummary,
    geminiSummary,
    partnerTag,
    geminiMock,
    publishedReviewCount,
    campaignCount,
    productRows,
    pendingReviewRows,
    publishedReviews,
  ] = await Promise.all([
    getAmazonSettingsSummary(),
    getGeminiSettingsSummary(),
    getAmazonPartnerTag(),
    shouldUseGeminiMock(),
    db
      .select({ value: count() })
      .from(reviews)
      .where(eq(reviews.status, "published"))
      .then((rows) => rows[0]?.value ?? 0),
    db
      .select({ value: count() })
      .from(campaigns)
      .then((rows) => rows[0]?.value ?? 0),
    db
      .select({
        id: products.id,
        externalId: products.externalId,
        affiliateLink: products.affiliateLink,
        title: products.title,
      })
      .from(products)
      .where(not(ilike(products.externalId, "%MOCK%")))
      .limit(20),
    db
      .select({
        id: reviews.id,
        slug: reviews.slug,
        title: reviews.title,
        status: reviews.status,
      })
      .from(reviews)
      .where(eq(reviews.status, "pending_review"))
      .limit(5),
    db
      .select({
        id: reviews.id,
        slug: reviews.slug,
        title: reviews.title,
        metaDescription: reviews.metaDescription,
        content: reviews.content,
        productId: reviews.productId,
      })
      .from(reviews)
      .where(eq(reviews.status, "published"))
      .limit(10),
  ]);

  const realProducts = productRows.filter(
    (product) => !isLikelyMockAsin(product.externalId),
  );
  const partnerLinkedProducts = realProducts.filter((product) =>
    partnerTag ? product.affiliateLink.includes(partnerTag) : false,
  );

  const [disclosurePage, privacyPage, robotsPage, sitemapPage] =
    await Promise.all([
      fetchPublicPage("/disclosure", publicBaseUrl),
      fetchPublicPage("/privacy", publicBaseUrl),
      fetchPublicPage("/robots.txt", publicBaseUrl),
      fetchPublicPage("/sitemap.xml", publicBaseUrl),
    ]);

  const latestPendingReview = pendingReviewRows[0];
  let qcReport: Awaited<ReturnType<typeof evaluateReviewById>> | null = null;

  if (latestPendingReview) {
    qcReport = await evaluateReviewById(latestPendingReview.id);
  }

  const checks: LaunchCheckItem[] = [
    {
      id: "a-site-url",
      section: "A",
      label: "Public site URL",
      status: isLocalhost ? "warning" : "ready",
      detail: isLocalhost
        ? `Local dev uses ${siteUrl}. Production should use https://postyim.com via POSTYIM_REMOTE_URL / deploy env.`
        : `Site URL is ${siteUrl}.`,
      actionHref: "/admin/settings/system",
    },
    {
      id: "a-disclosure-page",
      section: "A",
      label: "Affiliate disclosure page",
      status: disclosurePage.ok ? "ready" : "missing",
      detail: disclosurePage.ok
        ? `${publicBaseUrl}/disclosure is reachable.`
        : `Could not reach ${publicBaseUrl}/disclosure.`,
    },
    {
      id: "a-privacy-page",
      section: "A",
      label: "Privacy policy page",
      status: privacyPage.ok ? "ready" : "missing",
      detail: privacyPage.ok
        ? `${publicBaseUrl}/privacy is reachable.`
        : `Could not reach ${publicBaseUrl}/privacy.`,
    },
    {
      id: "a-partner-tag",
      section: "A",
      label: "Amazon partner tag saved",
      status: partnerTag ? "ready" : "missing",
      detail: partnerTag
        ? `Partner tag ${partnerTag} is configured.`
        : "Save your Associate tag in Integrations.",
      actionHref: "/admin/settings/integrations",
    },
    {
      id: "a-gemini-live",
      section: "A",
      label: "Gemini live mode",
      status: geminiMock ? "warning" : geminiSummary.hasApiKey ? "ready" : "missing",
      detail: geminiMock
        ? "Gemini mock mode is enabled. Disable it to use live review generation."
        : geminiSummary.hasApiKey
          ? "Gemini API key is configured for live generation."
          : "Add a Gemini API key in Integrations.",
      actionHref: "/admin/settings/integrations",
    },
    {
      id: "a-remote-sync",
      section: "A",
      label: "Localhost → production sync",
      status: remote.isConfigured ? "ready" : "warning",
      detail: remote.isConfigured
        ? `Configured to push content to ${remote.remoteUrl}.`
        : "Set POSTYIM_REMOTE_URL and REMOTE_SYNC_SECRET in .env.local for localhost pushes.",
      actionHref: "/admin/launch",
    },
    {
      id: "b-real-asin",
      section: "B",
      label: "Real Amazon ASIN in catalog",
      status: realProducts.length > 0 ? "ready" : "missing",
      detail:
        realProducts.length > 0
          ? `${realProducts.length} non-mock product(s) in catalog.`
          : "Add a manual product with a real ASIN before publishing.",
      actionHref: "/admin/products/new",
    },
    {
      id: "b-affiliate-link",
      section: "B",
      label: "Affiliate links include partner tag",
      status:
        realProducts.length === 0
          ? "missing"
          : partnerLinkedProducts.length === realProducts.length
            ? "ready"
            : "warning",
      detail:
        realProducts.length === 0
          ? "No real products to validate yet."
          : `${partnerLinkedProducts.length}/${realProducts.length} real products use tag ${partnerTag || "—"}.`,
      actionHref: "/admin/products",
    },
    {
      id: "c-campaign",
      section: "C",
      label: "Active campaign exists",
      status: campaignCount > 0 ? "ready" : "missing",
      detail:
        campaignCount > 0
          ? `${campaignCount} campaign(s) available for manual product entry.`
          : "Create a campaign before adding manual products.",
      actionHref: "/admin/campaigns/new",
    },
    {
      id: "c-generated-review",
      section: "C",
      label: "AI review generated",
      status:
        pendingReviewRows.length > 0 || publishedReviewCount > 0
          ? "ready"
          : "missing",
      detail:
        pendingReviewRows.length > 0 || publishedReviewCount > 0
          ? `${pendingReviewRows.length} pending review(s), ${publishedReviewCount} published.`
          : "Create a manual product, then generate a review with Gemini.",
      actionHref: "/admin/products",
    },
    {
      id: "d-quality-gate",
      section: "D",
      label: "Latest review passes QC",
      status: !latestPendingReview
        ? "missing"
        : qcReport?.passed
          ? "ready"
          : "warning",
      detail: !latestPendingReview
        ? "No pending review to evaluate."
        : qcReport?.passed
          ? `${latestPendingReview.title} passed QC (${qcReport.overallScore}/100).`
          : `${latestPendingReview.title} failed QC: ${qcReport?.failures.join(" ") ?? "Unknown"}`,
      actionHref: latestPendingReview
        ? `/admin/reviews/${latestPendingReview.id}`
        : "/admin/reviews",
    },
    {
      id: "e-disclosure-copy",
      section: "E",
      label: "Amazon Associate disclaimer text",
      status: DEFAULT_DISCLOSURE.includes("Amazon Associate") ? "ready" : "missing",
      detail: DEFAULT_DISCLOSURE,
    },
    {
      id: "e-review-disclosure",
      section: "E",
      label: "Published reviews include disclosure",
      status:
        publishedReviews.length === 0
          ? "warning"
          : publishedReviews.every((review) => disclosurePresent(review.content))
            ? "ready"
            : "warning",
      detail:
        publishedReviews.length === 0
          ? "No published reviews yet. Disclosure block will auto-render if missing in content."
          : "All published reviews include affiliate disclosure markers.",
    },
    {
      id: "f-robots",
      section: "F",
      label: "robots.txt allows review pages",
      status:
        robotsPage.ok && robotsPage.body.includes("Sitemap")
          ? "ready"
          : "warning",
      detail: robotsPage.ok
        ? `${publicBaseUrl}/robots.txt is reachable.`
        : `Could not fetch ${publicBaseUrl}/robots.txt.`,
    },
    {
      id: "f-sitemap",
      section: "F",
      label: "Dynamic sitemap",
      status: sitemapPage.ok ? "ready" : "warning",
      detail: sitemapPage.ok
        ? `${publicBaseUrl}/sitemap.xml is reachable.`
        : `Could not fetch ${publicBaseUrl}/sitemap.xml.`,
    },
    {
      id: "f-meta-length",
      section: "F",
      label: "Published meta descriptions length",
      status:
        publishedReviews.length === 0
          ? "warning"
          : publishedReviews.every((review) => {
              const length = review.metaDescription?.length ?? 0;
              return (
                length >= QUALITY_THRESHOLDS.metaDescriptionMin &&
                length <= QUALITY_THRESHOLDS.metaDescriptionMax
              );
            })
            ? "ready"
            : "warning",
      detail:
        publishedReviews.length === 0
          ? "Publish at least one review to validate metadata."
          : "Published reviews should keep meta descriptions between 120–160 characters.",
    },
    {
      id: "g-published-review",
      section: "G",
      label: "At least one published review on production",
      status: publishedReviewCount > 0 && !isLocalhost ? "ready" : "warning",
      detail:
        publishedReviewCount > 0
          ? `${publishedReviewCount} published review(s) in the connected database.`
          : "Approve and publish, then sync to postyim.com if working locally.",
      actionHref: "/admin/reviews",
    },
    {
      id: "g-affiliate-cta",
      section: "G",
      label: "Published product affiliate links verified",
      status:
        publishedReviews.length === 0 || partnerLinkedProducts.length === 0
          ? "warning"
          : "ready",
      detail:
        "Open a live review page and confirm CTA links include your partner tag.",
      actionHref: publishedReviews[0]
        ? `/reviews/${publishedReviews[0].slug}`
        : "/admin/reviews",
    },
    {
      id: "h-search-console",
      section: "H",
      label: "Google Search Console submission",
      status: "manual",
      detail:
        "Manual: submit https://postyim.com/sitemap.xml in Search Console after the first publish.",
    },
    {
      id: "h-associates-report",
      section: "H",
      label: "Amazon Associates sales tracking",
      status: "manual",
      detail:
        "Manual: monitor Link Type Performance in Associates Central for clicks and qualifying sales.",
    },
    {
      id: "h-pa-api",
      section: "H",
      label: "PA-API unlock path",
      status: amazonSummary.mock ? "warning" : "ready",
      detail: amazonSummary.mock
        ? "Pre-PA-API phase: use manual products + localhost sync until 10 qualifying sales unlock API access."
        : "Amazon live ingestion is configured.",
      actionHref: "/admin/settings/integrations",
    },
  ];

  return checks;
}

export function summarizeLaunchChecklist(checks: LaunchCheckItem[]) {
  return {
    ready: checks.filter((item) => item.status === "ready").length,
    warning: checks.filter((item) => item.status === "warning").length,
    missing: checks.filter((item) => item.status === "missing").length,
    manual: checks.filter((item) => item.status === "manual").length,
    total: checks.length,
  };
}
