export const dynamic = "force-dynamic";

const SYMBOLS = ["BTC-USD", "^DJI", "^IXIC", "^GSPC", "^VIX", "GC=F", "SI=F", "EURUSD=X", "GBPUSD=X"] as const;

type QuoteResult =
  | {
      price: number;
      change: number;
      changePercent: number;
      marketState: string;
    }
  | { error: string };

function deriveMarketState(meta: Record<string, unknown>): string {
  const tp = meta.currentTradingPeriod as
    | Record<string, { start: number; end: number }>
    | undefined;
  if (!tp) return "CLOSED";

  const now = Math.floor(Date.now() / 1000);
  if (tp.regular && now >= tp.regular.start && now < tp.regular.end) return "REGULAR";
  if (tp.pre && now >= tp.pre.start && now < tp.pre.end) return "PRE";
  if (tp.post && now >= tp.post.start && now < tp.post.end) return "POST";
  return "CLOSED";
}

async function fetchQuote(symbol: string): Promise<[string, QuoteResult]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });

    if (!res.ok) {
      return [symbol, { error: `HTTP ${res.status}` }];
    }

    const json = await res.json();
    const meta = json.chart?.result?.[0]?.meta;

    if (!meta) {
      return [symbol, { error: "No data" }];
    }

    const price = meta.regularMarketPrice ?? 0;
    const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    return [
      symbol,
      {
        price,
        change,
        changePercent,
        marketState: deriveMarketState(meta),
      },
    ];
  } catch {
    return [symbol, { error: "Fetch failed" }];
  }
}

export async function GET() {
  const results = await Promise.allSettled(SYMBOLS.map((s) => fetchQuote(s)));

  const quotes: Record<string, QuoteResult> = {};
  for (const result of results) {
    if (result.status === "fulfilled") {
      const [symbol, data] = result.value;
      quotes[symbol] = data;
    }
  }

  return Response.json(
    { quotes, fetchedAt: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
