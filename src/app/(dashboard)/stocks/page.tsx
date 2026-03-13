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

export default function StocksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stocks, setStocks] = useState<StockType[]>([]);
  const [loading, setLoading] = useState(true);

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
    } else {
      alert("삭제에 실패했습니다.");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3">나의 주식 리스트</h2>
          <StockSearch onAdd={handleAdd} />
        </div>

        {stocks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-2">추적 중인 종목이 없습니다.</p>
            <p className="text-sm">위 검색창에서 종목을 검색하여 추가해보세요.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stocks.map((stock) => (
              <StockCard
                key={stock.id}
                stock={stock as never}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
