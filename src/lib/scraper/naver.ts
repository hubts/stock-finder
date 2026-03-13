import * as cheerio from "cheerio";
import iconv from "iconv-lite";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Naver fetch failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  // Detect encoding from Content-Type header or meta tag
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("utf-8") || contentType.includes("UTF-8")) {
    return buffer.toString("utf-8");
  }
  if (contentType.includes("euc-kr") || contentType.includes("EUC-KR")) {
    return iconv.decode(buffer, "euc-kr");
  }

  // Auto-detect: try UTF-8 first, check for meta charset
  const raw = buffer.toString("utf-8");
  if (raw.includes('charset=euc-kr') || raw.includes('charset="euc-kr"')) {
    return iconv.decode(buffer, "euc-kr");
  }
  return raw;
}

export async function fetchNaverForeignOwnership(
  stockCode: string
): Promise<number | null> {
  try {
    const html = await fetchHtml(
      `https://finance.naver.com/item/main.naver?code=${stockCode}`
    );
    const $ = cheerio.load(html);
    const text = $("table.no_info tr")
      .filter((_, el) => $(el).text().includes("외국인"))
      .find("td span")
      .first()
      .text()
      .trim();

    if (!text) return null;
    return parseFloat(text.replace("%", ""));
  } catch {
    return null;
  }
}

interface InvestorData {
  foreignNetBuy: number | null;
  institutionalNetBuy: number | null;
  individualNetBuy: number | null;
}

export async function fetchNaverInvestorTrend(
  stockCode: string
): Promise<InvestorData> {
  try {
    const html = await fetchHtml(
      `https://finance.naver.com/item/frgn.naver?code=${stockCode}`
    );
    const $ = cheerio.load(html);

    let foreignNetBuy: number | null = null;
    let institutionalNetBuy: number | null = null;
    let individualNetBuy: number | null = null;

    // The table has rows with date data. Each row has:
    // 날짜 | 종가 | 전일비 | 등락률 | 거래량 | 외국인순매수 | 기관순매수 | 외국인보유 | 외국인비율
    // But the exact column layout can vary. Try multiple selectors.
    const tables = $("table.type2");

    tables.each((_, table) => {
      $(table)
        .find("tr")
        .each((i, row) => {
          if (i >= 7) return false; // only look at recent 5 data rows
          const cells = $(row).find("td");
          if (cells.length < 6) return;

          // Try to find rows with numeric date in first cell
          const firstCell = $(cells[0]).text().trim();
          if (!/\d{4}\.\d{2}\.\d{2}/.test(firstCell)) return;

          // Various layouts exist - try to detect by checking cell values
          const allValues = cells
            .map((_, c) => $(c).text().trim())
            .get();

          // Look for the net buy columns - they often contain signed numbers
          for (let j = 4; j < allValues.length; j++) {
            const val = parseNumber(allValues[j]);
            if (val === null) continue;

            // The first signed-number-like column after volume is usually foreign net buy
            if (foreignNetBuy === null && j >= 5) {
              foreignNetBuy = 0;
              institutionalNetBuy = 0;
            }
          }
        });
    });

    // If we couldn't parse the complex table, return nulls
    return { foreignNetBuy: null, institutionalNetBuy: null, individualNetBuy: null };
  } catch {
    return {
      foreignNetBuy: null,
      institutionalNetBuy: null,
      individualNetBuy: null,
    };
  }
}

export async function fetchNaverRevenue(
  stockCode: string
): Promise<number | null> {
  try {
    const html = await fetchHtml(
      `https://finance.naver.com/item/main.naver?code=${stockCode}`
    );
    const $ = cheerio.load(html);

    let revenue: number | null = null;
    $("table.tb_type1 tbody tr").each((_, row) => {
      const label = $(row).find("th").text().trim();
      if (label.includes("매출액")) {
        const val = $(row).find("td").first().text().trim();
        const parsed = parseNumber(val);
        if (parsed !== null) {
          revenue = parsed * 100000000; // 억 단위 → 원 단위
        }
      }
    });

    return revenue;
  } catch {
    return null;
  }
}

export async function fetchNaverNews(
  stockCode: string
): Promise<Array<{ title: string; link: string; date: string }>> {
  try {
    // Scrape news from the main stock page (뉴스공시 section)
    const html = await fetchHtml(
      `https://finance.naver.com/item/main.naver?code=${stockCode}`
    );
    const $ = cheerio.load(html);
    const news: Array<{ title: string; link: string; date: string }> = [];

    // News section is under h4.sub_tit3 > ul > li
    $("h4.sub_tit3")
      .nextAll("ul")
      .first()
      .find("li")
      .each((_, li) => {
        const a = $(li).find("span.txt > a").first();
        const title = a.text().trim();
        const href = a.attr("href");
        const date = $(li).find("em").last().text().trim();

        if (title && href) {
          news.push({
            title,
            link: href.startsWith("http")
              ? href
              : `https://finance.naver.com${href}`,
            date,
          });
        }
      });

    return news.slice(0, 10);
  } catch {
    return [];
  }
}

export async function fetchNaverConsensus(
  stockCode: string
): Promise<{ targetPrice: number | null; investmentOpinion: string | null }> {
  try {
    const html = await fetchHtml(
      `https://finance.naver.com/item/main.naver?code=${stockCode}`
    );
    const $ = cheerio.load(html);

    let targetPrice: number | null = null;
    let investmentOpinion: string | null = null;

    // table.rwidth with summary="투자의견 정보"
    // Row: <th>투자의견|목표주가</th><td>
    //   <span class="f_up"><em>4.00</em>매수</span> | <em>246,240</em>
    const row = $('table.rwidth tr').filter((_, el) =>
      $(el).text().includes("투자의견") && $(el).text().includes("목표주가")
    ).first();

    if (row.length) {
      const td = row.find("td");

      // Investment opinion: text after score in span.f_up or span.f_down
      const opinionSpan = td.find("span.f_up, span.f_down, span.f_stay").first();
      if (opinionSpan.length) {
        // The span contains <em>score</em>opinion_text
        const fullText = opinionSpan.text().trim();
        const score = opinionSpan.find("em").text().trim();
        const opinion = fullText.replace(score, "").trim();
        if (opinion) {
          investmentOpinion = opinion;
        }
      }

      // Target price: the em element after the bar span (second em in td)
      const ems = td.find("em");
      if (ems.length >= 2) {
        const val = $(ems[ems.length - 1]).text().trim();
        const parsed = parseNumber(val);
        if (parsed !== null) {
          targetPrice = parsed;
        }
      }
    }

    return { targetPrice, investmentOpinion };
  } catch {
    return { targetPrice: null, investmentOpinion: null };
  }
}

export async function fetchNaverRoeDividend(
  stockCode: string
): Promise<{ roe: number | null; dividendYield: number | null }> {
  try {
    const html = await fetchHtml(
      `https://finance.naver.com/item/main.naver?code=${stockCode}`
    );
    const $ = cheerio.load(html);

    // ROE: Find th.th_cop_anal13 strong containing "ROE(지배주주)", get first td value
    let roe: number | null = null;
    $("th.th_cop_anal13 strong").each((_, el) => {
      if ($(el).text().includes("ROE(지배주주)")) {
        const td = $(el).closest("tr").find("td").first();
        const val = td.text().trim();
        const parsed = parseNumber(val);
        if (parsed !== null) {
          roe = parsed;
        }
      }
    });

    // Dividend yield
    let dividendYield: number | null = null;
    const dvrText = $("#_dvr").text().trim();
    if (dvrText) {
      const parsed = parseFloat(dvrText);
      if (!isNaN(parsed)) {
        dividendYield = parsed;
      }
    }

    return { roe, dividendYield };
  } catch {
    return { roe: null, dividendYield: null };
  }
}

export async function fetchNaverCompanyOverview(
  stockCode: string
): Promise<string | null> {
  try {
    const html = await fetchHtml(
      `https://finance.naver.com/item/main.naver?code=${stockCode}`
    );
    const $ = cheerio.load(html);

    const paragraphs: string[] = [];
    $("#summary_info p").each((_, el) => {
      const text = $(el).text().trim();
      if (text) paragraphs.push(text);
    });

    return paragraphs.length > 0 ? paragraphs.join(" ") : null;
  } catch {
    return null;
  }
}

function parseNumber(text: string): number | null {
  const cleaned = text.replace(/,/g, "").replace(/\s/g, "").trim();
  if (!cleaned || cleaned === "-" || cleaned === "") return null;
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}
