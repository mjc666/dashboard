type QuoteData = {
  price: number;
  change: number;
  changePercent: number;
  marketState: string;
};

type MarketCardProps = {
  label: string;
  prefix?: string;
  data: QuoteData | { error: string } | null;
};

function formatMarketState(state: string): string {
  switch (state) {
    case "REGULAR":
      return "Open";
    case "PRE":
      return "Pre-Market";
    case "POST":
    case "POSTPOST":
      return "After Hours";
    default:
      return "Closed";
  }
}

export default function MarketCard({ label, prefix = "", data }: MarketCardProps) {
  if (!data) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-sm text-zinc-400">{label}</p>
        <div className="mt-2 h-8 w-32 animate-pulse rounded bg-zinc-800" />
        <div className="mt-2 h-4 w-20 animate-pulse rounded bg-zinc-800" />
      </div>
    );
  }

  if ("error" in data) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-sm text-zinc-400">{label}</p>
        <p className="mt-2 text-lg text-zinc-500">Unavailable</p>
      </div>
    );
  }

  const isPositive = data.change >= 0;
  const color = isPositive ? "text-emerald-400" : "text-red-400";
  const sign = isPositive ? "+" : "";
  const marketStateLabel = formatMarketState(data.marketState);
  const isOpen = data.marketState === "REGULAR";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{label}</p>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            isOpen ? "bg-emerald-900/50 text-emerald-400" : "bg-zinc-800 text-zinc-400"
          }`}
        >
          {marketStateLabel}
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">
        {prefix}
        {data.price.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
      <p className={`mt-1 text-sm tabular-nums ${color}`}>
        {sign}
        {data.change.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        ({sign}
        {data.changePercent.toFixed(2)}%)
      </p>
    </div>
  );
}
