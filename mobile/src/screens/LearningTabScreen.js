import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import MyCoursesScreen from './MyCoursesScreen';
import Button from '../components/Button';
import { colors, spacing } from '../constants/theme';

export default function LearningTabScreen({ navigation }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <MyCoursesScreen navigation={navigation} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Learning</Text>
      <Text style={styles.subtitle}>Sign in to see your enrolled courses</Text>
      <Button title="Sign In" onPress={() => navigation.navigate('Login')} />
      <Button
        title="Create Account"
        variant="secondary"
        onPress={() => navigation.navigate('Register')}
        style={{ marginTop: spacing.sm, width: '100%' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg, textAlign: 'center' },
});
