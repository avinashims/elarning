import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { colors, spacing } from '../constants/theme';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
    } catch (err) {
      Alert.alert('Registration failed', err.response?.data?.message || 'Could not create account');
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
        <Text style={styles.subtitle}>Start your learning journey</Text>

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
            />
          </View>
        ))}

        <Button title="Create Account" onPress={handleRegister} loading={loading} style={styles.btn} />

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
