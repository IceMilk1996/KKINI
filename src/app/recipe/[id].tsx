import { useState, useCallback, type ReactNode } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { Ionicons } from '@expo/vector-icons';
import { repo } from '@/lib/repo';
import type { RecipeDetail } from '@/types/database';
import { colors, spacing, radius, font, shadow, categoryStyle, fonts } from '@/theme';
import { HeaderBackButton } from '@/components/HeaderBackButton';

const DIFFICULTY_LABEL: Record<string, string> = { easy: '쉬움', medium: '보통', hard: '어려움' };

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const headerHeight = useHeaderHeight(); // 상태바 + 헤더 높이 (투명 헤더라 레이아웃 공간을 안 먹음)
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

  function onDelete() {
    if (!id) return;
    Alert.alert('레시피 삭제', '이 레시피를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => { await repo.deleteRecipe(id); router.back(); } },
    ]);
  }

  const cs = categoryStyle(recipe?.category?.name);

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerTransparent: true,
          headerLeft: () => <HeaderBackButton circle />,
          headerRight: recipe
            ? () => (
                <View style={styles.headerBtns}>
                  <Pressable onPress={() => router.push(`/recipe/edit/${id}`)} hitSlop={8} style={styles.favBtn}>
                    <Ionicons name="create-outline" size={20} color={colors.text} />
                  </Pressable>
                  <Pressable onPress={onToggleFav} hitSlop={8} style={styles.favBtn}>
                    <Ionicons name={fav ? 'heart' : 'heart-outline'} size={20} color={fav ? colors.primary : colors.text} />
                  </Pressable>
                </View>
              )
            : undefined,
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: spacing.xl * 2, flexGrow: 1 }}
        // iOS가 화면 진입 후 스크롤뷰 inset을 뒤늦게 보정하면서 콘텐츠가 밀려 올라가는 것을 막는다
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
      >
        {!recipe ? (
          <View style={[styles.center, { paddingTop: headerHeight }]}>
            <Text style={font.muted}>불러오는 중…</Text>
          </View>
        ) : (
          <>
            {/* 히어로 — 투명 헤더에 가리는 만큼 위쪽 여백을 더해 준다 */}
            <View style={[styles.hero, { backgroundColor: cs.tint, height: 200 + headerHeight, paddingTop: headerHeight }]}>
              <Text style={styles.heroEmoji}>{cs.emoji}</Text>
            </View>

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
          </>
        )}
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
  headerBtns: { flexDirection: 'row', gap: spacing.sm },
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
