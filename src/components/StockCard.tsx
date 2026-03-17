"use client";

import { useState } from "react";

interface StockDataType {
  companyOverview: string | null;
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
  opinionDate: string | null;
  opinionPrevDiff: string | null;
  opinionBrokerage: string | null;
  opinionReport: string | null;
  institutionalBuyPeriod: string | null;
  retailAvgPrice: number | null;
  foreignOwnershipTrend: string | null;
  institutionalTrend: string | null;
  retailAvgPriceTrend: string | null;
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

function fmtNum(n: number | null | undefined): string {
  if (n == null) return "-";
  return n.toLocaleString("ko-KR");
}

function fmtDec(n: number | null | undefined, digits = 2): string {
  if (n == null) return "-";
  return Number(n.toFixed(digits)).toLocaleString("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function fmtBig(n: string | null | undefined): string {
  if (!n) return "-";
  const num = Number(n);
  if (isNaN(num)) return "-";
  if (Math.abs(num) >= 1_0000_0000_0000) return `${(num / 1_0000_0000_0000).toFixed(1)}조`;
  if (Math.abs(num) >= 1_0000_0000) return `${(num / 1_0000_0000).toFixed(0)}억`;
  if (Math.abs(num) >= 1_0000) return `${(num / 1_0000).toFixed(0)}만`;
  return num.toLocaleString("ko-KR");
}

function fmtChange(n: number | null | undefined): string {
  if (n == null) return "-";
  const sign = n > 0 ? "+" : "";
  return `${sign}${fmtDec(n)}%`;
}

function changeColor(n: number | null | undefined): string {
  if (n == null) return "";
  if (n > 0) return "text-rose-400";
  if (n < 0) return "text-blue-400";
  return "";
}

function fb(value: unknown): string {
  if (value != null && value !== "" && value !== "-") return "bg-emerald-500/10";
  return "";
}

function fmtEditNum(val: unknown): string {
  if (val == null || val === "") return "";
  const num = Number(String(val).replace(/,/g, ""));
  if (isNaN(num)) return String(val);
  return num.toLocaleString("ko-KR");
}

function stripCommas(s: string): string {
  return s.replace(/,/g, "");
}

type TrendValue = "증가" | "횡보" | "감소" | null;
const TREND_OPTIONS: TrendValue[] = ["증가", "횡보", "감소"];

const ALL_KEYS = [
  "currentPrice", "marketCap", "dailyChange", "change5d", "change20d",
  "change60d", "change120d", "change240d", "foreignOwnership", "revenue",
  "operatingProfit", "per", "pbr", "roe", "evEbitda", "eps", "bps", "dps",
  "dividendYield", "ipoPrice", "creditRatio", "targetPrice", "investmentOpinion",
  "opinionDate", "opinionPrevDiff", "opinionBrokerage", "opinionReport",
  "institutionalBuyPeriod", "retailAvgPrice",
  "foreignOwnershipTrend", "institutionalTrend", "retailAvgPriceTrend",
];

const STRING_FIELDS = new Set([
  "investmentOpinion", "opinionDate", "opinionPrevDiff", "opinionBrokerage",
  "opinionReport", "institutionalBuyPeriod",
  "foreignOwnershipTrend", "institutionalTrend", "retailAvgPriceTrend",
]);

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
      const values: Record<string, string> = {};
      for (const key of ALL_KEYS) {
        const val = (d as unknown as Record<string, unknown>)[key];
        if (val == null) {
          values[key] = "";
        } else if (STRING_FIELDS.has(key)) {
          values[key] = String(val);
        } else {
          values[key] = fmtEditNum(val);
        }
      }
      setEditValues(values);
    }
    setEditing(!editing);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fields: Record<string, unknown> = {};
      for (const key of ALL_KEYS) {
        const raw = editValues[key];
        if (raw === "" || raw == null) {
          fields[key] = null;
        } else if (STRING_FIELDS.has(key)) {
          fields[key] = raw;
        } else {
          const num = Number(stripCommas(raw));
          if (!isNaN(num)) fields[key] = num;
        }
      }
      await onEdit(stock.id, fields);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleTrendChange = async (field: string, value: TrendValue) => {
    await onEdit(stock.id, { [field]: value });
  };

  const updateEditValue = (key: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };

  const th = "border border-white/[0.06] px-2 py-2 text-xs font-semibold text-white/50 bg-white/[0.03] text-center";
  const td = "border border-white/[0.06] px-2 py-2 text-sm text-white/80 text-center";

  const ei = (key: string, placeholder = "-") => (
    <input
      type="text"
      value={editValues[key] ?? ""}
      onChange={(e) => updateEditValue(key, e.target.value)}
      className="w-full text-center text-sm border-0 bg-amber-500/10 text-amber-200 focus:outline-none focus:bg-amber-500/20 rounded px-1"
      placeholder={placeholder}
    />
  );

  const cardStyle = editing
    ? "backdrop-blur-xl bg-white/[0.05] rounded-2xl border-2 border-amber-500/40 p-5 relative shadow-xl shadow-amber-500/5"
    : "backdrop-blur-xl bg-white/[0.04] rounded-2xl border border-white/[0.08] p-5 shadow-xl shadow-black/20";

  return (
    <div className={cardStyle}>
      {editing && (
        <div className="absolute -top-2.5 left-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-0.5 rounded-full shadow-lg shadow-amber-500/30">
          수정 중
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-emerald-400">{stock.stockName}</h3>
          <span className="text-xs text-white/30">{stock.stockCode}</span>
          {d && (
            <span className="text-xs text-white/20 ml-2">
              ({new Date(d.updatedAt).toLocaleString("ko-KR")} 업데이트)
            </span>
          )}
        </div>
        {d && (
          <div className="text-right">
            <span className={`text-xl font-bold ${changeColor(d.dailyChange)} ${!changeColor(d.dailyChange) ? "text-white" : ""}`}>
              {fmtNum(d.currentPrice)}원
            </span>
            <span className={`text-sm ml-2 ${changeColor(d.dailyChange)}`}>
              {fmtChange(d.dailyChange)}
            </span>
          </div>
        )}
      </div>

      {/* 기업개요 */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-white/70 mb-2">기업개요</h4>
        <div className={`border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white/60 leading-relaxed ${fb(d?.companyOverview)}`}>
          {d?.companyOverview || "기업개요 정보 없음 - 동기화를 눌러주세요"}
        </div>
        <table className="w-full border-collapse table-fixed mt-2">
          <thead>
            <tr>
              <th className={th}>현재가</th>
              <th className={th}>시총금액</th>
              <th className={th}>PER</th>
              <th className={th}>PBR</th>
              <th className={th}>ROE</th>
              <th className={th}>EV/EBITDA</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={`${td} ${fb(d?.currentPrice)} font-semibold`}>
                {editing ? ei("currentPrice") : (d?.currentPrice != null ? `${fmtNum(d.currentPrice)}원` : "-")}
              </td>
              <td className={`${td} ${fb(d?.marketCap)}`}>
                {editing ? ei("marketCap") : fmtBig(d?.marketCap)}
              </td>
              <td className={`${td} ${fb(d?.per)}`}>
                {editing ? ei("per") : (d?.per != null ? fmtDec(d.per) : "-")}
              </td>
              <td className={`${td} ${fb(d?.pbr)}`}>
                {editing ? ei("pbr") : (d?.pbr != null ? fmtDec(d.pbr) : "-")}
              </td>
              <td className={`${td} ${fb(d?.roe)}`}>
                {editing ? ei("roe") : (d?.roe != null ? `${fmtDec(d.roe)}%` : "-")}
              </td>
              <td className={`${td} ${fb(d?.evEbitda)}`}>
                {editing ? ei("evEbitda") : (d?.evEbitda != null ? fmtDec(d.evEbitda) : "-")}
              </td>
            </tr>
          </tbody>
        </table>
        <table className="w-full border-collapse table-fixed -mt-px">
          <thead>
            <tr>
              <th className={th}>공모가</th>
              <th className={th}>매출액</th>
              <th className={th}>영업이익</th>
              <th className={th}>신용잔고비율</th>
              <th className={th}>배당금</th>
              <th className={th}>배당수익률</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={`${td} ${fb(d?.ipoPrice)}`}>
                {editing ? ei("ipoPrice") : (d?.ipoPrice != null ? `${fmtNum(d.ipoPrice)}원` : "-")}
              </td>
              <td className={`${td} ${fb(d?.revenue)}`}>
                {editing ? ei("revenue") : fmtBig(d?.revenue)}
              </td>
              <td className={`${td} ${fb(d?.operatingProfit)}`}>
                {editing ? ei("operatingProfit") : fmtBig(d?.operatingProfit)}
              </td>
              <td className={`${td} ${fb(d?.creditRatio)}`}>
                {editing ? ei("creditRatio") : (d?.creditRatio != null ? `${fmtDec(d.creditRatio)}%` : "-")}
              </td>
              <td className={`${td} ${fb(d?.dps)}`}>
                {editing ? ei("dps") : (d?.dps != null ? `${fmtNum(d.dps)}원` : "-")}
              </td>
              <td className={`${td} ${fb(d?.dividendYield)}`}>
                {editing ? ei("dividendYield") : (d?.dividendYield != null ? `${fmtDec(d.dividendYield)}%` : "-")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 투자의견 */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-white/70 mb-2">투자의견</h4>
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr>
              <th className={th}>일자</th>
              <th className={th}>목표주가</th>
              <th className={th}>이전대비</th>
              <th className={th}>투자의견</th>
              <th className={th}>증권사</th>
              <th className={th}>리포트</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={`${td} ${fb(d?.opinionDate)}`}>
                {editing ? ei("opinionDate", "2025-03-13") : (d?.opinionDate || "-")}
              </td>
              <td className={`${td} ${fb(d?.targetPrice)}`}>
                {editing ? ei("targetPrice") : (d?.targetPrice ? `${fmtNum(d.targetPrice)}원` : "-")}
              </td>
              <td className={`${td} ${fb(d?.opinionPrevDiff)}`}>
                {editing ? ei("opinionPrevDiff", "+10%") : (d?.opinionPrevDiff || (
                  d?.targetPrice && d?.currentPrice
                    ? `${(((d.targetPrice - d.currentPrice) / d.currentPrice) * 100).toFixed(1)}%`
                    : "-"
                ))}
              </td>
              <td className={`${td} ${fb(d?.investmentOpinion)}`}>
                {editing ? ei("investmentOpinion", "매수") : (d?.investmentOpinion || "-")}
              </td>
              <td className={`${td} ${fb(d?.opinionBrokerage)}`}>
                {editing ? ei("opinionBrokerage", "증권사명") : (d?.opinionBrokerage || "-")}
              </td>
              <td className={`${td} ${fb(d?.opinionReport)}`}>
                {editing ? ei("opinionReport", "리포트명") : (d?.opinionReport || "-")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 등락률 */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-white/70 mb-2">등락률</h4>
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr>
              <th className={th}>오늘</th>
              <th className={th}>5일</th>
              <th className={th}>20일</th>
              <th className={th}>60일</th>
              <th className={th}>120일</th>
              <th className={th}>250일</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={`${td} ${fb(d?.dailyChange)} ${changeColor(d?.dailyChange)} font-semibold`}>
                {editing ? ei("dailyChange") : fmtChange(d?.dailyChange)}
              </td>
              <td className={`${td} ${fb(d?.change5d)} ${changeColor(d?.change5d)} font-semibold`}>
                {editing ? ei("change5d") : fmtChange(d?.change5d)}
              </td>
              <td className={`${td} ${fb(d?.change20d)} ${changeColor(d?.change20d)} font-semibold`}>
                {editing ? ei("change20d") : fmtChange(d?.change20d)}
              </td>
              <td className={`${td} ${fb(d?.change60d)} ${changeColor(d?.change60d)} font-semibold`}>
                {editing ? ei("change60d") : fmtChange(d?.change60d)}
              </td>
              <td className={`${td} ${fb(d?.change120d)} ${changeColor(d?.change120d)} font-semibold`}>
                {editing ? ei("change120d") : fmtChange(d?.change120d)}
              </td>
              <td className={`${td} ${fb(d?.change240d)} ${changeColor(d?.change240d)} font-semibold`}>
                {editing ? ei("change240d") : fmtChange(d?.change240d)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 투자자 동향 */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-white/70 mb-2">투자자 동향</h4>
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr>
              <th colSpan={2} className={`${th} w-[33.333%]`}>외국인보유</th>
              <th colSpan={2} className={`${th} w-[33.333%]`}>기관매수추이</th>
              <th colSpan={2} className={`${th} w-[33.333%]`}>개인평단가</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2} className={`${td} w-[33.333%] ${fb(d?.foreignOwnership)} font-semibold`}>
                {editing
                  ? ei("foreignOwnership")
                  : (d?.foreignOwnership != null ? `${fmtDec(d.foreignOwnership)}%` : "-")}
              </td>
              <td colSpan={2} className={`${td} w-[33.333%] font-semibold`}>
                {editing ? ei("institutionalBuyPeriod", "매수기간 4/9") : (
                  d?.institutionalBuyPeriod
                    ? <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-lg text-xs">{d.institutionalBuyPeriod}</span>
                    : "-"
                )}
              </td>
              <td colSpan={2} className={`${td} w-[33.333%] font-semibold`}>
                {editing ? ei("retailAvgPrice", "25,000") : (
                  d?.retailAvgPrice != null
                    ? <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-lg text-xs">{fmtNum(d.retailAvgPrice)}원</span>
                    : "-"
                )}
              </td>
            </tr>
            <tr>
              <td colSpan={2} className={`${td} w-[33.333%]`}>
                <TrendCheckboxes
                  value={(d?.foreignOwnershipTrend as TrendValue) || null}
                  onChange={(v) => handleTrendChange("foreignOwnershipTrend", v)}
                />
              </td>
              <td colSpan={2} className={`${td} w-[33.333%]`}>
                <TrendCheckboxes
                  value={(d?.institutionalTrend as TrendValue) || null}
                  onChange={(v) => handleTrendChange("institutionalTrend", v)}
                />
              </td>
              <td colSpan={2} className={`${td} w-[33.333%]`}>
                <TrendCheckboxes
                  value={(d?.retailAvgPriceTrend as TrendValue) || null}
                  onChange={(v) => handleTrendChange("retailAvgPriceTrend", v)}
                />
              </td>
            </tr>
          </tbody>
        </table>
        <p className="text-xs text-white/20 mt-1.5">* 증가/횡보/감소는 체크하면 바로 반영</p>
      </div>

      {/* 관련뉴스 */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-white/70 mb-2">관련뉴스</h4>
        <div className="border border-white/[0.06] rounded-xl overflow-hidden">
          {stock.news.length > 0 ? (
            stock.news.map((n) => (
              <a
                key={n.id}
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2.5 text-sm text-blue-300/80 hover:bg-white/[0.04] border-b border-white/[0.04] last:border-b-0 truncate transition"
              >
                {n.title}
                {n.date && <span className="text-white/20 ml-2 text-xs">{n.date}</span>}
              </a>
            ))
          ) : (
            <>
              <div className="px-3 py-2.5 border-b border-white/[0.04] text-sm text-white/10">&nbsp;</div>
              <div className="px-3 py-2.5 border-b border-white/[0.04] text-sm text-white/10">&nbsp;</div>
              <div className="px-3 py-2.5 text-sm text-white/10">&nbsp;</div>
            </>
          )}
        </div>
      </div>

      {/* 외부 링크 */}
      <div className="flex justify-center gap-8 mb-4 text-sm">
        <a
          href={`https://finance.daum.net/quotes/A${stock.stockCode}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400/70 hover:text-blue-300 inline-flex items-center gap-1.5 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          다음증권 더보기
        </a>
        <a
          href={`https://finance.naver.com/item/main.naver?code=${stock.stockCode}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400/70 hover:text-blue-300 inline-flex items-center gap-1.5 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          네이버증권 더보기
        </a>
      </div>

      {/* 안내 문구 */}
      <p className="text-xs text-white/20 mb-4 text-center">
        * <span className="bg-emerald-500/10 text-emerald-400/60 px-1.5 py-0.5 rounded">초록색 배경</span>은 동기화로 가져온 정보입니다.
      </p>

      {/* 액션 버튼 */}
      <div className="flex justify-end items-center pt-4 border-t border-white/[0.06] gap-2">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
            <button
              onClick={handleEditToggle}
              className="px-5 py-2 text-sm bg-white/[0.06] text-white/60 rounded-xl font-medium hover:bg-white/[0.1] transition"
            >
              취소
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleEditToggle}
              className="px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20"
            >
              직접 수정
            </button>
            <button
              onClick={handleUpdate}
              disabled={updating}
              className="px-4 py-2 text-sm bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-green-600 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {updating ? "수집 중..." : "동기화"}
            </button>
            <button
              onClick={() => onDelete(stock.id)}
              className="px-4 py-2 text-sm bg-white/[0.06] text-rose-400/80 rounded-xl font-medium hover:bg-rose-500/10 transition"
            >
              삭제
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function TrendCheckboxes({
  value,
  onChange,
}: {
  value: TrendValue;
  onChange: (v: TrendValue) => void;
}) {
  return (
    <div className="flex justify-center gap-3 text-xs">
      {TREND_OPTIONS.map((option) => (
        <label key={option} className="flex items-center gap-0.5 cursor-pointer">
          <input
            type="checkbox"
            checked={value === option}
            onChange={() => onChange(value === option ? null : option)}
            className="w-3 h-3 rounded border-white/20 bg-white/[0.06] accent-emerald-500"
          />
          <span className={value === option ? "font-bold text-emerald-400" : "text-white/40"}>
            {option}
          </span>
        </label>
      ))}
    </div>
  );
}
