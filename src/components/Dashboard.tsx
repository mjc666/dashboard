"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import Clock from "./Clock";
import MarketCard from "./MarketCard";
import NewsCard from "./NewsCard";
import BookmarksCard from "./BookmarksCard";
import SortableWidget from "./SortableWidget";

type QuoteData = {
  price: number;
  change: number;
  changePercent: number;
  marketState: string;
};

type QuoteResult = QuoteData | { error: string };

type MarketResponse = {
  quotes: Record<string, QuoteResult>;
  fetchedAt: string;
};

type Article = {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
};

type Widget = {
  id: string;
  type: "clock" | "market" | "news" | "bookmarks";
  symbol?: { key: string; label: string; prefix: string };
};

const DEFAULT_WIDGETS: Widget[] = [
  { id: "clock", type: "clock" },
  { id: "market-BTC-USD", type: "market", symbol: { key: "BTC-USD", label: "Bitcoin", prefix: "$" } },
  { id: "market-DJI", type: "market", symbol: { key: "^DJI", label: "Dow Jones", prefix: "" } },
  { id: "market-IXIC", type: "market", symbol: { key: "^IXIC", label: "NASDAQ", prefix: "" } },
  { id: "market-GSPC", type: "market", symbol: { key: "^GSPC", label: "S&P 500", prefix: "" } },
  { id: "market-VIX", type: "market", symbol: { key: "^VIX", label: "VIX", prefix: "" } },
  { id: "market-GC", type: "market", symbol: { key: "GC=F", label: "Gold", prefix: "$" } },
  { id: "market-SI", type: "market", symbol: { key: "SI=F", label: "Silver", prefix: "$" } },
  { id: "market-EURUSD", type: "market", symbol: { key: "EURUSD=X", label: "EUR/USD", prefix: "" } },
  { id: "market-GBPUSD", type: "market", symbol: { key: "GBPUSD=X", label: "GBP/USD", prefix: "" } },
  { id: "bookmarks", type: "bookmarks" },
  { id: "news", type: "news" },
];

const STORAGE_KEY = "dashboard-widget-order";

function loadWidgetOrder(): Widget[] {
  if (typeof window === "undefined") return DEFAULT_WIDGETS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_WIDGETS;
    const ids: string[] = JSON.parse(stored);
    const idMap = new Map(DEFAULT_WIDGETS.map((w) => [w.id, w]));
    const ordered: Widget[] = [];
    for (const id of ids) {
      const w = idMap.get(id);
      if (w) {
        ordered.push(w);
        idMap.delete(id);
      }
    }
    // Append any new widgets not in stored order
    for (const w of idMap.values()) {
      ordered.push(w);
    }
    return ordered;
  } catch {
    return DEFAULT_WIDGETS;
  }
}

function saveWidgetOrder(widgets: Widget[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets.map((w) => w.id)));
  } catch {
    // Ignore storage errors
  }
}

const MARKET_POLL_INTERVAL = 30_000;
const NEWS_POLL_INTERVAL = 300_000; // 5 minutes

export default function Dashboard() {
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const [quotes, setQuotes] = useState<Record<string, QuoteResult> | null>(null);
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    setWidgets(loadWidgetOrder());
  }, []);

  const fetchMarketData = useCallback(async () => {
    try {
      const res = await fetch("/api/market");
      if (!res.ok) return;
      const data: MarketResponse = await res.json();
      setQuotes(data.quotes);
      setLastUpdated(data.fetchedAt);
    } catch {
      // Keep stale data on failure
    }
  }, []);

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch("/api/news");
      if (!res.ok) return;
      const data = await res.json();
      setArticles(data.articles);
    } catch {
      // Keep stale data on failure
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
    const id = setInterval(fetchMarketData, MARKET_POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchMarketData]);

  useEffect(() => {
    fetchNews();
    const id = setInterval(fetchNews, NEWS_POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchNews]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWidgets((prev) => {
        const oldIndex = prev.findIndex((w) => w.id === active.id);
        const newIndex = prev.findIndex((w) => w.id === over.id);
        const next = arrayMove(prev, oldIndex, newIndex);
        saveWidgetOrder(next);
        return next;
      });
    }
  }

  function renderWidget(widget: Widget) {
    switch (widget.type) {
      case "clock":
        return <Clock />;
      case "market":
        return (
          <MarketCard
            label={widget.symbol!.label}
            prefix={widget.symbol!.prefix}
            data={quotes ? (quotes[widget.symbol!.key] ?? null) : null}
          />
        );
      case "news":
        return <NewsCard articles={articles} />;
      case "bookmarks":
        return <BookmarksCard />;
    }
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {widgets.map((widget) => (
              <SortableWidget
                key={widget.id}
                id={widget.id}
                colSpan={widget.type === "news" ? 2 : 1}
              >
                {renderWidget(widget)}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {lastUpdated && (
        <p className="mt-4 text-center text-xs text-zinc-500">
          Last updated {new Date(lastUpdated).toLocaleTimeString()}
        </p>
      )}
    </>
  );
}
