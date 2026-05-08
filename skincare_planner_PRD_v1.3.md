# 40대 여성 맞춤 피부관리 프로그램 — 기획서 (v1.3 / Beta)

> Claude Code 작업용 PRD (Product Requirements Document)
> 대상 지역: 경기도 성남시 분당구 (사용자 지정 3개 병원)
> 목표: 2시간 내 작동하는 MVP 프로토타입
> **변경 이력**: v1.0 → v1.1 (스택) → v1.2 (Beta 범위) → v1.3 (Plan B 메인, 단순 UX)

---

## 0. v1.3 핵심 결정사항 (Decisions Log)

| 항목 | v1.2 | v1.3 (확정) | 이유 |
|------|------|-------------|------|
| 데이터 수집 방식 | Plan A 우선 + B/C fallback | **Plan B (사용자 복붙) 메인** | 크롤링 리스크 제거, 분석 품질 안정 |
| 리뷰 입력 UX | 미정 | **textarea 1개 / 병원, 자동 파싱** | 사용자 부담 최소화 |
| 실시간 카운터 | 미정 | **없음** | 시간 절약, 단순함 |
| 파싱 결과 노출 | 미정 | **노출 안 함 (서버만 처리)** | 불완전한 결과로 인한 불안 회피 |
| 최소 리뷰 수 | 50건 권장 | **10건 이상이면 분석 진행** | 사용자 부담 완화 |
| Plan A (크롤링) | 메인 | **Phase 1+ 옵션** | Beta는 Plan B로 충분 |

### 0.1 사용자 지정 분석 대상 (Beta)

```
1. https://naver.me/GeURykHe   (단축URL #1)
2. https://naver.me/5zXc14lX   (단축URL #2)
3. https://naver.me/GUwik9QI   (단축URL #3)
```

> 사용자가 위 3개 링크를 직접 방문해 리뷰를 복사·붙여넣기 함.
> 시스템은 단축URL을 데이터로만 보관 (Phase 1+에서 크롤링 활용 가능).

---

## 1. 서비스 개요

### 1.1 한 줄 정의
40대 여성의 **피부 고민**과 **이벤트(Action Day)**를 입력받아, 사용자가 직접 붙여넣은 **3개 피부과 리뷰**를 분석하여 **개인 맞춤 화장품/영양제 To-do**와 **병원 비교 분석**을 제공하는 웹 대시보드.

### 1.2 핵심 가치 제안
- **개인화**: 피부타입 + 고민 + 이벤트 기반 타임라인 설계
- **객관성**: 사용자가 가져온 실제 리뷰를 분석한 시술 평판
- **단순함**: 복붙 한 번으로 분석 완료
- **실행력**: 매일 체크 가능한 To-do

### 1.3 핵심 기능 (MVP 범위)
| 번호 | 기능 | 우선순위 | 검증 우선순위 |
|------|------|----------|---------------|
| F1 | 피부 진단 폼 | P0 | ① |
| F2 | 화장품 To-do 알고리즘 | P0 | ① |
| F3 | 영양제 To-do 알고리즘 (성분 단위) | P0 | ① |
| F4 | Action Day 역산 타임라인 | P0 | ③ |
| F5 | 리뷰 복붙 입력 + 자동 파싱 | P0 | ② |
| F6 | 시술별 워드마이닝 + 감성 분석 (Claude API) | P0 | ② |
| F7 | 3개 병원 비교 분석 | P0 | ② |
| F8 | 통합 대시보드 시각화 | P0 | ① (전부의 전제) |

---

## 2. 사용자 플로우

```
[랜딩] 
  → [Step 1: 피부 진단 입력]
  → [Step 2: 3개 병원 리뷰 복붙] (탭 3개)
  → [분석 중...] (Claude API 호출)
  → [대시보드]
       ├─ 화장품 To-do
       ├─ 영양제 To-do (성분만)
       ├─ Action Day 타임라인
       └─ 3개 병원 비교 분석
```

### 2.1 Step 1: 피부 진단 입력
- **피부 타입** (단일): 건성 / 지성 / 복합성 / 수부지 / 민감성
- **피부 고민** (복수, 우선순위 1~3순위):
  기미·잡티 / 주름 / 모공 / 홍조 / 탄력저하 / 트러블 / 칙칙함 / 다크서클
- **나이대**: 40-44 / 45-49
- **Action Day** (선택): 날짜 + 이벤트 (결혼식/동창회/촬영/여행/없음)
- **현재 케어 수준**: 초보 / 중급 / 고급
- **예산대**: 월 5만 / 10만 / 20만 / 그 이상

### 2.2 Step 2: 리뷰 입력 (v1.3 핵심 단순화)

**UX 원칙**:
- 병원 3개를 **탭** 으로 분리 (한 번에 한 병원씩 작업)
- 각 탭에 **textarea 1개**, placeholder에 안내 문구
- 사용자는 네이버 지도에서 **리뷰 영역 통째로 복사 → 붙여넣기**
- 카운터·미리보기 **없음** (불안 유발 회피)
- 모든 탭 입력 후 "분석 시작" 버튼

**탭 UI 예시**:
```
┌─────────────────────────────────────────────────┐
│ [병원 A] [병원 B] [병원 C]    ← 탭            │
├─────────────────────────────────────────────────┤
│ 병원 A의 네이버 지도 리뷰를 복사해서 붙여넣어 주세요. │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ (textarea, 높이 500px)                     │ │
│ │                                             │ │
│ │ placeholder:                                │ │
│ │ "예시:                                       │ │
│ │  닉네임1                                     │ │
│ │  2024.12.15 방문                            │ │
│ │  토닝 받았는데 정말 효과 좋았어요...          │ │
│ │                                             │ │
│ │  닉네임2                                     │ │
│ │  ..."                                        │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ 💡 빈 리뷰는 자동으로 무시됩니다. 최소 10건 권장.  │
│ 💡 광고성 리뷰는 자동으로 걸러집니다.             │
│                                                 │
│        [건너뛰기]    [다음 병원 →]              │
└─────────────────────────────────────────────────┘
```

**건너뛰기 옵션**: 리뷰 없이도 진행 가능. 단 해당 병원은 비교 분석에서 "데이터 부족" 표시.

---

## 3. 알고리즘 설계

### 3.1 화장품 To-do 알고리즘

**원칙**: 피부타입 × 고민 × 시간대 × 단계

```
STEP 1: 베이스 루틴 (피부 타입)
  - 건성: 저자극 클렌저 → 토너 → 에센스 → 크림(고보습) → SPF
  - 지성: 산성 클렌저 → 토너(BHA) → 가벼운 세럼 → 젤크림 → SPF
  - 복합성: 약산성 클렌저 → 토너 → 에센스 → 부위별 크림
  - 수부지: 저자극 클렌저 → 보습토너 → 수분세럼 → 가벼운 크림
  - 민감성: 약산성 클렌저 → 진정토너 → 시카세럼 → 베리어크림

STEP 2: 타겟 성분 매핑 (피부 고민)
  기미·잡티   → 비타민C(AM), 나이아신아마이드, 알부틴, 트라넥사믹산
  주름       → 레티놀(PM), 펩타이드, 바쿠치올
  모공       → BHA, 나이아신아마이드, AHA
  홍조       → 시카, 마데카소사이드, 판테놀, 알란토인
  탄력저하   → 펩타이드, 콜라겐, 레티놀
  트러블     → 살리실산, 티트리, 아젤라산
  칙칙함     → AHA, 비타민C, 글리콜산

STEP 3: 충돌 체크 (병용 금기)
  - 비타민C + 레티놀: 시간대 분리 (C=AM, 레티놀=PM)
  - 레티놀 + AHA/BHA: 격일 사용
  - 비타민C + 나이아신아마이드: 민감 피부는 분리

STEP 4: 우선순위 가중치
  1순위 → 0.5 / 2순위 → 0.3 / 3순위 → 0.2

STEP 5: To-do 생성 (시간대별)
  AM: 클렌저 → 토너 → [1순위 타겟 세럼] → 보습 → SPF
  PM: 이중클렌저 → 토너 → [2순위 타겟 세럼] → 크림
  주 2-3회: 각질관리 / 시트마스크
```

**중요**: 화장품도 **성분·카테고리만 추천**, 브랜드/제품명 X.

### 3.2 영양제 To-do 알고리즘 (성분명만)

**원칙**: 고민별 영양소 매핑 + 흡수율 고려한 복용 시간
**중요**: ⚠️ **브랜드/제품명 일체 추천하지 않음**

```
고민 → 핵심 영양소
─────────────────────────────────────
기미·잡티   → 비타민C, L-시스테인, 글루타치온, 비오틴
주름       → 콜라겐(저분자), 비타민E, 코엔자임Q10
탄력      → 콜라겐, 히알루론산, 비타민C
홍조       → 오메가3, 프로바이오틱스
트러블     → 아연, 비타민B군, 프로바이오틱스
전반적 노화  → 폴리페놀, 아스타잔틴, 레스베라트롤
수분/건조  → 세라마이드, 히알루론산, 오메가3

복용 시간 규칙:
- 지용성 (A/D/E/K, 오메가3, Q10): 식후
- 수용성 (B, C): 식전 또는 식간
- 콜라겐: 공복
- 프로바이오틱스: 식전 30분
- 철분: 비타민C와 함께 (칼슘과 분리)

40대 여성 공통 권장:
- 비타민D / 마그네슘 / 오메가3 / 콜라겐
```

**출력 예시**:
```json
{
  "daily_supplements": [
    {
      "ingredient": "비타민C",
      "dose_range": "500-1000mg",
      "timing": "아침 식전",
      "linked_concern": "기미·잡티",
      "note": "공복 자극 시 식후로"
    }
  ],
  "disclaimer": "본 정보는 일반 영양 가이드이며 의학적 조언이 아닙니다."
}
```

### 3.3 Action Day 타임라인 알고리즘

```
D-90 ~ D-60: 집중 관리 시작
  - 색소 시술 (토닝, 레이저토닝): 4-6주 간격, 3-4회
  - 콜라겐 부스팅 (포텐자, 인모드): 4주 간격, 2-3회
  - 영양제 본격 시작

D-30: 다운타임 있는 시술 마지노선
  - 박피, IPL, 깊은 레이저는 D-30 이전 완료

D-14 ~ D-7: 가벼운 케어
  - 수분/진정 (LDM, 수분광채주사)

D-7 이내: 시술 금지, 진정 위주 홈케어
D-1 ~ D-Day: 충분한 수분 + 수면
```

### 3.4 3개 병원 비교 분석 알고리즘

```
사용자 고민 → 적합 시술 매핑
─────────────────────────────
기미·잡티   → 토닝, 레이저토닝, IPL, 피코토닝
주름       → 보톡스, 필러, 울쎄라, 써마지
모공       → 포텐자, 프락셀, LDM
홍조       → 브이빔, IPL, 시카부스터
탄력       → 인모드, 슈링크, 울쎄라
트러블     → 아그네스, 레이저, PDT

병원별 매칭 점수 (0~100):
  match_score = (시술_매칭도 × 0.45)
              + (긍정_리뷰_비율 × 0.35)
              + (리뷰_수_정규화 × 0.10)
              + (광고_역가중 × 0.10)

  ※ review_count_normalized = min(valid_reviews / 50, 1.0)
  ※ valid_reviews < 10 → "데이터 부족" 플래그, 점수 표시 X
```

**키워드 사전**:
```
긍정: "효과", "만족", "친절", "꼼꼼", "추천", "좋아요", "재방문", "변화"
부정: "비싸", "강매", "아프", "효과없", "실망", "불친절", "후회"
광고 의심: "이벤트", "패키지", "할인", "결제", "체험단"
        + 리뷰 길이 비정상 + 동일 작성자 다수
```

---

## 4. 데이터 입력 전략 (v1.3: Plan B 메인)

### 4.1 사용자 플로우

```
1. 사용자가 네이버 지도에서 병원 페이지 방문 (지정 단축URL 3개)
2. "리뷰" 탭으로 이동
3. 화면에 보이는 리뷰들을 드래그 후 복사 (Ctrl+C)
4. 우리 서비스의 해당 병원 탭에 붙여넣기 (Ctrl+V)
5. 다음 병원으로 이동
6. 3개 모두 완료 후 "분석 시작" 클릭
```

**왜 이 방식인가**:
- 100% 작동 보장 (네이버 차단 영향 X)
- 사용자가 50건 이상 보려면 어차피 무한 스크롤 필요 → 적당히 보이는 만큼만 복사해도 OK
- Beta 사용자에게 "함께 만든다"는 참여감 제공

### 4.2 리뷰 자동 파싱 로직

**입력**: textarea의 raw text (네이버 지도에서 복사된 형태)

**파싱 단계**:

```python
def parse_naver_reviews(raw_text: str) -> list[dict]:
    """
    네이버 지도 리뷰 복붙 텍스트를 개별 리뷰로 분할.
    
    네이버 리뷰의 일반적 패턴:
      [닉네임]
      [작성일자] [방문/영수증 인증 등 메타]
      [리뷰 본문 — 여러 줄 가능]
      [사장님 답글] (있을 수도, 없을 수도)
      [공백 줄]
      [다음 닉네임]
      ...
    """
    
    # STEP 1: 정규화
    text = normalize_whitespace(raw_text)  # \r\n → \n, 연속 공백 정리
    
    # STEP 2: 리뷰 경계 후보 찾기 (3가지 시그널 사용)
    boundaries = []
    
    # 시그널 A: 날짜 패턴 (YYYY.MM.DD, n일 전, n주 전, n달 전)
    date_pattern = r'(\d{4}\.\d{1,2}\.\d{1,2}|\d+(일|주|달|개월|년)\s*전)'
    
    # 시그널 B: 빈 줄 2개 이상
    blank_line_pattern = r'\n\s*\n\s*\n'
    
    # 시그널 C: "방문", "영수증", "예약" 같은 인증 라벨
    auth_pattern = r'(방문\s*인증|영수증\s*인증|예약|N\s*Pay)'
    
    # STEP 3: 가장 안정적인 시그널부터 사용
    # 날짜 패턴이 가장 신뢰도 높음 → 날짜 발견 시 그 직전 줄을 닉네임으로 가정
    chunks = split_by_date_anchors(text, date_pattern)
    
    # STEP 4: 각 청크에서 본문 추출
    reviews = []
    for chunk in chunks:
        review = {
            "nickname": extract_nickname(chunk),  # 마스킹: "김**" 형태
            "date_raw": extract_date(chunk),
            "body": extract_body(chunk),  # 답글, 메타 라벨 제거
            "rating": extract_rating(chunk)  # 별점 있으면 (없으면 null)
        }
        if len(review["body"].strip()) >= 10:  # 너무 짧은 건 제외
            reviews.append(review)
    
    return reviews
```

**Fallback 전략 (파싱 실패 시)**:
```
시그널 A(날짜 패턴) 매칭 0건 → 시그널 B(빈 줄)로 분할 시도
시그널 B도 실패 → 시그널 C(인증 라벨)로 분할 시도
모두 실패 → 전체 텍스트를 1개 리뷰로 처리 (사용자에게는 표시 안 함)
```

**중요**: 파싱 정확도가 100%일 필요는 없음. 50건 입력에서 40건만 정확히 파싱돼도 분석 가능. **사용자에게 파싱 결과를 보여주지 않으므로** 불완전성이 노출되지 않음.

### 4.3 워드마이닝 파이프라인 (Claude API 사용)

**왜 Claude API를 쓰는가**:
- KoNLPy 환경 세팅 시간 제거 (Java 의존성)
- 한국어 정확도 ↑ (특히 시술명, 신조어, 줄임말)
- 광고/감성/시술 추출을 한 번에 처리 가능

**프롬프트 설계**:
```python
WORDMINING_PROMPT = """
다음은 한 피부과의 리뷰 {n}개입니다. 각 리뷰를 분석해 JSON으로 반환하세요.

[리뷰 목록]
{reviews_json}

요구 출력 (각 리뷰별):
{
  "review_index": 0,
  "mentioned_procedures": ["토닝", "포텐자"],  // 시술명 추출 (없으면 [])
  "sentiment": "positive" | "negative" | "neutral",
  "is_ad_suspicious": true | false,
  "ad_reason": "체험단 표현 다수" | null,
  "key_keywords": ["꼼꼼", "친절"]  // 명사·형용사 3-5개
}

시술명 정규화:
- "레이저토닝" "피코토닝" → "토닝"
- "울쎄라리프팅" "ulthera" → "울쎄라"
- "물광주사" "수분광채" → "스킨부스터"

광고 의심 시그널:
- 체험단/협찬/이벤트 명시
- 비정상적으로 긴 본문 + 모든 시술 칭찬
- 동일 닉네임이 짧은 시간에 여러 리뷰
"""
```

**집계**:
```python
def aggregate_clinic(parsed_reviews, llm_results):
    return {
        "total_reviews": len(parsed_reviews),
        "valid_reviews": len([r for r in llm_results if not r["is_ad_suspicious"]]),
        "ad_filtered_count": len([r for r in llm_results if r["is_ad_suspicious"]]),
        "procedure_mentions": count_procedures(llm_results),
        "sentiment_distribution": count_sentiments(llm_results),
        "top_keywords": top_n_keywords(llm_results, 10),
        "sample_reviews": pick_representative(parsed_reviews, llm_results)
    }
```

### 4.4 시술명 정규화 사전

```python
PROCEDURE_DICT = {
    "토닝": ["토닝", "레이저토닝", "피코토닝", "토닝레이저"],
    "보톡스": ["보톡스", "보톨리눔", "보톡스주사"],
    "필러": ["필러", "히알루론산필러", "필러주사"],
    "울쎄라": ["울쎄라", "울쎄라리프팅", "ulthera"],
    "슈링크": ["슈링크", "하이푸", "HIFU"],
    "포텐자": ["포텐자"],
    "인모드": ["인모드", "인모드리프팅"],
    "써마지": ["써마지", "써마지FLX"],
    "프락셀": ["프락셀"],
    "IPL": ["IPL", "아이피엘"],
    "리쥬란": ["리쥬란", "리쥬란힐러"],
    "스킨부스터": ["스킨부스터", "물광주사", "수분광채"],
}
```

이 사전은 LLM 프롬프트에도 포함시켜 정규화의 일관성 확보.

---

## 5. 시스템 아키텍처

### 5.1 전체 워크플로우

```
┌─────────────────────────────────────────────────────────┐
│            [Web Dashboard] (Next.js)                     │
│  Step 1: 진단 폼                                          │
│  Step 2: 리뷰 입력 (탭 3개, textarea)                     │
│  Step 3: 대시보드                                         │
└────────────────────────┬────────────────────────────────┘
                         │ POST /api/analyze
                         ▼
┌─────────────────────────────────────────────────────────┐
│              [FastAPI Backend]                          │
│            ┌─────────────────────┐                      │
│            │   Orchestrator      │                      │
│            └──────────┬──────────┘                      │
│                       │                                  │
│      ┌────────┬───────┼──────────┬─────────┐            │
│      ▼        ▼       ▼          ▼         ▼            │
│  Diagnosis Cosmetic Supplement Timeline  Clinic         │
│   Agent     Agent    Agent      Agent    Agent          │
│                                            │            │
│                                            ▼            │
│                                  Review Parser          │
│                                  (raw → list[dict])     │
│                                            │            │
│                                            ▼            │
│                                  Wordmining Agent       │
│                                  (Claude API)           │
│                                            │            │
│                                            ▼            │
│                                  Scoring Agent          │
│                                  (3개 비교 점수)         │
└─────────────────────────────────────────────────────────┘
```

### 5.2 서브에이전트 명세 (v1.3)

| 에이전트 | 역할 | 입력 | 출력 |
|---------|------|------|------|
| Orchestrator | 흐름 제어 | 사용자 입력 + 리뷰 텍스트 | dashboard_payload |
| Diagnosis Agent | 입력 정규화 | raw form | user_profile |
| Cosmetic Agent | 화장품 루틴 | user_profile | cosmetic_todos |
| Supplement Agent | 영양제 (성분만) | user_profile | supplement_todos |
| Timeline Agent | D-Day 역산 | user_profile + D-Day | timeline |
| **Review Parser** | 리뷰 텍스트 분할 | textarea raw | list[review] |
| Wordmining Agent | 시술/감성/광고 분석 | parsed reviews | reviews_analyzed |
| Scoring Agent | 3개 병원 비교 | concerns + analyzed | comparison_result |
| Clinic Agent | 비교 분석 통합 | scoring 결과 | top_3_comparison |

> Plan A(Crawler Agent)는 Phase 1+로 이월. 현재 디렉토리에서 빠짐.

---

## 6. 기술적 병목 분석 (v1.3)

### 6.1 예상 병목 6가지 (네이버 차단 항목 제거됨)

| # | 병목 | 영향도 | 대응 |
|---|------|--------|------|
| 1 | **리뷰 파싱 정확도** ⚠️ NEW 메인 | ⭐⭐⭐⭐ | 3단 fallback (날짜→빈줄→인증라벨) + LLM 보정 |
| 2 | Next.js + FastAPI 환경 세팅 | ⭐⭐⭐⭐ | 보일러플레이트 + CORS 사전 설정 |
| 3 | Claude API 호출 시간 (50건 × 3병원) | ⭐⭐⭐ | 병원별 1회 batch 호출 (병렬 가능) |
| 4 | 광고 리뷰 필터링 정확도 | ⭐⭐⭐ | LLM에 광고 시그널 명시 |
| 5 | 시술명 표기 다양성 | ⭐⭐⭐ | 정규화 사전 + LLM 프롬프트 동기화 |
| 6 | 의료광고법 리스크 | ⭐⭐⭐ | 면책 + "비교 분석" 표현 |

### 6.2 시간 분배 (한결 여유로워짐)

| 시간 | 작업 |
|------|------|
| 0:00-0:20 | 환경 세팅 (Next.js + FastAPI + CORS) |
| 0:20-0:50 | 알고리즘 4종 (cosmetic/supplement/timeline + Pydantic) |
| 0:50-1:10 | Review Parser + 더미 텍스트로 단위 테스트 |
| 1:10-1:30 | Wordmining (Claude API) + Scoring |
| 1:30-1:50 | 프론트: 진단 폼 + 리뷰 입력 폼 + 대시보드 |
| 1:50-2:00 | 통합 테스트 |

> Plan A 제거로 약 30분 여유 발생 → UI 다듬기에 활용 가능

---

## 7. 단계별 구현 로드맵 (v1.3)

### Phase 0a: 백엔드 — 70분

```
[0:00-0:10] FastAPI 보일러플레이트 + Pydantic 모델
[0:10-0:30] 알고리즘 3종 (cosmetic, supplement, timeline)
[0:30-0:50] Review Parser (정규식 + fallback)
            + 더미 텍스트 3종 단위 테스트
[0:50-1:10] Wordmining (Claude API) + Scoring + Orchestrator
            POST /api/analyze 통합
            curl 테스트 통과
```

### Phase 0b: 프론트엔드 — 50분

```
[1:10-1:25] Next.js + Tailwind + shadcn/ui 세팅
[1:25-1:40] /diagnose 폼 (단일 페이지)
            /reviews-input 페이지 (탭 3개 + textarea)
[1:40-1:55] /dashboard 페이지 (4개 카드 + Recharts)
[1:55-2:00] 통합 테스트 + README
```

### Phase 0a 검증 우선순위 (시간 부족 시)

```
✅ 필수: F1, F2, F3, F5, F6 (입력→파싱→분석→매칭)
⏰ 시간 남으면: F4 타임라인 시각화 (Gantt)
⏭️ Phase 1로: 광고 필터링 정교화, 파서 엣지케이스
```

### Phase 1: 데이터 검증 (1주)

- [ ] 실사용자 5명에게 리뷰 입력 테스트
- [ ] 파싱 실패 케이스 수집 → 정규식 보강
- [ ] 광고 분류 정확도 측정 (수동 라벨링 50건)
- [ ] LLM 호출 비용·시간 최적화

### Phase 2: 확장 (2주)

- [ ] Plan A (Playwright 크롤링) 부활 검토
- [ ] 분당구 외 병원 추가
- [ ] 화장품/영양제 알고리즘 의학 자문

### Phase 3: 사용자 경험 (1개월+)

- [ ] 사용자 계정 + 진척 트래킹
- [ ] 푸시 알림
- [ ] 피부과 예약 연동 (선택)

---

## 8. 기술 스택

```
Frontend
├─ Next.js 14 (App Router) + TypeScript
├─ Tailwind CSS + shadcn/ui (Tabs, Textarea, Card)
└─ Recharts

Backend
├─ Python 3.11 + FastAPI + Pydantic v2
├─ Anthropic Claude API (워드마이닝)
└─ uvicorn

Data
└─ JSON 파일 (Beta), SQLite (Phase 1+)
```

### 8.1 디렉토리 구조 (v1.3: crawler 제거)

```
skincare_planner/
├─ frontend/
│  ├─ app/
│  │  ├─ page.tsx                # 랜딩
│  │  ├─ diagnose/page.tsx       # Step 1: 진단
│  │  ├─ reviews-input/page.tsx  # Step 2: 리뷰 복붙 (탭 3개)
│  │  └─ dashboard/page.tsx      # Step 3: 결과
│  ├─ components/
│  │  ├─ TodoCard.tsx
│  │  ├─ TimelineGantt.tsx
│  │  ├─ ClinicComparisonCard.tsx
│  │  ├─ ConcernPriorityPicker.tsx
│  │  └─ ReviewInputTabs.tsx
│  └─ lib/api.ts
│
├─ backend/
│  ├─ main.py                    # FastAPI 라우터
│  ├─ agents/
│  │  ├─ diagnosis.py
│  │  ├─ cosmetic.py
│  │  ├─ supplement.py
│  │  ├─ timeline.py
│  │  ├─ wordmining.py           # Claude API
│  │  └─ scoring.py
│  ├─ parsers/
│  │  └─ review_parser.py        # 정규식 기반 파싱
│  ├─ data/
│  │  ├─ clinics_target.json
│  │  ├─ ingredient_map.json
│  │  ├─ procedure_dict.json
│  │  ├─ keyword_sentiment.json
│  │  └─ sample_reviews.txt      # 파서 단위 테스트용 더미
│  └─ schemas.py
│
└─ docs/
   └─ PRD_v1.3.md
```

### 8.2 Claude Code Subagent

```
- backend-builder: FastAPI + 알고리즘 + 파서 + 워드마이닝
- frontend-builder: Next.js 3페이지
```

병렬 실행 가능. crawler-builder는 v1.3에서 빠짐.

### 8.3 설치

```bash
# Backend
python -m venv venv && source venv/bin/activate
pip install fastapi uvicorn[standard] pydantic anthropic
# (KoNLPy, Playwright 제외 — 환경 세팅 시간 단축)

# Frontend
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend && npx shadcn-ui@latest init
npm install recharts lucide-react
# shadcn 컴포넌트
npx shadcn-ui@latest add tabs textarea card button input select
```

---

## 9. 출력 명세 (대시보드)

### 9.1 대시보드 구성

```
┌───────────────────────────────────────────────────────────┐
│  안녕하세요, 당신의 피부 여정이 시작됐어요                   │
├───────────────────────────────────────────────────────────┤
│  [진단 요약]                                               │
│  타입: 수부지 / 고민: 기미 > 모공 > 탄력 / D-Day: 결혼식 87일 │
├──────────────────────────────┬────────────────────────────┤
│  [화장품 To-do]               │  [영양제 To-do]             │
│  ☐ AM 1. 약산성 클렌저         │  ☐ 비타민C 500-1000mg       │
│  ☐ AM 2. 비타민C 세럼          │     아침 식전               │
│  ☐ AM 3. 자외선차단            │  ☐ 저분자 콜라겐 3-5g       │
│  ☐ PM 1. 이중클렌저            │     공복                    │
│  ☐ PM 2. 레티놀 (격일)         │  ※ 브랜드 추천 없음          │
├──────────────────────────────┴────────────────────────────┤
│  [Action Day 타임라인]                                     │
│  ████░░░░░░░░  D-90~D-60: 집중 시술                        │
│  ░░░░████░░░░  D-30: 마지막 시술                           │
│  ░░░░░░░░████  D-7: 진정 위주                              │
├───────────────────────────────────────────────────────────┤
│  [3개 병원 비교 분석]                                      │
│                                                            │
│   병원 A          병원 B          병원 C                   │
│   매칭 92         매칭 78         데이터 부족              │
│   ▓▓▓▓▓░         ▓▓▓▓░░          (리뷰 8건)               │
│                                                            │
│   강점: 토닝     강점: 포텐자                              │
│   긍정: 87%      긍정: 72%                                 │
│   광고: 5%       광고: 12%                                 │
│                                                            │
│   "꼼꼼한 진료, 토닝 효과" — A 대표 리뷰                    │
└───────────────────────────────────────────────────────────┘
```

### 9.2 시각화 (Recharts)
- 도넛: 피부 고민 비중
- 수평 막대: Action Day 타임라인 (간이 Gantt)
- 그룹 막대: 3개 병원 점수 비교

---

## 10. 데이터 모델

### 10.1 user_profile.json
```json
{
  "user_id": "uuid",
  "skin_type": "수부지",
  "concerns": [
    {"name": "기미·잡티", "priority": 1},
    {"name": "모공", "priority": 2},
    {"name": "탄력저하", "priority": 3}
  ],
  "age_range": "45-49",
  "action_day": {
    "date": "2026-08-01",
    "event": "결혼식",
    "days_remaining": 87
  },
  "care_level": "중급",
  "budget": 100000
}
```

### 10.2 clinics_target.json
```json
{
  "clinics": [
    {"id": "clinic_01", "label": "병원 A", "short_url": "https://naver.me/GeURykHe"},
    {"id": "clinic_02", "label": "병원 B", "short_url": "https://naver.me/5zXc14lX"},
    {"id": "clinic_03", "label": "병원 C", "short_url": "https://naver.me/GUwik9QI"}
  ]
}
```

### 10.3 review_input_payload (POST 본문)
```json
{
  "user_profile": { "...": "..." },
  "clinic_reviews": {
    "clinic_01": "닉네임1\n2024.12.15 방문\n토닝 받았어요...\n\n닉네임2\n...",
    "clinic_02": "...",
    "clinic_03": ""
  }
}
```

### 10.4 dashboard_payload.json
```json
{
  "user_profile": {},
  "cosmetic_todos": {"morning": [], "evening": [], "weekly": []},
  "supplement_todos": {
    "daily_supplements": [],
    "disclaimer": "본 정보는 일반 영양 가이드이며 의학적 조언이 아닙니다."
  },
  "timeline": {"phases": []},
  "clinic_comparison": {
    "clinics": [
      {
        "id": "clinic_01",
        "label": "병원 A",
        "match_score": 92,
        "data_status": "ok",
        "matched_procedures": ["토닝", "포텐자"],
        "positive_ratio": 0.87,
        "review_count": 47,
        "ad_suspicion_ratio": 0.05,
        "strengths": ["꼼꼼", "토닝 효과"],
        "sample_review": "꼼꼼한 진료, 토닝 효과 좋아요"
      },
      {
        "id": "clinic_03",
        "label": "병원 C",
        "data_status": "insufficient",
        "review_count": 8,
        "message": "리뷰가 10건 미만이라 분석에서 제외됐어요"
      }
    ]
  }
}
```

---

## 11. 면책 / 윤리

- 의학적 진단·처방 아님
- 영양제: 성분명·권장량만, 브랜드 추천 X
- 화장품: 성분·카테고리만, 브랜드 추천 X
- 피부과: 사용자가 직접 가져온 리뷰의 분석이며 "추천"이 아닌 **"비교 분석"**
- 알레르기·기존 질환자는 전문의 상담 권고 (대시보드 상단 노출)
- 개인 식별 정보 마스킹 (닉네임은 첫 글자만 표시)
- 매칭 점수는 **참고용**이며 의료 선택의 절대 기준이 아님

---

## 12. Claude Code 작업 가이드

### 12.1 시작 명령어 (복붙용)

```
PRD_v1.3.md를 읽고 다음 순서로 작업해줘.

[Phase 0a — 백엔드, 70분]
1. backend/ FastAPI 보일러플레이트 + CORS + Pydantic 모델 (schemas.py)
2. backend/agents/에 5개 에이전트 구현
   - diagnosis, cosmetic, supplement(브랜드 X), timeline, scoring
   - PRD §3의 룰 기반 그대로
3. backend/parsers/review_parser.py 작성
   - PRD §4.2의 3단 fallback 로직 (날짜 → 빈줄 → 인증라벨)
   - backend/data/sample_reviews.txt 더미 텍스트로 단위 테스트
4. backend/agents/wordmining.py: Claude API 기반
   - PRD §4.3의 프롬프트 그대로 사용
5. POST /api/analyze 엔드포인트
   - 입력: user_profile + 3개 병원 리뷰 textarea raw
   - 출력: dashboard_payload
   - 병원별 LLM 호출은 asyncio.gather로 병렬

[Phase 0b — 프론트엔드, 50분]
6. frontend/ Next.js + Tailwind + shadcn/ui 세팅
   - shadcn 컴포넌트: tabs, textarea, card, button, input, select
7. /diagnose 폼 (Step 1)
8. /reviews-input 페이지 (Step 2)
   - shadcn Tabs 3개 (병원 A/B/C)
   - 각 탭에 큰 textarea + 안내 문구
   - "건너뛰기" 옵션
9. /dashboard 페이지 (Step 3) — Recharts 4개 카드
10. lib/api.ts에 FastAPI 호출 헬퍼

[검증]
- curl로 /api/analyze 테스트 (Phase 0a 60분 시점)
- 브라우저로 풀 플로우 (Phase 0b 110분 시점)

검증 우선순위 (시간 부족 시): PRD §1.3 표 참조 — F4 타임라인 시각화는 마지막
```

### 12.2 체크포인트

| 시점 | 검증 | 미달 시 |
|------|------|---------|
| 30분 | FastAPI `/health` + 모델 정의 완료 | 보일러플레이트 단순화 |
| 60분 | `/api/analyze` POST 더미 데이터로 통과 | Phase 0a 확장 포기 |
| 90분 | Next.js `/diagnose` → API 호출 성공 | UI 컴포넌트 단순화 |
| 110분 | `/reviews-input` + `/dashboard` 렌더링 | Recharts 생략 |
| 120분 | 통합 테스트 + README | 종료 |

### 12.3 리뷰 파서 단위 테스트용 더미 (sample_reviews.txt)

```
김** 
2024.12.15 방문 인증
토닝 받았는데 정말 효과 좋네요. 꼼꼼하게 봐주시고 친절하셔서 좋았습니다.
사장님 답글: 감사합니다.

이** 
2024.11.30 방문
포텐자 시술 받았어요. 처음엔 좀 아팠는데 결과는 만족스러웠습니다.

박** 
3주 전
이번에 이벤트로 패키지 결제했어요. 모든 시술이 다 좋아요!! 추천합니다.
```

이 텍스트로 파서가 3개 리뷰를 인식해야 하고, 마지막은 광고 의심으로 분류돼야 함.

---

## 13. v1.3 → v1.4 후속 논의

- [ ] 의료 자문 가능 여부
- [ ] 광고 리뷰 라벨링 데이터셋 구축
- [ ] 사용자 계정 도입 시점
- [ ] 분당구 외 지역 확장
- [ ] Plan A (크롤링) 부활 시점

---

*문서 버전: v1.3 / 작성: Claude / 작성일: 2026-05-07*
*변경 요약: Plan B(복붙) 메인화 / 자동 파싱만 / 카운터 제거 / 파싱 결과 비노출 / Plan A는 Phase 1+ 이월 / 시간 분배 여유 확보*
