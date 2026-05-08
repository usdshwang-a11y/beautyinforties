from datetime import date, datetime

from schemas import ActionDay, UserProfile, UserProfileForm


def _days_remaining(action_date_str: str | None) -> int | None:
    if not action_date_str:
        return None
    try:
        d = datetime.strptime(action_date_str, "%Y-%m-%d").date()
    except ValueError:
        return None
    return (d - date.today()).days


def normalize(form: UserProfileForm) -> UserProfile:
    sorted_concerns = sorted(form.concerns, key=lambda c: c.priority)[:3]
    ad_date = form.action_day.date if form.action_day else None
    ad_event = form.action_day.event if form.action_day else None
    return UserProfile(
        skin_type=form.skin_type,
        concerns=sorted_concerns,
        age_range=form.age_range,
        action_day=ActionDay(
            date=ad_date,
            event=ad_event,
            days_remaining=_days_remaining(ad_date),
        ),
        care_level=form.care_level,
        budget=form.budget,
    )
