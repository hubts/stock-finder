"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/stocks");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="inline-block w-8 h-8 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950" />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Chart lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.06]" preserveAspectRatio="none" viewBox="0 0 1200 800">
        <polyline fill="none" stroke="#60a5fa" strokeWidth="2" points="0,600 150,560 300,500 450,520 600,400 750,350 900,380 1050,280 1200,200" />
        <polyline fill="none" stroke="#34d399" strokeWidth="1.5" points="0,650 150,620 300,580 450,600 600,520 750,480 900,500 1050,420 1200,350" />
      </svg>

      {/* Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/15 rounded-full blur-[120px]" />

      <div className="relative z-10 text-center px-4">
        {/* Logo */}
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>

        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
          Stock Finder
        </h1>
        <p className="text-lg text-blue-200/60 mb-10 max-w-md mx-auto">
          한국 주식 포트폴리오를 스마트하게 추적하고 관리하세요
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="px-8 py-3.5 border border-white/20 text-white/80 rounded-xl font-semibold hover:bg-white/[0.06] hover:text-white transition-all backdrop-blur-sm"
          >
            회원가입
          </Link>
        </div>

        {/* Ticker */}
        <div className="mt-16">
          <div className="inline-flex items-center gap-6 text-xs text-white/20">
            <span>KOSPI</span>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <span>KOSDAQ</span>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <span>KODEX 200</span>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <span>TIGER 반도체</span>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <span>삼성전자</span>
          </div>
        </div>
      </div>
    </div>
  );
}
