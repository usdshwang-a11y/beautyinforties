from collections import Counter

from agents.wordmining import PROCEDURE_TO_CATEGORY
from schemas import CategoryHit, ClinicResult, UserProfile

CONCERN_TO_PROCEDURES = {
    "기미·잡티":   ["레블라이트", "젠틀맥스", "피코프락셀", "토닝", "IPL", "루비레이저"],
    "주름":        ["인모드", "올리지오", "티타늄", "보톡스", "필러"],
    "모공":        ["포텐자", "피코프락셀", "프락셀"],
    "홍조":        ["브이빔", "젠틀맥스", "IPL"],
    "탄력저하":    ["인모드", "올리지오", "티타늄", "슈링크", "리쥬란"],
    "트러블":      ["포텐자", "PDT"],
    "다크서클":    ["인모드", "필러"],
    "수분/건조":   ["릴리이드", "필메드", "싸이토케어", "리쥬란"],
    "칙칙함":      ["레블라이트", "젠틀맥스", "피코프락셀", "밀크필", "제네시스", "토닝"],
}

INSUFFICIENT_THRESHOLD = 10
EDGE_WEIGHT = 1.8


def _target_procedures(profile: UserProfile) -> set[str]:
    out: set[str] = set()
    for c in profile.concerns:
        for p in CONCERN_TO_PROCEDURES.get(c.name, []):
            out.add(p)
    return out


def _representative(parsed: list[dict], analyzed: list[dict]) -> str | None:
    # Prefer an edge review (procedure-mentioning + positive + non-ad)
    for r, a in zip(parsed, analyzed):
        if (
            a["mentioned_procedures"]
            and a["sentiment"] == "positive"
            and not a["is_ad_suspicious"]
        ):
            return r["body"][:200]
    # Fall back to any positive non-ad review
    for r, a in zip(parsed, analyzed):
        if a["sentiment"] == "positive" and not a["is_ad_suspicious"]:
            return r["body"][:200]
    for r in parsed:
        if r.get("body"):
            return r["body"][:200]
    return None


def _category_breakdown(proc_counter: Counter[str]) -> list[CategoryHit]:
    hits = [
        CategoryHit(
            procedure=proc,
            mentions=count,
            category=PROCEDURE_TO_CATEGORY.get(proc, "기타"),
        )
        for proc, count in proc_counter.most_common()
    ]
    return hits


def score(
    clinic_id: str,
    label: str,
    parsed: list[dict],
    analyzed: list[dict],
    profile: UserProfile,
) -> ClinicResult:
    review_count = len(parsed)
    valid = [a for a in analyzed if not a["is_ad_suspicious"]]
    valid_count = len(valid)

    if valid_count < INSUFFICIENT_THRESHOLD:
        return ClinicResult(
            id=clinic_id,
            label=label,
            data_status="insufficient",
            review_count=review_count,
            message=f"리뷰가 {INSUFFICIENT_THRESHOLD}건 미만이라 비교에서 제외되었어요 (유효 {valid_count}건)",
        )

    # 1.8x weighted positive_ratio: procedure-mentioning reviews count more
    weights = [
        EDGE_WEIGHT if a["mentioned_procedures"] else 1.0 for a in valid
    ]
    total_weight = sum(weights)
    weighted_pos = sum(
        w for w, a in zip(weights, valid) if a["sentiment"] == "positive"
    )
    positive_ratio = weighted_pos / total_weight if total_weight else 0.0

    # Procedure aggregation
    proc_counter: Counter[str] = Counter()
    for a in valid:
        for p in a["mentioned_procedures"]:
            proc_counter[p] += 1

    target = _target_procedures(profile)
    if target:
        target_hits = sum(proc_counter.get(p, 0) for p in target)
        proc_total = sum(proc_counter.values()) or 1
        proc_match = min(target_hits / proc_total, 1.0)
    else:
        proc_match = 0.0

    edge_review_count = sum(1 for a in valid if a["mentioned_procedures"])
    edge_ratio = edge_review_count / valid_count if valid_count else 0.0

    review_norm = min(valid_count / 50, 1.0)
    ad_ratio = (review_count - valid_count) / review_count if review_count else 0.0

    raw = (
        proc_match * 0.40
        + positive_ratio * 0.30
        + edge_ratio * 0.15
        + (1 - ad_ratio) * 0.15
    )
    match_score = round(raw * 100)

    matched_procedures = sorted(
        (p for p in proc_counter if p in target),
        key=lambda p: -proc_counter[p],
    )[:5]

    keyword_counter: Counter[str] = Counter()
    for a in valid:
        for kw in a["key_keywords"]:
            keyword_counter[kw] += 1
    strengths = [k for k, _ in keyword_counter.most_common(5)]

    return ClinicResult(
        id=clinic_id,
        label=label,
        data_status="ok",
        review_count=review_count,
        match_score=match_score,
        matched_procedures=matched_procedures,
        positive_ratio=round(positive_ratio, 2),
        ad_suspicion_ratio=round(ad_ratio, 2),
        strengths=strengths,
        sample_review=_representative(parsed, analyzed),
        edge_review_count=edge_review_count,
        category_breakdown=_category_breakdown(proc_counter),
    )
