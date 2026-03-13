"use client";

import { useState } from "react";

interface StockDataType {
  currentPrice: number | null;
  marketCap: string | null;
  dailyChange: number | null;
  change5d: number | null;
  change20d: number | null;
  change60d: number | null;
  change120d: number | null;
  change240d: number | null;
  foreignOwnership: number | null;
  revenue: string | null;
  per: number | null;
  pbr: number | null;
  targetPrice: number | null;
  investmentOpinion: string | null;
  updatedAt: string;
}

interface StockNewsType {
  id: string;
  title: string;
  link: string;
  date: string | null;
}

interface StockType {
  id: string;
  stockCode: string;
  stockName: string;
  data: StockDataType | null;
  news: StockNewsType[];
}

interface StockCardProps {
  stock: StockType;
  onUpdate: (stockId: string) => Promise<void>;
  onDelete: (stockId: string) => Promise<void>;
}

function formatNumber(n: number | null | undefined): string {
  if (n == null) return "-";
  return n.toLocaleString("ko-KR");
}

function formatBigNumber(n: string | null | undefined): string {
  if (!n) return "-";
  const num = Number(n);
  if (isNaN(num)) return "-";
  if (Math.abs(num) >= 1_0000_0000_0000) {
    return `${(num / 1_0000_0000_0000).toFixed(1)}조`;
  }
  if (Math.abs(num) >= 1_0000_0000) {
    return `${(num / 1_0000_0000).toFixed(0)}억`;
  }
  if (Math.abs(num) >= 1_0000) {
    return `${(num / 1_0000).toFixed(0)}만`;
  }
  return num.toLocaleString("ko-KR");
}

function formatChange(n: number | null | undefined): string {
  if (n == null) return "-";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function changeColor(n: number | null | undefined): string {
  if (n == null) return "text-gray-400";
  if (n > 0) return "text-red-600";
  if (n < 0) return "text-blue-600";
  return "text-gray-600";
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const updated = new Date(dateStr);
  const diffMs = now.getTime() - updated.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return updated.toLocaleDateString("ko-KR");
}

export default function StockCard({ stock, onUpdate, onDelete }: StockCardProps) {
  const [updating, setUpdating] = useState(false);
  const d = stock.data;

  const handleUpdate = async () => {
    setUpdating(true);
    await onUpdate(stock.id);
    setUpdating(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      {/* Header + Update badge */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">{stock.stockName}</h3>
            <span className="text-xs text-gray-400">{stock.stockCode}</span>
          </div>
          {d ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {timeAgo(d.updatedAt)} 업데이트
              </span>
              <span className="text-xs text-gray-400">
                {new Date(d.updatedAt).toLocaleString("ko-KR")}
              </span>
            </div>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
              데이터 없음 - 업데이트 필요
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {d && (
            <div className="text-right">
              <p className={`text-xl font-bold ${changeColor(d.dailyChange)}`}>
                {formatNumber(d.currentPrice)}
                <span className="text-sm text-gray-400 ml-1">원</span>
              </p>
              <p className={`text-sm font-medium ${changeColor(d.dailyChange)}`}>
                {formatChange(d.dailyChange)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Section 1: 기업 개요 */}
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">기업 개요</h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-gray-50 rounded-lg">
          <DataItem label="시가총액" value={d ? formatBigNumber(d.marketCap) : "-"} />
          <DataItem label="매출액" value={d ? formatBigNumber(d.revenue) : "-"} />
          <DataItem label="PER" value={d?.per != null ? `${d.per.toFixed(1)}` : "-"} />
          <DataItem label="PBR" value={d?.pbr != null ? `${d.pbr.toFixed(2)}` : "-"} />
          <DataItem
            label="외국인보유"
            value={d?.foreignOwnership != null ? `${d.foreignOwnership.toFixed(2)}%` : "-"}
          />
        </div>
      </div>

      {/* Section 2: 등락률 */}
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">등락률</h4>
        <div className="grid grid-cols-5 gap-3 p-3 bg-gray-50 rounded-lg">
          <DataItem label="5일" value={d ? formatChange(d.change5d) : "-"} className={d ? changeColor(d.change5d) : "text-gray-400"} />
          <DataItem label="20일" value={d ? formatChange(d.change20d) : "-"} className={d ? changeColor(d.change20d) : "text-gray-400"} />
          <DataItem label="60일" value={d ? formatChange(d.change60d) : "-"} className={d ? changeColor(d.change60d) : "text-gray-400"} />
          <DataItem label="120일" value={d ? formatChange(d.change120d) : "-"} className={d ? changeColor(d.change120d) : "text-gray-400"} />
          <DataItem label="240일" value={d ? formatChange(d.change240d) : "-"} className={d ? changeColor(d.change240d) : "text-gray-400"} />
        </div>
      </div>

      {/* Section 3: 투자 의견 */}
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">투자 의견</h4>
        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
          <DataItem
            label="목표주가"
            value={d?.targetPrice ? `${formatNumber(d.targetPrice)}원` : "-"}
          />
          <DataItem
            label="투자의견"
            value={d?.investmentOpinion || "-"}
          />
        </div>
      </div>

      {/* News - always visible */}
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">관련 뉴스</h4>
        <div className="space-y-1.5 p-3 bg-gray-50 rounded-lg">
          {stock.news.length > 0 ? (
            stock.news.map((n) => (
              <a
                key={n.id}
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-blue-600 hover:underline truncate"
              >
                {n.title}
                {n.date && (
                  <span className="text-gray-400 ml-2 text-xs">{n.date}</span>
                )}
              </a>
            ))
          ) : (
            <p className="text-sm text-gray-400">뉴스 데이터 없음 - 업데이트를 눌러주세요</p>
          )}
          <a
            href={`https://finance.naver.com/item/news.naver?code=${stock.stockCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-gray-500 hover:text-blue-600 mt-2 text-right"
          >
            네이버증권 뉴스 더보기 →
          </a>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end items-center pt-3 border-t gap-2">
        <button
          onClick={handleUpdate}
          disabled={updating}
          className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          {updating ? "수집 중..." : "업데이트"}
        </button>
        <button
          onClick={() => onDelete(stock.id)}
          className="px-4 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

function DataItem({
  label,
  value,
  className = "text-gray-900",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm font-semibold ${className}`}>{value}</p>
    </div>
  );
}
