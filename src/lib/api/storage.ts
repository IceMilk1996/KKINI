// =============================================================
// Storage API — 이미지 업로드 (Supabase Storage)
// RN에서는 base64 → ArrayBuffer로 변환해 업로드한다.
// =============================================================
import { decode } from 'base64-arraybuffer';
import { supabase, getCurrentUserId } from '../supabase';

const BUCKET = 'recipe-images';

/**
 * base64 이미지 데이터를 업로드하고 공개 URL을 반환.
 * @param base64 순수 base64 문자열 (data URI 접두어 없이)
 * @param ext 확장자 (jpg, png 등)
 * @param contentType MIME 타입
 */
export async function uploadRecipeImage(
  base64: string,
  ext = 'jpg',
  contentType = 'image/jpeg'
): Promise<string> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('로그인이 필요합니다.');

  const safeExt = ext.replace('jpeg', 'jpg');
  const path = `${uid}/${Date.now()}-${Math.floor(Math.random() * 1e6)}.${safeExt}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, decode(base64), { contentType, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
