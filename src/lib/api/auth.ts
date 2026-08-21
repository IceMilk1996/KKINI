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

  // 카카오는 이메일(account_email)이 사업자 검수 대상이라 요청하면 KOE205.
  // 닉네임만 요청한다. (구글은 기본 scope로 이메일 제공)
  const scopes = provider === 'kakao' ? 'profile_nickname' : undefined;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true, scopes },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('로그인 URL을 받지 못했습니다.');

  // 앱 내 브라우저로 인증 진행
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) return null; // 사용자가 취소

  const url = new URL(result.url);

  // PKCE 흐름: 콜백에 ?code=... → 세션 교환
  const code = url.searchParams.get('code');
  if (code) {
    const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
    if (exErr) throw exErr;
    return true;
  }

  // (구식) implicit 흐름 대비: #access_token=...
  const params = new URLSearchParams(url.hash.replace(/^#/, ''));
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (access_token && refresh_token) {
    const { error: sessErr } = await supabase.auth.setSession({ access_token, refresh_token });
    if (sessErr) throw sessErr;
    return true;
  }

  // 콜백에 에러가 담겨온 경우
  const errDesc = url.searchParams.get('error_description') || url.searchParams.get('error');
  throw new Error(errDesc || '로그인 세션을 만들지 못했습니다.');
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

/** 마이 화면용 간단 프로필 (이메일 + 닉네임) */
export async function getMe(): Promise<{ email: string | null; username: string | null; displayName: string | null }> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return { email: null, username: null, displayName: null };
  let username: string | null = null;
  let displayName: string | null = null;
  try {
    const { data: prof } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', user.id)
      .single();
    username = prof?.username ?? null;
    displayName = prof?.display_name ?? null;
  } catch {}
  return { email: user.email ?? null, username, displayName };
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
