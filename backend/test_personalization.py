"""Compare cosmetic + supplement outputs across different concern sets."""
import json

from agents import cosmetic, diagnosis, supplement
from schemas import UserProfileForm

PROFILES = {
    "A: 수분지 + 기미·잡티/모공/탄력저하": {
        "skin_type": "수분지",
        "concerns": [
            {"name": "기미·잡티", "priority": 1},
            {"name": "모공", "priority": 2},
            {"name": "탄력저하", "priority": 3},
        ],
        "age_range": "45-49",
        "action_day": None,
        "care_level": "중급",
        "budget": 100000,
    },
    "B: 건성 + 주름/홍조/트러블": {
        "skin_type": "건성",
        "concerns": [
            {"name": "주름", "priority": 1},
            {"name": "홍조", "priority": 2},
            {"name": "트러블", "priority": 3},
        ],
        "age_range": "45-49",
        "action_day": None,
        "care_level": "중급",
        "budget": 100000,
    },
    "C: 지성 + 모공/트러블/칙칙함": {
        "skin_type": "지성",
        "concerns": [
            {"name": "모공", "priority": 1},
            {"name": "트러블", "priority": 2},
            {"name": "칙칙함", "priority": 3},
        ],
        "age_range": "40-44",
        "action_day": None,
        "care_level": "중급",
        "budget": 100000,
    },
}


def run(label, raw):
    form = UserProfileForm(**raw)
    profile = diagnosis.normalize(form)
    cos = cosmetic.build(profile)
    sup = supplement.build(profile)

    print(f"\n========== {label} ==========")
    print("AM:")
    for s in cos.morning:
        print(f"  {s.step}. {s.item}")
    print("PM:")
    for s in cos.evening:
        print(f"  {s.step}. {s.item}")
    print("Supplements:")
    for s in sup.daily_supplements:
        print(f"  - {s.ingredient} {s.dose_range} ({s.linked_concern})")


for label, raw in PROFILES.items():
    run(label, raw)
