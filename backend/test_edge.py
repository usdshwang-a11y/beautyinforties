"""Verify 1.8x edge weighting + category breakdown end-to-end."""
import json
import time
import urllib.request

# 12 reviews: 6 mention edge procedures, 6 are generic
EDGE_REVIEWS = """프로필
유저A
팔로우
예약 후 이용대기 시간 바로 입장
인모드 FX 받았는데 심부볼 효과 좋아요. 꼼꼼하시고 친절합니다!
반응 남기기
방문일4.22.수2026년 4월 22일 수요일1번째 방문인증 수단영수증
프로필
유저B
팔로우
예약 후 이용대기 시간 바로 입장
포텐자 흉터 시술 받았어요. 모공도 작아지고 효과 만족스럽습니다.
반응 남기기
방문일4.21.화2026년 4월 21일 화요일2번째 방문인증 수단영수증
프로필
유저C
팔로우
예약 후 이용대기 시간 바로 입장
필메드 (NCTF) 맞고 피부톤이 환해졌어요. 추천합니다.
반응 남기기
방문일4.20.월2026년 4월 20일 월요일1번째 방문인증 수단영수증
프로필
유저D
팔로우
예약 후 이용대기 시간 바로 입장
젠틀맥스 프로 잡티 제거 받았는데 효과 좋네요. 만족합니다.
반응 남기기
방문일4.19.일2026년 4월 19일 일요일1번째 방문인증 수단영수증
프로필
유저E
팔로우
예약 후 이용대기 시간 바로 입장
올리지오 리프팅 받고 탄력이 살아났어요!! 너무 좋습니다.
반응 남기기
방문일4.18.토2026년 4월 18일 토요일1번째 방문인증 수단영수증
프로필
유저F
팔로우
예약 후 이용대기 시간 바로 입장
브이빔으로 홍조 치료받고 있어요. 변화가 보여서 만족!
반응 남기기
방문일4.17.금2026년 4월 17일 금요일3번째 방문인증 수단영수증
프로필
유저G
팔로우
예약 후 이용대기 시간 바로 입장
원장님이 꼼꼼하게 봐주시고 친절하셔서 좋았습니다.
반응 남기기
방문일4.16.목2026년 4월 16일 목요일1번째 방문인증 수단영수증
프로필
유저H
팔로우
예약 후 이용대기 시간 바로 입장
상담 친절하게 잘 해주세요. 추천드려요.
반응 남기기
방문일4.15.수2026년 4월 15일 수요일2번째 방문인증 수단영수증
프로필
유저I
팔로우
예약 후 이용대기 시간 바로 입장
직원분들 모두 친절하시고 깨끗한 피부과예요.
반응 남기기
방문일4.14.화2026년 4월 14일 화요일1번째 방문인증 수단영수증
프로필
유저J
팔로우
예약 후 이용대기 시간 바로 입장
재방문 만족합니다. 늘 감사드려요.
반응 남기기
방문일4.13.월2026년 4월 13일 월요일4번째 방문인증 수단영수증
프로필
유저K
팔로우
예약 후 이용대기 시간 바로 입장
대기시간 짧고 시설 깨끗합니다. 좋았어요.
반응 남기기
방문일4.12.일2026년 4월 12일 일요일1번째 방문인증 수단영수증
프로필
유저L
팔로우
예약 후 이용대기 시간 바로 입장
원장님 설명 자세하게 해주셔서 신뢰가 갑니다.
반응 남기기
방문일4.11.토2026년 4월 11일 토요일1번째 방문인증 수단영수증"""


def main():
    payload = {
        "user_profile_form": {
            "skin_type": "수분지",
            "concerns": [
                {"name": "탄력저하", "priority": 1},
                {"name": "기미·잡티", "priority": 2},
                {"name": "모공", "priority": 3},
            ],
            "age_range": "45-49",
            "action_day": {"date": "2026-08-01", "event": "결혼식"},
            "care_level": "중급",
            "budget": 100000,
        },
        "clinic_reviews": {
            "clinic_01": EDGE_REVIEWS,
            "clinic_02": EDGE_REVIEWS,
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
        data = json.loads(resp.read().decode("utf-8"))

    for c in data["clinic_comparison"]["clinics"]:
        print(f"\n--- {c['id']} ({c['label']}) ---")
        print(f"  data_status: {c['data_status']}")
        print(f"  review_count: {c['review_count']}, edge_review_count: {c['edge_review_count']}")
        print(f"  match_score: {c['match_score']}, positive_ratio: {c['positive_ratio']}")
        print(f"  matched_procedures: {c['matched_procedures']}")
        print(f"  category_breakdown:")
        for h in c["category_breakdown"]:
            print(f"    [{h['category']}] {h['procedure']}: {h['mentions']}")
        if c.get("sample_review"):
            print(f"  sample_review: {c['sample_review'][:80]}...")

    c1 = data["clinic_comparison"]["clinics"][0]
    assert c1["data_status"] == "ok", f"clinic_01 should be ok, got {c1['data_status']}"
    assert c1["edge_review_count"] == 6, f"expected 6 edge reviews, got {c1['edge_review_count']}"
    assert len(c1["category_breakdown"]) >= 4, f"expected >=4 categories, got {len(c1['category_breakdown'])}"
    cats = {h["category"] for h in c1["category_breakdown"]}
    assert "프리미엄 리프팅" in cats
    assert "스킨부스터" in cats
    assert "모공/흉터" in cats
    assert "색소/혈관" in cats
    print("\nEDGE TEST PASSED")


if __name__ == "__main__":
    # tiny wait for server
    time.sleep(1.5)
    main()
