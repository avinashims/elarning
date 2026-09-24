import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { colors, spacing } from '../constants/theme';
import { resetToMainApp } from '../navigation/navigationHelpers';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();

  const finishAuth = (userData) => {
    const tab = userData.role === 'TEACHER' || userData.role === 'ADMIN' ? 'Profile' : 'Learning';
    resetToMainApp(navigation, tab);
    return userData;
  };

  const handleGoogleSignIn = async (idToken) => {
    const userData = await loginWithGoogle(idToken, 'STUDENT');
    finishAuth(userData);
    return userData;
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter email and password.');
      return;
    }
    setLoading(true);
    try {
      const userData = await login(email.trim(), password);
      const tab = userData.role === 'TEACHER' || userData.role === 'ADMIN' ? 'Profile' : 'Learning';
      resetToMainApp(navigation, tab);
    } catch (err) {
      Alert.alert('Login failed', err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>Avi SkillStream</Text>
        <Text style={styles.title}>Log in to continue your learning journey</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="you@example.com"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
        />

        <Button title="Sign In" onPress={handleLogin} loading={loading} style={styles.btn} />

        <GoogleSignInButton onSuccess={handleGoogleSignIn} style={{ marginTop: spacing.sm }} />

        <Text style={styles.footer}>
          Don't have an account?{' '}
          <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
            Sign up
          </Text>
        </Text>

        <View style={styles.demo}>
          <Text style={styles.demoTitle}>Demo accounts</Text>
          <Text style={styles.demoText}>student@elearning.com / student123</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: 60 },
  logo: { fontSize: 32, textAlign: 'center', marginBottom: spacing.lg },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.xs, fontWeight: '500' },
  input: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    color: colors.text,
    marginBottom: spacing.md,
    fontSize: 15,
  },
  btn: { marginTop: spacing.sm },
  footer: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.lg, fontSize: 14 },
  link: { color: colors.primaryLight, fontWeight: '600' },
  demo: { marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  demoTitle: { textAlign: 'center', color: colors.textMuted, fontSize: 13, marginBottom: spacing.sm },
  demoText: { textAlign: 'center', color: colors.textMuted, fontSize: 12 },
});
