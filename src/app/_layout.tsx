import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Jua_400Regular } from '@expo-google-fonts/jua';
import { colors, fonts } from '@/theme';
import { repo } from '@/lib/repo';
import { USE_MOCK } from '@/lib/config';

// 폰트가 준비될 때까지 스플래시를 유지 (로딩 중 폰트 바뀌는 깜빡임 방지)
SplashScreen.preventAutoHideAsync();

// undefined = 확인 중, null = 미로그인, string = 로그인됨
function useAuthGate() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    let unsub: (() => void) | undefined;
    repo.getUserId().then(setUserId).catch(() => setUserId(null));
    // 실모드에서는 로그인 상태 변화를 구독 (로그인/로그아웃 시 자동 이동)
    if (!USE_MOCK) {
      try {
        const authApi = require('@/lib/api/auth');
        unsub = authApi.onAuthStateChange((uid: string | null) => setUserId(uid));
      } catch {}
    }
    return () => { if (unsub) unsub(); };
  }, []);

  useEffect(() => {
    if (userId === undefined) return; // 아직 확인 중
    const onLogin = segments[0] === 'login';
    // 공유 링크(웹)는 로그인 없이도 열려야 함
    const onPublicShare = segments[0] === 'recipe' && segments[1] === 'share';
    if (!userId && !onLogin && !onPublicShare) router.replace('/login');
    else if (userId && onLogin) router.replace('/(tabs)');
  }, [userId, segments]);

  return userId;
}

export default function RootLayout() {
  // 로고 = Jua(둥근), 그 외 전부 = 나눔스퀘어
  const [fontsLoaded] = useFonts({
    Jua_400Regular,
    NanumSquare: require('@kfonts/nanum-square/src/NanumSquareR.ttf'),
    NanumSquare_Bold: require('@kfonts/nanum-square/src/NanumSquareB.ttf'),
    NanumSquare_ExtraBold: require('@kfonts/nanum-square/src/NanumSquareEB.ttf'),
  });

  useAuthGate();

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // 폰트 로드 전에는 아무것도 렌더하지 않음 → 시스템폰트→커스텀폰트 재배치(깜빡임) 제거
  if (!fontsLoaded) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 18 },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="recipe/[id]" options={{ title: '레시피' }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
  );
}
