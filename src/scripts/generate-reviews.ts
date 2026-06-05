import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { generateReviewsForQueue } from "@/lib/jobs/content-generation";

async function main() {
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;
  const campaignId = process.argv.find((arg) => arg.startsWith("--campaign="))?.split("=")[1];

  const result = await generateReviewsForQueue({
    campaignId,
    limit,
  });

  console.log(JSON.stringify({ status: "ok", result }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
