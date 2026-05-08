"""Smoke test — parser + wordmining stub against real Naver-map sample."""
import asyncio
from pathlib import Path

from agents import wordmining
from parsers.review_parser import parse_naver_reviews

SAMPLE = (Path(__file__).parent / "data" / "sample_reviews.txt").read_text(encoding="utf-8")

BOILERPLATE_TOKENS = ["프로필", "팔로우", "반응 남기기", "방문일", "수단영수증", "수단결제내역"]


def main():
    parsed = parse_naver_reviews(SAMPLE)
    print(f"parsed reviews: {len(parsed)}")
    for i, r in enumerate(parsed):
        body_preview = r["body"][:60].replace("\n", " ")
        print(f"  [{i}] nick={r['nickname']} date={r['date_raw']} body={body_preview!r}")
    assert len(parsed) >= 5, f"expected >= 5 reviews, got {len(parsed)}"

    for i, r in enumerate(parsed):
        for tok in BOILERPLATE_TOKENS:
            assert tok not in r["body"], (
                f"review {i} body leaked boilerplate {tok!r}: {r['body']!r}"
            )

    analyzed = asyncio.run(wordmining.analyze_reviews(parsed, "clinic_test"))
    print(f"\nanalyzed:")
    for p, a in zip(parsed, analyzed):
        print(f"  procs={a['mentioned_procedures']} sent={a['sentiment']} ad={a['is_ad_suspicious']} kws={a['key_keywords']}")

    neg_indices = [
        i for i, p in enumerate(parsed) if "최악" in p["body"] or "비추" in p["body"]
    ]
    assert neg_indices, "expected at least one negative review"
    for i in neg_indices:
        assert analyzed[i]["sentiment"] == "negative", (
            f"review {i} should be negative, got {analyzed[i]['sentiment']}"
        )

    pos_count = sum(1 for a in analyzed if a["sentiment"] == "positive")
    assert pos_count >= 3, f"expected >= 3 positive reviews, got {pos_count}"

    print("\nSMOKE TEST PASSED")


if __name__ == "__main__":
    main()
