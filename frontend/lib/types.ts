export type SkinType = "건성" | "지성" | "복합성" | "수분지" | "민감성";
export type CareLevel = "초급" | "중급" | "고급";
export type AgeRange = "40-44" | "45-49";

export interface Concern {
  name: string;
  priority: number;
}

export interface ActionDayForm {
  date: string | null;
  event: string | null;
}

export interface UserProfileForm {
  skin_type: SkinType;
  concerns: Concern[];
  age_range: AgeRange;
  action_day: ActionDayForm | null;
  care_level: CareLevel;
  budget: number;
}

export interface ActionDay {
  date: string | null;
  event: string | null;
  days_remaining: number | null;
}

export interface UserProfile {
  skin_type: SkinType;
  concerns: Concern[];
  age_range: AgeRange;
  action_day: ActionDay;
  care_level: CareLevel;
  budget: number;
}

export interface TodoStep {
  step: number;
  item: string;
  ingredient_category: string | null;
}

export interface IngredientMeta {
  ingredient: string;
  function: string;
  category: string;
  products: string[];
}

export interface CosmeticTodos {
  morning: TodoStep[];
  evening: TodoStep[];
  weekly: TodoStep[];
  ingredient_meta: IngredientMeta[];
}

export type TimeSlot =
  | "언제든지"
  | "아침 식전"
  | "아침 식후"
  | "점심 식전"
  | "점심 식후"
  | "저녁";

export const TIME_SLOT_ORDER: TimeSlot[] = [
  "언제든지",
  "아침 식전",
  "아침 식후",
  "점심 식전",
  "점심 식후",
  "저녁",
];

export interface Supplement {
  ingredient: string;
  dose_range: string;
  timing: string;
  time_slot: TimeSlot;
  linked_concern: string;
  note: string;
}

export interface SupplementTodos {
  daily_supplements: Supplement[];
  disclaimer: string;
}

export interface ProcedureSchedule {
  procedure: string;
  category: string;
  last_safe_date: string;
  downtime_days: number;
  days_before_action: number;
}

export interface Timeline {
  action_date: string | null;
  days_remaining: number | null;
  procedures: ProcedureSchedule[];
}

export interface CategoryHit {
  procedure: string;
  mentions: number;
  category: string;
}

export interface ClinicResult {
  id: string;
  label: string;
  data_status: "ok" | "insufficient" | "skipped";
  review_count: number;
  match_score: number | null;
  matched_procedures: string[];
  positive_ratio: number | null;
  ad_suspicion_ratio: number | null;
  strengths: string[];
  sample_review: string | null;
  message: string | null;
  edge_review_count: number;
  category_breakdown: CategoryHit[];
}

export interface DashboardPayload {
  user_profile: UserProfile;
  cosmetic_todos: CosmeticTodos;
  supplement_todos: SupplementTodos;
  timeline: Timeline;
  clinic_comparison: { clinics: ClinicResult[] };
}

export interface AnalyzeRequest {
  user_profile_form: UserProfileForm;
  clinic_reviews: Record<string, string>;
}

export interface BenchmarkStatus {
  clinic_id: string;
  exists: boolean;
  char_count: number;
}

export const CLINIC_IDS = ["clinic_01", "clinic_02", "clinic_03"] as const;
export const CLINIC_LABELS: Record<string, string> = {
  clinic_01: "병원 A",
  clinic_02: "병원 B",
  clinic_03: "병원 C",
};
