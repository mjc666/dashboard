"use client";

type Article = {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
};

type NewsCardProps = {
  articles: Article[] | null;
};

export default function NewsCard({ articles }: NewsCardProps) {
  if (!articles) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-sm text-zinc-400">AI News</p>
        <div className="mt-3 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-5 animate-pulse rounded bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-sm text-zinc-400">AI News</p>
        <p className="mt-3 text-sm text-zinc-500">No articles available</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-sm text-zinc-400">AI News</p>
      <ul className="mt-3 space-y-3">
        {articles.map((article, i) => (
          <li key={i}>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="line-clamp-2 text-sm text-zinc-100 transition-colors hover:text-emerald-400"
            >
              {article.title}
            </a>
            <p className="mt-0.5 text-xs text-zinc-500">
              {article.source} &middot;{" "}
              {new Date(article.publishedAt).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
