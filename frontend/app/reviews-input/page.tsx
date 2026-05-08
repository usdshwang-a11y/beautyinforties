"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  analyze,
  getBenchmarkStatus,
  saveBenchmark,
} from "@/lib/api";
import { usePlannerStore } from "@/lib/store";
import {
  CLINIC_IDS,
  CLINIC_LABELS,
  type BenchmarkStatus,
} from "@/lib/types";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function ReviewsInputPage() {
  const router = useRouter();
  const profile = usePlannerStore((s) => s.profile);
  const reviews = usePlannerStore((s) => s.reviews);
  const setReview = usePlannerStore((s) => s.setReview);
  const setResult = usePlannerStore((s) => s.setResult);
  const isResultStale = usePlannerStore((s) => s.isResultStale);
  const result = usePlannerStore((s) => s.result);

  const [activeTab, setActiveTab] = useState<string>(CLINIC_IDS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [benchmarks, setBenchmarks] = useState<
    Record<string, BenchmarkStatus>
  >({});
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});

  useEffect(() => {
    if (!profile) router.replace("/diagnose");
  }, [profile, router]);

  useEffect(() => {
    Promise.all(CLINIC_IDS.map((id) => getBenchmarkStatus(id))).then(
      (statuses) => {
        const map: Record<string, BenchmarkStatus> = {};
        for (const s of statuses) map[s.clinic_id] = s;
        setBenchmarks(map);
      }
    );
  }, []);

  const stale = isResultStale();
  const hasReviews = CLINIC_IDS.some((id) => (reviews[id] ?? "").trim());

  const onSave = async (id: string) => {
    const text = reviews[id] ?? "";
    if (!text.trim()) return;
    setSaveStates((s) => ({ ...s, [id]: "saving" }));
    try {
      const status = await saveBenchmark(id, text);
      setBenchmarks((b) => ({ ...b, [id]: status }));
      setSaveStates((s) => ({ ...s, [id]: "saved" }));
      setTimeout(
        () => setSaveStates((s) => ({ ...s, [id]: "idle" })),
        2000
      );
    } catch {
      setSaveStates((s) => ({ ...s, [id]: "error" }));
      setTimeout(
        () => setSaveStates((s) => ({ ...s, [id]: "idle" })),
        2500
      );
    }
  };

  const onSubmit = async () => {
    if (!profile) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await analyze({
        user_profile_form: profile,
        clinic_reviews: Object.fromEntries(
          CLINIC_IDS.map((id) => [id, reviews[id] ?? ""])
        ),
      });
      setResult(result);
      router.push("/dashboard");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1 px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400 mb-3">
          Step 2 / 3
        </div>
        <h1 className="text-3xl font-semibold mb-3 text-slate-900">
          병원 리뷰 입력
        </h1>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          분당구 병원 3곳의 네이버 지도 리뷰를{" "}
          <span className="text-slate-900 underline underline-offset-4">
            드래그하여 복사 → 붙여넣기
          </span>{" "}
          해주세요. 리뷰가 적은 병원은 건너뛰셔도 괜찮아요.
        </p>

        {stale && hasReviews && (
          <div className="border-l-2 border-slate-900 pl-4 py-2 mb-6 text-sm text-slate-700">
            진단을 변경하셨어요. 같은 리뷰로 다시 분석하려면 아래{" "}
            <span className="text-slate-900 font-medium">분석 시작</span>{" "}
            버튼을 눌러주세요.
          </div>
        )}
        {result && !stale && hasReviews && (
          <div className="border border-slate-200 px-4 py-3 mb-6 text-sm flex items-center justify-between">
            <span className="text-slate-600">
              현재 진단으로 분석된 결과가 있어요.
            </span>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-slate-900 hover:underline underline-offset-4 tracking-wide"
            >
              대시보드 보기 →
            </button>
          </div>
        )}

        <div className="flex gap-8 border-b border-slate-200 mb-6">
          {CLINIC_IDS.map((id) => {
            const benchmarkExists = benchmarks[id]?.exists;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`pb-3 text-sm tracking-wide border-b-2 transition ${
                  activeTab === id
                    ? "border-slate-900 text-slate-900 font-medium"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                {CLINIC_LABELS[id]}
                {reviews[id]?.trim() && (
                  <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-slate-900 align-middle" />
                )}
                {benchmarkExists && (
                  <span className="ml-1.5 text-[9px] uppercase tracking-[0.15em] text-emerald-600 align-middle">
                    saved
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {CLINIC_IDS.map((id) => {
          const benchmark = benchmarks[id];
          const saveState = saveStates[id] ?? "idle";
          const currentText = reviews[id] ?? "";
          return (
            <div key={id} className={activeTab === id ? "" : "hidden"}>
              <div className="flex items-baseline justify-between mb-3 gap-3">
                <p className="text-xs text-slate-500 tracking-wide">
                  {CLINIC_LABELS[id]}의 네이버 지도 리뷰를 복사해서 붙여넣어
                  주세요.
                </p>
                {benchmark?.exists && !currentText.trim() && (
                  <span className="text-[10px] text-emerald-600 tracking-wide shrink-0">
                    💾 벤치마크 사용 예정 ({benchmark.char_count.toLocaleString()}
                    자)
                  </span>
                )}
              </div>
              <textarea
                value={currentText}
                onChange={(e) => setReview(id, e.target.value)}
                placeholder={`예시:\n프로필\n김**\n팔로우\n예약 후 이용대기 시간 10분 이내\n토닝 받았는데 정말 효과 좋네요...\n반응 남기기\n방문일4.22.수2026년 4월 22일 수요일1번째 방문인증 수단영수증`}
                className="w-full h-[500px] p-4 border border-slate-200 bg-white text-sm font-mono resize-none focus:outline-none focus:border-slate-900 leading-relaxed"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400 space-y-1 tracking-wide">
                  <p>· 빈 리뷰는 자동으로 무시됩니다 (최소 10건 권장)</p>
                  <p>· 광고성 리뷰는 자동으로 걸러집니다</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {saveState === "saved" && (
                    <span className="text-[11px] text-emerald-600 tracking-wide">
                      ✓ 저장됨
                    </span>
                  )}
                  {saveState === "error" && (
                    <span className="text-[11px] text-rose-600 tracking-wide">
                      저장 실패
                    </span>
                  )}
                  <button
                    onClick={() => onSave(id)}
                    disabled={
                      !currentText.trim() || saveState === "saving"
                    }
                    className="text-[11px] text-slate-700 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-300 hover:border-slate-900 px-3 py-1.5 tracking-wide transition"
                  >
                    {saveState === "saving"
                      ? "저장 중…"
                      : benchmark?.exists
                      ? "벤치마크 갱신"
                      : "벤치마크로 저장"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex justify-between items-center mt-12">
          <Link
            href="/diagnose"
            className="text-xs text-slate-500 hover:text-slate-900 tracking-wide"
          >
            ← 진단 다시
          </Link>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="h-12 px-10 bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-40 disabled:cursor-wait transition tracking-wide"
          >
            {submitting ? "분석 중…" : "분석 시작"}
          </button>
        </div>

        {error && (
          <p className="mt-6 text-xs text-slate-700 break-all border-l-2 border-slate-900 pl-3 py-1">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
