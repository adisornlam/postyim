import type { AffiliateNetwork } from "@/lib/affiliate/types";
import type { AffiliateAdapter } from "@/lib/affiliate/types";

import { createAmazonAdapter } from "./adapters/amazon/adapter";
import { createMockAmazonAdapter } from "./adapters/mock/adapter";
import { shouldUseAmazonMock } from "@/lib/env";

export function getAffiliateAdapter(
  network: AffiliateNetwork,
): AffiliateAdapter {
  switch (network) {
    case "amazon":
      if (shouldUseAmazonMock()) {
        return createMockAmazonAdapter();
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

export function getAdapterMode(network: AffiliateNetwork): "live" | "mock" {
  if (network === "amazon" && shouldUseAmazonMock()) {
    return "mock";
  }

  return "live";
}
