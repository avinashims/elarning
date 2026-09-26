import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Pricing.css';

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      api.get('/payments/plans'),
      user ? api.get('/payments/subscription').catch(() => null) : Promise.resolve(null),
    ])
      .then(([plansRes, subRes]) => {
        setPlans(plansRes.data.data);
        if (subRes) setSubscription(subRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve();
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = resolve;
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (plan) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setPaying(plan.id);
    try {
      const orderRes = await api.post('/payments/create-order', { planId: plan.id });
      const { orderId, amount, paymentId } = orderRes.data.data;

      await loadRazorpay();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency: 'INR',
        name: 'Avi SkillStream',
        description: plan.name,
        order_id: orderId,
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            alert('Payment successful! Premium access activated.');
            window.location.reload();
          } catch (err) {
            alert(err.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: { email: user.email, name: user.name },
        theme: { color: '#6366f1' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => alert('Payment failed. Please try again.'));
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not initiate payment');
    } finally {
      setPaying(null);
    }
  };

  if (loading) return <div className="loading container">Loading plans...</div>;

  return (
    <div className="container pricing-page">
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1>Choose Your Plan</h1>
        <p>Unlock premium lessons, live classes, and recorded sessions</p>
      </div>

      {subscription && (
        <div className="alert alert-success" style={{ maxWidth: 600, margin: '0 auto 2rem' }}>
          Active subscription: <strong>{subscription.plan.name}</strong> until{' '}
          {new Date(subscription.endDate).toLocaleDateString()}
        </div>
      )}

      <div className="pricing-grid">
        {plans.map((plan) => (
          <div key={plan.id} className={`pricing-card card ${plan.name === 'Pro' ? 'featured' : ''}`}>
            {plan.name === 'Pro' && <span className="badge badge-primary">Popular</span>}
            <h3>{plan.name}</h3>
            <div className="price">
              <span className="currency">₹</span>
              <span className="amount">{plan.price}</span>
              <span className="period">/{plan.durationDays} days</span>
            </div>
            <p className="plan-desc">{plan.description}</p>
            <ul className="features-list">
              {plan.features?.map((f, i) => (
                <li key={i}>✓ {f}</li>
              ))}
            </ul>
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              onClick={() => handleSubscribe(plan)}
              disabled={paying === plan.id || !!subscription}
            >
              {subscription ? 'Active' : paying === plan.id ? 'Processing...' : 'Subscribe Now'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
