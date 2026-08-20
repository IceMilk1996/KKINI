# 끼니 — React Native (Expo SDK 57) 앱

레시피 메모 앱 "끼니". **최신 Expo SDK(57)** 기준이라 iOS/Android Expo Go에서 바로 실행됩니다.
Supabase 없이도 **데모 모드**로 동작합니다.

## 🚀 실행

```bash
npm install
npx expo start
```

터미널 QR 코드를 폰의 **Expo Go**로 스캔 → 바로 실행.
(`i`=iOS 시뮬레이터, `a`=Android)

> `.env`가 없으면 자동으로 **데모 모드**(가짜 데이터)로 켜집니다.
> 샘플 레시피가 있고 추가·삭제·즐겨찾기·검색이 동작합니다(앱 종료 시 초기화).

## 📱 화면 (Expo Router, `src/app/`)

| 경로 | 파일 | 설명 |
|------|------|------|
| 홈 | `src/app/(tabs)/index.tsx` | 레시피 목록·검색 |
| 작성 | `src/app/(tabs)/create.tsx` | 레시피 등록 |
| 마이 | `src/app/(tabs)/profile.tsx` | 프로필·로그아웃 |
| 상세 | `src/app/recipe/[id].tsx` | 재료·순서·태그·삭제 |
| 로그인 | `src/app/login.tsx` | 소셜/이메일(데모는 바로 진입) |

## 🔌 Supabase 연결 (데모 → 실서버)

1. Supabase 프로젝트 생성 후 스키마 DDL + `supabase/functions.sql` 실행
2. `.env.example` → `.env` 복사 후 값 입력
   ```
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. 앱 재시작 → 자동으로 실서버 모드 (`src/lib/config.ts`의 `USE_MOCK`)

딥링크(소셜 로그인)는 `app.json`의 `"scheme": "kkini"` + Supabase Redirect URL `kkini://auth-callback` 설정 필요.

## 🗂 핵심 구조

```
src/
  app/                 # 화면 (파일 기반 라우팅)
  lib/
    config.ts          # 데모 모드 스위치
    supabase.ts        # Supabase 클라이언트
    api/               # Supabase CRUD
    repo/              # 저장소 추상화 (mock ↔ real 자동 전환)
    mock/              # 데모 데이터
  types/database.ts    # DB 타입
  theme.ts             # 색·간격·타이포
```

화면은 항상 `@/lib/repo`만 호출 → `USE_MOCK` 값에 따라 데모/실서버 자동 전환.

## ⚠️ 참고

- 이미지 업로드(Storage)는 아직 미포함.
- 실제 출시 단계에선 Expo Go 대신 **개발 빌드(dev build)** 권장.
- 설치 중 버전 경고가 있으면 `npx expo install --fix` 실행.
