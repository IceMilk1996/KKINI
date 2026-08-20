// 화면이 사용하는 저장소 인터페이스 (mock/real 공통)
import type { Recipe, RecipeDetail, RecipeInput, Category } from '../../types/database';

export interface Repo {
  // 인증
  getUserId(): Promise<string | null>;
  signInDemo(): Promise<void>;
  signOut(): Promise<void>;

  // 레시피
  listMyRecipes(search?: string): Promise<Recipe[]>;
  getRecipe(id: string): Promise<RecipeDetail>;
  createRecipe(input: RecipeInput): Promise<string>;
  updateRecipe(id: string, input: RecipeInput): Promise<void>;
  deleteRecipe(id: string): Promise<void>;

  // 즐겨찾기
  isFavorited(id: string): Promise<boolean>;
  toggleFavorite(id: string): Promise<boolean>;

  // 메타
  listCategories(): Promise<Category[]>;
}
