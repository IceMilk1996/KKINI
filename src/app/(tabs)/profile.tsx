import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { repo } from '@/lib/repo';
import { USE_MOCK } from '@/lib/config';
import { colors, spacing, radius, font, fonts } from '@/theme';

export default function ProfileScreen() {
  const router = useRouter();

  async function onSignOut() {
    try {
      await repo.signOut();
    } catch {}
    router.replace('/login');
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={36} color={colors.primary} />
      </View>
      <Text style={font.h2}>{USE_MOCK ? '데모 사용자' : '내 프로필'}</Text>
      <Text style={font.muted}>
        {USE_MOCK ? 'Supabase 연결 전 데모 모드입니다.' : '끼니와 함께 요리를 기록해요.'}
      </Text>

      <View style={styles.menu}>
        <Row icon="heart-outline" label="즐겨찾기한 레시피" />
        <Row icon="share-social-outline" label="공유한 레시피" />
        <Row icon="settings-outline" label="설정" />
      </View>

      <Pressable style={styles.signOut} onPress={onSignOut}>
        <Text style={{ fontFamily: fonts.bodyMedium, color: colors.danger }}>로그아웃</Text>
      </Pressable>
    </View>
  );
}

function Row({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text style={[font.body, { flex: 1 }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', paddingTop: spacing.xl * 2, gap: spacing.sm },
  avatar: {
    width: 80, height: 80, borderRadius: radius.pill, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  menu: { alignSelf: 'stretch', marginTop: spacing.xl, borderTopWidth: 1, borderTopColor: colors.border },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  signOut: { marginTop: spacing.xl, padding: spacing.md },
});
