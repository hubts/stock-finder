import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serialize";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const stocks = await prisma.stock.findMany({
    where: { userId: session.user.id },
    include: { data: true, news: { take: 5, orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(serializeBigInt(stocks));
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { stockCode, stockName } = await request.json();

  if (!stockCode || !stockName) {
    return NextResponse.json(
      { error: "종목코드와 종목명을 입력해주세요." },
      { status: 400 }
    );
  }

  const existing = await prisma.stock.findUnique({
    where: {
      userId_stockCode: { userId: session.user.id, stockCode },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "이미 추가된 종목입니다." },
      { status: 409 }
    );
  }

  const stock = await prisma.stock.create({
    data: {
      userId: session.user.id,
      stockCode,
      stockName,
    },
  });

  return NextResponse.json(stock, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const stockId = searchParams.get("id");

  if (!stockId) {
    return NextResponse.json({ error: "종목 ID가 필요합니다." }, { status: 400 });
  }

  const stock = await prisma.stock.findFirst({
    where: { id: stockId, userId: session.user.id },
  });

  if (!stock) {
    return NextResponse.json({ error: "종목을 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.stock.delete({ where: { id: stockId } });

  return NextResponse.json({ message: "삭제되었습니다." });
}
