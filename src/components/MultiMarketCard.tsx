"use client";

type QuoteData = {
  price: number;
  change: number;
  changePercent: number;
  marketState: string;
};

type QuoteResult = QuoteData | { error: string };

type MultiMarketCardProps = {
  title: string;
  symbols: { key: string; label: string; prefix?: string }[];
  quotes: Record<string, QuoteResult> | null;
};

function formatMarketState(state: string): string {
  switch (state) {
    case "REGULAR": return "Open";
    case "PRE": return "Pre";
    case "POST":
    case "POSTPOST": return "After";
    default: return "Closed";
  }
}

export default function MultiMarketCard({ title, symbols, quotes }: MultiMarketCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{title}</p>
      </div>
      <div className="space-y-4">
        {symbols.map((symbol) => {
          const data = quotes ? quotes[symbol.key] : null;
          
          if (!data) {
            return (
              <div key={symbol.key} className="animate-pulse">
                <div className="h-4 w-24 rounded bg-zinc-800" />
                <div className="mt-2 h-6 w-32 rounded bg-zinc-800" />
              </div>
            );
          }

          if ("error" in data) {
            return (
              <div key={symbol.key}>
                <p className="text-xs text-zinc-500">{symbol.label}</p>
                <p className="text-sm text-zinc-600">Unavailable</p>
              </div>
            );
          }

          const isPositive = data.change >= 0;
          const color = isPositive ? "text-emerald-400" : "text-red-400";
          const sign = isPositive ? "+" : "";

          return (
            <div key={symbol.key} className="flex items-center justify-between border-b border-zinc-800/50 pb-3 last:border-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-500 truncate">{symbol.label}</p>
                <p className="text-lg font-semibold tabular-nums">
                  {symbol.prefix}{data.price.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium tabular-nums ${color}`}>
                  {sign}{data.changePercent.toFixed(2)}%
                </p>
                <p className="text-[10px] text-zinc-600 uppercase">
                  {formatMarketState(data.marketState)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
