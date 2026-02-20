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

const RSS_FEEDS = [
  { url: "https://techcrunch.com/category/artificial-intelligence/feed/", source: "TechCrunch" },
  { url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", source: "The Verge" },
];

function decodeEntities(str: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'",
    "&#8217;": "\u2019", "&#8216;": "\u2018", "&#8220;": "\u201C", "&#8221;": "\u201D",
    "&#8211;": "\u2013", "&#8212;": "\u2014", "&#038;": "&", "&#8230;": "\u2026",
  };
  return str
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&[a-z]+;|&#\d+;/gi, (m) => entities[m] ?? m);
}

function parseItems(xml: string, source: string): Article[] {
  const items: Article[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] ?? "";
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] ?? "";
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";
    if (title && link) {
      items.push({ title: decodeEntities(title), url: link, source, publishedAt: pubDate });
    }
  }
  return items;
}

async function fetchFeed(feed: { url: string; source: string }): Promise<Article[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseItems(xml, feed.source);
  } catch {
    return [];
  }
}

async function fetchNews(): Promise<Article[]> {
  const results = await Promise.all(RSS_FEEDS.map(fetchFeed));
  const all = results.flat();
  all.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return all.slice(0, 6);
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
