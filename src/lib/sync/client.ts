import { assertRemoteSyncConfigured } from "@/lib/sync/config";
import type { SyncBundle, SyncPushResult } from "@/lib/sync/types";

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? `Remote sync failed with status ${response.status}`);
  }

  return data;
}

export async function fetchRemoteSyncStatus() {
  const { remoteUrl, syncSecret } = assertRemoteSyncConfigured();

  const response = await fetch(`${remoteUrl}/api/admin/sync/status`, {
    headers: {
      Authorization: `Bearer ${syncSecret}`,
    },
    cache: "no-store",
  });

  return parseJsonResponse<{
    status: string;
    siteUrl: string;
    syncEnabled: boolean;
    publishedReviewCount: number;
    productCount: number;
  }>(response);
}

export async function pushBundleToRemote(bundle: SyncBundle): Promise<SyncPushResult> {
  const { remoteUrl, syncSecret } = assertRemoteSyncConfigured();

  const response = await fetch(`${remoteUrl}/api/admin/sync/push`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${syncSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bundle),
  });

  const data = await parseJsonResponse<{ result: SyncPushResult }>(response);
  return data.result;
}
