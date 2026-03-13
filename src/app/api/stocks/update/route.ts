import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scrapeStockData } from "@/lib/scraper";
import { serializeBigInt } from "@/lib/serialize";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { stockId } = await request.json();

  if (!stockId) {
    return NextResponse.json(
      { error: "종목 ID가 필요합니다." },
      { status: 400 }
    );
  }

  const stock = await prisma.stock.findFirst({
    where: { id: stockId, userId: session.user.id },
  });

  if (!stock) {
    return NextResponse.json(
      { error: "종목을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  try {
    const scraped = await scrapeStockData(stock.stockCode);

    await prisma.stock.update({
      where: { id: stockId },
      data: { stockName: scraped.stockName },
    });

    const dataFields = {
      currentPrice: scraped.currentPrice,
      marketCap: scraped.marketCap ? BigInt(scraped.marketCap) : null,
      dailyChange: scraped.dailyChange,
      change5d: scraped.change5d,
      change20d: scraped.change20d,
      change60d: scraped.change60d,
      change120d: scraped.change120d,
      change240d: scraped.change240d,
      foreignOwnership: scraped.foreignOwnership,
      revenue: scraped.revenue ? BigInt(scraped.revenue) : null,
      per: scraped.per,
      pbr: scraped.pbr,
      targetPrice: scraped.targetPrice,
      investmentOpinion: scraped.investmentOpinion,
    };

    await prisma.stockData.upsert({
      where: { stockId },
      create: { stockId, ...dataFields },
      update: dataFields,
    });

    // Replace news
    await prisma.stockNews.deleteMany({ where: { stockId } });
    if (scraped.news.length > 0) {
      await prisma.stockNews.createMany({
        data: scraped.news.map((n) => ({
          stockId,
          title: n.title,
          link: n.link,
          date: n.date,
        })),
      });
    }

    const updated = await prisma.stock.findUnique({
      where: { id: stockId },
      include: {
        data: true,
        news: { take: 5, orderBy: { createdAt: "desc" } },
      },
    });

    return NextResponse.json(serializeBigInt(updated));
  } catch (error) {
    console.error("Stock update error:", error);
    return NextResponse.json(
      { error: "데이터 수집 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
