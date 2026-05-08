from schemas import Supplement, SupplementTodos, UserProfile

# (ingredient, dose, timing_note, time_slot, post_note)
CONCERN_TO_SUPPLEMENTS = {
    "기미·잡티": [
        ("비타민C", "500-1000mg", "아침 식후", "아침 식후", "공복 자극 시 식후로"),
        ("L-시스테인", "240mg", "아침 식후", "아침 식후", "비타민C와 함께"),
    ],
    "주름": [
        ("저분자 콜라겐", "3-5g", "공복", "아침 식전", "수분과 함께 섭취"),
        ("비타민E", "200-400 IU", "식후", "언제든지", "지용성, 식사와 함께"),
    ],
    "탄력저하": [
        ("저분자 콜라겐", "3-5g", "공복", "아침 식전", "수분과 함께 섭취"),
        ("히알루론산", "120-240mg", "식후", "언제든지", ""),
    ],
    "홍조": [
        ("오메가3", "1000-2000mg", "식후", "언제든지", "지용성"),
        ("프로바이오틱스", "100억 CFU", "식전 30분", "아침 식전", "장-피부 축"),
    ],
    "트러블": [
        ("아연", "15-30mg", "식후", "언제든지", "구리와 균형 필요"),
        ("프로바이오틱스", "100억 CFU", "식전 30분", "아침 식전", "장-피부 축"),
    ],
    "다크서클": [
        ("철분", "18mg", "비타민C와 함께", "아침 식후", "칼슘과 분리"),
    ],
    "수분/건조": [
        ("세라마이드", "30-50mg", "식후", "언제든지", ""),
        ("히알루론산", "120-240mg", "식후", "언제든지", ""),
    ],
    "모공": [],
    "칙칙함": [
        ("비타민C", "500-1000mg", "아침 식후", "아침 식후", ""),
    ],
}

COMMON_40S = [
    ("비타민D", "1000-2000 IU", "식후", "언제든지", "지용성"),
    ("마그네슘", "300-400mg", "취침 전", "저녁", ""),
    ("오메가3", "1000-2000mg", "식후", "언제든지", "지용성"),
]

DISCLAIMER = "본 정보는 일반 영양 가이드이며 의학적 조언이 아닙니다. 복용 중인 약이 있다면 의사·약사와 상의하세요."


def build(profile: UserProfile) -> SupplementTodos:
    seen: set[str] = set()
    out: list[Supplement] = []

    for concern in profile.concerns:
        for ing, dose, timing, time_slot, note in CONCERN_TO_SUPPLEMENTS.get(
            concern.name, []
        ):
            if ing in seen:
                continue
            seen.add(ing)
            out.append(
                Supplement(
                    ingredient=ing,
                    dose_range=dose,
                    timing=timing,
                    time_slot=time_slot,
                    linked_concern=concern.name,
                    note=note,
                )
            )

    for ing, dose, timing, time_slot, note in COMMON_40S:
        if ing in seen:
            continue
        seen.add(ing)
        out.append(
            Supplement(
                ingredient=ing,
                dose_range=dose,
                timing=timing,
                time_slot=time_slot,
                linked_concern="40대 공통 권장",
                note=note,
            )
        )

    return SupplementTodos(daily_supplements=out, disclaimer=DISCLAIMER)
