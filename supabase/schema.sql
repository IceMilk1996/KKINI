-- =============================================================
-- 끼니 — 전체 스키마 (Supabase SQL Editor에 통째로 붙여넣고 Run)
-- 테이블 + 인덱스 + RLS + 함수 + 카테고리 시드
-- 여러 번 실행해도 안전하도록 가드(if not exists / drop policy if exists)를 넣었습니다.
-- =============================================================

-- ── 0) 확장 ────────────────────────────────────────────────
create extension if not exists pg_trgm;

-- ── 1) ENUM 타입 (이미 있으면 건너뜀) ──────────────────────
do $$ begin
  create type difficulty_level as enum ('easy', 'medium', 'hard');
exception when duplicate_object then null; end $$;

do $$ begin
  create type recipe_visibility as enum ('private', 'unlisted', 'public');
exception when duplicate_object then null; end $$;

-- ── 2) updated_at 자동 갱신 함수 ───────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 3) profiles (auth.users 1:1 확장) ──────────────────────
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  display_name text,
  avatar_url   text,
  bio          text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
drop trigger if exists trg_profiles_updated on profiles;
create trigger trg_profiles_updated
  before update on profiles
  for each row execute function set_updated_at();

-- 회원가입 시 프로필 자동 생성
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4),
    split_part(new.email, '@', 1)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── 4) categories ──────────────────────────────────────────
create table if not exists categories (
  id       uuid primary key default gen_random_uuid(),
  name     text unique not null,
  position int not null default 0
);

-- ── 5) recipes ─────────────────────────────────────────────
create table if not exists recipes (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  category_id       uuid references categories(id) on delete set null,
  title             text not null,
  summary           text,
  cover_image_url   text,
  servings          int check (servings is null or servings > 0),
  cook_time_minutes int check (cook_time_minutes is null or cook_time_minutes >= 0),
  difficulty        difficulty_level,
  visibility        recipe_visibility not null default 'private',
  share_slug        text unique,
  forked_from_id    uuid references recipes(id) on delete set null,
  view_count        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
drop trigger if exists trg_recipes_updated on recipes;
create trigger trg_recipes_updated
  before update on recipes
  for each row execute function set_updated_at();

-- ── 6) ingredients ─────────────────────────────────────────
create table if not exists ingredients (
  id        uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  name      text not null,
  amount    text,
  unit      text,
  position  int not null default 0
);

-- ── 7) steps ───────────────────────────────────────────────
create table if not exists steps (
  id            uuid primary key default gen_random_uuid(),
  recipe_id     uuid not null references recipes(id) on delete cascade,
  step_no       int not null,
  instruction   text not null,
  image_url     text,
  timer_seconds int,
  unique (recipe_id, step_no)
);

-- ── 8) reference_links ─────────────────────────────────────
create table if not exists reference_links (
  id            uuid primary key default gen_random_uuid(),
  recipe_id     uuid not null references recipes(id) on delete cascade,
  url           text not null,
  title         text,
  thumbnail_url text,
  position      int not null default 0
);

-- ── 9) recipe_images ───────────────────────────────────────
create table if not exists recipe_images (
  id        uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  image_url text not null,
  position  int not null default 0
);

-- ── 10) tags & recipe_tags ─────────────────────────────────
create table if not exists tags (
  id   uuid primary key default gen_random_uuid(),
  name text unique not null
);
create table if not exists recipe_tags (
  recipe_id uuid references recipes(id) on delete cascade,
  tag_id    uuid references tags(id) on delete cascade,
  primary key (recipe_id, tag_id)
);

-- ── 11) favorites ──────────────────────────────────────────
create table if not exists favorites (
  user_id    uuid references profiles(id) on delete cascade,
  recipe_id  uuid references recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

-- =============================================================
-- 인덱스
-- =============================================================
create index if not exists idx_recipes_user       on recipes(user_id);
create index if not exists idx_recipes_category   on recipes(category_id);
create index if not exists idx_recipes_visibility on recipes(visibility) where visibility <> 'private';
create index if not exists idx_recipes_created     on recipes(created_at desc);
create index if not exists idx_ingredients_recipe on ingredients(recipe_id);
create index if not exists idx_steps_recipe       on steps(recipe_id);
create index if not exists idx_reflinks_recipe    on reference_links(recipe_id);
create index if not exists idx_images_recipe      on recipe_images(recipe_id);
create index if not exists idx_recipe_tags_tag    on recipe_tags(tag_id);
create index if not exists idx_favorites_recipe   on favorites(recipe_id);
create index if not exists idx_recipes_title_trgm on recipes using gin (title gin_trgm_ops);

-- =============================================================
-- RLS (행 단위 보안)
-- =============================================================
alter table profiles        enable row level security;
alter table recipes         enable row level security;
alter table ingredients     enable row level security;
alter table steps           enable row level security;
alter table reference_links enable row level security;
alter table recipe_images   enable row level security;
alter table tags            enable row level security;
alter table recipe_tags     enable row level security;
alter table favorites       enable row level security;
alter table categories      enable row level security;

-- profiles
drop policy if exists "profiles read"   on profiles;
drop policy if exists "profiles update" on profiles;
create policy "profiles read"   on profiles for select using (true);
create policy "profiles update" on profiles for update using (auth.uid() = id);

-- categories
drop policy if exists "categories read" on categories;
create policy "categories read" on categories for select using (true);

-- recipes
drop policy if exists "recipes select" on recipes;
drop policy if exists "recipes insert" on recipes;
drop policy if exists "recipes update" on recipes;
drop policy if exists "recipes delete" on recipes;
create policy "recipes select" on recipes for select
  using (user_id = auth.uid() or visibility = 'public');
create policy "recipes insert" on recipes for insert
  with check (user_id = auth.uid());
create policy "recipes update" on recipes for update
  using (user_id = auth.uid());
create policy "recipes delete" on recipes for delete
  using (user_id = auth.uid());

-- ingredients
drop policy if exists "ingredients select" on ingredients;
drop policy if exists "ingredients write"  on ingredients;
create policy "ingredients select" on ingredients for select using (
  exists (select 1 from recipes r where r.id = recipe_id
          and (r.user_id = auth.uid() or r.visibility = 'public')));
create policy "ingredients write" on ingredients for all using (
  exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid()))
  with check (
  exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid()));

-- steps
drop policy if exists "steps select" on steps;
drop policy if exists "steps write"  on steps;
create policy "steps select" on steps for select using (
  exists (select 1 from recipes r where r.id = recipe_id
          and (r.user_id = auth.uid() or r.visibility = 'public')));
create policy "steps write" on steps for all using (
  exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid()))
  with check (
  exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid()));

-- reference_links
drop policy if exists "reflinks select" on reference_links;
drop policy if exists "reflinks write"  on reference_links;
create policy "reflinks select" on reference_links for select using (
  exists (select 1 from recipes r where r.id = recipe_id
          and (r.user_id = auth.uid() or r.visibility = 'public')));
create policy "reflinks write" on reference_links for all using (
  exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid()))
  with check (
  exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid()));

-- recipe_images
drop policy if exists "images select" on recipe_images;
drop policy if exists "images write"  on recipe_images;
create policy "images select" on recipe_images for select using (
  exists (select 1 from recipes r where r.id = recipe_id
          and (r.user_id = auth.uid() or r.visibility = 'public')));
create policy "images write" on recipe_images for all using (
  exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid()))
  with check (
  exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid()));

-- tags
drop policy if exists "tags read"   on tags;
drop policy if exists "tags insert" on tags;
create policy "tags read"   on tags for select using (true);
create policy "tags insert" on tags for insert with check (auth.uid() is not null);

-- recipe_tags
drop policy if exists "recipe_tags select" on recipe_tags;
drop policy if exists "recipe_tags write"  on recipe_tags;
create policy "recipe_tags select" on recipe_tags for select using (
  exists (select 1 from recipes r where r.id = recipe_id
          and (r.user_id = auth.uid() or r.visibility = 'public')));
create policy "recipe_tags write" on recipe_tags for all using (
  exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid()))
  with check (
  exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid()));

-- favorites
drop policy if exists "favorites select" on favorites;
drop policy if exists "favorites write"  on favorites;
create policy "favorites select" on favorites for select using (user_id = auth.uid());
create policy "favorites write"  on favorites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =============================================================
-- RPC 함수 (공유 슬러그 조회 / 조회수 증가)
-- =============================================================
create or replace function get_recipe_by_slug(p_slug text)
returns setof recipes
language sql security definer set search_path = public as $$
  select * from recipes
  where share_slug = p_slug and visibility <> 'private';
$$;

create or replace function increment_recipe_view(p_id uuid)
returns void
language sql security definer set search_path = public as $$
  update recipes set view_count = view_count + 1 where id = p_id;
$$;

grant execute on function get_recipe_by_slug(text) to anon, authenticated;
grant execute on function increment_recipe_view(uuid) to anon, authenticated;

-- =============================================================
-- 카테고리 시드 (앱 카테고리 칩과 동일)
-- =============================================================
insert into categories (name, position) values
  ('한식', 1), ('양식', 2), ('중식', 3), ('일식', 4),
  ('디저트/베이킹', 5), ('밑반찬', 6), ('국/찌개', 7),
  ('면/파스타', 8), ('음료/차', 9), ('기타', 10)
on conflict (name) do nothing;
