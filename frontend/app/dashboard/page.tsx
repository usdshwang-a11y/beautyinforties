"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { usePlannerStore } from "@/lib/store";
import {
  TIME_SLOT_ORDER,
  type ClinicResult,
  type CosmeticTodos,
  type IngredientMeta,
  type ProcedureSchedule,
  type Supplement,
  type SupplementTodos,
  type TimeSlot,
  type Timeline,
  type TodoStep,
  type UserProfile,
} from "@/lib/types";

const PAULAS_CATEGORY_ORDER = [
  "항산화제",
  "세포교환성분",
  "각질제거",
  "피부진정",
];

export default function DashboardPage() {
  const router = useRouter();
  const result = usePlannerStore((s) => s.result);
  const reset = usePlannerStore((s) => s.reset);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!result) router.replace("/diagnose");
  }, [result, router]);

  if (!result) return null;

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const isChecked = (id: string) => checked.has(id);

  const cosmeticTotal =
    result.cosmetic_todos.morning.length +
    result.cosmetic_todos.evening.length +
    result.cosmetic_todos.weekly.length;
  const cosmeticDone = [...checked].filter((id) => id.startsWith("cos-"))
    .length;
  const supplementTotal = result.supplement_todos.daily_supplements.length;
  const supplementDone = [...checked].filter((id) => id.startsWith("sup-"))
    .length;

  return (
    <main className="flex-1 px-8 py-12">
      <div className="max-w-[1600px] mx-auto">
        <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400 mb-3">
          Step 3 / 3 — 결과
        </div>
        <div className="flex items-start justify-between mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 leading-snug">
            당신의 피부 여정이 시작됐어요
          </h1>
          <button
            onClick={() => {
              reset();
              router.push("/");
            }}
            className="text-xs text-slate-500 hover:text-slate-900 tracking-wide self-start mt-2"
          >
            처음부터 다시
          </button>
        </div>

        <div className="border-l-2 border-slate-300 pl-4 py-1 mb-8 text-xs text-slate-500 leading-relaxed">
          본 결과는 일반 가이드이며 의학적 진단·처방이 아닙니다. 알러지·기존
          질환이 있다면 전문의 상담을 권고드립니다.
        </div>

        <ProfileSummary profile={result.user_profile} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 border border-slate-200 mt-px">
          <CosmeticCard
            todos={result.cosmetic_todos}
            isChecked={isChecked}
            toggle={toggle}
            done={cosmeticDone}
            total={cosmeticTotal}
          />
          <SupplementCard
            todos={result.supplement_todos}
            isChecked={isChecked}
            toggle={toggle}
            done={supplementDone}
            total={supplementTotal}
          />
          <CalendarCard timeline={result.timeline} />
          <ClinicComparisonCard
            clinics={result.clinic_comparison.clinics}
          />
        </div>

        <div className="text-center mt-16 pt-8 border-t border-slate-200">
          <Link
            href="/reviews-input"
            className="text-xs text-slate-500 hover:text-slate-900 tracking-wide"
          >
            ← 리뷰 다시 입력
          </Link>
        </div>
      </div>
    </main>
  );
}

function ProfileSummary({ profile }: { profile: UserProfile }) {
  const { skin_type, concerns, action_day, age_range } = profile;
  return (
    <div className="bg-white border border-slate-200 p-6">
      <div className="text-[11px] uppercase tracking-[0.25em] text-slate-500 mb-3">
        진단 요약
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-xs text-slate-400 mb-1">타입</div>
          <div className="text-slate-900">
            {skin_type} · {age_range}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">고민</div>
          <div className="text-slate-900">
            {concerns.map((c) => `${c.priority}. ${c.name}`).join(" / ")}
          </div>
        </div>
        {action_day.date && action_day.event && (
          <div>
            <div className="text-xs text-slate-400 mb-1">D-day</div>
            <div className="text-slate-900">
              {action_day.event} · {action_day.date}
              {action_day.days_remaining !== null && (
                <span className="text-slate-500 ml-2">
                  (D
                  {action_day.days_remaining >= 0
                    ? `-${action_day.days_remaining}`
                    : `+${-action_day.days_remaining}`}
                  )
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressLight({ done, total }: { done: number; total: number }) {
  const ratio = total === 0 ? 0 : done / total;
  let dotColor = "bg-rose-300";
  if (ratio === 1) dotColor = "bg-emerald-400";
  else if (ratio > 0) dotColor = "bg-amber-300";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span className="text-[10px] text-slate-500 font-mono tracking-wide">
        {done}/{total}
      </span>
    </span>
  );
}

function SectionHeader({
  index,
  title,
  hint,
  right,
}: {
  index: string;
  title: string;
  hint?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="flex-1">
        <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400 mb-2">
          {index}
        </div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
      </div>
      {right && <div className="shrink-0 mt-1">{right}</div>}
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-checked={checked}
      role="checkbox"
      className={`w-4 h-4 mt-0.5 border flex-shrink-0 flex items-center justify-center transition ${
        checked
          ? "bg-slate-900 border-slate-900"
          : "bg-white border-slate-300 hover:border-slate-900"
      }`}
    >
      {checked && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          className="w-3 h-3 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function CosmeticCard({
  todos,
  isChecked,
  toggle,
  done,
  total,
}: {
  todos: CosmeticTodos;
  isChecked: (id: string) => boolean;
  toggle: (id: string) => void;
  done: number;
  total: number;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, IngredientMeta[]>();
    for (const m of todos.ingredient_meta) {
      const key = m.category || "기타";
      const arr = map.get(key) ?? [];
      arr.push(m);
      map.set(key, arr);
    }
    return map;
  }, [todos.ingredient_meta]);

  const orderedCategories = useMemo(() => {
    const keys = [...grouped.keys()];
    return [...PAULAS_CATEGORY_ORDER, ...keys.filter((k) => !PAULAS_CATEGORY_ORDER.includes(k))]
      .filter((k) => grouped.has(k));
  }, [grouped]);

  return (
    <div className="bg-white p-6">
      <SectionHeader
        index="01"
        title="화장품 To-do"
        right={<ProgressLight done={done} total={total} />}
      />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <Routine
            label="아침"
            scope="am"
            steps={todos.morning}
            isChecked={isChecked}
            toggle={toggle}
          />
          <Routine
            label="저녁"
            scope="pm"
            steps={todos.evening}
            isChecked={isChecked}
            toggle={toggle}
          />
          <Routine
            label="주 단위"
            scope="weekly"
            steps={todos.weekly}
            isChecked={isChecked}
            toggle={toggle}
          />
        </div>
        <div className="border-t xl:border-t-0 xl:border-l border-slate-100 pt-5 xl:pt-0 xl:pl-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-3">
            나에게 필요한 성분은?
          </div>
          {orderedCategories.length > 0 ? (
            <div className="space-y-4">
              {orderedCategories.map((cat) => (
                <div key={cat}>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-700 mb-2 border-b border-slate-200 pb-1">
                    {cat}
                  </div>
                  <ul className="space-y-2.5">
                    {grouped.get(cat)?.map((m) => (
                      <IngredientCard key={m.ingredient} meta={m} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              타겟 성분이 추출되지 않았어요
            </p>
          )}
        </div>
      </div>
      <p className="text-[11px] text-slate-400 mt-5 leading-relaxed border-t border-slate-100 pt-3">
        성분·카테고리만 표시합니다. 브랜드/제품 추천은 별도 데이터 입력 시
        업데이트됩니다.
      </p>
    </div>
  );
}

function Routine({
  label,
  scope,
  steps,
  isChecked,
  toggle,
}: {
  label: string;
  scope: string;
  steps: TodoStep[];
  isChecked: (id: string) => boolean;
  toggle: (id: string) => void;
}) {
  return (
    <div className="mb-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-2">
        {label}
      </div>
      <ol className="text-sm space-y-2">
        {steps.map((s) => {
          const id = `cos-${scope}-${s.step}`;
          const c = isChecked(id);
          return (
            <li key={id} className="flex items-start gap-2.5">
              <Checkbox checked={c} onChange={() => toggle(id)} />
              <span className="text-slate-300 font-mono text-xs w-5 shrink-0 mt-0.5">
                {String(s.step).padStart(2, "0")}
              </span>
              <span
                className={`flex-1 leading-relaxed ${
                  c ? "line-through text-slate-400" : "text-slate-800"
                }`}
              >
                {s.item}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function IngredientCard({ meta }: { meta: IngredientMeta }) {
  return (
    <li>
      <div className="text-sm text-slate-900 font-medium">
        {meta.ingredient}
      </div>
      {meta.function && (
        <div className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
          {meta.function}
        </div>
      )}
      {meta.products.length > 0 ? (
        <ul className="mt-1.5 space-y-0.5">
          {meta.products.map((p) => (
            <li
              key={p}
              className="text-[11px] text-slate-700 tracking-tight"
            >
              · {p}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-[10px] text-slate-300 mt-1 tracking-wide">
          대표상품 — 데이터 입력 대기
        </div>
      )}
    </li>
  );
}

function SupplementCard({
  todos,
  isChecked,
  toggle,
  done,
  total,
}: {
  todos: SupplementTodos;
  isChecked: (id: string) => boolean;
  toggle: (id: string) => void;
  done: number;
  total: number;
}) {
  const grouped = groupSupplementsByTimeSlot(todos.daily_supplements);

  return (
    <div className="bg-white p-6">
      <SectionHeader
        index="02"
        title="영양제 To-do"
        right={<ProgressLight done={done} total={total} />}
      />
      <div className="space-y-5">
        {TIME_SLOT_ORDER.map((slot) => {
          const items = grouped.get(slot);
          if (!items || items.length === 0) return null;
          return (
            <div key={slot}>
              <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-2">
                {slot}
              </div>
              <ul className="space-y-2.5">
                {items.map((s) => {
                  const id = `sup-${s.ingredient}`;
                  const c = isChecked(id);
                  return (
                    <li key={id} className="flex items-start gap-2.5">
                      <Checkbox
                        checked={c}
                        onChange={() => toggle(id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className={`font-medium text-sm ${
                              c
                                ? "line-through text-slate-400"
                                : "text-slate-900"
                            }`}
                          >
                            {s.ingredient}
                          </span>
                          <span
                            className={`text-[11px] font-mono ${
                              c ? "text-slate-300" : "text-slate-500"
                            }`}
                          >
                            {s.dose_range}
                          </span>
                        </div>
                        <div
                          className={`text-[11px] mt-0.5 tracking-wide ${
                            c ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          {s.linked_concern}
                          {s.note && ` · ${s.note}`}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400 mt-5 leading-relaxed border-t border-slate-100 pt-3">
        {todos.disclaimer}
      </p>
    </div>
  );
}

function groupSupplementsByTimeSlot(
  items: Supplement[]
): Map<TimeSlot, Supplement[]> {
  const map = new Map<TimeSlot, Supplement[]>();
  for (const it of items) {
    const arr = map.get(it.time_slot) ?? [];
    arr.push(it);
    map.set(it.time_slot, arr);
  }
  return map;
}

// === Calendar ===

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

function colorFor(procedure: string): string {
  let hash = 0;
  for (let i = 0; i < procedure.length; i++) {
    hash = (hash * 31 + procedure.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 62%, 55%)`;
}

function colorForBg(procedure: string): string {
  let hash = 0;
  for (let i = 0; i < procedure.length; i++) {
    hash = (hash * 31 + procedure.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsla(${hue}, 60%, 70%, 0.15)`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(d.getDate() + n);
  return r;
}

interface DayStatus {
  isToday: boolean;
  isAction: boolean;
  isPast: boolean;
  isLastSafe: ProcedureSchedule[];
  isDowntime: boolean;
}

function emptyStatus(): DayStatus {
  return {
    isToday: false,
    isAction: false,
    isPast: false,
    isLastSafe: [],
    isDowntime: false,
  };
}

function CalendarCard({ timeline }: { timeline: Timeline }) {
  if (!timeline.action_date) {
    return (
      <div className="bg-white p-6">
        <SectionHeader index="03" title="시술 캘린더" />
        <p className="text-xs text-slate-500 leading-relaxed">
          진단에서 Action Day를 설정하면 시술별 가능 일정과 다운타임이
          캘린더로 표시됩니다.
        </p>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const actionDate = parseDate(timeline.action_date);

  const dateMap = new Map<string, DayStatus>();
  const ensure = (d: Date): DayStatus => {
    const k = dateKey(d);
    if (!dateMap.has(k)) dateMap.set(k, emptyStatus());
    return dateMap.get(k)!;
  };

  for (const p of timeline.procedures) {
    const last = parseDate(p.last_safe_date);
    ensure(last).isLastSafe.push(p);
    let cur = addDays(last, 1);
    while (cur < actionDate) {
      ensure(cur).isDowntime = true;
      cur = addDays(cur, 1);
    }
  }
  ensure(actionDate).isAction = true;
  ensure(today).isToday = true;

  const months = monthsBetween(today, actionDate);

  return (
    <div className="bg-white p-6">
      <SectionHeader
        index="03"
        title="시술 캘린더"
        hint={`D-day ${timeline.action_date}${
          timeline.days_remaining !== null
            ? ` · D-${timeline.days_remaining}`
            : ""
        }`}
      />

      <div className="space-y-5 mb-5">
        {months.map((m) => (
          <MiniMonth
            key={`${m.year}-${m.month}`}
            year={m.year}
            month={m.month}
            today={today}
            actionDate={actionDate}
            dateMap={dateMap}
          />
        ))}
      </div>

      <Legend />

      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-2">
          시술별 마감일
        </div>
        {timeline.procedures.length > 0 ? (
          <ul className="space-y-1.5 text-xs">
            {timeline.procedures.map((p) => (
              <li
                key={p.procedure}
                className="flex items-center gap-2"
              >
                <span
                  className="w-2.5 h-2.5 shrink-0"
                  style={{ backgroundColor: colorFor(p.procedure) }}
                />
                <span className="text-slate-800 flex-1 min-w-0">
                  {p.procedure}
                  <span className="text-slate-400 ml-1.5 text-[10px]">
                    {p.category}
                  </span>
                </span>
                <span className="text-slate-500 font-mono shrink-0">
                  {formatShort(p.last_safe_date)}{" "}
                  <span className="text-slate-400">
                    (D-{p.days_before_action})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-400 italic">
            매칭되는 시술이 없거나 모든 마감일이 지났어요
          </p>
        )}
      </div>
    </div>
  );
}

function monthsBetween(start: Date, end: Date) {
  const out: { year: number; month: number }[] = [];
  let y = start.getFullYear();
  let m = start.getMonth();
  while (
    y < end.getFullYear() ||
    (y === end.getFullYear() && m <= end.getMonth())
  ) {
    out.push({ year: y, month: m });
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return out;
}

function MiniMonth({
  year,
  month,
  today,
  actionDate,
  dateMap,
}: {
  year: number;
  month: number;
  today: Date;
  actionDate: Date;
  dateMap: Map<string, DayStatus>;
}) {
  const firstOfMonth = new Date(year, month, 1);
  const startDow = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-2 font-mono">
        {year}.{String(month + 1).padStart(2, "0")}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {DOW.map((d) => (
          <div
            key={d}
            className="text-[9px] text-slate-400 text-center pb-1"
          >
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="h-7" />;
          const dt = new Date(year, month, d);
          const status = dateMap.get(dateKey(dt)) ?? emptyStatus();
          const isPast = dt < today && !status.isToday;
          return (
            <DayCell
              key={i}
              day={d}
              status={status}
              isPast={isPast}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayCell({
  day,
  status,
  isPast,
}: {
  day: number;
  status: DayStatus;
  isPast: boolean;
}) {
  let cls =
    "h-9 flex flex-col items-center justify-center text-[10px] tabular-nums relative";
  let style: React.CSSProperties = {};

  if (status.isAction) {
    cls += " bg-slate-900 text-white font-semibold";
  } else if (status.isLastSafe.length > 0) {
    // colored cell for last safe date — pick first procedure's color as bg tint
    const first = status.isLastSafe[0];
    cls += " text-slate-900 font-medium";
    style.backgroundColor = colorForBg(first.procedure);
  } else if (status.isDowntime) {
    cls += " bg-slate-100 text-slate-500";
  } else if (isPast) {
    cls += " text-slate-300";
  } else {
    cls += " text-slate-700";
  }

  if (status.isToday) {
    cls += " ring-1 ring-inset ring-slate-900";
  }

  const tooltip = status.isAction
    ? "Action Day"
    : status.isLastSafe.length > 0
    ? `${status.isLastSafe.map((p) => p.procedure).join(", ")} 마감`
    : status.isDowntime
    ? "다운타임"
    : status.isToday
    ? "오늘"
    : "";

  return (
    <div className={cls} style={style} title={tooltip || undefined}>
      <span className="leading-none mt-0.5">{day}</span>
      {!status.isAction && status.isLastSafe.length > 0 && (
        <div className="flex gap-0.5 mt-0.5 items-center">
          {status.isLastSafe.slice(0, 4).map((p) => (
            <span
              key={p.procedure}
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: colorFor(p.procedure) }}
            />
          ))}
          {status.isLastSafe.length > 4 && (
            <span className="text-[7px] text-slate-500">
              +{status.isLastSafe.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] text-slate-500 tracking-wide">
      <span className="inline-flex items-center gap-1.5">
        <span className="w-3 h-3 flex items-center justify-center" style={{ backgroundColor: "hsla(200, 60%, 70%, 0.15)" }}>
          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: "hsl(200, 62%, 55%)" }} />
        </span>
        마감일 (시술별 색)
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-3 h-3 bg-slate-100" />
        다운타임
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-3 h-3 bg-slate-900" />
        D-day
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-3 h-3 ring-1 ring-inset ring-slate-900" />
        오늘
      </span>
    </div>
  );
}

function formatShort(s: string): string {
  const d = parseDate(s);
  return `${d.getMonth() + 1}.${d.getDate()} ${DOW[d.getDay()]}`;
}

// === Clinic ===

function ClinicComparisonCard({ clinics }: { clinics: ClinicResult[] }) {
  return (
    <div className="bg-white p-6">
      <SectionHeader index="04" title="병원 비교 분석" />
      <div className="space-y-3">
        {clinics.map((c) => (
          <ClinicMiniCard key={c.id} clinic={c} />
        ))}
      </div>
      <p className="text-[11px] text-slate-400 mt-5 leading-relaxed border-t border-slate-100 pt-3">
        매칭 점수는 사용자가 입력한 리뷰 기반 분석이며 의료 선택의 절대 기준이
        아닙니다.
      </p>
    </div>
  );
}

function ClinicMiniCard({ clinic }: { clinic: ClinicResult }) {
  if (clinic.data_status !== "ok") {
    return (
      <div className="border border-slate-200 p-3">
        <div className="flex items-baseline justify-between mb-1">
          <div className="text-sm text-slate-900 font-medium">
            {clinic.label}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {clinic.review_count}건
          </div>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          {clinic.message ?? "데이터가 부족해요"}
        </p>
      </div>
    );
  }

  const grouped = groupByCategory(clinic.category_breakdown);
  const edgePct =
    clinic.review_count > 0
      ? Math.round((clinic.edge_review_count / clinic.review_count) * 100)
      : 0;

  return (
    <div className="border border-slate-200 p-3">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-sm text-slate-900 font-medium">
          {clinic.label}
        </div>
        <div className="text-2xl font-light text-slate-900 leading-none">
          {clinic.match_score}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 mb-2 text-[10px] tracking-wide border-t border-b border-slate-100 py-1.5">
        <div>
          <div className="text-slate-400">리뷰</div>
          <div className="text-slate-900 font-mono">{clinic.review_count}</div>
        </div>
        <div>
          <div className="text-slate-400">시술</div>
          <div className="text-slate-900 font-mono">
            {clinic.edge_review_count}
            <span className="text-slate-400 ml-0.5">({edgePct}%)</span>
          </div>
        </div>
        <div>
          <div className="text-slate-400">긍정</div>
          <div className="text-slate-900 font-mono">
            {clinic.positive_ratio !== null
              ? Math.round(clinic.positive_ratio * 100)
              : 0}
            %
          </div>
        </div>
      </div>

      {clinic.matched_procedures.length > 0 && (
        <div className="mb-2">
          <div className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mb-1">
            고민 매칭
          </div>
          <div className="flex flex-wrap gap-1">
            {clinic.matched_procedures.map((p) => (
              <span
                key={p}
                className="text-[10px] px-1.5 py-0.5 border border-slate-900 text-slate-900"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {grouped.length > 0 ? (
        <div className="mb-2">
          <div className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mb-1">
            카테고리별 언급
          </div>
          <div className="space-y-0.5">
            {grouped.map((g) => (
              <div key={g.category} className="text-[10px] leading-relaxed">
                <span className="text-slate-400 mr-1.5">{g.category}</span>
                {g.items.map((it, i) => (
                  <span key={it.procedure} className="text-slate-700">
                    {it.procedure}
                    <span className="text-slate-400 font-mono ml-0.5">
                      ·{it.mentions}
                    </span>
                    {i < g.items.length - 1 && (
                      <span className="text-slate-300">, </span>
                    )}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[10px] text-slate-400 mb-2 italic">
          시술 언급 없음
        </p>
      )}

      {clinic.sample_review && (
        <p className="text-[11px] text-slate-600 italic border-l-2 border-slate-300 pl-2 leading-relaxed mt-2">
          "{clinic.sample_review}"
        </p>
      )}
    </div>
  );
}

interface CategoryGroup {
  category: string;
  items: { procedure: string; mentions: number }[];
}

function groupByCategory(
  hits: { procedure: string; mentions: number; category: string }[]
): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>();
  for (const h of hits) {
    const g = map.get(h.category) ?? { category: h.category, items: [] };
    g.items.push({ procedure: h.procedure, mentions: h.mentions });
    map.set(h.category, g);
  }
  return Array.from(map.values()).sort((a, b) => {
    const aTotal = a.items.reduce((s, x) => s + x.mentions, 0);
    const bTotal = b.items.reduce((s, x) => s + x.mentions, 0);
    return bTotal - aTotal;
  });
}
