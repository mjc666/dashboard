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
import SearchCard from "./SearchCard";
import FinanceNewsCard from "./FinanceNewsCard";
import VibeRadioCard from "./VibeRadioCard";
import MultiMarketCard from "./MultiMarketCard";
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
  type: "clock" | "market" | "news" | "finance-news" | "bookmarks" | "search" | "vibe-radio" | "multi-market";
  symbol?: { key: string; label: string; prefix: string };
  symbols?: { key: string; label: string; prefix?: string }[];
  title?: string;
};

const DEFAULT_WIDGETS: Widget[] = [
  { id: "clock", type: "clock" },
  { id: "vibe-radio", type: "vibe-radio" },
  { 
    id: "market-crypto", 
    type: "multi-market", 
    title: "Crypto",
    symbols: [
      { key: "BTC-USD", label: "Bitcoin", prefix: "$" },
      { key: "XRP-USD", label: "XRP", prefix: "$" },
      { key: "BAT-USD", label: "Basic Attention Token", prefix: "$" },
    ]
  },
  { 
    id: "market-stocks", 
    type: "multi-market", 
    title: "Stocks",
    symbols: [
      { key: "^DJI", label: "Dow Jones" },
      { key: "^IXIC", label: "NASDAQ" },
      { key: "^GSPC", label: "S&P 500" },
    ]
  },
  { 
    id: "market-metals", 
    type: "multi-market", 
    title: "Metals",
    symbols: [
      { key: "GC=F", label: "Gold", prefix: "$" },
      { key: "SI=F", label: "Silver", prefix: "$" },
      { key: "PL=F", label: "Platinum", prefix: "$" },
    ]
  },
  { 
    id: "market-currencies", 
    type: "multi-market", 
    title: "Currencies",
    symbols: [
      { key: "EURUSD=X", label: "EUR/USD" },
      { key: "GBPUSD=X", label: "GBP/USD" },
      { key: "JPY=X", label: "USD/JPY" },
    ]
  },
  { id: "search", type: "search" },
  { id: "bookmarks", type: "bookmarks" },
  { id: "news", type: "news" },
  { id: "finance-news", type: "finance-news" },
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
  const [financeArticles, setFinanceArticles] = useState<Article[] | null>(null);
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

  const fetchFinanceNews = useCallback(async () => {
    try {
      const res = await fetch("/api/finance-news");
      if (!res.ok) return;
      const data = await res.json();
      setFinanceArticles(data.articles);
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

  useEffect(() => {
    fetchFinanceNews();
    const id = setInterval(fetchFinanceNews, NEWS_POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchFinanceNews]);

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
      case "vibe-radio":
        return <VibeRadioCard />;
      case "multi-market":
        return (
          <MultiMarketCard
            title={widget.title!}
            symbols={widget.symbols!}
            quotes={quotes}
          />
        );
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
      case "finance-news":
        return <FinanceNewsCard articles={financeArticles} />;
      case "bookmarks":
        return <BookmarksCard />;
      case "search":
        return <SearchCard />;
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
                colSpan={widget.type === "news" || widget.type === "finance-news" ? 2 : 1}
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
