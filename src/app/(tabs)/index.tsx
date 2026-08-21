import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, Pressable, ScrollView, RefreshControl, StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { repo } from '@/lib/repo';
import type { Recipe, Category } from '@/types/database';
import RecipeCard from '@/components/RecipeCard';
import { colors, spacing, radius, font, shadow, fonts } from '@/theme';
import { USE_MOCK } from '@/lib/config';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null); // null = 전체
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setRecipes(await repo.listMyRecipes(search || undefined));
    } catch (e) {
      console.warn(e);
    } finally {
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    repo.listCategories().then(setCategories).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // 레시피가 실제로 들어있는 카테고리만 칩으로 노출
  const counts = new Map<string, number>();
  recipes.forEach((r) => {
    if (r.category_id) counts.set(r.category_id, (counts.get(r.category_id) ?? 0) + 1);
  });
  const presentCats = categories.filter((c) => counts.has(c.id));

  // 선택된 카테고리가 목록에서 사라지면 전체로 되돌림
  const activeCat = selectedCat && presentCats.some((c) => c.id === selectedCat) ? selectedCat : null;
  const shown = activeCat ? recipes.filter((r) => r.category_id === activeCat) : recipes;

  return (
    <View style={styles.container}>
      <FlatList
        data={shown}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
            {USE_MOCK && (
              <View style={styles.demoBadge}>
                <Text style={styles.demoText}>🧪 데모 모드 · 서버 없이 미리보기</Text>
              </View>
            )}
            <Text style={styles.greeting}>오늘은 뭐 해먹지?</Text>
            <Text style={styles.subGreeting}>나만의 끼니를 기록해보세요 🍳</Text>

            <View style={styles.searchRow}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="레시피 검색"
                placeholderTextColor={colors.textMuted}
                returnKeyType="search"
                onSubmitEditing={load}
              />
            </View>

            {presentCats.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.catRow}
              >
                <Chip label="전체" on={!activeCat} onPress={() => setSelectedCat(null)} />
                {presentCats.map((c) => (
                  <Chip key={c.id} label={c.name} on={activeCat === c.id} onPress={() => setSelectedCat(c.id)} />
                ))}
              </ScrollView>
            )}

            {shown.length > 0 && (
              <Text style={styles.sectionLabel}>
                {activeCat ? presentCats.find((c) => c.id === activeCat)?.name : '내 레시피'} {shown.length}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.empty}>
              <View style={styles.emptyCircle}><Text style={styles.emptyEmoji}>🍳</Text></View>
              <Text style={styles.emptyTitle}>아직 레시피가 없어요</Text>
              <Text style={font.muted}>아래 + 버튼으로 첫 끼니를 기록해보세요</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <RecipeCard recipe={item} onPress={() => router.push(`/recipe/${item.id}`)} />
        )}
      />

      <Pressable style={styles.fab} onPress={() => router.push('/create')}>
        <Ionicons name="add" size={30} color={colors.white} />
      </Pressable>
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  demoBadge: {
    alignSelf: 'flex-start', backgroundColor: colors.surface,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, marginBottom: spacing.md,
  },
  demoText: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted },
  greeting: { fontSize: 28, fontFamily: fonts.display, color: colors.text },
  subGreeting: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, marginTop: 6 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginTop: spacing.lg, paddingHorizontal: spacing.md, paddingVertical: 13,
    backgroundColor: colors.card, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  searchInput: { fontFamily: fonts.body, flex: 1, color: colors.text, padding: 0, fontSize: 15 },
  catRow: { gap: spacing.sm, paddingTop: spacing.lg, paddingRight: spacing.lg },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.primary },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  chipTextOn: { color: colors.white },
  sectionLabel: { marginTop: spacing.xl, marginBottom: spacing.xs, fontSize: 16, fontFamily: fonts.display, color: colors.text },
  empty: { alignItems: 'center', marginTop: 60, gap: spacing.sm, paddingHorizontal: spacing.xl },
  emptyCircle: {
    width: 88, height: 88, borderRadius: radius.pill, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  emptyEmoji: { fontFamily: fonts.body, fontSize: 40 },
  emptyTitle: { fontSize: 18, fontFamily: fonts.display, color: colors.text },
  fab: {
    position: 'absolute', right: spacing.lg, bottom: spacing.xl,
    width: 60, height: 60, borderRadius: radius.pill, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', ...shadow.fab,
  },
});
