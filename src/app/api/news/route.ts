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

async function fetchNews(): Promise<Article[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  const url = `https://newsapi.org/v2/everything?q=artificial+intelligence+OR+AI+OR+LLM&language=en&sortBy=publishedAt&pageSize=6&apiKey=${apiKey}`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });

  if (!res.ok) return [];

  const json = await res.json();
  return (json.articles ?? []).map((a: Record<string, unknown>) => ({
    title: a.title as string,
    url: a.url as string,
    source: (a.source as Record<string, unknown>)?.name ?? "Unknown",
    publishedAt: a.publishedAt as string,
  }));
}

export async function GET() {
  const now = Date.now();

  if (cache && now - cache.fetchedAt < CACHE_TTL) {
    return Response.json({
      articles: cache.articles,
      fetchedAt: new Date(cache.fetchedAt).toISOString(),
    });
  }

  const articles = await fetchNews();
  cache = { articles, fetchedAt: now };

  return Response.json(
    { articles, fetchedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
