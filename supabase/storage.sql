-- =============================================================
-- 끼니 — 이미지 저장용 Storage 버킷 + 정책
-- Supabase SQL Editor에 붙여넣고 Run (schema.sql 실행 후)
-- =============================================================

-- 1) public 버킷 생성 (읽기는 공개, 업로드는 로그인 사용자만)
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

-- 2) 정책
drop policy if exists "recipe-images public read"   on storage.objects;
drop policy if exists "recipe-images auth insert"    on storage.objects;
drop policy if exists "recipe-images owner update"   on storage.objects;
drop policy if exists "recipe-images owner delete"   on storage.objects;

-- 누구나 읽기 (공유 레시피 이미지 표시용)
create policy "recipe-images public read" on storage.objects
  for select using (bucket_id = 'recipe-images');

-- 로그인 사용자만 업로드
create policy "recipe-images auth insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'recipe-images');

-- 올린 본인만 수정/삭제
create policy "recipe-images owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'recipe-images' and owner = auth.uid());

create policy "recipe-images owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'recipe-images' and owner = auth.uid());
