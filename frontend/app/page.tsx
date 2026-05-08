import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="max-w-xl w-full text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500 mb-6">
          for women in their 40s · Beta
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-6 leading-[1.15] tracking-tight">
          어제보다는<br />
          못생겨지지 않은<br />
          오늘
        </h1>
        <p className="text-slate-500 leading-relaxed mb-3 text-sm">
          회춘은 부담스럽고 방치는 죄책감.<br />
          그 사이의 관리를 큐레이션 해드릴게요.
        </p>
        <p className="text-[11px] text-slate-400 mb-10 tracking-wide">
          화장품·영양제 To-do · 시술 캘린더 · 병원 비교
        </p>
        <div className="flex flex-col items-center gap-4">
          <Link
            href="/diagnose"
            className="inline-flex items-center justify-center h-12 px-10 bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition tracking-wide"
          >
            진단 시작하기
          </Link>
          <p className="text-[11px] text-slate-400 tracking-wide">
            소요시간 약 5분 · 의학적 진단·처방이 아닙니다
          </p>
        </div>
      </div>
    </main>
  );
}
