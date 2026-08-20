import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, Pressable, RefreshControl, StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { repo } from '@/lib/repo';
import type { Recipe } from '@/types/database';
import { colors, spacing, radius, font, shadow, categoryStyle, fonts } from '@/theme';
import { USE_MOCK } from '@/lib/config';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false); // 당겨서 새로고침 전용
  const [loading, setLoading] = useState(true);        // 최초 로딩 전용

  // isPull=true(당겨서 새로고침)일 때만 RefreshControl을 돌린다.
  // 최초/포커스 로딩에서 refreshing을 켜면 iOS가 상단 contentInset을 밀어
  // 공백이 생겼다가 스르륵 사라지는 현상이 생김.
  const load = useCallback(async (isPull = false) => {
    if (isPull) setRefreshing(true);
    try {
      setRecipes(await repo.listMyRecipes(search || undefined));
    } catch (e) {
      console.warn(e);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [search]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.container}>
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
        }
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
                onSubmitEditing={() => load()}
              />
            </View>

            {recipes.length > 0 && (
              <Text style={styles.sectionLabel}>내 레시피 {recipes.length}</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <View style={styles.emptyCircle}><Text style={styles.emptyEmoji}>🍳</Text></View>
              <Text style={styles.emptyTitle}>아직 레시피가 없어요</Text>
              <Text style={font.muted}>아래 + 버튼으로 첫 끼니를 기록해보세요</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const cs = categoryStyleFromRecipe(item);
          return (
            <Pressable style={styles.card} onPress={() => router.push(`/recipe/${item.id}`)}>
              <View style={[styles.thumb, { backgroundColor: cs.tint }]}>
                <Text style={styles.thumbEmoji}>{cs.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                {item.summary ? (
                  <Text style={font.muted} numberOfLines={1}>{item.summary}</Text>
                ) : null}
                <View style={styles.metaRow}>
                  {item.cook_time_minutes != null && (
                    <View style={styles.metaChip}>
                      <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                      <Text style={styles.metaChipText}>{item.cook_time_minutes}분</Text>
                    </View>
                  )}
                  {item.servings != null && (
                    <View style={styles.metaChip}>
                      <Ionicons name="people-outline" size={13} color={colors.textMuted} />
                      <Text style={styles.metaChipText}>{item.servings}인분</Text>
                    </View>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.border} />
            </Pressable>
          );
        }}
      />

      <Pressable style={styles.fab} onPress={() => router.push('/create')}>
        <Ionicons name="add" size={30} color={colors.white} />
      </Pressable>
    </View>
  );
}

// 레시피의 category_id로 색/이모지를 정하되, 목록엔 카테고리 이름이 없으므로
// 데모 데이터의 category_id 매핑을 간단히 처리 (없으면 기본 🍳)
function categoryStyleFromRecipe(r: Recipe) {
  const map: Record<string, string> = {
    c1: '한식', c2: '양식', c3: '디저트/베이킹', c4: '면/파스타', c5: '밑반찬',
  };
  return categoryStyle(r.category_id ? map[r.category_id] : undefined);
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
  sectionLabel: { marginTop: spacing.xl, marginBottom: spacing.xs, fontSize: 16, fontFamily: fonts.display, color: colors.text },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md,
    backgroundColor: colors.card, borderRadius: radius.lg, ...shadow.card,
  },
  thumb: {
    width: 56, height: 56, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  thumbEmoji: { fontFamily: fonts.body, fontSize: 26 },
  cardTitle: { fontSize: 17, fontFamily: fonts.display, color: colors.text },
  metaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 6 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill,
  },
  metaChipText: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
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
