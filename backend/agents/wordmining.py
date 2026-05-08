"""
Review wordmining.

Default path is a deterministic local stub (data/keyword_sentiment.json + procedure_dict.json).
If ANTHROPIC_API_KEY is set, swap in the Claude path that batches reviews per clinic.
"""

from __future__ import annotations

import json
import os
from collections import Counter
from pathlib import Path

DATA = Path(__file__).resolve().parents[1] / "data"
_PROC_RAW = json.loads((DATA / "procedure_dict.json").read_text(encoding="utf-8"))
PROCEDURE_ALIASES: dict[str, list[str]] = _PROC_RAW["aliases"]
PROCEDURE_CATEGORIES: dict[str, list[str]] = _PROC_RAW["categories"]
PROCEDURE_TO_CATEGORY: dict[str, str] = {
    proc: cat for cat, procs in PROCEDURE_CATEGORIES.items() for proc in procs
}
KEYWORD_SENT: dict[str, list[str]] = json.loads(
    (DATA / "keyword_sentiment.json").read_text(encoding="utf-8")
)
_CLINIC_OVERRIDES_PATH = DATA / "clinic_overrides.json"
CLINIC_OVERRIDES: dict[str, dict] = (
    json.loads(_CLINIC_OVERRIDES_PATH.read_text(encoding="utf-8"))
    if _CLINIC_OVERRIDES_PATH.exists()
    else {}
)


def _apply_clinic_ignore(body: str, clinic_id: str) -> str:
    overrides = CLINIC_OVERRIDES.get(clinic_id, {})
    subs = overrides.get("ignore_substrings", [])
    cleaned = body
    for sub in subs:
        cleaned = cleaned.replace(sub, " ")
    return cleaned

CLAUDE_MODEL = "claude-haiku-4-5-20251001"


def _detect_procedures(body: str) -> list[str]:
    body_lower = body.lower()
    out = set()
    for canonical, aliases in PROCEDURE_ALIASES.items():
        for alias in aliases:
            if alias in body or alias.lower() in body_lower:
                out.add(canonical)
                break
    return sorted(out)


def _sentiment(body: str) -> str:
    pos = sum(body.count(w) for w in KEYWORD_SENT["positive"])
    neg = sum(body.count(w) for w in KEYWORD_SENT["negative"])
    if pos > neg:
        return "positive"
    if neg > pos:
        return "negative"
    return "neutral"


def _is_ad_suspicious(
    body: str, procedures: list[str], nickname: str | None, all_nicknames: Counter
) -> tuple[bool, str | None]:
    for w in KEYWORD_SENT["ad_suspect"]:
        if w in body:
            return True, f"광고 의심 키워드: {w}"
    if len(body) > 800 and len(procedures) >= 3:
        return True, "긴 본문 + 다수 시술 칭찬"
    if nickname and all_nicknames[nickname] >= 2:
        return True, "동일 닉네임 다수 리뷰"
    return False, None


def _key_keywords(body: str) -> list[str]:
    out = []
    for w in KEYWORD_SENT["positive"]:
        if w in body:
            out.append(w)
        if len(out) >= 3:
            break
    return out


def _stub_analyze(parsed: list[dict], clinic_id: str = "") -> list[dict]:
    nick_counter = Counter(
        (p.get("_raw_nickname") or p.get("nickname"))
        for p in parsed
        if p.get("_raw_nickname") or p.get("nickname")
    )
    out = []
    for i, r in enumerate(parsed):
        body = r.get("body", "")
        scored_body = _apply_clinic_ignore(body, clinic_id)
        procs = _detect_procedures(body)
        nick_key = r.get("_raw_nickname") or r.get("nickname")
        ad, reason = _is_ad_suspicious(body, procs, nick_key, nick_counter)
        out.append(
            {
                "review_index": i,
                "mentioned_procedures": procs,
                "sentiment": _sentiment(scored_body),
                "is_ad_suspicious": ad,
                "ad_reason": reason,
                "key_keywords": _key_keywords(scored_body),
            }
        )
    return out


async def _claude_analyze(parsed: list[dict], clinic_id: str) -> list[dict]:
    """
    Real Claude path. Only invoked when ANTHROPIC_API_KEY is set.
    Falls back to stub on any error so the dashboard always renders.
    """
    try:
        from anthropic import AsyncAnthropic
    except ImportError:
        return _stub_analyze(parsed, clinic_id)

    client = AsyncAnthropic()
    reviews_payload = json.dumps(
        [{"index": i, "body": r["body"]} for i, r in enumerate(parsed)],
        ensure_ascii=False,
    )
    procedure_aliases = json.dumps(PROCEDURE_ALIASES, ensure_ascii=False)

    prompt = f"""다음은 한 피부과의 리뷰 {len(parsed)}개입니다. 각 리뷰를 분석해 JSON으로 반환하세요.

[리뷰 목록]
{reviews_payload}

[시술명 정규화 사전]
{procedure_aliases}

요구 출력 (배열, 각 리뷰별):
[{{
  "review_index": 0,
  "mentioned_procedures": ["토닝", "포텐자"],
  "sentiment": "positive" | "negative" | "neutral",
  "is_ad_suspicious": true | false,
  "ad_reason": "체험단 표현 등" | null,
  "key_keywords": ["꼼꼼", "친절"]
}}]

광고 의심 신호: 체험단/협찬/이벤트 명시, 비정상적으로 긴 본문 + 모든 시술 칭찬, 동일 닉네임이 짧은 시간에 여러 리뷰.
JSON 배열만 반환하세요. 다른 텍스트 X.
"""

    try:
        msg = await client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}],
        )
        text = msg.content[0].text
        start = text.find("[")
        end = text.rfind("]")
        if start == -1 or end == -1:
            return _stub_analyze(parsed, clinic_id)
        return json.loads(text[start : end + 1])
    except Exception:
        return _stub_analyze(parsed, clinic_id)


async def analyze_reviews(parsed: list[dict], clinic_id: str) -> list[dict]:
    if not parsed:
        return []
    if os.environ.get("ANTHROPIC_API_KEY"):
        return await _claude_analyze(parsed, clinic_id)
    return _stub_analyze(parsed, clinic_id)
