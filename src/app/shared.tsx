import { useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { repo } from '@/lib/repo';
import type { Recipe } from '@/types/database';
import RecipeCard from '@/components/RecipeCard';
import { colors, spacing, radius, font } from '@/theme';

export default function SharedListScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setRecipes(await repo.listSharedRecipes());
    } catch (e) {
      console.warn(e);
    } finally {
      setRefreshing(false);
      setLoaded(true);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <>
      <Stack.Screen options={{ title: '공유한 레시피' }} />
      <FlatList
        style={{ flex: 1, backgroundColor: colors.bg }}
        data={recipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <RecipeCard recipe={item} onPress={() => router.push(`/recipe/${item.id}`)} />
        )}
        ListEmptyComponent={
          loaded && !refreshing ? (
            <View style={styles.empty}>
              <View style={styles.emptyCircle}><Text style={styles.emptyEmoji}>🔗</Text></View>
              <Text style={styles.emptyTitle}>공유한 레시피가 없어요</Text>
              <Text style={font.muted}>레시피 상세에서 공유 버튼을 누르면 여기에 모여요</Text>
            </View>
          ) : null
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', marginTop: 80, gap: spacing.sm, paddingHorizontal: spacing.xl },
  emptyCircle: {
    width: 88, height: 88, borderRadius: radius.pill, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontFamily: font.h2.fontFamily, color: colors.text },
});
