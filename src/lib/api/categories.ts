// =============================================================
// 카테고리 / 태그 조회 API
// =============================================================
import { supabase } from '../supabase';
import type { Category, Tag } from '../../types/database';

/** 전체 카테고리 (필터 UI용) */
export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('position', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

/** 태그 자동완성 검색 */
export async function searchTags(keyword: string, limit = 10): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .ilike('name', `%${keyword.toLowerCase()}%`)
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Tag[];
}
