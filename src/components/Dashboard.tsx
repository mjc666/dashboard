"use client";

import { useState, useEffect, useCallback } from "react";
import Clock from "./Clock";
import MarketCard from "./MarketCard";

type QuoteData = {
  price: number;
  change: number;
  changePercent: number;
  marketState: string;
};

type QuoteResult = QuoteData | { error: string };

type MarketResponse = {
  quotes: Record<string, QuoteResult>;
  fetchedAt: string;
};

const SYMBOLS = [
  { key: "BTC-USD", label: "Bitcoin", prefix: "$" },
  { key: "^DJI", label: "Dow Jones", prefix: "" },
  { key: "^IXIC", label: "NASDAQ", prefix: "" },
  { key: "^GSPC", label: "S&P 500", prefix: "" },
  { key: "GC=F", label: "Gold", prefix: "$" },
  { key: "SI=F", label: "Silver", prefix: "$" },
] as const;

const POLL_INTERVAL = 30_000;

export default function Dashboard() {
  const [quotes, setQuotes] = useState<Record<string, QuoteResult> | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchMarketData = useCallback(async () => {
    try {
      const res = await fetch("/api/market");
      if (!res.ok) return;
      const data: MarketResponse = await res.json();
      setQuotes(data.quotes);
      setLastUpdated(data.fetchedAt);
    } catch {
      // Keep stale data on failure
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
    const id = setInterval(fetchMarketData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchMarketData]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Clock />
      {SYMBOLS.map(({ key, label, prefix }) => (
        <MarketCard
          key={key}
          label={label}
          prefix={prefix}
          data={quotes ? (quotes[key] ?? null) : null}
        />
      ))}
      {lastUpdated && (
        <p className="col-span-full text-center text-xs text-zinc-500">
          Last updated {new Date(lastUpdated).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
