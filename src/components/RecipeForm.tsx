import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { repo } from '@/lib/repo';
import type { IngredientInput, Category, RecipeDetail, RecipeInput } from '@/types/database';
import { colors, spacing, radius, fonts } from '@/theme';

type StepForm = { instruction: string; timerMin: string };
type LinkForm = { url: string; title: string };
type Cover = { uri: string; base64?: string | null; contentType?: string | null };

type Props = {
  initial?: RecipeDetail | null;   // 있으면 수정 모드
  submitLabel: string;             // 버튼 문구
  onSubmit: (input: RecipeInput) => Promise<void>;
  resetAfterSubmit?: boolean;      // 작성(탭)에서 저장 후 폼 초기화
};

const emptyIng = (): IngredientInput => ({ name: '', amount: '', unit: '' });
const emptyStep = (): StepForm => ({ instruction: '', timerMin: '' });
const emptyLink = (): LinkForm => ({ url: '', title: '' });

export default function RecipeForm({ initial, submitLabel, onSubmit, resetAfterSubmit }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [summary, setSummary] = useState(initial?.summary ?? '');
  const [cookTime, setCookTime] = useState(initial?.cook_time_minutes != null ? String(initial.cook_time_minutes) : '');
  const [servings, setServings] = useState(initial?.servings != null ? String(initial.servings) : '');

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(initial?.category_id ?? null);

  // 대표 사진 (수정 모드면 기존 URL로 미리 채움)
  const [cover, setCover] = useState<Cover | null>(
    initial?.cover_image_url ? { uri: initial.cover_image_url } : null
  );

  const [ingredients, setIngredients] = useState<IngredientInput[]>(
    initial?.ingredients?.length
      ? initial.ingredients.map((i) => ({ name: i.name, amount: i.amount ?? '', unit: i.unit ?? '' }))
      : [emptyIng()]
  );
  const [steps, setSteps] = useState<StepForm[]>(
    initial?.steps?.length
      ? initial.steps.map((s) => ({ instruction: s.instruction, timerMin: s.timer_seconds ? String(Math.round(s.timer_seconds / 60)) : '' }))
      : [emptyStep()]
  );

  // 선택 항목 (평소엔 접힘, 수정 모드에서 값 있으면 펼침)
  const initLinks = initial?.reference_links ?? [];
  const initTags = initial?.tags ?? [];
  const [showLinks, setShowLinks] = useState(initLinks.length > 0);
  const [showTags, setShowTags] = useState(initTags.length > 0);
  const [links, setLinks] = useState<LinkForm[]>(
    initLinks.length ? initLinks.map((l) => ({ url: l.url, title: l.title ?? '' })) : [emptyLink()]
  );
  const [tags, setTags] = useState<string[]>(initTags.map((t) => t.name));
  const [tagInput, setTagInput] = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    repo.listCategories().then(setCategories).catch(() => {});
  }, []);

  const upIng = (i: number, p: Partial<IngredientInput>) =>
    setIngredients((prev) => prev.map((x, idx) => (idx === i ? { ...x, ...p } : x)));
  const upStep = (i: number, p: Partial<StepForm>) =>
    setSteps((prev) => prev.map((x, idx) => (idx === i ? { ...x, ...p } : x)));
  const upLink = (i: number, p: Partial<LinkForm>) =>
    setLinks((prev) => prev.map((x, idx) => (idx === i ? { ...x, ...p } : x)));
  function addTag() {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput('');
  }

  async function pickCover() {
    // 네이티브 모듈이 빌드에 포함됐는지 먼저 확인 (없으면 require가 던지므로 미리 차단)
    const { requireOptionalNativeModule } = require('expo-modules-core');
    if (!requireOptionalNativeModule('ExponentImagePicker')) {
      Alert.alert('사진 기능 준비 중', '앱을 한 번 다시 빌드하면 사진 추가를 쓸 수 있어요.');
      return;
    }
    const ImagePicker: typeof import('expo-image-picker') = require('expo-image-picker');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('사진 접근 권한이 필요해요', '설정에서 사진 접근을 허용해주세요.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });
    if (!res.canceled && res.assets?.[0]) {
      const a = res.assets[0];
      setCover({ uri: a.uri, base64: a.base64, contentType: a.mimeType ?? 'image/jpeg' });
    }
  }

  function resetForm() {
    setTitle(''); setSummary(''); setCookTime(''); setServings(''); setCategoryId(null); setCover(null);
    setIngredients([emptyIng()]);
    setSteps([emptyStep()]);
    setLinks([emptyLink()]); setTags([]); setShowLinks(false); setShowTags(false);
  }

  async function handleSubmit() {
    if (!title.trim()) return Alert.alert('제목을 입력해주세요.');
    setSaving(true);
    try {
      // 대표 사진 처리: 새로 고른 사진(base64 있음)이면 업로드, 기존 URL이면 그대로
      let coverUrl: string | null = null;
      if (cover) {
        coverUrl = cover.base64 ? await repo.uploadImage(cover) : cover.uri;
      }
      await onSubmit({
        title: title.trim(),
        summary: summary.trim() || null,
        cover_image_url: coverUrl,
        category_id: categoryId,
        cook_time_minutes: cookTime ? parseInt(cookTime, 10) : null,
        servings: servings ? parseInt(servings, 10) : null,
        ingredients: ingredients.filter((i) => i.name.trim()),
        steps: steps.filter((s) => s.instruction.trim()).map((s) => ({
          instruction: s.instruction.trim(),
          timer_seconds: s.timerMin ? parseInt(s.timerMin, 10) * 60 : null,
        })),
        reference_links: links.filter((l) => l.url.trim()).map((l) => ({ url: l.url.trim(), title: l.title.trim() || null })),
        tags,
      });
      if (resetAfterSubmit) resetForm();
    } catch (e: any) {
      Alert.alert('저장 실패', e?.message ?? '다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}>

        {/* 대표 사진 */}
        {cover ? (
          <View style={styles.coverWrap}>
            <Image source={{ uri: cover.uri }} style={styles.coverImg} contentFit="cover" />
            <Pressable style={styles.coverEdit} onPress={pickCover}>
              <Ionicons name="camera" size={16} color={colors.white} />
              <Text style={styles.coverEditText}>변경</Text>
            </Pressable>
            <Pressable style={styles.coverRemove} onPress={() => setCover(null)}>
              <Ionicons name="close" size={16} color={colors.white} />
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.coverAdd} onPress={pickCover}>
            <Ionicons name="camera-outline" size={26} color={colors.primary} />
            <Text style={styles.coverAddText}>대표 사진 추가</Text>
          </Pressable>
        )}

        {/* 기본 정보 */}
        <View style={styles.card}>
          <TextInput style={styles.field} value={title} onChangeText={setTitle} placeholder="요리명" placeholderTextColor={colors.textMuted} />
          <View style={styles.divider} />
          <TextInput style={styles.field} value={summary} onChangeText={setSummary} placeholder="한 줄 소개 (선택)" placeholderTextColor={colors.textMuted} />
        </View>

        {/* 카테고리 */}
        <Text style={styles.section}>카테고리</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: 2 }}>
          {categories.map((c) => {
            const on = categoryId === c.id;
            return (
              <Pressable key={c.id} onPress={() => setCategoryId(on ? null : c.id)} style={[styles.chip, on && styles.chipOn]}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 시간 / 인분 */}
        <View style={[styles.card, { flexDirection: 'row', marginTop: spacing.md }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.miniLabel}>조리시간(분)</Text>
            <TextInput style={styles.fieldTight} value={cookTime} onChangeText={setCookTime} keyboardType="number-pad" placeholder="15" placeholderTextColor={colors.textMuted} />
          </View>
          <View style={styles.vDivider} />
          <View style={{ flex: 1 }}>
            <Text style={styles.miniLabel}>인분</Text>
            <TextInput style={styles.fieldTight} value={servings} onChangeText={setServings} keyboardType="number-pad" placeholder="1" placeholderTextColor={colors.textMuted} />
          </View>
        </View>

        {/* 재료 */}
        <Text style={styles.section}>재료</Text>
        <View style={styles.card}>
          {ingredients.map((ing, i) => (
            <View key={i}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.rowLine}>
                <TextInput style={[styles.fieldFlat, { flex: 2 }]} value={ing.name ?? ''} onChangeText={(t) => upIng(i, { name: t })} placeholder="재료" placeholderTextColor={colors.textMuted} />
                <TextInput style={[styles.fieldFlat, { flex: 1, textAlign: 'right' }]} value={ing.amount ?? ''} onChangeText={(t) => upIng(i, { amount: t })} placeholder="수량" placeholderTextColor={colors.textMuted} />
                <TextInput style={[styles.fieldFlat, { width: 60, textAlign: 'right' }]} value={ing.unit ?? ''} onChangeText={(t) => upIng(i, { unit: t })} placeholder="단위" placeholderTextColor={colors.textMuted} />
              </View>
            </View>
          ))}
        </View>
        <Pressable style={styles.addRow} onPress={() => setIngredients((p) => [...p, emptyIng()])}>
          <Ionicons name="add-circle-outline" size={18} color={colors.primary} /><Text style={styles.addText}>재료 추가</Text>
        </Pressable>

        {/* 조리 순서 */}
        <Text style={styles.section}>조리 순서</Text>
        <View style={styles.card}>
          {steps.map((s, i) => (
            <View key={i}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.rowLine}>
                <View style={styles.stepNo}><Text style={styles.stepNoText}>{i + 1}</Text></View>
                <TextInput style={[styles.fieldFlat, { flex: 1 }]} value={s.instruction} onChangeText={(t) => upStep(i, { instruction: t })} placeholder="조리 방법" placeholderTextColor={colors.textMuted} multiline />
                <View style={styles.timerInline}>
                  <TextInput style={styles.timerInput} value={s.timerMin} onChangeText={(t) => upStep(i, { timerMin: t.replace(/[^0-9]/g, '') })} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textMuted} />
                  <Text style={styles.timerSuffix}>분</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
        <Pressable style={styles.addRow} onPress={() => setSteps((p) => [...p, emptyStep()])}>
          <Ionicons name="add-circle-outline" size={18} color={colors.primary} /><Text style={styles.addText}>단계 추가</Text>
        </Pressable>

        {/* 선택 항목: 참고 링크 */}
        {!showLinks ? (
          <Pressable style={styles.optionRow} onPress={() => setShowLinks(true)}>
            <Ionicons name="link-outline" size={17} color={colors.textMuted} />
            <Text style={styles.optionText}>참고 링크 추가</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.border} style={{ marginLeft: 'auto' }} />
          </Pressable>
        ) : (
          <>
            <Text style={styles.section}>참고 링크</Text>
            <View style={styles.card}>
              {links.map((l, i) => (
                <View key={i}>
                  {i > 0 && <View style={styles.divider} />}
                  <View style={styles.rowLine}>
                    <TextInput style={[styles.fieldFlat, { flex: 2 }]} value={l.url} onChangeText={(t) => upLink(i, { url: t })} placeholder="https://..." placeholderTextColor={colors.textMuted} autoCapitalize="none" keyboardType="url" />
                    <TextInput style={[styles.fieldFlat, { flex: 1 }]} value={l.title} onChangeText={(t) => upLink(i, { title: t })} placeholder="제목(선택)" placeholderTextColor={colors.textMuted} />
                  </View>
                </View>
              ))}
            </View>
            <Pressable style={styles.addRow} onPress={() => setLinks((p) => [...p, emptyLink()])}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} /><Text style={styles.addText}>링크 추가</Text>
            </Pressable>
          </>
        )}

        {/* 선택 항목: 태그 */}
        {!showTags ? (
          <Pressable style={styles.optionRow} onPress={() => setShowTags(true)}>
            <Ionicons name="pricetag-outline" size={17} color={colors.textMuted} />
            <Text style={styles.optionText}>태그 추가</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.border} style={{ marginLeft: 'auto' }} />
          </Pressable>
        ) : (
          <>
            <Text style={styles.section}>태그</Text>
            <View style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}>
              <TextInput style={[styles.fieldFlat, { flex: 1 }]} value={tagInput} onChangeText={setTagInput} placeholder="예: 자취요리" placeholderTextColor={colors.textMuted} onSubmitEditing={addTag} returnKeyType="done" />
              <Pressable onPress={addTag}><Text style={styles.tagAdd}>추가</Text></Pressable>
            </View>
            {tags.length > 0 && (
              <View style={styles.tagWrap}>
                {tags.map((t) => (
                  <Pressable key={t} style={styles.tagChip} onPress={() => setTags((p) => p.filter((x) => x !== t))}>
                    <Text style={styles.tagChipText}>#{t}</Text>
                    <Ionicons name="close" size={13} color={colors.primaryDark} />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}

        <Pressable style={[styles.saveBtn, saving && { opacity: 0.6 }]} disabled={saving} onPress={handleSubmit}>
          <Text style={styles.saveText}>{saving ? '저장 중…' : submitLabel}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  // 대표 사진
  coverAdd: {
    height: 150, borderRadius: radius.md, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: colors.primarySoft, borderStyle: 'dashed',
  },
  coverAddText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.primary },
  coverWrap: { height: 200, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surface },
  coverImg: { width: '100%', height: '100%' },
  coverEdit: {
    position: 'absolute', right: spacing.sm, bottom: spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill,
  },
  coverEditText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.white },
  coverRemove: {
    position: 'absolute', right: spacing.sm, top: spacing.sm,
    width: 28, height: 28, borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  // 카드 (테두리 없는 흰 그룹)
  card: {
    backgroundColor: colors.card, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: 4, marginTop: spacing.sm,
  },
  divider: { height: 1, backgroundColor: colors.border },
  vDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  field: { fontFamily: fonts.body, fontSize: 15, color: colors.text, paddingVertical: 14 },
  fieldTight: { fontFamily: fonts.body, fontSize: 15, color: colors.text, paddingVertical: 8, paddingBottom: 12 },
  fieldFlat: { fontFamily: fonts.body, fontSize: 15, color: colors.text, paddingVertical: 13 },
  rowLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  section: { fontFamily: fonts.display, fontSize: 16, color: colors.text, marginTop: spacing.xl, marginBottom: 2 },
  miniLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, paddingTop: 12 },
  // 카테고리 칩
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.primary },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  chipTextOn: { color: colors.white },
  // 단계
  stepNo: { width: 24, height: 24, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  stepNoText: { fontFamily: fonts.bodyBold, color: colors.white, fontSize: 12 },
  timerInline: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timerInput: { fontFamily: fonts.body, fontSize: 15, backgroundColor: colors.surface, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 6, width: 40, textAlign: 'center', color: colors.text },
  timerSuffix: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  // 추가 버튼
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.sm, marginLeft: 4 },
  addText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.primary },
  // 선택 항목 토글 행
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 16, marginTop: spacing.md,
  },
  optionText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.text },
  // 태그
  tagAdd: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.primary, paddingHorizontal: 6 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  tagChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.primarySoft, paddingLeft: 12, paddingRight: 8, paddingVertical: 6, borderRadius: radius.pill },
  tagChipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.primaryDark },
  // 저장
  saveBtn: { marginTop: spacing.xl * 1.5, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  saveText: { fontFamily: fonts.bodyBold, color: colors.white, fontSize: 16 },
});
