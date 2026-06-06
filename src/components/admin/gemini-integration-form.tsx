"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GeminiIntegrationForm({
  initial,
  onSaved,
}: {
  initial: {
    mock: boolean;
    modelDraft: string;
    modelFinal: string;
    hasApiKey: boolean;
  };
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [modelDraft, setModelDraft] = useState(initial.modelDraft);
  const [modelFinal, setModelFinal] = useState(initial.modelFinal);
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
          provider: "gemini",
          apiKey: apiKey || undefined,
          modelDraft,
          modelFinal,
          useMock,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to save Gemini settings");
      }

      setApiKey("");
      setSuccess("Gemini settings saved.");
      onSaved?.() ?? router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save Gemini settings",
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
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test-gemini" }),
      });

      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Gemini connection test failed");
      }

      setSuccess(data.message ?? "Gemini connection test succeeded.");
    } catch (testError) {
      setError(
        testError instanceof Error
          ? testError.message
          : "Gemini connection test failed",
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
      <div className="space-y-2">
        <Label htmlFor="gemini-api-key">API key</Label>
        <Input
          id="gemini-api-key"
          type="password"
          autoComplete="off"
          placeholder={
            initial.hasApiKey ? "Leave blank to keep current key" : "AIza..."
          }
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="gemini-model-draft">Draft model</Label>
          <Input
            id="gemini-model-draft"
            value={modelDraft}
            onChange={(event) => setModelDraft(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gemini-model-final">Final model</Label>
          <Input
            id="gemini-model-final"
            value={modelFinal}
            onChange={(event) => setModelFinal(event.target.value)}
            required
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={useMock}
          onChange={(event) => setUseMock(event.target.checked)}
          className="size-4 rounded border-input"
        />
        Use mock review generator (development mode)
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
