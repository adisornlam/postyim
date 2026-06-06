import type { AffiliateNetwork } from "@/lib/affiliate/types";
import type { AffiliateAdapter } from "@/lib/affiliate/types";

import { createAmazonAdapter } from "./adapters/amazon/adapter";
import { createMockAmazonAdapter } from "./adapters/mock/adapter";
import { shouldUseAmazonMock } from "@/lib/settings/runtime-config";

export async function getAffiliateAdapter(
  network: AffiliateNetwork,
): Promise<AffiliateAdapter> {
  switch (network) {
    case "amazon":
      if (await shouldUseAmazonMock()) {
        return await createMockAmazonAdapter();
      }
      return createAmazonAdapter();
    case "clickbank":
    case "cj":
    case "shareasale":
      throw new Error(`Affiliate network "${network}" is not implemented yet.`);
    default:
      throw new Error(`Unsupported affiliate network: ${network satisfies never}`);
  }
}

export async function getAdapterMode(
  network: AffiliateNetwork,
): Promise<"live" | "mock"> {
  if (network === "amazon" && (await shouldUseAmazonMock())) {
    return "mock";
  }

  return "live";
}
