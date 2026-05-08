"""End-to-end test of POST /api/analyze using urllib (no encoding gymnastics)."""
import json
import urllib.request
from pathlib import Path

SAMPLE = (Path(__file__).parent / "data" / "sample_reviews.txt").read_text(encoding="utf-8")

payload = {
    "user_profile_form": {
        "skin_type": "수분지",
        "concerns": [
            {"name": "기미·잡티", "priority": 1},
            {"name": "모공", "priority": 2},
            {"name": "탄력저하", "priority": 3},
        ],
        "age_range": "45-49",
        "action_day": {"date": "2026-08-01", "event": "결혼식"},
        "care_level": "중급",
        "budget": 100000,
    },
    "clinic_reviews": {
        "clinic_01": SAMPLE,
        "clinic_02": SAMPLE,
        "clinic_03": "",
    },
}

body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
req = urllib.request.Request(
    "http://127.0.0.1:8000/api/analyze",
    data=body,
    headers={"Content-Type": "application/json; charset=utf-8"},
    method="POST",
)
with urllib.request.urlopen(req, timeout=10) as resp:
    print("status:", resp.status)
    data = json.loads(resp.read().decode("utf-8"))

print("\n--- top-level keys ---")
print(list(data.keys()))

print("\n--- user_profile.action_day ---")
print(data["user_profile"]["action_day"])

print("\n--- cosmetic_todos.morning ---")
for s in data["cosmetic_todos"]["morning"]:
    print(f"  {s['step']}. {s['item']}")

print("\n--- supplement_todos (first 5) ---")
for s in data["supplement_todos"]["daily_supplements"][:5]:
    print(f"  {s['ingredient']} {s['dose_range']} ({s['linked_concern']})")

print("\n--- clinic_comparison ---")
for c in data["clinic_comparison"]["clinics"]:
    print(f"  {c['id']} ({c['label']}): status={c['data_status']} reviews={c['review_count']} score={c.get('match_score')}")

assert "user_profile" in data
assert "cosmetic_todos" in data
assert "supplement_todos" in data
assert "timeline" in data
assert "clinic_comparison" in data
assert len(data["clinic_comparison"]["clinics"]) == 3
print("\nE2E TEST PASSED")
