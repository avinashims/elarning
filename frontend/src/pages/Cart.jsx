import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import './Cart.css';

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    document.body.appendChild(script);
  });
}

export default function Cart() {
  const { user } = useAuth();
  const { cart, refreshCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const removeItem = async (courseId) => {
    try {
      await api.delete(`/cart/${courseId}`);
      await refreshCart();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not remove item');
    }
  };

  const checkout = async () => {
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    try {
      const orderRes = await api.post('/cart/checkout');
      const { orderId, amount } = orderRes.data.data;
      await loadRazorpay();

      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency: 'INR',
        name: 'Avi SkillStream',
        description: `${cart.count} course(s)`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await api.post('/cart/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            await refreshCart();
            alert('Purchase successful!');
            navigate('/my-courses');
          } catch (err) {
            alert(err.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: { email: user.email, name: user.name },
        theme: { color: '#5624d0' },
      });
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container cart-page">
      <h1>Shopping Cart</h1>
      <p className="cart-subtitle">{cart.count} course{cart.count !== 1 ? 's' : ''} in cart</p>

      {cart.items?.length === 0 ? (
        <div className="cart-empty">
          <p>Your cart is empty.</p>
          <Link to="/courses" className="btn btn-primary">Keep shopping</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.items.map((item) => (
              <div key={item.id} className="cart-item">
                {item.course?.thumbnail ? (
                  <img src={item.course.thumbnail} alt={item.course.title} />
                ) : (
                  <div className="cart-item-placeholder" />
                )}
                <div className="cart-item-info">
                  <Link to={`/courses/${item.courseId}`}><h3>{item.course?.title}</h3></Link>
                  {item.course?.teacher && <p>By {item.course.teacher.name}</p>}
                </div>
                <div className="cart-item-price">₹{(item.course?.price || 0).toLocaleString('en-IN')}</div>
                <button className="remove-btn" onClick={() => removeItem(item.courseId)} aria-label="Remove">✕</button>
              </div>
            ))}
          </div>

          <aside className="cart-summary">
            <h2>Total:</h2>
            <div className="cart-total">₹{cart.total.toLocaleString('en-IN')}</div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={checkout} disabled={loading}>
              {loading ? 'Processing...' : 'Checkout'}
            </button>
            <p className="cart-note">30-Day Money-Back Guarantee</p>
          </aside>
        </div>
      )}
    </div>
  );
}
