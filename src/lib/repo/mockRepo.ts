// =============================================================
// 데모(목) 저장소 — 메모리 안에서 동작. Supabase 불필요.
// =============================================================
import type { Recipe, RecipeDetail, RecipeInput } from '../../types/database';
import type { Repo } from './types';
import { DEMO_USER_ID, mockCategories, seedRecipes } from '../mock/mockData';

let recipes: RecipeDetail[] = seedRecipes();
const favorites = new Set<string>();
let signedIn = true; // 데모는 기본 로그인 상태
let seq = 100;

const uid = () => `id-${seq++}`;
const wait = <T>(v: T) => new Promise<T>((res) => setTimeout(() => res(v), 120));

function toRecipe(r: RecipeDetail): Recipe {
  const { category, ingredients, steps, reference_links, images, tags, ...base } = r;
  return base;
}

export const mockRepo: Repo = {
  async getUserId() {
    return signedIn ? DEMO_USER_ID : null;
  },
  async signInDemo() {
    signedIn = true;
  },
  async signOut() {
    signedIn = false;
  },

  async listMyRecipes(search?: string) {
    let list = recipes.filter((r) => r.user_id === DEMO_USER_ID);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.title.toLowerCase().includes(q));
    }
    const sorted = [...list].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return wait(sorted.map(toRecipe));
  },

  async getRecipe(id: string) {
    const r = recipes.find((x) => x.id === id);
    if (!r) throw new Error('레시피를 찾을 수 없습니다.');
    return wait(r);
  },

  async createRecipe(input: RecipeInput) {
    const id = uid();
    const ts = new Date().toISOString();
    const cat = mockCategories.find((c) => c.id === input.category_id) ?? null;
    const detail: RecipeDetail = {
      id,
      user_id: DEMO_USER_ID,
      category_id: input.category_id ?? null,
      title: input.title,
      summary: input.summary ?? null,
      cover_image_url: input.cover_image_url ?? null,
      servings: input.servings ?? null,
      cook_time_minutes: input.cook_time_minutes ?? null,
      difficulty: input.difficulty ?? null,
      visibility: 'private',
      share_slug: null,
      forked_from_id: null,
      view_count: 0,
      created_at: ts,
      updated_at: ts,
      category: cat,
      ingredients: (input.ingredients ?? []).map((ing, i) => ({
        id: uid(), recipe_id: id, name: ing.name,
        amount: ing.amount ?? null, unit: ing.unit ?? null, position: i,
      })),
      steps: (input.steps ?? []).map((s, i) => ({
        id: uid(), recipe_id: id, step_no: i + 1, instruction: s.instruction,
        image_url: s.image_url ?? null, timer_seconds: s.timer_seconds ?? null,
      })),
      reference_links: (input.reference_links ?? []).map((l, i) => ({
        id: uid(), recipe_id: id, url: l.url, title: l.title ?? null,
        thumbnail_url: l.thumbnail_url ?? null, position: i,
      })),
      images: (input.image_urls ?? []).map((url, i) => ({
        id: uid(), recipe_id: id, image_url: url, position: i,
      })),
      tags: (input.tags ?? []).map((name) => ({ id: uid(), name })),
    };
    recipes = [detail, ...recipes];
    return wait(id);
  },

  async updateRecipe(id: string, input: RecipeInput) {
    const idx = recipes.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('레시피를 찾을 수 없습니다.');
    const prev = recipes[idx];
    const cat = mockCategories.find((c) => c.id === input.category_id) ?? null;
    const updated: RecipeDetail = {
      ...prev,
      category_id: input.category_id ?? null,
      title: input.title,
      summary: input.summary ?? null,
      cover_image_url: input.cover_image_url ?? prev.cover_image_url,
      servings: input.servings ?? null,
      cook_time_minutes: input.cook_time_minutes ?? null,
      difficulty: input.difficulty ?? null,
      updated_at: new Date().toISOString(),
      category: cat,
      ingredients: (input.ingredients ?? []).map((ing, i) => ({
        id: uid(), recipe_id: id, name: ing.name,
        amount: ing.amount ?? null, unit: ing.unit ?? null, position: i,
      })),
      steps: (input.steps ?? []).map((s, i) => ({
        id: uid(), recipe_id: id, step_no: i + 1, instruction: s.instruction,
        image_url: s.image_url ?? null, timer_seconds: s.timer_seconds ?? null,
      })),
      reference_links: (input.reference_links ?? []).map((l, i) => ({
        id: uid(), recipe_id: id, url: l.url, title: l.title ?? null,
        thumbnail_url: l.thumbnail_url ?? null, position: i,
      })),
      images: (input.image_urls ?? []).map((url, i) => ({
        id: uid(), recipe_id: id, image_url: url, position: i,
      })),
      tags: (input.tags ?? []).map((name) => ({ id: uid(), name })),
    };
    recipes = recipes.map((r) => (r.id === id ? updated : r));
    return wait(undefined);
  },

  async deleteRecipe(id: string) {
    recipes = recipes.filter((r) => r.id !== id);
    favorites.delete(id);
    return wait(undefined);
  },

  async isFavorited(id: string) {
    return wait(favorites.has(id));
  },
  async toggleFavorite(id: string) {
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    return wait(favorites.has(id));
  },

  async listCategories() {
    return wait(mockCategories);
  },
};
