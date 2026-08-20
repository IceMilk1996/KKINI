import { useState, useEffect, type ReactNode } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { repo } from '@/lib/repo';
import type { RecipeDetail } from '@/types/database';
import { colors, spacing, radius, font, categoryStyle, fonts } from '@/theme';

export default function SharedRecipeScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'notfound'>('loading');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    repo.getRecipeBySlug(slug)
      .then((r) => { setRecipe(r); setState(r ? 'ok' : 'notfound'); })
      .catch(() => setState('notfound'));
  }, [slug]);

  async function onImport() {
    if (!recipe) return;
    setImporting(true);
    try {
      const id = await repo.createRecipe({
        title: recipe.title,
        summary: recipe.summary,
        cover_image_url: recipe.cover_image_url,
        category_id: recipe.category_id,
        servings: recipe.servings,
        cook_time_minutes: recipe.cook_time_minutes,
        difficulty: recipe.difficulty,
        ingredients: recipe.ingredients.map((i) => ({ name: i.name, amount: i.amount, unit: i.unit })),
        steps: recipe.steps.map((s) => ({ instruction: s.instruction, image_url: s.image_url, timer_seconds: s.timer_seconds })),
        reference_links: recipe.reference_links.map((l) => ({ url: l.url, title: l.title, thumbnail_url: l.thumbnail_url })),
        image_urls: recipe.images.map((im) => im.image_url),
        tags: recipe.tags.map((t) => t.name),
      });
      Alert.alert('가져왔어요', '내 레시피로 저장했어요.');
      router.replace(`/recipe/${id}`);
    } catch (e: any) {
      Alert.alert('가져오기 실패', e?.message ?? '로그인 후 다시 시도해주세요.');
    } finally {
      setImporting(false);
    }
  }

  if (state === 'loading') {
    return <View style={styles.center}><Text style={font.muted}>불러오는 중…</Text></View>;
  }
  if (state === 'notfound' || !recipe) {
    return (
      <>
        <Stack.Screen options={{ title: '공유 레시피' }} />
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🔗</Text>
          <Text style={styles.emptyTitle}>레시피를 찾을 수 없어요</Text>
          <Text style={font.muted}>공유가 해제되었거나 잘못된 링크예요</Text>
        </View>
      </>
    );
  }

  const cs = categoryStyle(recipe.category?.name);

  return (
    <>
      <Stack.Screen options={{ title: '', headerShadowVisible: false }} />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl * 3 }}>
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
          </View>

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
        </View>
      </ScrollView>

      <View style={styles.importBar}>
        <Pressable style={[styles.importBtn, importing && { opacity: 0.6 }]} disabled={importing} onPress={onImport}>
          <Ionicons name="download-outline" size={18} color={colors.white} />
          <Text style={styles.importText}>{importing ? '가져오는 중…' : '내 레시피로 가져오기'}</Text>
        </Pressable>
      </View>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, gap: spacing.sm },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontFamily: fonts.display, color: colors.text },
  hero: { height: 200, alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontFamily: fonts.body, fontSize: 84 },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg, alignItems: 'center' },
  catPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  catPillText: { fontFamily: fonts.bodyBold, fontSize: 13, fontWeight: '700' },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill,
  },
  metaChipText: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  ingCard: { backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: spacing.lg },
  ingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  ingAmount: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  stepRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: 6 },
  stepNo: { width: 30, height: 30, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  stepNoText: { fontFamily: fonts.bodyBold, color: colors.white, fontWeight: '800', fontSize: 14 },
  timerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    marginTop: 6, backgroundColor: colors.primarySoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill,
  },
  timerText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.primaryDark, fontWeight: '600' },
  importBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: spacing.lg, paddingBottom: spacing.xl, backgroundColor: colors.bg,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  importBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md,
  },
  importText: { fontFamily: fonts.bodyBold, color: colors.white, fontSize: 16 },
});
