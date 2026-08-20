// =============================================================
// 즐겨찾기 API
// =============================================================
import { supabase, getCurrentUserId } from '../supabase';

/** 즐겨찾기 여부 확인 */
export async function isFavorited(recipeId: string): Promise<boolean> {
  const uid = await getCurrentUserId();
  if (!uid) return false;
  const { count, error } = await supabase
    .from('favorites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', uid)
    .eq('recipe_id', recipeId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

/** 즐겨찾기 추가 */
export async function addFavorite(recipeId: string): Promise<void> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('로그인이 필요합니다.');
  const { error } = await supabase
    .from('favorites')
    .upsert({ user_id: uid, recipe_id: recipeId }, { onConflict: 'user_id,recipe_id' });
  if (error) throw error;
}

/** 즐겨찾기 해제 */
export async function removeFavorite(recipeId: string): Promise<void> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('로그인이 필요합니다.');
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', uid)
    .eq('recipe_id', recipeId);
  if (error) throw error;
}

/** 즐겨찾기 토글 — 최종 상태(true=추가됨)를 반환 */
export async function toggleFavorite(recipeId: string): Promise<boolean> {
  const favorited = await isFavorited(recipeId);
  if (favorited) {
    await removeFavorite(recipeId);
    return false;
  }
  await addFavorite(recipeId);
  return true;
}
