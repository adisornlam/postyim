export function getRemoteSyncConfig() {
  const remoteUrl = process.env.POSTYIM_REMOTE_URL?.trim().replace(/\/$/, "");
  const syncSecret = process.env.REMOTE_SYNC_SECRET?.trim();

  return {
    remoteUrl,
    syncSecret,
    isConfigured: Boolean(remoteUrl && syncSecret),
  };
}

export function assertRemoteSyncConfigured() {
  const config = getRemoteSyncConfig();

  if (!config.isConfigured) {
    throw new Error(
      "Remote sync is not configured. Set POSTYIM_REMOTE_URL and REMOTE_SYNC_SECRET in .env.local.",
    );
  }

  return config as { remoteUrl: string; syncSecret: string; isConfigured: true };
}
