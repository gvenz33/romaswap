"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

type Entry = {
  at?: string;
  state?: string;
  pair?: string;
  txHash?: string;
  result?: string;
  source?: string;
};

export function HistoryList() {
  const { address } = useAccount();
  const [remote, setRemote] = useState<Entry[]>([]);
  const [local, setLocal] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("romaswap.history");
    if (stored) {
      try {
        setLocal(JSON.parse(stored) as Entry[]);
      } catch {
        setLocal([]);
      }
    }
  }, []);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    void fetch(`/api/swap/history?wallet=${address}`)
      .then(async (response) => {
        if (!response.ok) {
          setError("History could not be loaded.");
          return;
        }
        const body = (await response.json()) as { events: Entry[] };
        setRemote(body.events);
        setError(null);
      })
      .catch(() => setError("History could not be loaded."))
      .finally(() => setLoading(false));
  }, [address]);

  const rows = [...remote, ...local];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <h1 className="font-serif text-5xl text-cream">Recent swaps</h1>
      <p className="mt-3 text-mute">
        Receipts are tied to the connected wallet. Sample runs stay on this browser and are marked simulated.
      </p>
      {!address ? <p className="mt-8 text-cream">Connect a wallet to load its history.</p> : null}
      {loading ? <p className="mt-8 text-mute">Loading history…</p> : null}
      {error ? <p className="mt-8 text-danger">{error}</p> : null}
      {address && !loading && rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-line p-6 text-mute">No swaps yet for this wallet.</p>
      ) : null}
      <ul className="mt-6 space-y-3">
        {rows.map((row, index) => (
          <li key={`${row.txHash ?? row.at ?? "row"}-${index}`} className="rounded-2xl border border-line p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-cream">{row.pair ?? "Swap"}</p>
              <p className="text-xs uppercase tracking-widest text-gold">{row.state ?? "recorded"}</p>
            </div>
            <p className="mt-2 text-sm text-mute">{row.result ?? row.source ?? "Recorded"}</p>
            {row.txHash ? (
              <a className="mt-2 inline-block text-sm text-gold" href={`https://basescan.org/tx/${row.txHash}`} target="_blank" rel="noreferrer">
                BaseScan receipt
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
