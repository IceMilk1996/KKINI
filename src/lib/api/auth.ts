// =============================================================
// 인증 API (React Native / Expo 버전)
// - 소셜 로그인: 딥링크 리디렉션 (expo-web-browser + expo-auth-session)
// - 이메일 로그인/회원가입, 프로필
// =============================================================
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../supabase';
import type { Profile } from '../../types/database';

export type OAuthProvider = 'google' | 'apple' | 'kakao';

/**
 * 소셜 로그인 (구글/애플/카카오).
 * 앱 내 브라우저에서 인증 후 딥링크로 복귀 → 세션 세팅.
 */
export async function signInWithOAuth(provider: OAuthProvider) {
  const redirectTo = makeRedirectUri({ scheme: 'kkini', path: 'auth-callback' });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('로그인 URL을 받지 못했습니다.');

  // 앱 내 브라우저로 인증 진행
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) return null;

  // 콜백 URL에서 토큰 추출 → 세션 설정
  const url = new URL(result.url);
  const params = new URLSearchParams(url.hash.substring(1)); // #access_token=...
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) throw new Error('토큰을 찾지 못했습니다.');

  const { data: sessionData, error: sessErr } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (sessErr) throw sessErr;
  return sessionData;
}

/** 이메일 + 비밀번호 로그인 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** 이메일 회원가입 (프로필은 DB 트리거가 자동 생성) */
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** 내 프로필 조회 */
export async function getMyProfile(): Promise<Profile | null> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return null;

  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
  if (error) throw error;
  return data as Profile;
}

/** 프로필 수정 */
export async function updateMyProfile(
  patch: Partial<Pick<Profile, 'username' | 'display_name' | 'avatar_url' | 'bio'>>
): Promise<Profile> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', uid)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

/** 로그인 상태 변화 구독 */
export function onAuthStateChange(callback: (userId: string | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user?.id ?? null);
  });
  return () => data.subscription.unsubscribe();
}
