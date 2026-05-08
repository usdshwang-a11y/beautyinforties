import json
from pathlib import Path

from schemas import CosmeticTodos, IngredientMeta, TodoStep, UserProfile

DATA = Path(__file__).resolve().parents[1] / "data"
INGREDIENT_MAP = json.loads((DATA / "ingredient_map.json").read_text(encoding="utf-8"))
INGREDIENT_PRODUCTS = json.loads(
    (DATA / "ingredient_products.json").read_text(encoding="utf-8")
)

BASE_ROUTINE = {
    "건성": {
        "morning": ["저자극 클렌저", "토너", "에센스", "크림(고보습)", "SPF"],
        "evening": ["저자극 클렌저", "토너", "에센스", "크림(고보습)"],
    },
    "지성": {
        "morning": ["약산성 클렌저", "토너(BHA)", "가벼운 세럼", "젤크림", "SPF"],
        "evening": ["이중 클렌저", "토너(BHA)", "가벼운 세럼", "젤크림"],
    },
    "복합성": {
        "morning": ["약산성 클렌저", "토너", "에센스", "부위별 크림"],
        "evening": ["이중 클렌저", "토너", "에센스", "부위별 크림"],
    },
    "수분지": {
        "morning": ["저자극 클렌저", "보습 토너", "수분 세럼", "가벼운 크림"],
        "evening": ["이중 클렌저", "보습 토너", "수분 세럼", "가벼운 크림"],
    },
    "민감성": {
        "morning": ["약산성 클렌저", "진정 토너", "시카 세럼", "베리어 크림"],
        "evening": ["저자극 클렌저", "진정 토너", "시카 세럼", "베리어 크림"],
    },
}

# AM 시간대 우선 성분 (자외선 보호 동시), PM은 레티놀/AHA 등
AM_INGREDIENTS = {"비타민C(AM)", "나이아신아마이드", "알부틴", "트라넥사믹산", "판테놀", "시카", "마데카소사이드", "알란토인"}
PM_INGREDIENTS = {"레티놀(PM)", "BHA", "AHA", "글리콜산"}


def _pick_ingredient(concern_name: str, slot: str) -> str | None:
    candidates = INGREDIENT_MAP.get(concern_name, [])
    bucket = AM_INGREDIENTS if slot == "morning" else PM_INGREDIENTS
    for c in candidates:
        if c in bucket:
            return c
    # 충돌 없는 첫 후보 폴백
    for c in candidates:
        if slot == "morning" and c not in PM_INGREDIENTS:
            return c
        if slot == "evening" and c not in AM_INGREDIENTS - {"판테놀", "시카"}:
            return c
    return candidates[0] if candidates else None


def _build_slot(profile: UserProfile, slot: str) -> list[TodoStep]:
    routine = BASE_ROUTINE[profile.skin_type][slot]
    steps: list[TodoStep] = []
    used: set[str] = set()
    insert_after = 1  # 토너 다음에 세럼 삽입

    for i, item in enumerate(routine):
        steps.append(TodoStep(step=i + 1, item=item))

    # 우선순위 1, 2 고민에 대해 타겟 세럼 삽입
    for concern in profile.concerns[:2]:
        ing = _pick_ingredient(concern.name, slot)
        if ing and ing not in used:
            used.add(ing)
            steps.insert(
                insert_after + 1,
                TodoStep(
                    step=0,
                    item=f"{ing} 세럼 ({concern.name})",
                    ingredient_category=ing,
                ),
            )
            insert_after += 1

    # step 번호 재정렬
    for i, s in enumerate(steps):
        s.step = i + 1
    return steps


def _build_weekly(profile: UserProfile) -> list[TodoStep]:
    items = ["주 1-2회 각질관리", "주 1-2회 시트마스크"]
    concern_names = {c.name for c in profile.concerns}
    if "모공" in concern_names or "칙칙함" in concern_names:
        items.append("주 1회 클레이마스크")
    if "기미·잡티" in concern_names:
        items.append("주 1회 비타민C 마스크")
    return [TodoStep(step=i + 1, item=v) for i, v in enumerate(items)]


def _ingredient_meta(steps_groups: list[list[TodoStep]]) -> list[IngredientMeta]:
    seen: set[str] = set()
    out: list[IngredientMeta] = []
    for steps in steps_groups:
        for s in steps:
            ing = s.ingredient_category
            if not ing or ing in seen:
                continue
            seen.add(ing)
            entry = INGREDIENT_PRODUCTS.get(ing, {})
            out.append(
                IngredientMeta(
                    ingredient=ing,
                    function=entry.get("function", ""),
                    category=entry.get("category", ""),
                    products=entry.get("products", []),
                )
            )
    return out


def build(profile: UserProfile) -> CosmeticTodos:
    morning = _build_slot(profile, "morning")
    evening = _build_slot(profile, "evening")
    weekly = _build_weekly(profile)
    return CosmeticTodos(
        morning=morning,
        evening=evening,
        weekly=weekly,
        ingredient_meta=_ingredient_meta([morning, evening, weekly]),
    )
