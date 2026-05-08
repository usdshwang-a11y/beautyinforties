import asyncio
import json
import os
import re
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from agents import cosmetic, diagnosis, scoring, supplement, timeline, wordmining
from parsers.review_parser import parse_naver_reviews
from schemas import (
    AnalyzeRequest,
    BenchmarkPayload,
    BenchmarkStatus,
    ClinicComparison,
    ClinicResult,
    DashboardPayload,
    UserProfile,
)

app = FastAPI(title="40대 맞춤 피부관리 플래너", version="1.3-beta")

# Comma-separated list of allowed origins. Set FRONTEND_URLS in production
# to e.g. "https://your-app.vercel.app". localhost is included for dev.
_default_origins = "http://localhost:3000"
_origins = [
    o.strip()
    for o in os.environ.get("FRONTEND_URLS", _default_origins).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA = Path(__file__).resolve().parent / "data"
BENCHMARK_DIR = DATA / "benchmarks"
CLINICS = json.loads((DATA / "clinics_target.json").read_text(encoding="utf-8"))["clinics"]
CLINIC_LABELS = {c["id"]: c["label"] for c in CLINICS}
_VALID_CLINIC_ID = re.compile(r"^[a-z0-9_]+$")


def _benchmark_path(clinic_id: str) -> Path:
    if not _VALID_CLINIC_ID.match(clinic_id):
        raise HTTPException(status_code=400, detail="invalid clinic_id")
    return BENCHMARK_DIR / f"{clinic_id}.txt"


def _load_benchmark(clinic_id: str) -> str:
    try:
        path = _benchmark_path(clinic_id)
    except HTTPException:
        return ""
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/benchmark", response_model=BenchmarkStatus)
async def save_benchmark(p: BenchmarkPayload) -> BenchmarkStatus:
    path = _benchmark_path(p.clinic_id)
    BENCHMARK_DIR.mkdir(parents=True, exist_ok=True)
    text = (p.reviews or "").strip()
    if not text:
        if path.exists():
            path.unlink()
        return BenchmarkStatus(clinic_id=p.clinic_id, exists=False, char_count=0)
    path.write_text(text, encoding="utf-8")
    return BenchmarkStatus(
        clinic_id=p.clinic_id, exists=True, char_count=len(text)
    )


@app.get("/api/benchmark/{clinic_id}", response_model=BenchmarkStatus)
async def get_benchmark_status(clinic_id: str) -> BenchmarkStatus:
    path = _benchmark_path(clinic_id)
    if not path.exists():
        return BenchmarkStatus(clinic_id=clinic_id, exists=False, char_count=0)
    text = path.read_text(encoding="utf-8")
    return BenchmarkStatus(clinic_id=clinic_id, exists=True, char_count=len(text))


async def _analyze_clinic(
    clinic_id: str, raw: str, profile: UserProfile
) -> ClinicResult:
    label = CLINIC_LABELS.get(clinic_id, clinic_id)
    if not raw or not raw.strip():
        raw = _load_benchmark(clinic_id)
    if not raw or not raw.strip():
        return ClinicResult(
            id=clinic_id,
            label=label,
            data_status="skipped",
            review_count=0,
            message="리뷰를 입력하지 않은 병원이에요",
        )
    parsed = parse_naver_reviews(raw)
    analyzed = await wordmining.analyze_reviews(parsed, clinic_id)
    return scoring.score(clinic_id, label, parsed, analyzed, profile)


@app.post("/api/analyze", response_model=DashboardPayload)
async def analyze(req: AnalyzeRequest) -> DashboardPayload:
    profile = diagnosis.normalize(req.user_profile_form)
    cosmetic_todos = cosmetic.build(profile)
    supplement_todos = supplement.build(profile)
    tl = timeline.build(profile)

    clinic_ids = [c["id"] for c in CLINICS]
    results = await asyncio.gather(
        *[
            _analyze_clinic(cid, req.clinic_reviews.get(cid, ""), profile)
            for cid in clinic_ids
        ]
    )

    return DashboardPayload(
        user_profile=profile,
        cosmetic_todos=cosmetic_todos,
        supplement_todos=supplement_todos,
        timeline=tl,
        clinic_comparison=ClinicComparison(clinics=list(results)),
    )
