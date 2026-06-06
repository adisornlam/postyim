"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AutomationSettingsForm({
  initial,
}: {
  initial: {
    hasCronSecret: boolean;
  };
}) {
  const router = useRouter();
  const [cronSecret, setCronSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/settings/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cronSecret: cronSecret || undefined,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to save automation settings");
      }

      setCronSecret("");
      setSuccess("Cron secret saved to the encrypted database.");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save automation settings",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
      <div className="space-y-2">
        <Label htmlFor="cron-secret">Cron secret</Label>
        <Input
          id="cron-secret"
          type="password"
          autoComplete="off"
          placeholder={
            initial.hasCronSecret
              ? "Leave blank to keep current secret"
              : "Random 32+ character secret"
          }
          value={cronSecret}
          onChange={(event) => setCronSecret(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Used by `/api/cron/daily` and manual job endpoints via{" "}
          <code className="rounded bg-muted px-1">
            Authorization: Bearer &lt;secret&gt;
          </code>
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save cron secret"}
      </Button>
    </form>
  );
}
