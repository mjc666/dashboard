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

type HNHit = {
  title: string;
  url: string;
  author: string;
  created_at: string;
  objectID: string;
};

async function fetchAINews(): Promise<Article[]> {
  try {
    // search_by_date ensures we get the most recent AI stories
    const res = await fetch(
      "https://hn.algolia.com/api/v1/search_by_date?query=AI&tags=story&hitsPerPage=15",
      {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const hits: HNHit[] = data.hits || [];

    return hits.map((hit) => ({
      title: hit.title,
      // Fallback to the HN discussion if there's no external URL
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      source: "Hacker News",
      publishedAt: hit.created_at,
    }));
  } catch (error) {
    console.error("Failed to fetch AI news from HN:", error);
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

  const articles = await fetchAINews();
  const limited = articles.slice(0, 6);

  cache = { articles: limited, fetchedAt: now };

  return Response.json(
    { articles: limited, fetchedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
