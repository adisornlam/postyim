import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { assertRemoteSyncConfigured } from "@/lib/sync/config";
import {
  exportSyncBundleByProductId,
  exportSyncBundleByReviewId,
  exportSyncBundleByReviewSlug,
} from "@/lib/sync/export-bundle";
import {
  fetchRemoteSyncStatus,
  pushBundleToRemote,
} from "@/lib/sync/client";

function readArg(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const command = process.argv[2] ?? "help";

  if (command === "status") {
    const status = await fetchRemoteSyncStatus();
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  if (command === "push") {
    const reviewId = readArg("review-id");
    const reviewSlug = readArg("review-slug");
    const productId = readArg("product-id");
    const publish = process.argv.includes("--publish");

    let bundle;

    if (reviewId) {
      bundle = await exportSyncBundleByReviewId(reviewId);
    } else if (reviewSlug) {
      bundle = await exportSyncBundleByReviewSlug(reviewSlug);
    } else if (productId) {
      bundle = await exportSyncBundleByProductId(productId);
    } else {
      throw new Error(
        "Provide --review-id=, --review-slug=, or --product-id= for push.",
      );
    }

    if (publish && bundle.review) {
      bundle.review.status = "published";
      bundle.review.publishedAt = new Date().toISOString();
    }

    const result = await pushBundleToRemote(bundle);
    console.log(JSON.stringify({ status: "ok", result }, null, 2));
    return;
  }

  const configState = assertRemoteSyncConfigured();
  console.log(`Remote sync target: ${configState.remoteUrl}`);
  console.log("");
  console.log("Usage:");
  console.log("  pnpm sync:status");
  console.log("  pnpm sync:push --review-slug=my-product-review");
  console.log("  pnpm sync:push --review-id=<uuid>");
  console.log("  pnpm sync:push --product-id=<uuid>");
  console.log("  pnpm sync:push --review-slug=my-product-review --publish");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
