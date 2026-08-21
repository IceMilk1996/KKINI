import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { repo } from '@/lib/repo';
import type { ProfileInfo } from '@/lib/repo/types';
import { colors, spacing, radius, font, fonts } from '@/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const [me, setMe] = useState<ProfileInfo | null>(null);
  const [recipeCount, setRecipeCount] = useState(0);
  const [favCount, setFavCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const [p, mine, favs] = await Promise.all([
        repo.getProfile(),
        repo.listMyRecipes(),
        repo.listFavoriteRecipes(),
      ]);
      setMe(p);
      setRecipeCount(mine.length);
      setFavCount(favs.length);
    } catch (e) {
      console.warn(e);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function onSignOut() {
    Alert.alert('로그아웃', '로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃', style: 'destructive',
        onPress: async () => {
          try { await repo.signOut(); } catch {}
          router.replace('/login');
        },
      },
    ]);
  }

  function onDeleteAccount() {
    Alert.alert(
      '회원 탈퇴',
      '정말 탈퇴하시겠어요?\n작성한 모든 레시피와 데이터가 영구적으로 삭제되며 되돌릴 수 없어요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴하기',
          style: 'destructive',
          onPress: async () => {
            try {
              await repo.deleteAccount();
              router.replace('/login');
            } catch (e: any) {
              Alert.alert('탈퇴 실패', e?.message ?? '다시 시도해주세요.');
            }
          },
        },
      ],
    );
  }

  const name = me?.displayName || me?.username || (me?.email ? me.email.split('@')[0] : '내 프로필');

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={36} color={colors.primary} />
        </View>
        <Text style={styles.name}>{name}</Text>
        {me?.email ? <Text style={font.muted}>{me.email}</Text> : null}
      </View>

      <View style={styles.stats}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{recipeCount}</Text>
          <Text style={styles.statLabel}>내 레시피</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{favCount}</Text>
          <Text style={styles.statLabel}>즐겨찾기</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <Row icon="bookmark-outline" label="보관함" onPress={() => router.push('/bookmarks')} />
        <Row icon="share-social-outline" label="공유한 레시피" onPress={() => router.push('/shared')} />
      </View>

      <Pressable style={styles.signOut} onPress={onSignOut}>
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={{ fontFamily: fonts.bodyMedium, color: colors.danger }}>로그아웃</Text>
      </Pressable>

      <Pressable style={styles.deleteAccount} onPress={onDeleteAccount}>
        <Text style={styles.deleteAccountText}>회원 탈퇴</Text>
      </Pressable>
    </View>
  );
}

function Row({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text style={[font.body, { flex: 1 }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: spacing.xl },
  top: { alignItems: 'center', gap: 4 },
  avatar: {
    width: 80, height: 80, borderRadius: radius.pill, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  name: { fontSize: 20, fontFamily: fonts.display, color: colors.text },
  stats: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.xl, marginHorizontal: spacing.lg,
    backgroundColor: colors.card, borderRadius: radius.lg, paddingVertical: spacing.lg,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  statNum: { fontSize: 22, fontFamily: fonts.display, color: colors.primary },
  statLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  menu: { marginTop: spacing.xl, marginHorizontal: spacing.lg, backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.xl, padding: spacing.md },
  deleteAccount: { alignItems: 'center', paddingVertical: spacing.sm },
  deleteAccountText: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, textDecorationLine: 'underline' },
});
