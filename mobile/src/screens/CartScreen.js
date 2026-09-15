import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import Button from '../components/Button';
import LoadingScreen from '../components/LoadingScreen';
import { colors, spacing } from '../constants/theme';

export default function CartScreen({ navigation }) {
  const [cart, setCart] = useState({ items: [], total: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  const loadCart = useCallback(() => {
    setLoading(true);
    api.get('/cart')
      .then((res) => setCart(res.data.data))
      .catch(() => setCart({ items: [], total: 0, count: 0 }))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { loadCart(); }, [loadCart]));

  const removeItem = async (courseId) => {
    try {
      await api.delete(`/cart/${courseId}`);
      loadCart();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not remove item');
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={cart.items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.subtitle}>{cart.count} course{cart.count !== 1 ? 's' : ''} in cart</Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <Button title="Browse courses" onPress={() => navigation.getParent()?.navigate('Main', { screen: 'Courses' })} />
          </View>
        }
        ListFooterComponent={
          cart.items.length > 0 ? (
            <View style={styles.summary}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.total}>₹{cart.total.toLocaleString('en-IN')}</Text>
              <Text style={styles.note}>
                Complete purchase on the web app with Razorpay, or contact admin to enable in-app payments.
              </Text>
              <Button
                title="View course details"
                onPress={() => navigation.navigate('CourseDetail', { courseId: cart.items[0].courseId })}
              />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            {item.course?.thumbnail ? (
              <Image source={{ uri: item.course.thumbnail }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]} />
            )}
            <View style={styles.itemInfo}>
              <TouchableOpacity onPress={() => navigation.navigate('CourseDetail', { courseId: item.courseId })}>
                <Text style={styles.itemTitle} numberOfLines={2}>{item.course?.title}</Text>
              </TouchableOpacity>
              <Text style={styles.itemPrice}>₹{(item.course?.price || 0).toLocaleString('en-IN')}</Text>
            </View>
            <TouchableOpacity onPress={() => removeItem(item.courseId)} style={styles.remove}>
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.md },
  empty: { alignItems: 'center', paddingTop: spacing.xl },
  emptyText: { fontSize: 16, color: colors.textMuted, marginBottom: spacing.lg },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  thumb: { width: 80, height: 48, borderRadius: 4 },
  thumbPlaceholder: { backgroundColor: colors.primary },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: colors.text },
  remove: { padding: spacing.sm },
  removeText: { fontSize: 18, color: colors.textMuted },
  summary: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  totalLabel: { fontSize: 14, color: colors.textMuted },
  total: { fontSize: 28, fontWeight: '700', color: colors.text, marginVertical: spacing.sm },
  note: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 18 },
});
