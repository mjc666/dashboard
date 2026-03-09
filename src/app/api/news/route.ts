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

type NewsDataResult = {
  title: string;
  link: string;
  source_id: string;
  pubDate: string;
};

async function fetchNewsDataAI(): Promise<Article[]> {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey || apiKey === "your_newsdata_io_key_here") {
    console.warn("NEWSDATA_API_KEY is not set correctly");
    return [];
  }

  try {
    const res = await fetch(
      `https://newsdata.io/api/1/news?apikey=${apiKey}&q=artificial%20intelligence&category=technology&language=en`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const results: NewsDataResult[] = data.results || [];

    return results.map((result) => ({
      title: result.title,
      url: result.link,
      source: result.source_id.charAt(0).toUpperCase() + result.source_id.slice(1),
      publishedAt: result.pubDate,
    }));
  } catch (error) {
    console.error("Failed to fetch news from newsdata.io:", error);
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

  const articles = await fetchNewsDataAI();
  const limited = articles.slice(0, 6);

  cache = { articles: limited, fetchedAt: now };

  return Response.json(
    { articles: limited, fetchedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
