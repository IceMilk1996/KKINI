import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { repo } from '@/lib/repo';
import { USE_MOCK } from '@/lib/config';
import { colors, spacing, radius, fonts } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 데모 모드: 서버 없이 바로 입장
  async function startDemo() {
    await repo.signInDemo();
    router.replace('/(tabs)');
  }

  // 실모드: 이메일 로그인/회원가입
  async function submitEmail() {
    if (!email.trim() || !password) return Alert.alert('이메일과 비밀번호를 입력해주세요.');
    if (password.length < 6) return Alert.alert('비밀번호는 6자 이상이어야 합니다.');
    setLoading(true);
    try {
      const authApi = require('@/lib/api/auth');
      if (mode === 'signin') {
        await authApi.signInWithEmail(email.trim(), password);
        // 로그인 성공 → 루트의 인증 게이트가 자동으로 탭 화면으로 이동
      } else {
        const data = await authApi.signUpWithEmail(email.trim(), password);
        if (!data?.session) {
          Alert.alert('가입 완료', '이메일 인증이 켜져 있으면 메일함을 확인한 뒤 로그인해주세요.');
          setMode('signin');
        }
        // 인증이 꺼져 있으면 세션이 바로 생겨 게이트가 이동시킴
      }
    } catch (e: any) {
      Alert.alert(mode === 'signin' ? '로그인 실패' : '회원가입 실패', e?.message ?? '다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>끼니</Text>
          <Text style={styles.tagline}>매일의 끼니를 기록하다</Text>
        </View>

        {USE_MOCK ? (
          // ── 데모 모드 (Supabase 미연결) ──
          <View style={styles.buttons}>
            <Pressable style={[styles.btn, styles.primary]} onPress={startDemo}>
              <Text style={styles.primaryText}>데모로 시작하기</Text>
            </Pressable>
            <Text style={styles.note}>지금은 데모 모드예요. Supabase를 연결하면 로그인·저장이 켜집니다.</Text>
          </View>
        ) : (
          // ── 실모드 (이메일 인증) ──
          <View style={styles.buttons}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="이메일"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호 (6자 이상)"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
            <Pressable style={[styles.btn, styles.primary, loading && { opacity: 0.6 }]} disabled={loading} onPress={submitEmail}>
              <Text style={styles.primaryText}>{loading ? '처리 중…' : mode === 'signin' ? '로그인' : '회원가입'}</Text>
            </Pressable>
            <Pressable style={styles.switchRow} onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
              <Text style={styles.switchText}>
                {mode === 'signin' ? '계정이 없나요? 회원가입' : '이미 계정이 있나요? 로그인'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: spacing.xl },
  logoWrap: { alignItems: 'center', marginBottom: spacing.xl * 2 },
  logo: { fontSize: 52, fontFamily: fonts.logo, color: colors.primary },
  tagline: { fontFamily: fonts.body, marginTop: spacing.sm, color: colors.textMuted, fontSize: 15 },
  buttons: { gap: spacing.md },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: 14,
    fontFamily: fonts.body, fontSize: 15, color: colors.text, backgroundColor: colors.card,
  },
  btn: { paddingVertical: 14, borderRadius: radius.md, alignItems: 'center' },
  primary: { backgroundColor: colors.primary },
  primaryText: { fontFamily: fonts.bodyBold, color: colors.white, fontSize: 16 },
  switchRow: { alignItems: 'center', paddingVertical: spacing.sm },
  switchText: { fontFamily: fonts.bodyMedium, color: colors.primary, fontSize: 14 },
  note: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: spacing.sm },
});
