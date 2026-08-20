import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, shadow } from '@/theme';

/**
 * iOS/Android에서 동일하게 보이는 뒤로가기 버튼.
 * 네이티브 back 버튼은 플랫폼마다 아이콘(‹ vs ←)과 라벨 유무가 달라서 직접 그린다.
 * circle: 투명 헤더 위에 얹을 때 쓰는 원형 변형 (상세 화면의 우측 버튼들과 짝을 맞춤)
 */
export function HeaderBackButton({ circle = false }: { circle?: boolean }) {
  const router = useRouter();
  if (!router.canGoBack()) return null;

  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={8}
      style={({ pressed }) => [circle && styles.circle, pressed && styles.pressed]}
    >
      <Ionicons name="chevron-back" size={22} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center', ...shadow.card,
  },
  pressed: { opacity: 0.55 },
});
