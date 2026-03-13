const DAUM_API_BASE = "https://finance.daum.net/api";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function makeHeaders(stockCode?: string) {
  return {
    Referer: stockCode
      ? `https://finance.daum.net/quotes/A${stockCode}`
      : "https://finance.daum.net",
    "User-Agent": UA,
    Accept: "application/json, text/plain, */*",
  };
}

interface DaumChartItem {
  date: string;
  tradePrice: number;
}

export interface DaumQuoteResult {
  stockName: string;
  currentPrice: number;
  marketCap: number;
  dailyChange: number;
  foreignOwnership: number | null;
  revenue: number | null;
  operatingProfit: number | null;
  per: number | null;
  pbr: number | null;
  eps: number | null;
  bps: number | null;
  dps: number | null;
}

export async function fetchDaumQuote(
  stockCode: string
): Promise<DaumQuoteResult> {
  const url = `${DAUM_API_BASE}/quotes/A${stockCode}?summary=false&changeStatistics=true`;
  const res = await fetch(url, { headers: makeHeaders(stockCode) });

  if (!res.ok) {
    throw new Error(`Daum quote fetch failed: ${res.status}`);
  }

  const data = await res.json();

  return {
    stockName: data.name as string,
    currentPrice: data.tradePrice as number,
    marketCap: data.marketCap as number,
    dailyChange: (data.changeRate ?? 0) * 100,
    foreignOwnership: data.foreignRatio != null
      ? data.foreignRatio * 100
      : null,
    revenue: data.sales ?? null,
    operatingProfit: data.operatingProfit ?? null,
    per: data.per ?? null,
    pbr: data.pbr ?? null,
    eps: data.eps ?? null,
    bps: data.bps ?? null,
    dps: data.dps ?? null,
  };
}

export async function fetchDaumChart(
  stockCode: string,
  limit: number = 250
): Promise<DaumChartItem[]> {
  const url = `${DAUM_API_BASE}/charts/A${stockCode}/days?limit=${limit}&adjusted=true`;
  const res = await fetch(url, { headers: makeHeaders(stockCode) });

  if (!res.ok) {
    console.warn(`Daum chart fetch failed: ${res.status}`);
    return [];
  }

  const data = await res.json();
  return (data.data || []).map((item: Record<string, unknown>) => ({
    date: item.date as string,
    tradePrice: item.tradePrice as number,
  }));
}

export function calculateChangeRates(
  chart: DaumChartItem[],
  currentPrice: number
) {
  const getChange = (daysAgo: number): number | null => {
    if (chart.length < daysAgo) return null;
    const pastPrice = chart[daysAgo - 1]?.tradePrice;
    if (!pastPrice) return null;
    return ((currentPrice - pastPrice) / pastPrice) * 100;
  };

  return {
    change5d: getChange(5),
    change20d: getChange(20),
    change60d: getChange(60),
    change120d: getChange(120),
    change240d: getChange(240),
  };
}

export async function fetchDaumConsensus(
  stockCode: string
): Promise<{ targetPrice: number | null; investmentOpinion: string | null }> {
  // Try multiple possible API paths for investment/consensus data
  const paths = [
    `/quotes/A${stockCode}/investment`,
    `/analysis/A${stockCode}`,
    `/consensus/A${stockCode}`,
    `/investments/A${stockCode}`,
  ];

  for (const path of paths) {
    try {
      const res = await fetch(`${DAUM_API_BASE}${path}`, {
        headers: makeHeaders(stockCode),
      });
      if (!res.ok) continue;

      const data = await res.json();

      // Try to extract target price and opinion from various response shapes
      const targetPrice =
        data.targetPrice ??
        data.consensusTargetPrice ??
        data.target_price ??
        data.avgTargetPrice ??
        null;

      const investmentOpinion =
        data.investmentOpinion ??
        data.consensusOpinion ??
        data.opinion ??
        data.avgOpinion ??
        null;

      if (targetPrice || investmentOpinion) {
        return {
          targetPrice: targetPrice ? Number(targetPrice) : null,
          investmentOpinion: investmentOpinion ? String(investmentOpinion) : null,
        };
      }
    } catch {
      continue;
    }
  }

  return { targetPrice: null, investmentOpinion: null };
}

export async function searchDaumStocks(query: string) {
  const url = `${DAUM_API_BASE}/search?q=${encodeURIComponent(query)}&type=stock`;
  const res = await fetch(url, { headers: makeHeaders() });

  if (!res.ok) {
    throw new Error(`Daum search failed: ${res.status}`);
  }

  const data = await res.json();
  const items = data.suggestItems || [];

  return items
    .filter(
      (item: Record<string, unknown>) =>
        item.symbolCode && (item.symbolCode as string).startsWith("A")
    )
    .map((item: Record<string, unknown>) => ({
      code: (item.symbolCode as string).replace("A", ""),
      name: item.koreanName as string,
      market: (item.symbolCode as string).startsWith("A") ? "KRX" : "",
    }))
    .slice(0, 20);
}
