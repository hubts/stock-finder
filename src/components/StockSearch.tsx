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
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="종목명 또는 코드로 검색..."
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "검색 중..." : "검색"}
        </button>
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.code}
              onClick={() => {
                onAdd(r.code, r.name);
                setOpen(false);
                setQuery("");
                setResults([]);
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex justify-between items-center border-b last:border-b-0"
            >
              <span className="font-medium">{r.name}</span>
              <span className="text-sm text-gray-400">
                {r.code} · {r.market}
              </span>
            </button>
          ))}
        </div>
      )}

      {open && results.length === 0 && !loading && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
}
