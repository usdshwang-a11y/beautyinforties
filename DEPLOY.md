# Deployment Guide

## 권장 조합: Vercel (프론트엔드) + Render (백엔드)

둘 다 무료 티어로 충분히 베타 가능. Vercel은 Next.js에 최적화돼 있고, Render는 Python FastAPI를 그대로 띄울 수 있어요.

---

## 0. 사전 준비 — GitHub 푸시

```powershell
cd C:\Users\BOK\Desktop\coding\derma

git init
git add .
git commit -m "initial commit"

# GitHub에서 새 리포 만든 후 (예: derma-planner)
git remote add origin https://github.com/<YOUR_USER>/derma-planner.git
git branch -M main
git push -u origin main
```

`.gitignore` 가 venv·node_modules·.env·.next 등을 자동 제외합니다.

---

## 1. 백엔드 배포 — Render

### 1-A. 첫 배포

1. https://render.com 가입 (GitHub OAuth)
2. **New +** → **Web Service** → 위에서 만든 GitHub 리포 선택
3. 다음 값 입력:
   - **Name**: `derma-backend` (subdomain이 됨 → `derma-backend.onrender.com`)
   - **Region**: Singapore (한국에서 가장 가까움)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
4. **Advanced** → Environment Variables 추가:
   - `PYTHON_VERSION` = `3.11.9`
   - `FRONTEND_URLS` = `http://localhost:3000` (Vercel URL 받으면 추가)
   - `ANTHROPIC_API_KEY` = (옵션, 비워두면 stub 모드)
5. **Create Web Service** → 빌드 시작 (3~5분)
6. 완료되면 `https://derma-backend.onrender.com` 접속 → `/health` 가 `{"status":"ok"}` 반환하면 OK

> **참고**: 무료 플랜은 15분 idle 시 sleep → 첫 요청에 30초 cold start. 베타에는 충분.

### 1-B. render.yaml로 IaC 배포 (선택)

리포 루트 또는 `backend/` 안에 [backend/render.yaml](backend/render.yaml) 이 이미 들어있어요. Render 대시보드에서 **Blueprint** 로 가져오면 위 1-A 설정이 자동으로 적용됩니다.

---

## 2. 프론트엔드 배포 — Vercel

1. https://vercel.com 가입 (GitHub OAuth)
2. **Add New** → **Project** → GitHub 리포 import
3. **Configure Project**:
   - **Framework Preset**: `Next.js` (자동 감지)
   - **Root Directory**: `frontend`  ← 클릭해서 변경
   - **Build Command**: `next build` (기본값 그대로)
   - **Output Directory**: `.next` (기본값 그대로)
4. **Environment Variables** 추가:
   - `NEXT_PUBLIC_API_BASE` = `https://derma-backend.onrender.com`  (1번 단계 URL)
5. **Deploy** → 1~3분 대기
6. 완료되면 `https://<your-project>.vercel.app` 발급

---

## 3. 양방향 연결

Vercel URL을 받으면 Render의 환경변수를 업데이트해야 CORS가 통과합니다.

1. Render 대시보드 → derma-backend → **Environment**
2. `FRONTEND_URLS` 값 수정:
   ```
   http://localhost:3000,https://your-project.vercel.app
   ```
3. **Save Changes** → 자동 재배포

---

## 4. 검증

- `https://your-project.vercel.app/` → 랜딩 페이지 로드
- /diagnose → 폼 작성 → /reviews-input → 분석 시작
- 브라우저 DevTools Network 탭에서 `POST /api/analyze` 가 200 반환 확인
- 만약 CORS 에러 → Render `FRONTEND_URLS` 에 정확한 Vercel URL이 들어갔는지 재확인

---

## 5. 커스텀 도메인 (선택)

### Vercel
프로젝트 Settings → Domains → 도메인 추가 → Vercel이 안내하는 DNS 레코드 (CNAME or A) 를 도메인 등록업체에 추가. SSL은 자동 발급.

### Render
Web Service → Settings → Custom Domains → 동일 패턴.

이후 `FRONTEND_URLS` 에 커스텀 도메인도 추가.

---

## 6. 비용 정리

| 서비스 | 무료 한도 | 한도 초과 시 |
|---|---|---|
| Vercel Hobby | 100 GB 대역폭/월, 무제한 빌드 | 한도 도달 시 정지 (과금 X) |
| Render Free | 750 시간/월, 15분 idle 시 sleep | 시간 초과 시 정지 |
| Anthropic API | $0 (stub 모드) | 연결 시 토큰당 과금 |

베타 사용자 ~50명까지는 둘 다 무료 한도 안에서 충분합니다.

---

## 7. 대안 시나리오

### 단일 플랫폼 (Render만 사용)
Render는 Next.js도 호스팅 가능 — Static Site로 배포하거나 Web Service로 SSR. 단 Vercel만큼 Next.js에 최적화돼 있지 않아 Edge Cache·Image Optimization 손해. 추천하지 않음.

### Fly.io
Docker 기반. 컨테이너 1개에 둘 다 띄우는 것도 가능. 학습 곡선 있지만 조작 자유도 높음. 베타 단계엔 오버엔지니어링.

### Railway
$5 trial 후 paid. UI는 깔끔하지만 무료 한도가 짧아 베타에는 Render가 유리.
