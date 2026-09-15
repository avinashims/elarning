import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import api from '../api/client';
import { API_URL } from '../constants/theme';
import LoadingScreen from '../components/LoadingScreen';
import Button from '../components/Button';
import { colors, spacing } from '../constants/theme';

export default function LessonScreen({ route, navigation }) {
  const { lessonId } = route.params;
  const videoRef = useRef(null);
  const [lesson, setLesson] = useState(null);
  const [videoUri, setVideoUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastSavedRef = useRef(0);

  const saveProgress = useCallback(async (watchedSeconds, completed = false) => {
    try {
      await api.put(`/progress/lesson/${lessonId}`, { watchedSeconds, completed });
    } catch (err) {
      console.error('Failed to save progress', err);
    }
  }, [lessonId]);

  useEffect(() => {
    (async () => {
      try {
        const lessonRes = await api.get(`/lessons/${lessonId}`);
        const lessonData = lessonRes.data.data;
        setLesson(lessonData);

        if (lessonData.locked) {
          setError('Premium subscription required');
          return;
        }

        const accessRes = await api.get(`/videos/lessons/${lessonId}/access`);
        const { signedUrl } = accessRes.data.data;
        const absoluteUrl = signedUrl.startsWith('http')
          ? signedUrl
          : `${API_URL.replace(/\/api$/, '')}${signedUrl}`;
        setVideoUri(absoluteUrl);
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to load lesson';
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [lessonId]);

  const handlePlaybackUpdate = (status) => {
    if (!status.isLoaded || status.isBuffering) return;
    const current = Math.floor(status.positionMillis / 1000);
    if (current - lastSavedRef.current >= 5) {
      lastSavedRef.current = current;
      saveProgress(current);
    }
    if (status.didJustFinish) {
      saveProgress(Math.floor(status.durationMillis / 1000), true);
    }
  };

  if (loading) return <LoadingScreen />;

  if (error || lesson?.locked) {
    return (
      <View style={styles.container}>
        <View style={styles.lockedBox}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockTitle}>Premium Content Locked</Text>
          <Text style={styles.lockDesc}>{error || 'Subscribe to access this lesson.'}</Text>
          <Button title="View Plans" onPress={() => navigation.navigate('Pricing')} />
        </View>
      </View>
    );
  }

  const initialPosition = (lesson?.progress?.watchedSeconds || 0) * 1000;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{lesson?.title}</Text>
      {lesson?.description && <Text style={styles.desc}>{lesson.description}</Text>}

      {videoUri && (
        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri: videoUri }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          positionMillis={initialPosition}
          onPlaybackStatusUpdate={handlePlaybackUpdate}
        />
      )}

      {lesson?.progress?.watchedSeconds > 0 && (
        <Text style={styles.resume}>
          Resuming from {Math.floor(lesson.progress.watchedSeconds / 60)}:
          {String(lesson.progress.watchedSeconds % 60).padStart(2, '0')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.md },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  desc: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.md },
  video: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', borderRadius: 12 },
  resume: { fontSize: 13, color: colors.textMuted, marginTop: spacing.md },
  lockedBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lockIcon: { fontSize: 48, marginBottom: spacing.md },
  lockTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  lockDesc: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg },
});
