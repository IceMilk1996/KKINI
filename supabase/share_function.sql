-- =============================================================
-- 끼니 — 공유 링크로 레시피 "전체 상세"를 안전하게 반환
-- (schema.sql 실행 후 SQL Editor에 추가 실행)
-- 링크(슬러그)만 알면 로그인 없이도 상세 전체를 볼 수 있게 함.
-- RLS를 우회하되 "private 아님 + 슬러그 일치"로만 접근을 한정한다.
-- =============================================================
create or replace function get_shared_recipe(p_slug text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select to_jsonb(r)
    || jsonb_build_object(
      'category', (select to_jsonb(c) from categories c where c.id = r.category_id),
      'ingredients', coalesce(
        (select jsonb_agg(to_jsonb(i) order by i.position) from ingredients i where i.recipe_id = r.id),
        '[]'::jsonb),
      'steps', coalesce(
        (select jsonb_agg(to_jsonb(s) order by s.step_no) from steps s where s.recipe_id = r.id),
        '[]'::jsonb),
      'reference_links', coalesce(
        (select jsonb_agg(to_jsonb(l) order by l.position) from reference_links l where l.recipe_id = r.id),
        '[]'::jsonb),
      'images', coalesce(
        (select jsonb_agg(to_jsonb(im) order by im.position) from recipe_images im where im.recipe_id = r.id),
        '[]'::jsonb),
      'tags', coalesce(
        (select jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name))
         from recipe_tags rt join tags t on t.id = rt.tag_id where rt.recipe_id = r.id),
        '[]'::jsonb)
    )
  from recipes r
  where r.share_slug = p_slug and r.visibility <> 'private'
  limit 1;
$$;

grant execute on function get_shared_recipe(text) to anon, authenticated;
