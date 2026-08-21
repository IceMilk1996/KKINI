// 화면이 사용하는 저장소 인터페이스 (mock/real 공통)
import type { Recipe, RecipeDetail, RecipeInput, Category } from '../../types/database';

export interface Repo {
  // 인증
  getUserId(): Promise<string | null>;
  signInDemo(): Promise<void>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;

  // 레시피
  listMyRecipes(search?: string): Promise<Recipe[]>;
  listFavoriteRecipes(): Promise<Recipe[]>;
  getRecipe(id: string): Promise<RecipeDetail>;
  createRecipe(input: RecipeInput): Promise<string>;
  updateRecipe(id: string, input: RecipeInput): Promise<void>;
  deleteRecipe(id: string): Promise<void>;

  // 공유
  shareRecipe(id: string): Promise<{ slug: string; url: string }>;
  unshareRecipe(id: string): Promise<void>;
  getRecipeBySlug(slug: string): Promise<RecipeDetail | null>;
  listSharedRecipes(): Promise<Recipe[]>;

  // 즐겨찾기
  isFavorited(id: string): Promise<boolean>;
  toggleFavorite(id: string): Promise<boolean>;

  // 이미지 업로드 (로컬 사진 → 저장소 URL)
  uploadImage(input: ImageUploadInput): Promise<string>;

  // 프로필
  getProfile(): Promise<ProfileInfo>;

  // 메타
  listCategories(): Promise<Category[]>;
}

export interface ProfileInfo {
  email: string | null;
  username: string | null;
  displayName: string | null;
}

export interface ImageUploadInput {
  uri: string;                 // 로컬 파일 uri (또는 이미 올라간 http URL)
  base64?: string | null;      // 새로 고른 사진이면 base64 존재
  contentType?: string | null; // 예: image/jpeg
}
