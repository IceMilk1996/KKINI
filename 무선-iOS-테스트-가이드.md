# 끼니 — 무선(케이블 없이) iOS 실기기 테스트 가이드

Expo Go 없이, 아이폰에 **QR/링크로 앱을 설치**해서 테스트하는 방법입니다.
방식은 **EAS Build 내부 배포(internal distribution)** — 클라우드에서 빌드해 무선으로 설치합니다.

---

## ✅ 준비물

- **Expo 계정** (무료) — https://expo.dev 가입
- **Apple Developer Program** (연 $99, 필수) — iOS는 애플 서명 규칙상 무선 설치에 유료 개발자 계정이 필요합니다.
- Node.js 설치된 맥/PC

> 유료 계정 없이 무선으로 iOS 실기기 설치는 애플 정책상 불가능합니다.
> (무료로 하려면: 케이블로 한 번 설치 → 같은 Wi-Fi에서 Metro로 무선 리로드. 맨 아래 참고)

---

## 1. EAS CLI 설치 & 로그인

```bash
npm i -g eas-cli
eas login            # Expo 계정으로 로그인
```

## 2. 프로젝트 연결

```bash
cd ~/Desktop/project/kkini-app
npm install          # expo-dev-client 추가되어 재설치 필요
eas init             # 프로젝트를 EAS에 연결 (projectId 생성 → app.json에 기록)
```

## 3. 테스트할 아이폰 등록 (최초 1회)

내부 배포는 등록된 기기에만 설치돼요.

```bash
eas device:create
```

- 안내되는 **링크/QR을 아이폰 Safari로** 열고, 프로파일을 설치합니다
  (설정 → 일반 → VPN 및 기기 관리에서 승인).
- 등록할 아이폰마다 한 번씩 해주면 됩니다.

## 4. 무선 설치용 빌드 만들기

두 가지 프로파일이 준비돼 있어요(`eas.json`).

```bash
# (A) 그냥 앱만 설치해서 눌러보기 — 가장 간단
eas build --profile preview --platform ios

# (B) 개발 빌드 — 코드 고치면 실시간 반영(핫 리로드)
eas build --profile development --platform ios
```

빌드는 클라우드에서 진행되고, 처음엔 애플 인증서/프로비저닝을 자동으로 만들라고 물어봐요 → `yes` 하면 됩니다 (Apple 계정 로그인 필요).

## 5. 아이폰에 무선 설치

- 빌드가 끝나면 터미널과 expo.dev 대시보드에 **QR 코드/설치 링크**가 나와요.
- 아이폰 카메라로 **QR을 찍거나** 링크를 Safari로 열면 → **바로 무선 설치**됩니다. 🎉
- 케이블 전혀 필요 없습니다.

## 6. (개발 빌드일 때) 실시간 리로드

`development` 프로파일로 설치했다면:

```bash
npx expo start --dev-client
```

맥과 아이폰이 **같은 Wi-Fi**면, 앱을 열고 서버에 연결 → 코드 저장할 때마다 무선으로 즉시 반영돼요.

---

## 🔁 요약

| 목적 | 명령 | 결과 |
|------|------|------|
| 한 번 설치해 눌러보기 | `eas build --profile preview -p ios` | 무선 설치 링크/QR |
| 개발하며 실시간 반영 | `eas build --profile development -p ios` + `npx expo start --dev-client` | 무선 핫리로드 |

---

## 💡 유료 계정 없이 무선으로 하고 싶다면

무료 Apple ID로는 무선 OTA 설치가 안 되지만, 이렇게 하면 사실상 무선 개발이 가능해요.

1. 아이폰을 맥에 **한 번만 케이블 연결** → `npx expo run:ios --device`로 dev build 설치
2. Xcode에서 기기 선택 → **"Connect via network"** 체크
3. 이후엔 케이블 빼고, 같은 Wi-Fi에서 `npx expo start --dev-client`로 무선 리로드

즉 "최초 설치 1회만 케이블, 이후 무선" 방식입니다.

---

## ⚠️ 참고

- 안드로이드는 `eas build --profile preview -p android`로 **APK**를 뽑아 링크로 바로 설치돼요(계정 승인·유료 불필요).
- 현재 앱은 데모 모드로 동작하니, Supabase 연결 전에도 설치해서 화면을 눌러볼 수 있습니다.
- 번들 ID: `app.kkini` (app.json에 설정됨).
