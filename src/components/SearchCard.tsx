"use client";

import { useState } from "react";

export default function SearchCard() {
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    window.open(
      `https://search.brave.com/search?q=${encodeURIComponent(trimmed)}`,
      "_blank",
    );
    setQuery("");
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-sm text-zinc-400">Brave Search</p>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the web..."
          className="min-w-0 flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-700 px-3 py-2 text-sm text-zinc-100 transition-colors hover:bg-zinc-600"
        >
          Go
        </button>
      </form>
    </div>
  );
}
