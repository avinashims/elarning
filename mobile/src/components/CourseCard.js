import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { colors, spacing } from '../constants/theme';

function formatPrice(price) {
  if (!price || price === 0) return 'Free';
  return `₹${price.toLocaleString('en-IN')}`;
}

export default function CourseCard({ course, onPress }) {
  const rating = course.rating?.average || 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {course.thumbnail ? (
        <Image source={{ uri: course.thumbnail }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>📖</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{course.title}</Text>
        {course.teacher && <Text style={styles.instructor}>By {course.teacher.name}</Text>}
        {rating > 0 && (
          <Text style={styles.rating}>★ {rating.toFixed(1)} ({course.rating?.count || 0})</Text>
        )}
        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(course.price)}</Text>
          {course._count && (
            <Text style={styles.metaText}>{course._count.enrollments || 0} students</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  image: { width: '100%', height: 140 },
  placeholder: {
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 40 },
  body: { padding: spacing.md },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  instructor: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.xs },
  rating: { fontSize: 12, color: colors.warning, marginBottom: spacing.xs },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: { fontSize: 16, fontWeight: '700', color: colors.text },
  metaText: { fontSize: 12, color: colors.textMuted },
});
