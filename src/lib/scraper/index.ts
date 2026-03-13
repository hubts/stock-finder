import {
  fetchDaumQuote,
  fetchDaumChart,
  fetchDaumConsensus,
  calculateChangeRates,
} from "./daum";
import {
  fetchNaverForeignOwnership,
  fetchNaverRevenue,
  fetchNaverNews,
  fetchNaverConsensus,
} from "./naver";

export interface StockScrapedData {
  stockName: string;
  currentPrice: number;
  marketCap: number;
  dailyChange: number;
  change5d: number | null;
  change20d: number | null;
  change60d: number | null;
  change120d: number | null;
  change240d: number | null;
  foreignOwnership: number | null;
  revenue: number | null;
  per: number | null;
  pbr: number | null;
  targetPrice: number | null;
  investmentOpinion: string | null;
  news: Array<{ title: string; link: string; date: string }>;
}

export async function scrapeStockData(
  stockCode: string
): Promise<StockScrapedData> {
  // Fetch all data sources in parallel
  const [quote, chart, news, daumConsensus, naverConsensus] =
    await Promise.all([
      fetchDaumQuote(stockCode),
      fetchDaumChart(stockCode, 250),
      fetchNaverNews(stockCode),
      fetchDaumConsensus(stockCode),
      fetchNaverConsensus(stockCode),
    ]);

  const changeRates = calculateChangeRates(chart, quote.currentPrice);

  // Use Daum data as primary; Naver fallback
  let foreignOwnership = quote.foreignOwnership;
  let revenue = quote.revenue;

  // Target price: Daum first, then Naver
  const targetPrice = daumConsensus.targetPrice ?? naverConsensus.targetPrice;
  const investmentOpinion =
    daumConsensus.investmentOpinion ?? naverConsensus.investmentOpinion;

  // Fallback to Naver for missing Daum data
  if (foreignOwnership == null || revenue == null) {
    const [naverForeign, naverRevenue] = await Promise.all([
      foreignOwnership == null
        ? fetchNaverForeignOwnership(stockCode)
        : Promise.resolve(null),
      revenue == null
        ? fetchNaverRevenue(stockCode)
        : Promise.resolve(null),
    ]);

    if (naverForeign != null) foreignOwnership = naverForeign;
    if (naverRevenue != null) revenue = naverRevenue;
  }

  return {
    stockName: quote.stockName,
    currentPrice: quote.currentPrice,
    marketCap: quote.marketCap,
    dailyChange: quote.dailyChange,
    ...changeRates,
    foreignOwnership,
    revenue,
    per: quote.per,
    pbr: quote.pbr,
    targetPrice,
    investmentOpinion,
    news,
  };
}
