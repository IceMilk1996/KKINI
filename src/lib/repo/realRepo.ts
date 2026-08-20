// =============================================================
// 실제(Supabase) 저장소 — 데이터 레이어 API를 인터페이스에 맞춰 래핑
// =============================================================
import type { Repo } from './types';
import { getCurrentUserId } from '../supabase';
import * as recipesApi from '../api/recipes';
import * as favoritesApi from '../api/favorites';
import * as categoriesApi from '../api/categories';
import * as authApi from '../api/auth';
import * as storageApi from '../api/storage';

export const realRepo: Repo = {
  getUserId: () => getCurrentUserId(),
  async signInDemo() {
    // 실제 모드에는 데모 로그인이 없음 — 로그인 화면에서 소셜/이메일 사용
    throw new Error('데모 로그인은 데모 모드에서만 가능합니다.');
  },
  signOut: () => authApi.signOut(),

  listMyRecipes: (search?: string) => recipesApi.listMyRecipes({ search }),
  listFavoriteRecipes: () => recipesApi.listFavoriteRecipes(),
  getRecipe: (id: string) => recipesApi.getRecipe(id),
  createRecipe: (input) => recipesApi.createRecipe(input),
  updateRecipe: (id: string, input) => recipesApi.updateRecipe(id, input),
  deleteRecipe: (id: string) => recipesApi.deleteRecipe(id),

  shareRecipe: (id: string) => recipesApi.shareRecipe(id),
  unshareRecipe: (id: string) => recipesApi.unshareRecipe(id),
  getRecipeBySlug: (slug: string) => recipesApi.getRecipeBySlug(slug),
  listSharedRecipes: () => recipesApi.listSharedRecipes(),

  isFavorited: (id: string) => favoritesApi.isFavorited(id),
  toggleFavorite: (id: string) => favoritesApi.toggleFavorite(id),

  uploadImage: (input) => {
    // base64가 없으면 이미 올라간 URL이므로 그대로 반환
    if (!input.base64) return Promise.resolve(input.uri);
    const ext = (input.contentType?.split('/')[1] || 'jpg');
    return storageApi.uploadRecipeImage(input.base64, ext, input.contentType || 'image/jpeg');
  },

  getProfile: () => authApi.getMe(),

  listCategories: () => categoriesApi.listCategories(),
};
