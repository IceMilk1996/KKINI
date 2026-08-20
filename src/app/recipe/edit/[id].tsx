import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import RecipeForm from '@/components/RecipeForm';
import { repo } from '@/lib/repo';
import type { RecipeDetail } from '@/types/database';
import { colors, font } from '@/theme';

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);

  useEffect(() => {
    if (!id) return;
    repo.getRecipe(id).then(setRecipe).catch(() => {});
  }, [id]);

  if (!recipe) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <Text style={font.muted}>불러오는 중…</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: '레시피 수정' }} />
      <RecipeForm
        initial={recipe}
        submitLabel="수정 완료"
        onSubmit={async (input) => {
          await repo.updateRecipe(recipe.id, input);
          router.replace(`/recipe/${recipe.id}`);
        }}
      />
    </>
  );
}
