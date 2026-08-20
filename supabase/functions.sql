-- =============================================================
-- 끼니 — 앱 코드가 사용하는 RPC 함수
-- (스키마 DDL 실행 후 이 파일을 SQL Editor에 추가로 실행)
-- =============================================================

-- 1) 공유 슬러그로 레시피 조회 (unlisted 포함, private 제외)
--    RLS를 우회하되 "슬러그를 아는 경우"로만 접근을 한정한다.
create or replace function get_recipe_by_slug(p_slug text)
returns setof recipes
language sql
security definer
set search_path = public
as $$
  select * from recipes
  where share_slug = p_slug
    and visibility <> 'private';
$$;

-- 2) 조회수 1 증가 (상세 진입 시 호출). 경쟁 조건에 안전한 원자적 증가.
create or replace function increment_recipe_view(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update recipes set view_count = view_count + 1 where id = p_id;
$$;

-- 익명 사용자도 공유 링크를 열 수 있도록 실행 권한 부여
grant execute on function get_recipe_by_slug(text) to anon, authenticated;
grant execute on function increment_recipe_view(uuid) to anon, authenticated;
