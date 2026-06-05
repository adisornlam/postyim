import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { generateReviewsForQueue } from "@/lib/jobs/content-generation";
import { ingestActiveCampaigns } from "@/lib/jobs/product-ingestion";
import { refreshProductPrices } from "@/lib/jobs/price-refresh";

async function main() {
  const limit = Number(process.argv[2] ?? 10);

  console.log("=== Postyim production pipeline ===\n");

  console.log("1/3 Product ingestion...");
  const ingestResults = await ingestActiveCampaigns();
  console.log(
    `    ${ingestResults.length} campaigns processed`,
    ingestResults.map((result) => ({
      slug: result.campaignSlug,
      processed: result.itemsProcessed,
      mode: result.mode,
    })),
  );

  console.log("\n2/3 Price refresh...");
  const priceResult = await refreshProductPrices({});
  console.log(
    `    ${priceResult.itemsProcessed} updated, ${priceResult.itemsFailed} failed`,
  );

  console.log(`\n3/3 Content generation (limit ${limit})...`);
  const generationResult = await generateReviewsForQueue({ limit });
  console.log(
    `    ${generationResult.itemsProcessed} generated, ${generationResult.itemsFailed} failed`,
  );

  console.log("\nPipeline complete.");
  console.log("Next: review drafts in /admin/reviews and publish approved content.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
