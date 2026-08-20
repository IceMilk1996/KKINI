// =============================================================
// 앱 공통 설정값
// =============================================================

/**
 * 공유 링크 베이스 URL.
 * 웹 공유 페이지가 생기면 실제 도메인(예: https://kkini.app)으로 교체.
 */
export const SHARE_BASE_URL = 'https://kkini.app/r';

/** OAuth 로그인 후 앱으로 돌아올 딥링크 스킴 (app.json의 scheme과 일치) */
export const APP_SCHEME = 'kkini';

/**
 * 데모 모드 — Supabase 환경변수가 없으면 자동으로 켜진다.
 * 켜져 있으면 실제 서버 없이 메모리 안의 가짜 데이터로 동작하므로,
 * 백엔드 없이도 앱 UI를 바로 실행해볼 수 있다.
 */
export const USE_MOCK = !process.env.EXPO_PUBLIC_SUPABASE_URL;
