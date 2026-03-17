"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import StockSearch from "@/components/StockSearch";
import StockCard from "@/components/StockCard";

interface StockType {
  id: string;
  stockCode: string;
  stockName: string;
  data: Record<string, unknown> | null;
  news: Array<{ id: string; title: string; link: string; date: string | null }>;
}

function fmtNum(n: number | null | undefined): string {
  if (n == null) return "-";
  return n.toLocaleString("ko-KR");
}

function fmtChange(n: number | null | undefined): string {
  if (n == null) return "-";
  const sign = n > 0 ? "+" : "";
  return `${sign}${Number(n.toFixed(2)).toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function changeColor(n: number | null | undefined): string {
  if (n == null) return "text-white/30";
  if (n > 0) return "text-rose-400";
  if (n < 0) return "text-blue-400";
  return "text-white/60";
}

function changeBg(n: number | null | undefined): string {
  if (n == null) return "";
  if (n > 0) return "bg-rose-500/10 text-rose-400";
  if (n < 0) return "bg-blue-500/10 text-blue-400";
  return "";
}

export default function StocksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stocks, setStocks] = useState<StockType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchStocks = useCallback(async () => {
    try {
      const res = await fetch("/api/stocks");
      if (res.ok) {
        const data = await res.json();
        setStocks(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchStocks();
    }
  }, [status, fetchStocks]);

  const handleAdd = async (code: string, name: string) => {
    const res = await fetch("/api/stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockCode: code, stockName: name }),
    });

    if (res.ok) {
      fetchStocks();
    } else {
      const data = await res.json();
      alert(data.error || "추가에 실패했습니다.");
    }
  };

  const handleUpdate = async (stockId: string) => {
    try {
      const res = await fetch("/api/stocks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockId }),
      });

      if (res.ok) {
        await fetchStocks();
      } else {
        const data = await res.json();
        alert(data.error || "업데이트에 실패했습니다.");
      }
    } catch {
      alert("업데이트 중 오류가 발생했습니다.");
    }
  };

  const handleEdit = async (stockId: string, fields: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/stocks/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockId, fields }),
      });

      if (res.ok) {
        await fetchStocks();
      } else {
        const data = await res.json();
        alert(data.error || "저장에 실패했습니다.");
      }
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (stockId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const res = await fetch(`/api/stocks?id=${stockId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setStocks((prev) => prev.filter((s) => s.id !== stockId));
      if (selectedId === stockId) setSelectedId(null);
    } else {
      alert("삭제에 실패했습니다.");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-400/20 border-t-blue-400 rounded-full animate-spin mb-3" />
          <p className="text-white/40 text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const selectedStock = stocks.find((s) => s.id === selectedId);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background texture */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/50 pointer-events-none" />
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-6">
          {/* Header & Search */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">나의 주식 리스트</h2>
              <span className="text-sm text-white/30">{stocks.length}개 종목</span>
            </div>
            <StockSearch onAdd={handleAdd} />
          </div>

          {stocks.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/[0.04] border border-white/[0.06] rounded-2xl mb-4">
                <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-white/50 mb-1">추적 중인 종목이 없습니다.</p>
              <p className="text-sm text-white/30">위 검색창에서 종목을 검색하여 추가해보세요.</p>
            </div>
          ) : (
            <>
              {/* Stock List Table */}
              <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden mb-6 shadow-xl shadow-black/20">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">종목</th>
                      <th className="text-right px-4 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">현재가</th>
                      <th className="text-right px-4 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">등락률</th>
                      <th className="text-right px-4 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider hidden sm:table-cell">PER</th>
                      <th className="text-right px-4 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider hidden md:table-cell">목표주가</th>
                      <th className="text-right px-4 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">업데이트</th>
                      <th className="text-center px-4 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider w-20">상세</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {stocks.map((stock) => {
                      const d = stock.data as Record<string, unknown> | null;
                      const price = d?.currentPrice as number | null;
                      const dailyChange = d?.dailyChange as number | null;
                      const per = d?.per as number | null;
                      const targetPrice = d?.targetPrice as number | null;
                      const updatedAt = d?.updatedAt as string | null;
                      const isSelected = selectedId === stock.id;

                      return (
                        <tr
                          key={stock.id}
                          className={`transition-colors hover:bg-white/[0.03] ${isSelected ? "bg-blue-500/[0.08]" : ""}`}
                        >
                          <td className="px-4 py-3.5">
                            <div>
                              <div className="font-semibold text-white text-sm">{stock.stockName}</div>
                              <div className="text-xs text-white/30">{stock.stockCode}</div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <span className={`font-semibold text-sm ${price ? changeColor(dailyChange) : "text-white/30"}`}>
                              {price ? `${fmtNum(price)}` : "-"}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            {dailyChange != null ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ${changeBg(dailyChange)}`}>
                                {fmtChange(dailyChange)}
                              </span>
                            ) : (
                              <span className="text-white/30 text-sm">-</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                            <span className="text-sm text-white/50">
                              {per != null ? per.toFixed(2) : "-"}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-right hidden md:table-cell">
                            <span className="text-sm text-white/50">
                              {targetPrice ? `${fmtNum(targetPrice)}` : "-"}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <span className="text-xs text-white/30">
                              {updatedAt
                                ? new Date(updatedAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                                : "미동기화"}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => setSelectedId(isSelected ? null : stock.id)}
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                                isSelected
                                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                                  : "bg-white/[0.06] text-white/40 hover:bg-white/[0.1] hover:text-white/60"
                              }`}
                            >
                              <svg
                                className={`w-4 h-4 transition-transform ${isSelected ? "rotate-180" : ""}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Selected Stock Detail */}
              {selectedStock && (
                <div className="animate-in">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-bold text-white">{selectedStock.stockName} 상세정보</h3>
                    <button
                      onClick={() => setSelectedId(null)}
                      className="text-white/30 hover:text-white/60 transition"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <StockCard
                    stock={selectedStock as never}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
