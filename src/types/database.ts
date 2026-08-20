// =============================================================
// 끼니 — DB 타입 정의
// DB 스키마(끼니_DB스키마_설계.md)와 1:1 대응
// =============================================================

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Visibility = 'private' | 'unlisted' | 'public';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  position: number;
}

export interface Recipe {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  summary: string | null;
  cover_image_url: string | null;
  servings: number | null;
  cook_time_minutes: number | null;
  difficulty: Difficulty | null;
  visibility: Visibility;
  share_slug: string | null;
  forked_from_id: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Ingredient {
  id: string;
  recipe_id: string;
  name: string;
  amount: string | null;
  unit: string | null;
  position: number;
}

export interface Step {
  id: string;
  recipe_id: string;
  step_no: number;
  instruction: string;
  image_url: string | null;
  timer_seconds: number | null;
}

export interface ReferenceLink {
  id: string;
  recipe_id: string;
  url: string;
  title: string | null;
  thumbnail_url: string | null;
  position: number;
}

export interface RecipeImage {
  id: string;
  recipe_id: string;
  image_url: string;
  position: number;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Favorite {
  user_id: string;
  recipe_id: string;
  created_at: string;
}

// ---- 조합 타입 (상세 화면에서 한 번에 다루는 형태) ----

export interface RecipeDetail extends Recipe {
  category: Category | null;
  ingredients: Ingredient[];
  steps: Step[];
  reference_links: ReferenceLink[];
  images: RecipeImage[];
  tags: Tag[];
}

// ---- 작성/수정 입력 타입 ----

export interface IngredientInput {
  name: string;
  amount?: string | null;
  unit?: string | null;
}

export interface StepInput {
  instruction: string;
  image_url?: string | null;
  timer_seconds?: number | null;
}

export interface ReferenceLinkInput {
  url: string;
  title?: string | null;
  thumbnail_url?: string | null;
}

export interface RecipeInput {
  title: string;
  summary?: string | null;
  cover_image_url?: string | null;
  category_id?: string | null;
  servings?: number | null;
  cook_time_minutes?: number | null;
  difficulty?: Difficulty | null;
  ingredients?: IngredientInput[];
  steps?: StepInput[];
  reference_links?: ReferenceLinkInput[];
  image_urls?: string[];
  tags?: string[]; // 태그 이름 목록
}
