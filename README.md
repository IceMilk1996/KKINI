<div align="center">

# 🍳 끼니

**오늘은 뭐 해먹지? — 나만의 레시피를 기록하는 모바일 앱**

재료와 조리 순서를 적어두고, 필요할 때 바로 꺼내 보세요.

![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo_SDK-57-000020?logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)

</div>

---

## 소개

끼니는 요리 기록을 위한 개인용 레시피 노트입니다.

인터넷에서 찾은 레시피를 스크랩하거나, 직접 만든 요리를 다음에도 똑같이 재현하고 싶을 때 씁니다. 재료 목록, 조리 순서, 타이머, 태그를 한 화면에 정리해두면 요리하면서 스크롤 한 번으로 따라갈 수 있습니다.

**서버 없이 바로 실행됩니다.** Supabase 설정을 하지 않으면 자동으로 데모 모드로 켜지고, 샘플 레시피로 모든 기능을 그대로 써볼 수 있습니다.

## 주요 기능

| | |
|---|---|
| 📝 **레시피 작성** | 제목·요약·카테고리·인분·조리시간·난이도 |
| 🥕 **재료 관리** | 이름 / 양 / 단위를 항목별로 입력 |
| 👩‍🍳 **조리 순서** | 단계별 설명과 단계별 타이머 |
| 🏷 **태그** | 해시태그로 분류 |
| 🔍 **검색** | 제목으로 내 레시피 찾기 |
| ❤️ **즐겨찾기** | 상세 화면에서 하트로 표시 |
| 🔗 **참고 링크** | 원본 레시피 출처 보관 |
| 🧪 **데모 모드** | 서버 연결 없이 미리보기 |

## 화면

| 화면 | 경로 | 내용 |
|------|------|------|
| 홈 | `src/app/(tabs)/index.tsx` | 레시피 목록, 검색, 당겨서 새로고침 |
| 작성 | `src/app/(tabs)/create.tsx` | 레시피 등록 |
| 마이 | `src/app/(tabs)/profile.tsx` | 프로필, 로그아웃 |
| 상세 | `src/app/recipe/[id].tsx` | 재료·순서·태그·즐겨찾기·삭제 |
| 수정 | `src/app/recipe/edit/[id].tsx` | 기존 레시피 편집 |
| 로그인 | `src/app/login.tsx` | 소셜·이메일 (데모는 바로 진입) |

## 빠른 시작

```bash
npm install
npx expo start
```

터미널의 QR 코드를 폰의 **Expo Go**로 스캔하면 바로 실행됩니다.
(시뮬레이터는 `i` = iOS, `a` = Android)

> `.env`가 없으면 **데모 모드**로 켜집니다. 샘플 레시피가 들어 있고 추가·수정·삭제·즐겨찾기·검색이 모두 동작합니다. 단, 앱을 종료하면 초기화됩니다.

## Supabase 연결

데모 모드에서 실제 서버로 전환하려면:

1. Supabase 프로젝트를 만들고 `supabase/schema.sql`과 `supabase/functions.sql`을 실행합니다
2. `.env.example`을 `.env`로 복사하고 값을 채웁니다

   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   ```

3. 앱을 재시작하면 자동으로 실서버 모드로 전환됩니다

소셜 로그인을 쓴다면 Supabase의 Redirect URL에 `kkini://auth-callback`을 등록하세요. 스킴은 `app.json`의 `"scheme": "kkini"`에 정의돼 있습니다.

## 프로젝트 구조

```
src/
  app/                 # 화면 — Expo Router 파일 기반 라우팅
  components/          # 공용 컴포넌트
  lib/
    config.ts          # 데모 모드 스위치 (USE_MOCK)
    supabase.ts        # Supabase 클라이언트
    api/               # Supabase CRUD
    repo/              # 저장소 추상화 — mock ↔ real 자동 전환
    mock/              # 데모 데이터
  types/database.ts    # DB 타입
  theme.ts             # 색·간격·타이포
```

화면은 Supabase를 직접 호출하지 않고 **항상 `@/lib/repo`만** 거칩니다. `USE_MOCK` 값에 따라 같은 인터페이스로 데모 데이터와 실서버가 교체되므로, 화면 코드는 어느 쪽인지 알 필요가 없습니다.

## 기술 스택

- **React Native 0.86** · **Expo SDK 57**
- **Expo Router** — 파일 기반 내비게이션
- **TypeScript**
- **Supabase** — 인증, PostgreSQL, RLS

## 아직 없는 것

- 이미지 업로드 (Supabase Storage) — 현재는 카테고리별 이모지로 대체
- 마이 탭의 메뉴 항목(즐겨찾기 목록·공유·설정)은 아직 화면이 연결되지 않았습니다
- 검색은 제목만 대상으로 합니다

## 참고

- 실제 배포 단계에서는 Expo Go 대신 **개발 빌드(dev build)** 를 권장합니다
- 설치 중 버전 경고가 뜨면 `npx expo install --fix`를 실행하세요
