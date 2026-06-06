"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const REGIONS = [
  { value: "us-east-1", label: "US (us-east-1)" },
  { value: "us-west-2", label: "US West (us-west-2)" },
  { value: "eu-west-1", label: "UK (eu-west-1)" },
];

export function AmazonIntegrationForm({
  initial,
  onSaved,
}: {
  initial: {
    mock: boolean;
    region: string;
    partnerTag: string;
    hasAccessKey: boolean;
    hasSecretKey: boolean;
  };
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [partnerTag, setPartnerTag] = useState(initial.partnerTag);
  const [region, setRegion] = useState(initial.region);
  const [useMock, setUseMock] = useState(initial.mock);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  async function saveConnection() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/settings/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "amazon",
          accessKey: accessKey || undefined,
          secretKey: secretKey || undefined,
          partnerTag,
          region,
          useMock,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to save Amazon settings");
      }

      setAccessKey("");
      setSecretKey("");
      setSuccess("Amazon marketplace settings saved.");
      if (onSaved) {
        onSaved();
      } else {
        router.refresh();
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save Amazon settings",
      );
    } finally {
      setLoading(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/settings/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test-amazon" }),
      });

      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Amazon connection test failed");
      }

      setSuccess(data.message ?? "Amazon connection test succeeded.");
    } catch (testError) {
      setError(
        testError instanceof Error
          ? testError.message
          : "Amazon connection test failed",
      );
    } finally {
      setTesting(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void saveConnection();
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amazon-access-key">Access key</Label>
          <Input
            id="amazon-access-key"
            type="password"
            autoComplete="off"
            placeholder={
              initial.hasAccessKey ? "Leave blank to keep current key" : "AKIA..."
            }
            value={accessKey}
            onChange={(event) => setAccessKey(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amazon-secret-key">Secret key</Label>
          <Input
            id="amazon-secret-key"
            type="password"
            autoComplete="off"
            placeholder={
              initial.hasSecretKey ? "Leave blank to keep current key" : "Secret key"
            }
            value={secretKey}
            onChange={(event) => setSecretKey(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amazon-partner-tag">Partner tag</Label>
          <Input
            id="amazon-partner-tag"
            value={partnerTag}
            onChange={(event) => setPartnerTag(event.target.value)}
            placeholder="yourtag-20"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amazon-region">Region</Label>
          <select
            id="amazon-region"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
          >
            {REGIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={useMock}
          onChange={(event) => setUseMock(event.target.checked)}
          className="size-4 rounded border-input"
        />
        Use mock catalog (development mode)
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save & connect"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={testing || useMock}
          onClick={() => void testConnection()}
        >
          {testing ? "Testing..." : "Test connection"}
        </Button>
      </div>
    </form>
  );
}
