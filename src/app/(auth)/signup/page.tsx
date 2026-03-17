"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("서버 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Decorative chart lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]" preserveAspectRatio="none" viewBox="0 0 1200 800">
        <polyline
          fill="none"
          stroke="#a78bfa"
          strokeWidth="2"
          points="0,600 100,580 200,520 300,540 400,460 500,480 600,380 700,350 800,400 900,320 1000,280 1100,250 1200,200"
        />
        <polyline
          fill="none"
          stroke="#34d399"
          strokeWidth="1.5"
          points="0,650 100,640 200,600 300,620 400,560 500,570 600,500 700,470 800,510 900,440 1000,400 1100,380 1200,340"
        />
      </svg>

      {/* Glowing orbs */}
      <div className="absolute top-1/3 -right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/3 -left-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-[100px]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Stock Finder</span>
          </div>
          <p className="text-purple-200/60 text-sm">투자 여정을 시작하세요</p>
        </div>

        {/* Card */}
        <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl p-8 shadow-2xl">
          <h1 className="text-xl font-bold text-white mb-6">회원가입</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-purple-100/70 mb-1.5">
                이름
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 focus:outline-none transition"
                placeholder="홍길동"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-100/70 mb-1.5">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 focus:outline-none transition"
                placeholder="name@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-100/70 mb-1.5">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 focus:outline-none transition"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <p className="text-xs text-white/30 mt-1.5">6자 이상 입력해주세요</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  가입 중...
                </span>
              ) : "회원가입"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/[0.08] text-center">
            <p className="text-sm text-purple-200/50">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition">
                로그인
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom ticker */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-4 text-xs text-white/20">
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
