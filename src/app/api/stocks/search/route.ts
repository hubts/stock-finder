import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchDaumStocks } from "@/lib/scraper/daum";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 1) {
    return NextResponse.json(
      { error: "검색어를 입력해주세요." },
      { status: 400 }
    );
  }

  try {
    const results = await searchDaumStocks(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Stock search error:", error);
    return NextResponse.json(
      { error: "종목 검색 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
