import json
from datetime import date, datetime, timedelta
from pathlib import Path

from agents.scoring import CONCERN_TO_PROCEDURES
from agents.wordmining import PROCEDURE_TO_CATEGORY
from schemas import ProcedureSchedule, Timeline, UserProfile

DATA = Path(__file__).resolve().parents[1] / "data"
SCHEDULE: dict[str, int] = json.loads(
    (DATA / "procedure_schedule.json").read_text(encoding="utf-8")
)


def build(profile: UserProfile) -> Timeline:
    if not profile.action_day.date or profile.action_day.days_remaining is None:
        return Timeline()

    try:
        action_date = datetime.strptime(profile.action_day.date, "%Y-%m-%d").date()
    except ValueError:
        return Timeline()

    today = date.today()

    relevant: set[str] = set()
    for c in profile.concerns:
        for p in CONCERN_TO_PROCEDURES.get(c.name, []):
            if p in SCHEDULE:
                relevant.add(p)

    procedures: list[ProcedureSchedule] = []
    for p in relevant:
        downtime = SCHEDULE[p]
        last_safe = action_date - timedelta(days=downtime)
        if last_safe < today:
            continue
        procedures.append(
            ProcedureSchedule(
                procedure=p,
                category=PROCEDURE_TO_CATEGORY.get(p, "기타"),
                last_safe_date=last_safe.isoformat(),
                downtime_days=downtime,
                days_before_action=downtime,
            )
        )

    procedures.sort(key=lambda x: x.last_safe_date)

    return Timeline(
        action_date=profile.action_day.date,
        days_remaining=profile.action_day.days_remaining,
        procedures=procedures,
    )
