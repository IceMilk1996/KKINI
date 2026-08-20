import { useState, useCallback, type ReactNode } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Share } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { repo } from '@/lib/repo';
import type { RecipeDetail } from '@/types/database';
import { SHARE_BASE_URL } from '@/lib/config';
import { colors, spacing, radius, font, shadow, categoryStyle, fonts } from '@/theme';

const DIFFICULTY_LABEL: Record<string, string> = { easy: '쉬움', medium: '보통', hard: '어려움' };

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [fav, setFav] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [r, f] = await Promise.all([repo.getRecipe(id), repo.isFavorited(id)]);
      setRecipe(r);
      setFav(f);
    } catch (e) {
      console.warn(e);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onToggleFav() {
    if (!id) return;
    setFav(await repo.toggleFavorite(id));
  }

  async function onShare() {
    if (!recipe) return;
    try {
      let url = recipe.share_slug ? `${SHARE_BASE_URL}/${recipe.share_slug}` : null;
      if (recipe.visibility === 'private' || !url) {
        const res = await repo.shareRecipe(recipe.id);
        url = res.url;
        load(); // 공유 상태 갱신
      }
      await Share.share({ message: `${recipe.title} 레시피\n${url}`, url: url ?? undefined });
    } catch {
      // 사용자가 공유 취소
    }
  }

  function onUnshare() {
    if (!recipe) return;
    Alert.alert('공유 해제', '공유 링크를 끌까요? 링크로는 더 이상 볼 수 없게 돼요.', [
      { text: '취소', style: 'cancel' },
      { text: '공유 해제', style: 'destructive', onPress: async () => { await repo.unshareRecipe(recipe.id); load(); } },
    ]);
  }

  function onDelete() {
    if (!id) return;
    Alert.alert('레시피 삭제', '이 레시피를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => { await repo.deleteRecipe(id); router.back(); } },
    ]);
  }

  if (!recipe) {
    return <View style={styles.center}><Text style={font.muted}>불러오는 중…</Text></View>;
  }

  const cs = categoryStyle(recipe.category?.name);

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerShadowVisible: false,
          headerRight: () => (
            <View style={styles.headerBtns}>
              <Pressable onPress={onShare} hitSlop={8}>
                <Ionicons name="share-outline" size={22} color={colors.text} />
              </Pressable>
              <Pressable onPress={() => router.push(`/recipe/edit/${id}`)} hitSlop={8}>
                <Ionicons name="create-outline" size={22} color={colors.text} />
              </Pressable>
              <Pressable onPress={onToggleFav} hitSlop={8}>
                <Ionicons name={fav ? 'heart' : 'heart-outline'} size={22} color={fav ? colors.primary : colors.text} />
              </Pressable>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}>
        {/* 히어로 */}
        {recipe.cover_image_url ? (
          <Image source={{ uri: recipe.cover_image_url }} style={styles.hero} contentFit="cover" />
        ) : (
          <View style={[styles.hero, { backgroundColor: cs.tint }]}>
            <Text style={styles.heroEmoji}>{cs.emoji}</Text>
          </View>
        )}

        <View style={styles.body}>
          <Text style={font.title}>{recipe.title}</Text>
          {recipe.summary ? <Text style={[font.muted, { marginTop: 6, fontSize: 14 }]}>{recipe.summary}</Text> : null}

          <View style={styles.metaRow}>
            {recipe.category ? (
              <View style={[styles.catPill, { backgroundColor: cs.tint }]}>
                <Text style={[styles.catPillText, { color: cs.color }]}>{cs.emoji} {recipe.category.name}</Text>
              </View>
            ) : null}
            {recipe.cook_time_minutes != null && <MetaChip icon="time-outline" label={`${recipe.cook_time_minutes}분`} />}
            {recipe.servings != null && <MetaChip icon="people-outline" label={`${recipe.servings}인분`} />}
            {recipe.difficulty ? <MetaChip icon="stats-chart-outline" label={DIFFICULTY_LABEL[recipe.difficulty]} /> : null}
          </View>

          {recipe.tags.length > 0 && (
            <View style={styles.tagRow}>
              {recipe.tags.map((t) => (
                <Text key={t.id} style={styles.hashtag}>#{t.name}</Text>
              ))}
            </View>
          )}

          {recipe.visibility !== 'private' && (
            <View style={styles.shareBanner}>
              <Ionicons name="link" size={16} color={colors.primaryDark} />
              <Text style={styles.shareBannerText}>공유 중이에요</Text>
              {recipe.share_slug ? (
                <Pressable onPress={() => router.push(`/recipe/share/${recipe.share_slug}`)} hitSlop={6}>
                  <Text style={styles.shareLink}>미리보기</Text>
                </Pressable>
              ) : null}
              <Text style={styles.shareDot}>·</Text>
              <Pressable onPress={onUnshare} hitSlop={6}><Text style={styles.shareUnlink}>해제</Text></Pressable>
            </View>
          )}

          <Section title={`재료 ${recipe.ingredients.length}`}>
            <View style={styles.ingCard}>
              {recipe.ingredients.map((ing, i) => (
                <View key={ing.id} style={[styles.ingRow, i === recipe.ingredients.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={font.body}>{ing.name}</Text>
                  <Text style={styles.ingAmount}>{[ing.amount, ing.unit].filter(Boolean).join(' ')}</Text>
                </View>
              ))}
            </View>
          </Section>

          <Section title="조리 순서">
            {recipe.steps.map((s) => (
              <View key={s.id} style={styles.stepRow}>
                <View style={styles.stepNo}><Text style={styles.stepNoText}>{s.step_no}</Text></View>
                <View style={{ flex: 1, paddingTop: 2 }}>
                  <Text style={[font.body, { lineHeight: 22 }]}>{s.instruction}</Text>
                  {s.timer_seconds ? (
                    <View style={styles.timerChip}>
                      <Ionicons name="timer-outline" size={13} color={colors.primaryDark} />
                      <Text style={styles.timerText}>{Math.round(s.timer_seconds / 60)}분 타이머</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </Section>

          {recipe.reference_links.length > 0 && (
            <Section title="참고 링크">
              {recipe.reference_links.map((l) => (
                <View key={l.id} style={styles.linkRow}>
                  <Ionicons name="link-outline" size={16} color={colors.primary} />
                  <Text style={styles.linkText} numberOfLines={1}>{l.title || l.url}</Text>
                </View>
              ))}
            </Section>
          )}

          <Pressable style={styles.deleteBtn} onPress={onDelete}>
            <Ionicons name="trash-outline" size={17} color={colors.danger} />
            <Text style={{ fontFamily: fonts.bodyMedium, color: colors.danger }}>레시피 삭제</Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

function MetaChip({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={13} color={colors.textMuted} />
      <Text style={styles.metaChipText}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ marginTop: spacing.xl }}>
      <Text style={font.h2}>{title}</Text>
      <View style={{ marginTop: spacing.md, gap: spacing.sm }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  headerBtns: { flexDirection: 'row', gap: spacing.lg, paddingRight: spacing.xs },
  favBtn: {
    width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center', ...shadow.card,
  },
  hero: { height: 200, alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontFamily: fonts.body, fontSize: 84 },
  body: {
    marginTop: -22, backgroundColor: colors.bg,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg, paddingTop: spacing.xl,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg, alignItems: 'center' },
  catPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  catPillText: { fontFamily: fonts.bodyBold, fontSize: 13, fontWeight: '700' },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill,
  },
  metaChipText: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  hashtag: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.primary, fontWeight: '600' },
  shareBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: spacing.lg, paddingHorizontal: spacing.md, paddingVertical: 10,
    backgroundColor: colors.primarySoft, borderRadius: radius.md,
  },
  shareBannerText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.primaryDark, flex: 1 },
  shareLink: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primaryDark },
  shareDot: { color: colors.primaryDark, marginHorizontal: 2 },
  shareUnlink: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted },
  ingCard: {
    backgroundColor: colors.card, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, ...shadow.card,
  },
  ingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  ingAmount: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  stepRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: 6 },
  stepNo: {
    width: 30, height: 30, borderRadius: radius.pill, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNoText: { fontFamily: fonts.bodyBold, color: colors.white, fontWeight: '800', fontSize: 14 },
  timerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    marginTop: 6, backgroundColor: colors.primarySoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill,
  },
  timerText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.primaryDark, fontWeight: '600' },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, ...shadow.card,
  },
  linkText: { fontFamily: fonts.body, flex: 1, fontSize: 14, color: colors.text },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    marginTop: spacing.xl * 1.5, paddingVertical: spacing.md,
    borderWidth: 1.5, borderColor: '#F3D9D2', borderRadius: radius.md,
  },
});
