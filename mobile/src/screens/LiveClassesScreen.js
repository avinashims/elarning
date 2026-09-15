import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import LoadingScreen from '../components/LoadingScreen';
import { colors, spacing } from '../constants/theme';

export default function LiveClassesScreen() {
  const { isAuthenticated } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);

  useEffect(() => {
    api.get('/live-classes/upcoming')
      .then((res) => setClasses(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleJoin = async (cls) => {
    if (!isAuthenticated) {
      Alert.alert('Login required', 'Please sign in to join live classes.');
      return;
    }

    setJoining(cls.id);
    try {
      const res = await api.get(`/live-classes/${cls.id}/join`);
      const { meetingUrl, liveStreamId } = res.data.data;
      const url = meetingUrl || (liveStreamId ? `https://stream.example.com/${liveStreamId}` : null);

      if (url) {
        await WebBrowser.openBrowserAsync(url);
      } else {
        Alert.alert('No join link', 'Meeting URL is not available yet.');
      }
    } catch (err) {
      Alert.alert('Cannot join', err.response?.data?.message || 'Unable to join this class');
    } finally {
      setJoining(null);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={classes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Upcoming Live Classes</Text>
            <Text style={styles.subtitle}>Join interactive sessions with instructors</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No upcoming live classes scheduled.</Text>
        }
        renderItem={({ item: cls }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{cls.title}</Text>
              <View style={[styles.statusBadge, cls.status === 'LIVE' && styles.liveBadge]}>
                <Text style={styles.statusText}>{cls.status}</Text>
              </View>
            </View>
            {cls.description && <Text style={styles.desc}>{cls.description}</Text>}
            <Text style={styles.date}>📅 {new Date(cls.scheduledAt).toLocaleString()}</Text>
            {cls.course && <Text style={styles.course}>Course: {cls.course.title}</Text>}
            {cls.isPremium && (
              <View style={styles.premiumBadge}><Text style={styles.premiumText}>Premium</Text></View>
            )}
            <Button
              title={joining === cls.id ? 'Checking...' : cls.status === 'LIVE' ? 'Join Class' : 'Join When Ready'}
              onPress={() => handleJoin(cls)}
              loading={joining === cls.id}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.md, marginTop: spacing.xs },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1, marginRight: spacing.sm },
  statusBadge: { backgroundColor: 'rgba(99,102,241,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  liveBadge: { backgroundColor: 'rgba(239,68,68,0.2)' },
  statusText: { fontSize: 11, color: colors.primaryLight, fontWeight: '600' },
  desc: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm },
  date: { fontSize: 13, color: colors.text, marginBottom: spacing.xs },
  course: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
  premiumBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, marginBottom: spacing.xs },
  premiumText: { fontSize: 11, color: colors.warning, fontWeight: '600' },
});
