import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import LoadingScreen from '../components/LoadingScreen';
import { colors, spacing } from '../constants/theme';

export default function PricingScreen() {
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/payments/plans'),
      isAuthenticated ? api.get('/payments/subscription').catch(() => null) : Promise.resolve(null),
    ])
      .then(([plansRes, subRes]) => {
        setPlans(plansRes.data.data);
        if (subRes) setSubscription(subRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleSubscribe = (plan) => {
    Alert.alert(
      'Subscribe on Web',
      'Payment via Razorpay is available on the web app. Open the web platform to complete your subscription.',
      [{ text: 'OK' }]
    );
  };

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Choose Your Plan</Text>
      <Text style={styles.subtitle}>Unlock premium lessons and live classes</Text>

      {subscription && (
        <View style={styles.activeBox}>
          <Text style={styles.activeText}>
            Active: {subscription.plan.name} until {new Date(subscription.endDate).toLocaleDateString()}
          </Text>
        </View>
      )}

      {plans.map((plan) => (
        <View key={plan.id} style={[styles.planCard, plan.name === 'Pro' && styles.featured]}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.price}>₹{plan.price}<Text style={styles.period}> / {plan.durationDays} days</Text></Text>
          <Text style={styles.planDesc}>{plan.description}</Text>
          {plan.features?.map((f, i) => (
            <Text key={i} style={styles.feature}>✓ {f}</Text>
          ))}
          <Button
            title={subscription ? 'Active' : 'Subscribe'}
            onPress={() => handleSubscribe(plan)}
            disabled={!!subscription}
            style={{ marginTop: spacing.md }}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg, marginTop: spacing.xs },
  activeBox: { backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 10, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  activeText: { color: colors.success, fontSize: 14, textAlign: 'center' },
  planCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  featured: { borderColor: colors.primary },
  planName: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  price: { fontSize: 32, fontWeight: '800', color: colors.primaryLight, marginBottom: spacing.sm },
  period: { fontSize: 14, color: colors.textMuted, fontWeight: '400' },
  planDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md },
  feature: { fontSize: 13, color: colors.textMuted, alignSelf: 'flex-start', marginBottom: spacing.xs },
});
