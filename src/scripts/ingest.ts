import { config } from "dotenv";

config({ path: ".env.local" });
config();

import {
  ingestActiveCampaigns,
  ingestCampaignProducts,
} from "@/lib/jobs/product-ingestion";

async function main() {
  const campaignId = process.argv[2];
  const all = process.argv.includes("--all");

  if (all) {
    const results = await ingestActiveCampaigns();
    console.log(JSON.stringify({ status: "ok", results }, null, 2));
    return;
  }

  if (campaignId) {
    const result = await ingestCampaignProducts(campaignId);
    console.log(JSON.stringify({ status: "ok", result }, null, 2));
    return;
  }

  console.error(
    "Usage: pnpm jobs:ingest <campaignId> | pnpm jobs:ingest --all",
  );
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
