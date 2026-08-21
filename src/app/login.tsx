import { USE_MOCK } from '@/lib/config';
import { repo } from '@/lib/repo';
import { colors, fonts, radius, spacing } from '@/theme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 데모 모드: 서버 없이 바로 입장
  async function startDemo() {
    await repo.signInDemo();
    router.replace('/(tabs)');
  }

  // 실모드: 소셜 로그인 (구글/카카오)
  async function onOAuth(provider: 'google' | 'kakao') {
    setLoading(true);
    try {
      const authApi = require('@/lib/api/auth');
      await authApi.signInWithOAuth(provider);
      // 성공 시 루트 인증 게이트가 자동으로 탭 화면으로 이동
    } catch (e: any) {
      Alert.alert('로그인 실패', e?.message ?? '다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  // 실모드: 이메일 로그인 / 회원가입 (버튼별로 호출)
  async function submitEmail(action: 'signin' | 'signup') {
    if (!email.trim() || !password)
      return Alert.alert('이메일과 비밀번호를 입력해주세요.');
    if (password.length < 6)
      return Alert.alert('비밀번호는 6자 이상이어야 합니다.');
    setLoading(true);
    try {
      const authApi = require('@/lib/api/auth');
      if (action === 'signin') {
        await authApi.signInWithEmail(email.trim(), password);
        // 로그인 성공 → 루트의 인증 게이트가 자동으로 탭 화면으로 이동
      } else {
        const data = await authApi.signUpWithEmail(email.trim(), password);
        if (!data?.session) {
          Alert.alert(
            '가입 완료',
            '이메일 인증이 켜져 있으면 메일함을 확인한 뒤 로그인해주세요.',
          );
        }
        // 인증이 꺼져 있으면 세션이 바로 생겨 게이트가 이동시킴
      }
    } catch (e: any) {
      Alert.alert(
        action === 'signin' ? '로그인 실패' : '회원가입 실패',
        e?.message ?? '다시 시도해주세요.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/images/login-logo.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>나만의 끼니를 기록하다</Text>
        </View>

        {USE_MOCK ? (
          // ── 데모 모드 (Supabase 미연결) ──
          <View style={styles.buttons}>
            <Pressable style={[styles.btn, styles.primary]} onPress={startDemo}>
              <Text style={styles.primaryText}>데모로 시작하기</Text>
            </Pressable>
            <Text style={styles.note}>
              지금은 데모 모드예요. Supabase를 연결하면 로그인·저장이 켜집니다.
            </Text>
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
            <Pressable
              style={[styles.btn, styles.primary, loading && { opacity: 0.6 }]}
              disabled={loading}
              onPress={() => submitEmail('signin')}
            >
              <Text style={styles.primaryText}>
                {loading ? '처리 중…' : '로그인'}
              </Text>
            </Pressable>

            <View style={styles.divRow}>
              <View style={styles.divLine} />
              <Text style={styles.divText}>또는</Text>
              <View style={styles.divLine} />
            </View>

            {/* 카카오는 이메일 동의항목 API 검수 승인 후 아래 주석을 해제하면 됨
            <Pressable style={[styles.btn, styles.kakao, loading && { opacity: 0.6 }]} disabled={loading} onPress={() => onOAuth('kakao')}>
              <Ionicons name="chatbubble" size={17} color="#191600" />
              <Text style={styles.kakaoText}>카카오로 계속하기</Text>
            </Pressable>
            */}
            <Pressable
              style={[styles.btn, styles.social, loading && { opacity: 0.6 }]}
              disabled={loading}
              onPress={() => onOAuth('google')}
            >
              <Image
                source={require('../../assets/images/google-g.png')}
                style={{ width: 18, height: 18 }}
              />
              <Text style={styles.socialText}>Google로 계속하기</Text>
            </Pressable>

            <Pressable
              style={styles.switchRow}
              onPress={() => router.push('/signup')}
            >
              <Text style={styles.switchText}>
                아직 회원이 아니신가요?{' '}
                <Text style={{ fontFamily: fonts.bodyBold }}>회원가입</Text>
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logoWrap: { alignItems: 'center', marginBottom: spacing.xl * 2 },
  logoImg: { width: 168, height: 92 },
  tagline: {
    fontFamily: fonts.body,
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: 15,
  },
  buttons: { gap: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.card,
  },
  btn: { paddingVertical: 14, borderRadius: radius.md, alignItems: 'center' },
  primary: { backgroundColor: colors.primary },
  primaryText: {
    fontFamily: fonts.bodyBold,
    color: colors.white,
    fontSize: 16,
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  outlineText: {
    fontFamily: fonts.bodyBold,
    color: colors.primary,
    fontSize: 16,
  },
  switchRow: { alignItems: 'center', paddingVertical: spacing.md },
  switchText: {
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
    fontSize: 14,
  },
  divRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  divLine: { flex: 1, height: 1, backgroundColor: colors.border },
  divText: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 12 },
  social: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  socialText: {
    fontFamily: fonts.bodyMedium,
    color: colors.text,
    fontSize: 15,
  },
  kakao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE500',
  },
  kakaoText: { fontFamily: fonts.bodyMedium, color: '#191600', fontSize: 15 },
  note: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
