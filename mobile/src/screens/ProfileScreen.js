import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { colors, spacing, API_URL } from '../constants/theme';

export default function ProfileScreen({ navigation }) {
  const { user, logout, isAdmin, isTeacher } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => { await logout(); },
      },
    ]);
  };

  if (!user) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Welcome to Avi SkillStream</Text>
        <Text style={styles.subtitle}>Sign in to access courses, cart, and learning</Text>
        <Button title="Sign In" onPress={() => navigation.navigate('Login')} />
        <Button
          title="Create Account"
          variant="secondary"
          onPress={() => navigation.navigate('Register')}
          style={{ marginTop: spacing.sm }}
        />
        <Text style={styles.apiHint}>API: {API_URL}</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user.name?.charAt(0)?.toUpperCase()}</Text>
      </View>
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>
      <View style={styles.roleBadge}>
        <Text style={styles.roleText}>{user.role}</Text>
      </View>

      <View style={styles.menu}>
        <Button title="My Learning" variant="secondary" onPress={() => navigation.navigate('Learning')} style={styles.menuBtn} />
        <Button title="Cart" variant="secondary" onPress={() => navigation.navigate('Cart')} style={styles.menuBtn} />
        <Button title="Wishlist" variant="secondary" onPress={() => navigation.navigate('Wishlist')} style={styles.menuBtn} />
        <Button title="Live Classes" variant="secondary" onPress={() => navigation.navigate('LiveClasses')} style={styles.menuBtn} />
        <Button title="Recordings" variant="secondary" onPress={() => navigation.navigate('Recordings')} style={styles.menuBtn} />
        <Button title="Subscription Plans" variant="secondary" onPress={() => navigation.navigate('Pricing')} style={styles.menuBtn} />
      </View>

      <Button title="Logout" variant="secondary" onPress={handleLogout} style={{ marginTop: spacing.lg, width: '100%' }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.bg, padding: spacing.lg, alignItems: 'center', paddingTop: 32, paddingBottom: spacing.xl },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg, textAlign: 'center' },
  apiHint: { fontSize: 11, color: colors.textMuted, marginTop: spacing.xl, textAlign: 'center' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  email: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.md },
  roleBadge: { backgroundColor: 'rgba(86,36,208,0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginBottom: spacing.xl },
  roleText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  menu: { width: '100%', gap: spacing.sm },
  menuBtn: { width: '100%' },
});
