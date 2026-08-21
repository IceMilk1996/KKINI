import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, fonts } from '@/theme';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSignup() {
    if (!email.trim() || !password) return Alert.alert('이메일과 비밀번호를 입력해주세요.');
    if (password.length < 6) return Alert.alert('비밀번호는 6자 이상이어야 합니다.');
    if (password !== password2) return Alert.alert('비밀번호가 서로 달라요.', '두 번 입력한 비밀번호를 확인해주세요.');
    setLoading(true);
    try {
      const authApi = require('@/lib/api/auth');
      const data = await authApi.signUpWithEmail(email.trim(), password);
      if (!data?.session) {
        // 이메일 인증이 켜져 있으면 세션이 없음 → 메일 확인 후 로그인
        Alert.alert('가입 완료', '메일함을 확인해 인증한 뒤 로그인해주세요.', [
          { text: '확인', onPress: () => router.replace('/login') },
        ]);
      }
      // 인증이 꺼져 있으면 세션이 바로 생겨 루트 게이트가 탭으로 이동
    } catch (e: any) {
      Alert.alert('회원가입 실패', e?.message ?? '다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <View style={styles.logoWrap}>
          <Image source={require('../../assets/images/login-logo.png')} style={styles.logoImg} resizeMode="contain" />
          <Text style={styles.tagline}>끼니와 함께 시작하기</Text>
        </View>

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
          <TextInput
            style={styles.input}
            value={password2}
            onChangeText={setPassword2}
            placeholder="비밀번호 확인"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />
          <Pressable style={[styles.btn, styles.primary, loading && { opacity: 0.6 }]} disabled={loading} onPress={onSignup}>
            <Text style={styles.primaryText}>{loading ? '처리 중…' : '회원가입'}</Text>
          </Pressable>

          <Pressable style={styles.switchRow} onPress={() => router.replace('/login')}>
            <Text style={styles.switchText}>이미 계정이 있으신가요? <Text style={{ fontFamily: fonts.bodyBold }}>로그인</Text></Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: spacing.xl },
  logoWrap: { alignItems: 'center', marginBottom: spacing.xl * 2 },
  logoImg: { width: 168, height: 92 },
  tagline: { fontFamily: fonts.body, marginTop: spacing.md, color: colors.textMuted, fontSize: 15 },
  buttons: { gap: spacing.md },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: 14,
    fontFamily: fonts.body, fontSize: 15, color: colors.text, backgroundColor: colors.card,
  },
  btn: { paddingVertical: 14, borderRadius: radius.md, alignItems: 'center' },
  primary: { backgroundColor: colors.primary },
  primaryText: { fontFamily: fonts.bodyBold, color: colors.white, fontSize: 16 },
  switchRow: { alignItems: 'center', paddingVertical: spacing.md },
  switchText: { fontFamily: fonts.bodyMedium, color: colors.textMuted, fontSize: 14 },
});
