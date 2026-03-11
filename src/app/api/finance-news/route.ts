export const dynamic = "force-dynamic";

type Article = {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
};

type CachedData = {
  articles: Article[];
  fetchedAt: number;
};

let cache: CachedData | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const FREE_SOURCES = ["CNBC", "MarketWatch", "Yahoo Finance", "Business Wire", "PR Newswire", "Investing.com", "Forbes"];

type FinnhubArticle = {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
};

async function fetchFinnhubNews(): Promise<Article[]> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.error("FINNHUB_API_KEY is not set");
    return [];
  }

  try {
    const res = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${apiKey}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];

    const data: FinnhubArticle[] = await res.json();
    
    // Filter by free sources
    const filtered = data.filter((item) => 
      FREE_SOURCES.some(source => item.source.toLowerCase().includes(source.toLowerCase()))
    );

    return filtered.map((item) => ({
      title: item.headline,
      url: item.url,
      source: item.source,
      publishedAt: new Date(item.datetime * 1000).toISOString(),
    }));
  } catch (error) {
    console.error("Failed to fetch Finnhub news:", error);
    return [];
  }
}

export async function GET() {
  const now = Date.now();

  if (cache && now - cache.fetchedAt < CACHE_TTL) {
    return Response.json({
      articles: cache.articles,
      fetchedAt: new Date(cache.fetchedAt).toISOString(),
    });
  }

  const articles = await fetchFinnhubNews();
  // Sort and limit
  articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const limited = articles.slice(0, 6);

  cache = { articles: limited, fetchedAt: now };

  return Response.json(
    { articles: limited, fetchedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
