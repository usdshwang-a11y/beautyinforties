import re

DATE_RE = re.compile(
    r"(\d{4}\.\d{1,2}\.\d{1,2}|\d+\s*(?:일|주|달|개월|년)\s*전)"
)
BLANK_LINES_RE = re.compile(r"\n\s*\n\s*\n")
AUTH_RE = re.compile(r"(방문\s*인증|영수증\s*인증|예약|N\s*Pay)")
META_PREFIX_RE = re.compile(
    r"^\s*(?:사장님\s*답글:|답글:|방문\s*인증|영수증\s*인증|N\s*Pay|예약\s+(?:후|없이)\s+이용대기.*|\d{4}\.\d{1,2}\.\d{1,2}.*|\d+\s*(?:일|주|달|개월|년)\s*전.*|프로필|팔로우|반응\s*남기기|더보기|펼쳐서\s*더보기|팔로워\s+[\d,]+|리뷰\s*\d+\s*사진\s*\d+(?:팔로워\s+[\d,]+)?|방문일.*수단(?:영수증|결제내역).*)\s*$"
)

# --- Naver-map current UI format ---
PROFILE_ANCHOR_RE = re.compile(r"^프로필$", re.MULTILINE)
NAVER_HEADER_NOISE = {
    "사진·영상 리뷰",
    "사진/영상 리뷰만",
    "최신순",
    "정렬 안내",
    "리뷰 클렌징 시스템 작동중입니다",
    "펼쳐서 더보기",
}
NAVER_HEADER_NOISE_RE = re.compile(r"^리뷰\s*\d+\s*안내$")  # e.g. "리뷰595안내"
NAVER_BODY_NOISE_RE = re.compile(
    r"^(?:"
    r"프로필|팔로우|반응\s*남기기|더보기|펼쳐서\s*더보기|"
    r"팔로워\s+[\d,]+|"
    r"리뷰\s*\d+\s*사진\s*\d+(?:팔로워\s+[\d,]+)?|"
    r"예약\s+(?:후|없이)\s+이용대기.*|"
    r"방문일.*수단(?:영수증|결제내역).*"
    r")$"
)
NAVER_DATE_RE = re.compile(r"(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일")

MIN_BODY = 10


def _normalize(raw: str) -> str:
    return raw.replace("\r\n", "\n").replace("\r", "\n").strip()


def _mask(nick: str | None) -> str | None:
    if not nick:
        return None
    nick = nick.strip()
    if not nick:
        return None
    return nick[0] + "**"


def _extract_body(chunk_lines: list[str]) -> str:
    body_lines = [
        ln for ln in chunk_lines if ln.strip() and not META_PREFIX_RE.match(ln)
    ]
    return "\n".join(body_lines).strip()


def _extract_date(chunk: str) -> str | None:
    m = DATE_RE.search(chunk)
    return m.group(1) if m else None


def _split_by_date(text: str) -> list[dict]:
    lines = text.split("\n")
    anchors: list[int] = []
    for i, ln in enumerate(lines):
        if DATE_RE.search(ln):
            anchors.append(i)
    if not anchors:
        return []

    boundaries: list[int] = []
    for a in anchors:
        nick_line = a - 1 if a - 1 >= 0 else a
        while nick_line > 0 and not lines[nick_line].strip():
            nick_line -= 1
        boundaries.append(nick_line)

    boundaries = sorted(set(boundaries))
    boundaries.append(len(lines))

    chunks = []
    for i in range(len(boundaries) - 1):
        start, end = boundaries[i], boundaries[i + 1]
        chunk_lines = lines[start:end]
        if not chunk_lines:
            continue
        nickname = chunk_lines[0].strip() if chunk_lines else None
        body = _extract_body(chunk_lines[1:])
        if len(body) < MIN_BODY:
            continue
        chunks.append(
            {
                "nickname": _mask(nickname),
                "_raw_nickname": nickname,
                "date_raw": _extract_date("\n".join(chunk_lines)),
                "body": body,
            }
        )
    return chunks


def _split_by_blanks(text: str) -> list[dict]:
    parts = BLANK_LINES_RE.split(text)
    out = []
    for part in parts:
        lines = [ln for ln in part.split("\n") if ln.strip()]
        if len(lines) < 2:
            continue
        nickname = lines[0].strip()
        body = _extract_body(lines[1:])
        if len(body) < MIN_BODY:
            continue
        out.append(
            {
                "nickname": _mask(nickname),
                "_raw_nickname": nickname,
                "date_raw": _extract_date(part),
                "body": body,
            }
        )
    return out


def _split_by_auth_label(text: str) -> list[dict]:
    matches = list(AUTH_RE.finditer(text))
    if not matches:
        return []
    starts = [0] + [m.start() for m in matches]
    starts = sorted(set(starts))
    starts.append(len(text))
    out = []
    for i in range(len(starts) - 1):
        chunk = text[starts[i] : starts[i + 1]].strip()
        lines = [ln for ln in chunk.split("\n") if ln.strip()]
        if len(lines) < 2:
            continue
        nickname = lines[0].strip()
        body = _extract_body(lines[1:])
        if len(body) < MIN_BODY:
            continue
        out.append(
            {
                "nickname": _mask(nickname),
                "date_raw": _extract_date(chunk),
                "body": body,
            }
        )
    return out


def _strip_naver_header(text: str) -> str:
    out_lines = []
    for ln in text.split("\n"):
        s = ln.strip()
        if s in NAVER_HEADER_NOISE:
            continue
        if NAVER_HEADER_NOISE_RE.match(s):
            continue
        out_lines.append(ln)
    return "\n".join(out_lines)


def _split_by_profile_anchor(text: str) -> list[dict]:
    cleaned = _strip_naver_header(text)
    matches = list(PROFILE_ANCHOR_RE.finditer(cleaned))
    if len(matches) < 2:
        return []
    boundaries = [m.start() for m in matches] + [len(cleaned)]

    out: list[dict] = []
    for i in range(len(boundaries) - 1):
        chunk = cleaned[boundaries[i] : boundaries[i + 1]]
        survivors = [
            ln.strip()
            for ln in chunk.split("\n")
            if ln.strip() and not NAVER_BODY_NOISE_RE.match(ln.strip())
        ]
        if not survivors:
            continue
        nickname = survivors[0]
        body = "\n".join(survivors[1:]).strip()
        if len(body) < MIN_BODY:
            continue

        date_raw: str | None = None
        m = NAVER_DATE_RE.search(chunk)
        if m:
            y, mo, d = m.group(1), m.group(2).zfill(2), m.group(3).zfill(2)
            date_raw = f"{y}-{mo}-{d}"
        else:
            date_raw = _extract_date(chunk)

        out.append(
            {
                "nickname": _mask(nickname),
                "_raw_nickname": nickname,
                "date_raw": date_raw,
                "body": body,
            }
        )
    return out


def parse_naver_reviews(raw: str) -> list[dict]:
    if not raw or not raw.strip():
        return []
    text = _normalize(raw)

    for splitter in (
        _split_by_profile_anchor,
        _split_by_date,
        _split_by_blanks,
        _split_by_auth_label,
    ):
        result = splitter(text)
        if result:
            return result

    return [{"nickname": None, "date_raw": None, "body": text}]
