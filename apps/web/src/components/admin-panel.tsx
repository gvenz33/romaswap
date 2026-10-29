"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Metrics = {
  priceRequests: number;
  priceSuccessRatio: number | null;
  quoteRequests: number;
  quoteSuccess: number;
  latencyP50Ms: number | null;
  latencyP95Ms: number | null;
  simulated: number;
  submitted: number;
  confirmed: number;
  reverted: number;
  rejected: number;
};

type Payload = {
  mode: { live: boolean; executionEnabled: boolean; reason: string };
  metrics: Metrics;
  recent: Array<{ at: string; kind: string; ok: boolean; result?: string; state?: string }>;
};

export function AdminPanel() {
  const [token, setToken] = useState("");
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/metrics", { headers: { "x-admin-token": token } });
      const body = (await response.json()) as Payload & { error?: { message?: string } };
      if (!response.ok) {
        setPayload(null);
        setError(body.error?.message ?? "Analytics refused the token.");
        return;
      }
      setPayload(body);
    } catch {
      setError("Analytics could not be reached.");
    } finally {
      setLoading(false);
    }
  }

  const metrics = payload?.metrics;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <h1 className="font-serif text-5xl text-cream">Analytics</h1>
      <p className="mt-3 max-w-2xl text-mute">
        Read-only. Quoted requests are not traded volume, and simulated swaps are not revenue. Fee changes are not
        available here; the 0.25% rate is fixed in code until a multisig process exists.
      </p>
      <form
        className="mt-6 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void load();
        }}
      >
        <label className="sr-only" htmlFor="admin-token">
          Admin access token
        </label>
        <Input
          id="admin-token"
          type="password"
          autoComplete="current-password"
          placeholder="Admin access token"
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />
        <Button type="submit" disabled={loading || token.length === 0}>
          {loading ? "Checking…" : "Open"}
        </Button>
      </form>
      {error ? <p className="mt-4 text-danger" role="status">{error}</p> : null}
      {payload ? (
        <>
          <p className="mt-6 text-sm text-gold-bright">{payload.mode.reason}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Price requests" value={String(metrics?.priceRequests ?? 0)} />
            <Stat
              label="Price success"
              value={metrics?.priceSuccessRatio === null || metrics?.priceSuccessRatio === undefined ? "—" : `${Math.round(metrics.priceSuccessRatio * 100)}%`}
            />
            <Stat label="p50 / p95 ms" value={`${metrics?.latencyP50Ms ?? "—"} / ${metrics?.latencyP95Ms ?? "—"}`} />
            <Stat label="Quotes" value={`${metrics?.quoteSuccess ?? 0}/${metrics?.quoteRequests ?? 0}`} />
            <Stat label="Simulated" value={String(metrics?.simulated ?? 0)} />
            <Stat label="Submitted" value={String(metrics?.submitted ?? 0)} />
            <Stat label="Confirmed" value={String(metrics?.confirmed ?? 0)} />
            <Stat label="Reverted" value={String(metrics?.reverted ?? 0)} />
          </dl>
          <ul className="mt-6 space-y-2">
            {payload.recent.map((event, index) => (
              <li key={`${event.at}-${index}`} className="flex justify-between gap-3 text-sm text-mute">
                <span>{event.kind} · {event.result ?? event.state ?? (event.ok ? "ok" : "failed")}</span>
                <time>{new Date(event.at).toLocaleString()}</time>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line p-3">
      <dt className="text-xs uppercase tracking-widest text-mute">{label}</dt>
      <dd className="mt-2 text-xl text-cream">{value}</dd>
    </div>
  );
}
