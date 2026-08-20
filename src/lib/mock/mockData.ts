// =============================================================
// 데모 모드용 초기 데이터
// =============================================================
import type { RecipeDetail, Category } from '../../types/database';

export const DEMO_USER_ID = 'demo-user';

export const mockCategories: Category[] = [
  { id: 'c1', name: '한식', position: 1 },
  { id: 'c2', name: '양식', position: 2 },
  { id: 'c3', name: '디저트/베이킹', position: 3 },
  { id: 'c4', name: '면/파스타', position: 4 },
  { id: 'c5', name: '밑반찬', position: 5 },
];

function now() {
  return new Date().toISOString();
}

export function seedRecipes(): RecipeDetail[] {
  return [
    {
      id: 'r1',
      user_id: DEMO_USER_ID,
      category_id: 'c1',
      title: '김치볶음밥',
      summary: '남은 김치로 뚝딱 만드는 한 그릇',
      cover_image_url: null,
      servings: 1,
      cook_time_minutes: 15,
      difficulty: 'easy',
      visibility: 'private',
      share_slug: null,
      forked_from_id: null,
      view_count: 0,
      created_at: now(),
      updated_at: now(),
      category: mockCategories[0],
      ingredients: [
        { id: 'i1', recipe_id: 'r1', name: '밥', amount: '1', unit: '공기', position: 0 },
        { id: 'i2', recipe_id: 'r1', name: '김치', amount: '1', unit: '컵', position: 1 },
        { id: 'i3', recipe_id: 'r1', name: '참기름', amount: '1', unit: '큰술', position: 2 },
        { id: 'i4', recipe_id: 'r1', name: '계란', amount: '1', unit: '개', position: 3 },
      ],
      steps: [
        { id: 's1', recipe_id: 'r1', step_no: 1, instruction: '팬에 기름을 두르고 김치를 볶는다.', image_url: null, timer_seconds: null },
        { id: 's2', recipe_id: 'r1', step_no: 2, instruction: '밥을 넣고 김치와 함께 볶는다.', image_url: null, timer_seconds: 180 },
        { id: 's3', recipe_id: 'r1', step_no: 3, instruction: '참기름을 두르고, 계란 프라이를 올려 마무리.', image_url: null, timer_seconds: null },
      ],
      reference_links: [
        { id: 'l1', recipe_id: 'r1', url: 'https://youtu.be/example', title: '참고 영상', thumbnail_url: null, position: 0 },
      ],
      images: [],
      tags: [
        { id: 't1', name: '자취요리' },
        { id: 't2', name: '한그릇' },
      ],
    },
    {
      id: 'r2',
      user_id: DEMO_USER_ID,
      category_id: 'c4',
      title: '알리오 올리오',
      summary: '재료 4개로 완성하는 기본 파스타',
      cover_image_url: null,
      servings: 2,
      cook_time_minutes: 20,
      difficulty: 'medium',
      visibility: 'private',
      share_slug: null,
      forked_from_id: null,
      view_count: 0,
      created_at: now(),
      updated_at: now(),
      category: mockCategories[3],
      ingredients: [
        { id: 'i5', recipe_id: 'r2', name: '스파게티', amount: '180', unit: 'g', position: 0 },
        { id: 'i6', recipe_id: 'r2', name: '마늘', amount: '5', unit: '쪽', position: 1 },
        { id: 'i7', recipe_id: 'r2', name: '올리브유', amount: '4', unit: '큰술', position: 2 },
        { id: 'i8', recipe_id: 'r2', name: '페페론치노', amount: '약간', unit: null, position: 3 },
      ],
      steps: [
        { id: 's4', recipe_id: 'r2', step_no: 1, instruction: '면을 소금 넣은 물에 삶는다.', image_url: null, timer_seconds: 480 },
        { id: 's5', recipe_id: 'r2', step_no: 2, instruction: '올리브유에 편 썬 마늘을 약불로 볶는다.', image_url: null, timer_seconds: null },
        { id: 's6', recipe_id: 'r2', step_no: 3, instruction: '면수와 면을 넣고 유화시켜 완성.', image_url: null, timer_seconds: null },
      ],
      reference_links: [],
      images: [],
      tags: [{ id: 't3', name: '파스타' }],
    },
  ];
}
