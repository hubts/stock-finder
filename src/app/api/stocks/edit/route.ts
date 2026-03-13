import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serialize";

const BIGINT_FIELDS = new Set(["marketCap", "revenue", "operatingProfit"]);

const EDITABLE_FIELDS = new Set([
  "currentPrice",
  "marketCap",
  "dailyChange",
  "change5d",
  "change20d",
  "change60d",
  "change120d",
  "change240d",
  "foreignOwnership",
  "revenue",
  "operatingProfit",
  "per",
  "pbr",
  "roe",
  "evEbitda",
  "eps",
  "bps",
  "dps",
  "dividendYield",
  "ipoPrice",
  "creditRatio",
  "targetPrice",
  "investmentOpinion",
]);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { stockId, fields } = await request.json();

  if (!stockId || !fields || typeof fields !== "object") {
    return NextResponse.json(
      { error: "stockId와 fields가 필요합니다." },
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

  // Filter to only editable fields and convert BigInt fields
  const dataFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (!EDITABLE_FIELDS.has(key)) continue;

    if (value == null) {
      dataFields[key] = null;
    } else if (BIGINT_FIELDS.has(key)) {
      dataFields[key] = BigInt(value as number | string);
    } else {
      dataFields[key] = value;
    }
  }

  dataFields.isManualEdit = true;

  await prisma.stockData.upsert({
    where: { stockId },
    create: { stockId, ...dataFields },
    update: dataFields,
  });

  const updated = await prisma.stock.findUnique({
    where: { id: stockId },
    include: {
      data: true,
      news: { take: 5, orderBy: { createdAt: "desc" } },
    },
  });

  return NextResponse.json(serializeBigInt(updated));
}
