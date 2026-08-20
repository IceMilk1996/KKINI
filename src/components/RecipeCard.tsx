import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { Recipe } from '@/types/database';
import { colors, spacing, radius, font, shadow, categoryStyle, fonts } from '@/theme';

// 데모 데이터의 category_id → 이름 매핑 (실데이터는 UUID라 기본 이모지로 폴백)
const DEMO_CAT: Record<string, string> = {
  c1: '한식', c2: '양식', c3: '디저트/베이킹', c4: '면/파스타', c5: '밑반찬',
};

export default function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const cs = categoryStyle(recipe.category_id ? DEMO_CAT[recipe.category_id] : undefined);
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {recipe.cover_image_url ? (
        <Image source={{ uri: recipe.cover_image_url }} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={[styles.thumb, { backgroundColor: cs.tint }]}>
          <Text style={styles.thumbEmoji}>{cs.emoji}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle} numberOfLines={1}>{recipe.title}</Text>
        {recipe.summary ? (
          <Text style={font.muted} numberOfLines={1}>{recipe.summary}</Text>
        ) : null}
        <View style={styles.metaRow}>
          {recipe.cook_time_minutes != null && (
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaChipText}>{recipe.cook_time_minutes}분</Text>
            </View>
          )}
          {recipe.servings != null && (
            <View style={styles.metaChip}>
              <Ionicons name="people-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaChipText}>{recipe.servings}인분</Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.border} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md,
    backgroundColor: colors.card, borderRadius: radius.lg, ...shadow.card,
  },
  thumb: { width: 56, height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  thumbEmoji: { fontFamily: fonts.body, fontSize: 26 },
  cardTitle: { fontSize: 17, fontFamily: fonts.display, color: colors.text },
  metaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 6 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill,
  },
  metaChipText: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
});
