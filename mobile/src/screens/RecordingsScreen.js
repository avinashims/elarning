import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import api from '../api/client';
import LoadingScreen from '../components/LoadingScreen';
import { colors, spacing } from '../constants/theme';

export default function RecordingsScreen({ navigation }) {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/live-classes/recordings')
      .then((res) => setRecordings(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Recorded Classes</Text>
            <Text style={styles.subtitle}>Watch previous live sessions</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No recordings available yet.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.description && <Text style={styles.desc}>{item.description}</Text>}
            <View style={styles.meta}>
              {item.isPremium && (
                <View style={styles.badge}><Text style={styles.badgeText}>Premium</Text></View>
              )}
              <Text style={styles.date}>{new Date(item.recordedAt).toLocaleDateString()}</Text>
            </View>
            {item.locked ? (
              <Text style={styles.locked} onPress={() => navigation.navigate('Pricing')}>
                🔒 Premium Required — Tap to subscribe
              </Text>
            ) : (
              <Text style={styles.available}>Recording available</Text>
            )}
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
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  desc: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  badge: { backgroundColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 11, color: colors.warning, fontWeight: '600' },
  date: { fontSize: 12, color: colors.textMuted },
  locked: { fontSize: 14, color: colors.warning, marginTop: spacing.xs },
  available: { fontSize: 13, color: colors.success, marginTop: spacing.xs },
});
