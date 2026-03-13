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
  operatingProfit: string | null;
  per: number | null;
  pbr: number | null;
  roe: number | null;
  evEbitda: number | null;
  eps: number | null;
  bps: number | null;
  dps: number | null;
  dividendYield: number | null;
  ipoPrice: number | null;
  creditRatio: number | null;
  targetPrice: number | null;
  investmentOpinion: string | null;
  isManualEdit: boolean;
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
  onEdit: (stockId: string, fields: Record<string, unknown>) => Promise<void>;
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

// Fields that are editable in manual edit mode
const EDITABLE_NUMERIC_FIELDS: Array<{
  key: string;
  label: string;
  format: (v: unknown) => string;
  isBigInt?: boolean;
}> = [
  { key: "currentPrice", label: "현재가", format: (v) => formatNumber(v as number) },
  { key: "marketCap", label: "시가총액", format: (v) => formatBigNumber(v as string), isBigInt: true },
  { key: "dailyChange", label: "일간등락", format: (v) => formatChange(v as number) },
  { key: "change5d", label: "5일", format: (v) => formatChange(v as number) },
  { key: "change20d", label: "20일", format: (v) => formatChange(v as number) },
  { key: "change60d", label: "60일", format: (v) => formatChange(v as number) },
  { key: "change120d", label: "120일", format: (v) => formatChange(v as number) },
  { key: "change240d", label: "240일", format: (v) => formatChange(v as number) },
  { key: "foreignOwnership", label: "외국인보유", format: (v) => v != null ? `${(v as number).toFixed(2)}%` : "-" },
  { key: "revenue", label: "매출액", format: (v) => formatBigNumber(v as string), isBigInt: true },
  { key: "operatingProfit", label: "영업이익", format: (v) => formatBigNumber(v as string), isBigInt: true },
  { key: "per", label: "PER", format: (v) => v != null ? `${(v as number).toFixed(1)}` : "-" },
  { key: "pbr", label: "PBR", format: (v) => v != null ? `${(v as number).toFixed(2)}` : "-" },
  { key: "roe", label: "ROE", format: (v) => v != null ? `${(v as number).toFixed(2)}%` : "-" },
  { key: "evEbitda", label: "EV/EBITDA", format: (v) => v != null ? `${(v as number).toFixed(1)}` : "-" },
  { key: "eps", label: "EPS", format: (v) => formatNumber(v as number) },
  { key: "bps", label: "BPS", format: (v) => formatNumber(v as number) },
  { key: "dps", label: "DPS", format: (v) => formatNumber(v as number) },
  { key: "dividendYield", label: "배당수익률", format: (v) => v != null ? `${(v as number).toFixed(2)}%` : "-" },
  { key: "ipoPrice", label: "공모가", format: (v) => formatNumber(v as number) },
  { key: "creditRatio", label: "신용잔고비율", format: (v) => v != null ? `${(v as number).toFixed(2)}%` : "-" },
  { key: "targetPrice", label: "목표주가", format: (v) => v != null ? `${formatNumber(v as number)}원` : "-" },
  { key: "investmentOpinion", label: "투자의견", format: (v) => (v as string) || "-" },
];

export default function StockCard({ stock, onUpdate, onDelete, onEdit }: StockCardProps) {
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const d = stock.data;

  const handleUpdate = async () => {
    setUpdating(true);
    await onUpdate(stock.id);
    setUpdating(false);
  };

  const handleEditToggle = () => {
    if (!editing && d) {
      // Initialize edit values from current data
      const values: Record<string, string> = {};
      for (const field of EDITABLE_NUMERIC_FIELDS) {
        const val = (d as unknown as Record<string, unknown>)[field.key];
        values[field.key] = val != null ? String(val) : "";
      }
      setEditValues(values);
    }
    setEditing(!editing);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fields: Record<string, unknown> = {};
      for (const field of EDITABLE_NUMERIC_FIELDS) {
        const raw = editValues[field.key];
        if (raw === "" || raw == null) {
          fields[field.key] = null;
        } else if (field.key === "investmentOpinion") {
          fields[field.key] = raw;
        } else {
          const num = Number(raw);
          if (!isNaN(num)) {
            fields[field.key] = num;
          }
        }
      }
      await onEdit(stock.id, fields);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const updateEditValue = (key: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      {/* Header */}
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

      {/* 기업개요 */}
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">기업 개요</h4>
        <div className="grid grid-cols-5 gap-3 p-3 bg-gray-50 rounded-lg">
          <EditableItem editing={editing} field="marketCap" label="시가총액" value={d ? formatBigNumber(d.marketCap) : "-"} editValue={editValues.marketCap} onChange={updateEditValue} />
          <EditableItem editing={editing} field="per" label="PER" value={d?.per != null ? `${d.per.toFixed(1)}` : "-"} editValue={editValues.per} onChange={updateEditValue} />
          <EditableItem editing={editing} field="pbr" label="PBR" value={d?.pbr != null ? `${d.pbr.toFixed(2)}` : "-"} editValue={editValues.pbr} onChange={updateEditValue} />
          <EditableItem editing={editing} field="roe" label="ROE" value={d?.roe != null ? `${d.roe.toFixed(2)}%` : "-"} editValue={editValues.roe} onChange={updateEditValue} />
          <EditableItem editing={editing} field="evEbitda" label="EV/EBITDA" value={d?.evEbitda != null ? `${d.evEbitda.toFixed(1)}` : "-"} editValue={editValues.evEbitda} onChange={updateEditValue} />
        </div>
        <div className="grid grid-cols-5 gap-3 p-3 bg-gray-50 rounded-lg mt-1">
          <EditableItem editing={editing} field="revenue" label="매출액" value={d ? formatBigNumber(d.revenue) : "-"} editValue={editValues.revenue} onChange={updateEditValue} />
          <EditableItem editing={editing} field="operatingProfit" label="영업이익" value={d ? formatBigNumber(d.operatingProfit) : "-"} editValue={editValues.operatingProfit} onChange={updateEditValue} />
          <EditableItem editing={editing} field="eps" label="EPS" value={d?.eps != null ? formatNumber(d.eps) : "-"} editValue={editValues.eps} onChange={updateEditValue} />
          <EditableItem editing={editing} field="bps" label="BPS" value={d?.bps != null ? formatNumber(d.bps) : "-"} editValue={editValues.bps} onChange={updateEditValue} />
          <EditableItem editing={editing} field="dividendYield" label="배당수익률" value={d?.dividendYield != null ? `${d.dividendYield.toFixed(2)}%` : "-"} editValue={editValues.dividendYield} onChange={updateEditValue} />
        </div>
      </div>

      {/* 투자의견 */}
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">투자 의견</h4>
        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
          <EditableItem editing={editing} field="targetPrice" label="목표주가" value={d?.targetPrice ? `${formatNumber(d.targetPrice)}원` : "-"} editValue={editValues.targetPrice} onChange={updateEditValue} />
          <EditableItem editing={editing} field="investmentOpinion" label="투자의견" value={d?.investmentOpinion || "-"} editValue={editValues.investmentOpinion} onChange={updateEditValue} />
        </div>
      </div>

      {/* 등락률 */}
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">등락률</h4>
        <div className="grid grid-cols-6 gap-3 p-3 bg-gray-50 rounded-lg">
          <EditableItem editing={editing} field="dailyChange" label="오늘" value={d ? formatChange(d.dailyChange) : "-"} className={d ? changeColor(d.dailyChange) : "text-gray-400"} editValue={editValues.dailyChange} onChange={updateEditValue} />
          <EditableItem editing={editing} field="change5d" label="5일" value={d ? formatChange(d.change5d) : "-"} className={d ? changeColor(d.change5d) : "text-gray-400"} editValue={editValues.change5d} onChange={updateEditValue} />
          <EditableItem editing={editing} field="change20d" label="20일" value={d ? formatChange(d.change20d) : "-"} className={d ? changeColor(d.change20d) : "text-gray-400"} editValue={editValues.change20d} onChange={updateEditValue} />
          <EditableItem editing={editing} field="change60d" label="60일" value={d ? formatChange(d.change60d) : "-"} className={d ? changeColor(d.change60d) : "text-gray-400"} editValue={editValues.change60d} onChange={updateEditValue} />
          <EditableItem editing={editing} field="change120d" label="120일" value={d ? formatChange(d.change120d) : "-"} className={d ? changeColor(d.change120d) : "text-gray-400"} editValue={editValues.change120d} onChange={updateEditValue} />
          <EditableItem editing={editing} field="change240d" label="240일" value={d ? formatChange(d.change240d) : "-"} className={d ? changeColor(d.change240d) : "text-gray-400"} editValue={editValues.change240d} onChange={updateEditValue} />
        </div>
      </div>

      {/* 투자자 동향 */}
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">투자자 동향</h4>
        <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
          <EditableItem editing={editing} field="foreignOwnership" label="외국인보유" value={d?.foreignOwnership != null ? `${d.foreignOwnership.toFixed(2)}%` : "-"} editValue={editValues.foreignOwnership} onChange={updateEditValue} />
          <EditableItem editing={editing} field="ipoPrice" label="공모가" value={d?.ipoPrice != null ? `${formatNumber(d.ipoPrice)}원` : "-"} editValue={editValues.ipoPrice} onChange={updateEditValue} />
          <EditableItem editing={editing} field="creditRatio" label="신용잔고비율" value={d?.creditRatio != null ? `${d.creditRatio.toFixed(2)}%` : "-"} editValue={editValues.creditRatio} onChange={updateEditValue} />
        </div>
      </div>

      {/* 관련 뉴스 */}
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

      {/* 하단 링크 */}
      <div className="flex gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
        <a
          href={`https://finance.daum.net/quotes/A${stock.stockCode}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-blue-600"
        >
          다음증권 더보기 →
        </a>
        <a
          href={`https://finance.naver.com/item/main.naver?code=${stock.stockCode}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-blue-600"
        >
          네이버증권 더보기 →
        </a>
      </div>

      {/* 직접작성 체크박스 + 저장 */}
      <div className="flex items-center gap-3 mb-3">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={editing}
            onChange={handleEditToggle}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-600">직접작성</span>
        </label>
        {editing && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        )}
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

function EditableItem({
  label,
  value,
  className = "text-gray-900",
  editing,
  field,
  editValue,
  onChange,
}: {
  label: string;
  value: string;
  className?: string;
  editing: boolean;
  field: string;
  editValue?: string;
  onChange: (key: string, value: string) => void;
}) {
  if (editing) {
    return (
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <input
          type="text"
          value={editValue ?? ""}
          onChange={(e) => onChange(field, e.target.value)}
          className="w-full text-sm border border-gray-300 rounded px-1.5 py-0.5 mt-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="-"
        />
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm font-semibold ${className}`}>{value}</p>
    </div>
  );
}
