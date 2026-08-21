// =============================================================
// 끼니 — 디자인 토큰 (따뜻하고 아기자기한 톤)
// =============================================================
export const colors = {
  bg: '#FFFBF6',        // 따뜻한 크림
  surface: '#F7EFE6',   // 부드러운 베이지
  card: '#FFFFFF',
  primary: '#BE5F3C',   // 로고색 (깊은 테라코타)
  primaryDark: '#9E4B2E',
  primarySoft: '#F6E6DB', // 테라코타 틴트 (썸네일·칩 배경)
  text: '#3B322B',      // 따뜻한 다크 브라운
  textMuted: '#9B8E82',
  border: '#F0E7DB',    // 아주 연한 경계
  danger: '#D9634C',
  white: '#FFFFFF',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };

// 부드러운 그림자 (아기자기한 카드 느낌)
export const shadow = {
  card: {
    shadowColor: '#B98A5E',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  fab: {
    shadowColor: '#9E4B2E',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
};

// 폰트 패밀리 — 로고만 Jua, 그 외 전부 나눔스퀘어
export const fonts = {
  logo: 'Jua_400Regular',              // "끼니" 로고 전용
  display: 'NanumSquare_ExtraBold',    // 제목·헤딩
  body: 'NanumSquare',                 // 본문
  bodyMedium: 'NanumSquare_Bold',      // 강조 본문
  bodyBold: 'NanumSquare_ExtraBold',   // 볼드
};

export const font = {
  title: { fontSize: 24, fontFamily: fonts.display, color: colors.text },
  h2: { fontSize: 19, fontFamily: fonts.display, color: colors.text },
  body: { fontSize: 15, fontFamily: fonts.body, color: colors.text },
  muted: { fontSize: 13, fontFamily: fonts.body, color: colors.textMuted },
};

// 카테고리별 이모지 + 색 (썸네일/뱃지에 사용)
type CatStyle = { emoji: string; tint: string; color: string };
const CAT: Record<string, CatStyle> = {
  '한식': { emoji: '🍚', tint: '#FDEEDF', color: '#E58A45' },
  '양식': { emoji: '🍝', tint: '#FCE9E2', color: '#E8794A' },
  '중식': { emoji: '🥟', tint: '#FBE6DE', color: '#DE6B44' },
  '일식': { emoji: '🍣', tint: '#FDEFE0', color: '#EDA157' },
  '디저트/베이킹': { emoji: '🧁', tint: '#FBE7EC', color: '#E38DA0' },
  '면/파스타': { emoji: '🍜', tint: '#FBF0DC', color: '#E4AE4C' },
  '밑반찬': { emoji: '🥗', tint: '#EEF5E2', color: '#8BB558' },
  '국/찌개': { emoji: '🍲', tint: '#FCE9E1', color: '#E17A4E' },
  '면/파스타 ': { emoji: '🍜', tint: '#FBF0DC', color: '#E4AE4C' },
  '음료/차': { emoji: '🍵', tint: '#E9F3EA', color: '#7FB07E' },
};
const DEFAULT_CAT: CatStyle = { emoji: '🍳', tint: colors.primarySoft, color: colors.primary };

export function categoryStyle(name?: string | null): CatStyle {
  if (!name) return DEFAULT_CAT;
  return CAT[name] ?? DEFAULT_CAT;
}
