import { USE_MOCK } from '@/lib/config';
import { repo } from '@/lib/repo';
import { colors, fonts } from '@/theme';
import { Jua_400Regular } from '@expo-google-fonts/jua';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';

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
    const seg = segments as string[];
    const onAuthPage = seg[0] === 'login' || seg[0] === 'signup';
    // 공유 링크(웹)는 로그인 없이도 열려야 함
    const onPublicShare = seg[0] === 'recipe' && seg[1] === 'share';
    if (!userId && !onAuthPage && !onPublicShare) router.replace('/login');
    else if (userId && onAuthPage) router.replace('/(tabs)');
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
  const router = useRouter();

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
        headerTitleAlign: 'center', // iOS·안드로이드 제목 위치 통일(가운데)
        headerShadowVisible: false, // 헤더 밑줄/그림자 제거(평평하게 통일)
        contentStyle: { backgroundColor: colors.bg },
        // 뒤로가기 버튼도 두 OS 동일하게 (Ionicons 꺾쇠). 뒤로 갈 곳이 있을 때만 표시.
        headerLeft: ({ canGoBack }) =>
          canGoBack ? (
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={{ paddingRight: 4 }}
            >
              <Ionicons name="chevron-back" size={26} color={colors.text} />
            </Pressable>
          ) : null,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="recipe/[id]" options={{ title: '레시피' }} />
      <Stack.Screen name="recipe/share/[slug]" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
    </Stack>
  );
}
