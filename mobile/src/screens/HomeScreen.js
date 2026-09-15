import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import Button from '../components/Button';
import CourseCard from '../components/CourseCard';
import { colors, spacing } from '../constants/theme';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/categories').then((r) => r.data.data).catch(() => []),
      api.get('/courses').then((r) => r.data.data.slice(0, 4)).catch(() => []),
    ]).then(([cats, featured]) => {
      setCategories(cats);
      setCourses(featured);
    });
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Learn without limits</Text>
        <Text style={styles.heroSubtitle}>
          Courses, live classes, and expert instructors — on your phone.
        </Text>
        <Button title="Explore courses" onPress={() => navigation.navigate('Courses')} />
        {!user ? (
          <Button
            title="Sign up free"
            variant="secondary"
            onPress={() => navigation.navigate('Register')}
            style={{ marginTop: spacing.sm }}
          />
        ) : (
          <Button
            title="My learning"
            variant="secondary"
            onPress={() => navigation.navigate('Learning')}
            style={{ marginTop: spacing.sm }}
          />
        )}
      </View>

      {categories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top categories</Text>
          {categories.slice(0, 6).map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryRow}
              onPress={() => navigation.navigate('Courses')}
            >
              <Text style={styles.categoryText}>{cat.icon} {cat.name}</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {courses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Students are viewing</Text>
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: spacing.xl },
  hero: {
    backgroundColor: colors.bgDark,
    padding: spacing.lg,
  },
  heroTitle: { fontSize: 26, fontWeight: '700', color: colors.textLight, marginBottom: spacing.sm },
  heroSubtitle: { fontSize: 15, color: '#cec0fc', marginBottom: spacing.lg, lineHeight: 22 },
  section: { padding: spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryText: { fontSize: 15, fontWeight: '600', color: colors.text },
  arrow: { fontSize: 20, color: colors.textMuted },
});
