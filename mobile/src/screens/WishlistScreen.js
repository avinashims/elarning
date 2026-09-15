import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import CourseCard from '../components/CourseCard';
import LoadingScreen from '../components/LoadingScreen';
import Button from '../components/Button';
import { colors, spacing } from '../constants/theme';

export default function WishlistScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      api.get('/wishlist')
        .then((res) => setItems(res.data.data.map((w) => w.course || w)))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }, [])
  );

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.subtitle}>{items.length} saved course{items.length !== 1 ? 's' : ''}</Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Your wishlist is empty</Text>
            <Button title="Explore courses" onPress={() => navigation.getParent()?.navigate('Main', { screen: 'Courses' })} />
          </View>
        }
        renderItem={({ item }) => (
          <CourseCard
            course={item}
            onPress={() => navigation.navigate('CourseDetail', { courseId: item.id })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.md },
  empty: { alignItems: 'center', paddingTop: spacing.xl },
  emptyText: { fontSize: 16, color: colors.textMuted, marginBottom: spacing.lg },
});
