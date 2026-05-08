"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePlannerStore } from "@/lib/store";
import type {
  AgeRange,
  CareLevel,
  Concern,
  SkinType,
  UserProfileForm,
} from "@/lib/types";

const SKIN_TYPES: SkinType[] = ["건성", "지성", "복합성", "수분지", "민감성"];
const CONCERN_OPTIONS = [
  "기미·잡티",
  "주름",
  "모공",
  "홍조",
  "탄력저하",
  "트러블",
  "칙칙함",
  "다크서클",
];
const AGE_RANGES: AgeRange[] = ["40-44", "45-49"];
const CARE_LEVELS: CareLevel[] = ["초급", "중급", "고급"];
const BUDGETS = [50000, 100000, 200000, 300000];
const EVENTS = ["결혼식", "동창회", "촬영", "여행", "없음"];

export default function DiagnosePage() {
  const router = useRouter();
  const setProfile = usePlannerStore((s) => s.setProfile);
  const storedProfile = usePlannerStore((s) => s.profile);

  const [skinType, setSkinType] = useState<SkinType>("수분지");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<AgeRange>("45-49");
  const [actionDate, setActionDate] = useState("");
  const [actionEvent, setActionEvent] = useState("결혼식");
  const [careLevel, setCareLevel] = useState<CareLevel>("중급");
  const [budget, setBudget] = useState(100000);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    if (storedProfile) {
      setSkinType(storedProfile.skin_type);
      setConcerns(
        [...storedProfile.concerns]
          .sort((a, b) => a.priority - b.priority)
          .map((c) => c.name)
      );
      setAgeRange(storedProfile.age_range);
      setActionDate(storedProfile.action_day?.date ?? "");
      setActionEvent(storedProfile.action_day?.event ?? "결혼식");
      setCareLevel(storedProfile.care_level);
      setBudget(storedProfile.budget);
    }
    setHydrated(true);
  }, [storedProfile, hydrated]);

  const toggleConcern = (c: string) => {
    setError(null);
    setConcerns((prev) =>
      prev.includes(c)
        ? prev.filter((x) => x !== c)
        : prev.length >= 3
        ? prev
        : [...prev, c]
    );
  };

  const submit = () => {
    if (concerns.length === 0) {
      setError("피부 고민을 1개 이상 선택해주세요");
      return;
    }
    const concernsTyped: Concern[] = concerns.map((name, i) => ({
      name,
      priority: i + 1,
    }));
    const form: UserProfileForm = {
      skin_type: skinType,
      concerns: concernsTyped,
      age_range: ageRange,
      action_day:
        actionDate && actionEvent !== "없음"
          ? { date: actionDate, event: actionEvent }
          : null,
      care_level: careLevel,
      budget,
    };
    setProfile(form);
    router.push("/reviews-input");
  };

  return (
    <main className="flex-1 px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400 mb-3">
          Step 1 / 3
        </div>
        <h1 className="text-3xl font-semibold mb-12 text-slate-900">피부 진단</h1>

        <Section title="피부 타입" subtitle="현재 본인에게 가장 가까운 한 가지">
          <div className="flex flex-wrap gap-2">
            {SKIN_TYPES.map((t) => (
              <Chip key={t} active={skinType === t} onClick={() => setSkinType(t)}>
                {t}
              </Chip>
            ))}
          </div>
        </Section>

        <Section
          title="피부 고민"
          subtitle="우선순위 순으로 1~3개 (선택 순서가 곧 우선순위)"
        >
          <div className="flex flex-wrap gap-2">
            {CONCERN_OPTIONS.map((c) => {
              const idx = concerns.indexOf(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleConcern(c)}
                  className={`px-4 py-2 text-sm border transition ${
                    idx >= 0
                      ? "bg-slate-900 border-slate-900 text-white"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-900"
                  }`}
                >
                  {idx >= 0 ? `${idx + 1}순위 · ${c}` : c}
                </button>
              );
            })}
          </div>
          {error && (
            <p className="text-slate-700 text-xs mt-3 border-l-2 border-slate-900 pl-2">
              {error}
            </p>
          )}
        </Section>

        <Section title="연령대">
          <div className="flex gap-2">
            {AGE_RANGES.map((a) => (
              <Chip key={a} active={ageRange === a} onClick={() => setAgeRange(a)}>
                {a}
              </Chip>
            ))}
          </div>
        </Section>

        <Section
          title="Action Day (선택)"
          subtitle="중요한 일정이 있다면 D-day 역산 타임라인을 만들어드려요"
        >
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="date"
              value={actionDate}
              onChange={(e) => setActionDate(e.target.value)}
              className="px-4 py-2 border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-900"
            />
            <select
              value={actionEvent}
              onChange={(e) => setActionEvent(e.target.value)}
              className="px-4 py-2 border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-900"
            >
              {EVENTS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </Section>

        <Section title="현재 케어 수준">
          <div className="flex gap-2">
            {CARE_LEVELS.map((c) => (
              <Chip key={c} active={careLevel === c} onClick={() => setCareLevel(c)}>
                {c}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="월 예산 (원)">
          <div className="flex flex-wrap gap-2">
            {BUDGETS.map((b) => (
              <Chip key={b} active={budget === b} onClick={() => setBudget(b)}>
                {b.toLocaleString()}
              </Chip>
            ))}
          </div>
        </Section>

        <div className="flex justify-between items-center mt-14">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-900 tracking-wide"
          >
            ← 처음으로
          </Link>
          <button
            onClick={submit}
            className="h-12 px-10 bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition tracking-wide"
          >
            다음 — 리뷰 입력
          </button>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-10">
      <div className="border-t border-slate-200 pt-6">
        <h2 className="text-[11px] uppercase tracking-[0.25em] text-slate-500 mb-1">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            {subtitle}
          </p>
        )}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm border transition ${
        active
          ? "bg-slate-900 border-slate-900 text-white"
          : "bg-white border-slate-200 text-slate-700 hover:border-slate-900"
      }`}
    >
      {children}
    </button>
  );
}
