from typing import Literal, Optional
from pydantic import BaseModel, Field

SkinType = Literal["건성", "지성", "복합성", "수분지", "민감성"]
CareLevel = Literal["초급", "중급", "고급"]
AgeRange = Literal["40-44", "45-49"]


class Concern(BaseModel):
    name: str
    priority: int = Field(ge=1, le=3)


class ActionDayForm(BaseModel):
    date: Optional[str] = None
    event: Optional[str] = None


class UserProfileForm(BaseModel):
    skin_type: SkinType
    concerns: list[Concern]
    age_range: AgeRange
    action_day: Optional[ActionDayForm] = None
    care_level: CareLevel
    budget: int


class ActionDay(BaseModel):
    date: Optional[str]
    event: Optional[str]
    days_remaining: Optional[int]


class UserProfile(BaseModel):
    skin_type: SkinType
    concerns: list[Concern]
    age_range: AgeRange
    action_day: ActionDay
    care_level: CareLevel
    budget: int


class TodoStep(BaseModel):
    step: int
    item: str
    ingredient_category: Optional[str] = None


class IngredientMeta(BaseModel):
    ingredient: str
    function: str
    category: str = ""
    products: list[str] = []


class CosmeticTodos(BaseModel):
    morning: list[TodoStep]
    evening: list[TodoStep]
    weekly: list[TodoStep]
    ingredient_meta: list[IngredientMeta] = []


TimeSlot = Literal[
    "언제든지",
    "아침 식전",
    "아침 식후",
    "점심 식전",
    "점심 식후",
    "저녁",
]


class Supplement(BaseModel):
    ingredient: str
    dose_range: str
    timing: str
    time_slot: TimeSlot
    linked_concern: str
    note: str


class SupplementTodos(BaseModel):
    daily_supplements: list[Supplement]
    disclaimer: str


class ProcedureSchedule(BaseModel):
    procedure: str
    category: str
    last_safe_date: str  # YYYY-MM-DD
    downtime_days: int
    days_before_action: int


class Timeline(BaseModel):
    action_date: Optional[str] = None
    days_remaining: Optional[int] = None
    procedures: list[ProcedureSchedule] = []


class CategoryHit(BaseModel):
    procedure: str
    mentions: int
    category: str


class ClinicResult(BaseModel):
    id: str
    label: str
    data_status: Literal["ok", "insufficient", "skipped"]
    review_count: int = 0
    match_score: Optional[int] = None
    matched_procedures: list[str] = []
    positive_ratio: Optional[float] = None
    ad_suspicion_ratio: Optional[float] = None
    strengths: list[str] = []
    sample_review: Optional[str] = None
    message: Optional[str] = None
    edge_review_count: int = 0
    category_breakdown: list[CategoryHit] = []


class ClinicComparison(BaseModel):
    clinics: list[ClinicResult]


class AnalyzeRequest(BaseModel):
    user_profile_form: UserProfileForm
    clinic_reviews: dict[str, str]


class BenchmarkPayload(BaseModel):
    clinic_id: str
    reviews: str


class BenchmarkStatus(BaseModel):
    clinic_id: str
    exists: bool
    char_count: int = 0


class DashboardPayload(BaseModel):
    user_profile: UserProfile
    cosmetic_todos: CosmeticTodos
    supplement_todos: SupplementTodos
    timeline: Timeline
    clinic_comparison: ClinicComparison
