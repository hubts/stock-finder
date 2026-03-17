"use client";

import { useState, useCallback } from "react";

interface SearchResult {
  code: string;
  name: string;
  market: string;
}

interface StockSearchProps {
  onAdd: (code: string, name: string) => void;
}

export default function StockSearch({ onAdd }: StockSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/stocks/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="종목명 또는 코드로 검색..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400/40 focus:outline-none transition text-sm"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20 text-sm"
        >
          {loading ? (
            <span className="inline-flex items-center gap-1.5">
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              검색 중
            </span>
          ) : "검색"}
        </button>
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-10 mt-2 w-full bg-slate-800/95 backdrop-blur-xl border border-white/[0.1] rounded-xl shadow-2xl shadow-black/40 max-h-60 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.code}
              onClick={() => {
                onAdd(r.code, r.name);
                setOpen(false);
                setQuery("");
                setResults([]);
              }}
              className="w-full text-left px-4 py-3 hover:bg-white/[0.06] flex justify-between items-center border-b border-white/[0.06] last:border-b-0 transition"
            >
              <span className="font-medium text-white text-sm">{r.name}</span>
              <span className="text-xs text-blue-300/50">
                {r.code} · {r.market}
              </span>
            </button>
          ))}
        </div>
      )}

      {open && results.length === 0 && !loading && (
        <div className="absolute z-10 mt-2 w-full bg-slate-800/95 backdrop-blur-xl border border-white/[0.1] rounded-xl shadow-2xl p-4 text-center text-white/40 text-sm">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
}
