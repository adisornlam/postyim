import { getRemoteSyncConfig } from "@/lib/sync/config";

export function verifyRemoteSyncAuth(request: Request): boolean {
  const { syncSecret } = getRemoteSyncConfig();

  if (!syncSecret) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${syncSecret}`;
}

export function unauthorizedSyncResponse() {
  return Response.json(
    { error: "Unauthorized. Provide Authorization: Bearer <REMOTE_SYNC_SECRET>." },
    { status: 401 },
  );
}
