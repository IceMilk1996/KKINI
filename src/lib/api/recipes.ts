// =============================================================
// 레시피 API — 목록, 상세, 생성, 수정, 삭제, 공유, 가져오기
// =============================================================
import { supabase, getCurrentUserId } from '../supabase';
import { SHARE_BASE_URL } from '../config';
import type {
  Recipe,
  RecipeDetail,
  RecipeInput,
  Visibility,
} from '../../types/database';

// 상세 조회에 쓰는 중첩 select 구문
const DETAIL_SELECT = `
  *,
  category:categories(*),
  ingredients(*),
  steps(*),
  reference_links(*),
  images:recipe_images(*),
  recipe_tags(tags(*))
`;

// recipe_tags(tags(*)) 형태를 평탄한 tags 배열로 변환
function normalizeDetail(row: any): RecipeDetail {
  const tags = (row.recipe_tags ?? []).map((rt: any) => rt.tags).filter(Boolean);
  const { recipe_tags, ...rest } = row;
  return {
    ...rest,
    tags,
    ingredients: (row.ingredients ?? []).sort(
      (a: any, b: any) => a.position - b.position
    ),
    steps: (row.steps ?? []).sort((a: any, b: any) => a.step_no - b.step_no),
    reference_links: (row.reference_links ?? []).sort(
      (a: any, b: any) => a.position - b.position
    ),
    images: (row.images ?? []).sort((a: any, b: any) => a.position - b.position),
  } as RecipeDetail;
}

export interface RecipeListOptions {
  categoryId?: string;
  search?: string;       // 제목 검색
  favoritesOnly?: boolean;
  limit?: number;
  offset?: number;
}

/** 내 레시피 목록 (홈/보관함) */
export async function listMyRecipes(opts: RecipeListOptions = {}): Promise<Recipe[]> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('로그인이 필요합니다.');

  let query = supabase
    .from('recipes')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });

  if (opts.categoryId) query = query.eq('category_id', opts.categoryId);
  if (opts.search) query = query.ilike('title', `%${opts.search}%`);
  if (opts.limit) query = query.range(opts.offset ?? 0, (opts.offset ?? 0) + opts.limit - 1);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Recipe[];
}

/** 내가 공유한 레시피 (private 아님) */
export async function listSharedRecipes(): Promise<Recipe[]> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('로그인이 필요합니다.');
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', uid)
    .neq('visibility', 'private')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Recipe[];
}

/** 공개 레시피 탐색 (커뮤니티 피드용) */
export async function listPublicRecipes(opts: RecipeListOptions = {}): Promise<Recipe[]> {
  let query = supabase
    .from('recipes')
    .select('*')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false });

  if (opts.categoryId) query = query.eq('category_id', opts.categoryId);
  if (opts.search) query = query.ilike('title', `%${opts.search}%`);
  if (opts.limit) query = query.range(opts.offset ?? 0, (opts.offset ?? 0) + opts.limit - 1);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Recipe[];
}

/** 즐겨찾기한 레시피 목록 */
export async function listFavoriteRecipes(): Promise<Recipe[]> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase
    .from('favorites')
    .select('recipe:recipes(*)')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => row.recipe).filter(Boolean) as Recipe[];
}

/** 레시피 상세 (재료·단계·링크·이미지·태그 포함) */
export async function getRecipe(id: string): Promise<RecipeDetail> {
  const { data, error } = await supabase
    .from('recipes')
    .select(DETAIL_SELECT)
    .eq('id', id)
    .single();
  if (error) throw error;
  return normalizeDetail(data);
}

/** 공유 슬러그로 레시피 "전체 상세" 조회 (로그인 없이도 — security-definer 함수가 RLS 우회) */
export async function getRecipeBySlug(slug: string): Promise<RecipeDetail | null> {
  const { data, error } = await supabase.rpc('get_shared_recipe', { p_slug: slug });
  if (error) throw error;
  if (!data) return null;
  return data as RecipeDetail;
}

// ---- 태그 처리: 이름으로 upsert 후 레시피에 연결 ----
async function syncTags(recipeId: string, tagNames: string[]) {
  const names = [...new Set(tagNames.map((t) => t.trim().toLowerCase()).filter(Boolean))];
  if (names.length === 0) return;

  // 태그 upsert (이름 unique)
  const { data: tagRows, error: tagErr } = await supabase
    .from('tags')
    .upsert(names.map((name) => ({ name })), { onConflict: 'name' })
    .select();
  if (tagErr) throw tagErr;

  const links = (tagRows ?? []).map((t: any) => ({ recipe_id: recipeId, tag_id: t.id }));
  const { error: linkErr } = await supabase
    .from('recipe_tags')
    .upsert(links, { onConflict: 'recipe_id,tag_id' });
  if (linkErr) throw linkErr;
}

// ---- 자식(재료/단계/링크/이미지) 삽입 ----
async function insertChildren(recipeId: string, input: RecipeInput) {
  const jobs: PromiseLike<any>[] = [];

  if (input.ingredients?.length) {
    jobs.push(
      supabase.from('ingredients').insert(
        input.ingredients.map((ing, i) => ({
          recipe_id: recipeId,
          name: ing.name,
          amount: ing.amount ?? null,
          unit: ing.unit ?? null,
          position: i,
        }))
      )
    );
  }
  if (input.steps?.length) {
    jobs.push(
      supabase.from('steps').insert(
        input.steps.map((s, i) => ({
          recipe_id: recipeId,
          step_no: i + 1,
          instruction: s.instruction,
          image_url: s.image_url ?? null,
          timer_seconds: s.timer_seconds ?? null,
        }))
      )
    );
  }
  if (input.reference_links?.length) {
    jobs.push(
      supabase.from('reference_links').insert(
        input.reference_links.map((l, i) => ({
          recipe_id: recipeId,
          url: l.url,
          title: l.title ?? null,
          thumbnail_url: l.thumbnail_url ?? null,
          position: i,
        }))
      )
    );
  }
  if (input.image_urls?.length) {
    jobs.push(
      supabase.from('recipe_images').insert(
        input.image_urls.map((url, i) => ({ recipe_id: recipeId, image_url: url, position: i }))
      )
    );
  }

  const results = await Promise.all(jobs);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;

  if (input.tags?.length) await syncTags(recipeId, input.tags);
}

/** 레시피 생성 (본문 + 재료·단계·링크·이미지·태그 한 번에) */
export async function createRecipe(input: RecipeInput): Promise<string> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase
    .from('recipes')
    .insert({
      user_id: uid,
      title: input.title,
      summary: input.summary ?? null,
      cover_image_url: input.cover_image_url ?? null,
      category_id: input.category_id ?? null,
      servings: input.servings ?? null,
      cook_time_minutes: input.cook_time_minutes ?? null,
      difficulty: input.difficulty ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;

  const recipeId = data.id as string;
  await insertChildren(recipeId, input);
  return recipeId;
}

/**
 * 레시피 수정. 본문은 patch, 재료/단계/링크/이미지/태그는
 * 넘어온 경우 "통째 교체"(기존 삭제 후 재삽입) 방식.
 */
export async function updateRecipe(id: string, input: RecipeInput): Promise<void> {
  const { error } = await supabase
    .from('recipes')
    .update({
      title: input.title,
      summary: input.summary ?? null,
      cover_image_url: input.cover_image_url ?? null,
      category_id: input.category_id ?? null,
      servings: input.servings ?? null,
      cook_time_minutes: input.cook_time_minutes ?? null,
      difficulty: input.difficulty ?? null,
    })
    .eq('id', id);
  if (error) throw error;

  // 자식 통째 교체 (재료/단계/링크/이미지/태그 연결)
  await Promise.all([
    supabase.from('ingredients').delete().eq('recipe_id', id),
    supabase.from('steps').delete().eq('recipe_id', id),
    supabase.from('reference_links').delete().eq('recipe_id', id),
    supabase.from('recipe_images').delete().eq('recipe_id', id),
    supabase.from('recipe_tags').delete().eq('recipe_id', id),
  ]);
  await insertChildren(id, input);
}

/** 레시피 삭제 (자식은 CASCADE로 함께 삭제됨) */
export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
}

// ---- 공유 ----

function generateSlug(): string {
  return (
    Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6)
  );
}

/** 레시피 공유 켜기 — 슬러그 발급 + 공개 범위 설정. 공유 URL 반환 */
export async function shareRecipe(
  id: string,
  visibility: Exclude<Visibility, 'private'> = 'unlisted'
): Promise<{ slug: string; url: string }> {
  // 이미 슬러그가 있으면 재사용
  const { data: existing } = await supabase
    .from('recipes')
    .select('share_slug')
    .eq('id', id)
    .single();

  const slug = existing?.share_slug ?? generateSlug();
  const { error } = await supabase
    .from('recipes')
    .update({ share_slug: slug, visibility })
    .eq('id', id);
  if (error) throw error;

  return { slug, url: `${SHARE_BASE_URL}/${slug}` };
}

/** 공유 끄기 — 다시 비공개로 */
export async function unshareRecipe(id: string): Promise<void> {
  const { error } = await supabase
    .from('recipes')
    .update({ visibility: 'private' })
    .eq('id', id);
  if (error) throw error;
}

/** 공유받은 레시피를 내 노트로 가져오기(fork) */
export async function forkRecipe(sourceId: string): Promise<string> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('로그인이 필요합니다.');

  const src = await getRecipe(sourceId);
  const { data, error } = await supabase
    .from('recipes')
    .insert({
      user_id: uid,
      title: src.title,
      summary: src.summary,
      cover_image_url: src.cover_image_url,
      category_id: src.category_id,
      servings: src.servings,
      cook_time_minutes: src.cook_time_minutes,
      difficulty: src.difficulty,
      forked_from_id: src.id,
    })
    .select('id')
    .single();
  if (error) throw error;

  const newId = data.id as string;
  await insertChildren(newId, {
    title: src.title,
    ingredients: src.ingredients.map((i) => ({ name: i.name, amount: i.amount, unit: i.unit })),
    steps: src.steps.map((s) => ({
      instruction: s.instruction,
      image_url: s.image_url,
      timer_seconds: s.timer_seconds,
    })),
    reference_links: src.reference_links.map((l) => ({
      url: l.url,
      title: l.title,
      thumbnail_url: l.thumbnail_url,
    })),
    image_urls: src.images.map((im) => im.image_url),
    tags: src.tags.map((t) => t.name),
  });
  return newId;
}

/** 조회수 증가 (상세 진입 시). 실패해도 무시 */
export async function incrementView(id: string): Promise<void> {
  await supabase.rpc('increment_recipe_view', { p_id: id });
}
