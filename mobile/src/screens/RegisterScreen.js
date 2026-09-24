import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { colors, spacing } from '../constants/theme';
import { resetToMainApp } from '../navigation/navigationHelpers';
import GoogleSignInButton from '../components/GoogleSignInButton';

function registrationErrorMessage(err) {
  const data = err.response?.data;
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.join('\n');
  }
  return data?.message || 'Could not create account';
}

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();

  const finishAuth = (userData) => {
    const tab = userData.role === 'TEACHER' ? 'Profile' : 'Learning';
    resetToMainApp(navigation, tab);
    return userData;
  };

  const handleGoogleSignIn = async (idToken) => {
    const userData = await loginWithGoogle(idToken, form.role);
    finishAuth(userData);
    return userData;
  };

  const handleRegister = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      Alert.alert('Missing details', 'Enter your name, email, and password.');
      return;
    }
    setLoading(true);
    try {
      const userData = await register(form.name.trim(), form.email.trim(), form.password, form.role);
      const tab = userData.role === 'TEACHER' ? 'Profile' : 'Learning';
      resetToMainApp(navigation, tab);
    } catch (err) {
      Alert.alert('Registration failed', registrationErrorMessage(err));
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
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start learning or teaching</Text>

        <Text style={styles.label}>I am a</Text>
        <View style={styles.roleRow}>
          {[
            { value: 'STUDENT', label: 'Student' },
            { value: 'TEACHER', label: 'Teacher' },
          ].map((option) => {
            const selected = form.role === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setForm({ ...form, role: option.value })}
                style={[styles.roleChip, selected && styles.roleChipSelected]}
              >
                <Text style={[styles.roleChipText, selected && styles.roleChipTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {['name', 'email', 'password'].map((field) => (
          <View key={field}>
            <Text style={styles.label}>{field === 'name' ? 'Full Name' : field.charAt(0).toUpperCase() + field.slice(1)}</Text>
            <TextInput
              style={styles.input}
              value={form[field]}
              onChangeText={(v) => setForm({ ...form, [field]: v })}
              secureTextEntry={field === 'password'}
              keyboardType={field === 'email' ? 'email-address' : 'default'}
              autoCapitalize={field === 'email' ? 'none' : 'words'}
              placeholderTextColor={colors.textMuted}
              placeholder={field === 'password' ? 'At least 8 characters, letter + number' : undefined}
            />
          </View>
        ))}

        <Button title="Create Account" onPress={handleRegister} loading={loading} style={styles.btn} />

        <GoogleSignInButton onSuccess={handleGoogleSignIn} role={form.role} style={{ marginTop: spacing.sm }} />

        <Text style={styles.footer}>
          Already have an account?{' '}
          <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
            Sign in
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.xs, fontWeight: '500' },
  roleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  roleChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.bgCard,
  },
  roleChipSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(86,36,208,0.08)',
  },
  roleChipText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  roleChipTextSelected: { color: colors.primary },
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
});
