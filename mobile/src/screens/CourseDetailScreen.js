import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import LoadingScreen from '../components/LoadingScreen';
import { colors, spacing, resolveMediaUrl } from '../constants/theme';

function formatPrice(price) {
  if (!price || price === 0) return 'Free';
  return `₹${price.toLocaleString('en-IN')}`;
}

export default function CourseDetailScreen({ route, navigation }) {
  const { courseId } = route.params;
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    const requests = [api.get(`/courses/${courseId}`)];
    if (isAuthenticated) {
      requests.push(api.get(`/progress/course/${courseId}`).catch(() => null));
    }

    Promise.all(requests)
      .then(([courseRes, progressRes]) => {
        setCourse(courseRes.data.data);
        if (progressRes) setProgress(progressRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [courseId, isAuthenticated]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      setCourse((c) => ({ ...c, isEnrolled: true, isOwned: true }));
      Alert.alert('Success', 'Enrolled successfully!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Enrollment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    setActionLoading(true);
    try {
      await api.post('/cart', { courseId });
      Alert.alert('Added', 'Course added to cart');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not add to cart');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    try {
      const res = await api.post(`/wishlist/${courseId}`);
      Alert.alert('Wishlist', res.data.data.wishlisted ? 'Saved to wishlist' : 'Removed from wishlist');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not update wishlist');
    }
  };

  if (loading) return <LoadingScreen />;
  if (!course) return <View style={styles.container}><Text style={styles.error}>Course not found</Text></View>;

  const isFree = !course.price || course.price === 0;
  const isOwned = course.isOwned || course.isEnrolled;
  const rating = course.rating || { average: 0, count: 0 };
  const thumbnailUri = resolveMediaUrl(course.thumbnail);

  return (
    <ScrollView style={styles.container}>
      {thumbnailUri ? <Image source={{ uri: thumbnailUri }} style={styles.banner} /> : null}
      <View style={styles.content}>
        <Text style={styles.title}>{course.title}</Text>
        {course.subtitle && <Text style={styles.subtitle}>{course.subtitle}</Text>}
        {rating.average > 0 && (
          <Text style={styles.rating}>★ {rating.average.toFixed(1)} ({rating.count} ratings)</Text>
        )}
        {course.teacher && (
          <Text style={styles.teacher}>Instructor: {course.teacher.name}</Text>
        )}
        <Text style={styles.price}>{formatPrice(course.price)}</Text>

        {progress && (
          <View style={styles.progressBox}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress.stats.progressPercent}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {progress.stats.progressPercent}% complete
            </Text>
          </View>
        )}

        {isOwned ? (
          <Button
            title="Go to course"
            onPress={() => {
              let firstLesson = null;
              for (const ch of course.chapters || []) {
                for (const lesson of ch.lessons || []) {
                  if (!lesson.locked || isOwned) {
                    firstLesson = lesson;
                    break;
                  }
                }
                if (firstLesson) break;
              }
              if (firstLesson?.id) {
                navigation.navigate('Lesson', { lessonId: firstLesson.id, courseId });
              } else {
                Alert.alert(
                  'No lessons yet',
                  'This course has no video lessons. Check Live classes or ask your instructor to add content.'
                );
                setTab('curriculum');
              }
            }}
            style={{ marginBottom: spacing.sm }}
          />
        ) : isFree ? (
          <Button title="Enroll now" onPress={handleEnroll} loading={actionLoading} style={{ marginBottom: spacing.sm }} />
        ) : (
          <Button title="Add to cart" onPress={handleAddToCart} loading={actionLoading} style={{ marginBottom: spacing.sm }} />
        )}
        <Button title="Save for later" variant="secondary" onPress={handleWishlist} style={{ marginBottom: spacing.lg }} />

        <View style={styles.tabs}>
          {['overview', 'curriculum'].map((t) => (
            <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'overview' && (
          <View>
            {course.learningObjectives?.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>What you'll learn</Text>
                {course.learningObjectives.map((obj, i) => (
                  <Text key={i} style={styles.bullet}>✓ {obj}</Text>
                ))}
              </>
            )}
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.desc}>{course.description}</Text>
          </View>
        )}

        {tab === 'curriculum' && course.chapters?.map((chapter) => (
          <View key={chapter.id} style={styles.chapter}>
            <Text style={styles.chapterTitle}>{chapter.title}</Text>
            {chapter.lessons?.map((lesson) => (
              <TouchableOpacity
                key={lesson.id}
                style={[styles.lesson, lesson.locked && !isOwned && styles.lessonLocked]}
                onPress={() => {
                  if (lesson.locked && !isOwned) {
                    navigation.navigate('Pricing');
                    return;
                  }
                  if (!isAuthenticated) {
                    navigation.navigate('Login');
                    return;
                  }
                  navigation.navigate('Lesson', { lessonId: lesson.id, courseId });
                }}
              >
                <Text style={styles.lessonTitle}>
                  {lesson.locked && !isOwned ? '🔒' : '▶'} {lesson.title}
                </Text>
                {lesson.isPremium && (
                  <View style={styles.badge}><Text style={styles.badgeText}>Premium</Text></View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  banner: { width: '100%', height: 200 },
  content: { padding: spacing.md },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.sm },
  rating: { fontSize: 13, color: colors.warning, marginBottom: spacing.xs },
  teacher: { fontSize: 13, color: colors.primaryLight, marginBottom: spacing.xs },
  price: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  desc: { fontSize: 14, color: colors.textMuted, lineHeight: 22, marginBottom: spacing.sm },
  progressBox: { marginBottom: spacing.md },
  progressBar: { height: 6, backgroundColor: colors.bgCard, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  progressText: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.md },
  tab: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, marginRight: spacing.sm },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: colors.text },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm, marginTop: spacing.sm },
  bullet: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.xs },
  chapter: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chapterTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  lesson: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
  lessonLocked: { opacity: 0.7 },
  lessonTitle: { fontSize: 14, color: colors.text, flex: 1 },
  badge: { backgroundColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 11, color: colors.warning, fontWeight: '600' },
  error: { color: colors.danger, textAlign: 'center', marginTop: spacing.xl },
});
