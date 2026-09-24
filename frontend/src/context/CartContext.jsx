import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0, count: 0 });
  const [wishlistCount, setWishlistCount] = useState(0);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [], total: 0, count: 0 });
      return;
    }
    try {
      const res = await api.get('/cart');
      const payload = res.data?.data;
      setCart(
        payload && typeof payload.count === 'number'
          ? payload
          : { items: payload?.items || [], total: payload?.total || 0, count: payload?.count || 0 }
      );
    } catch {
      setCart({ items: [], total: 0, count: 0 });
    }
  }, [isAuthenticated]);

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlistCount(0);
      return;
    }
    try {
      const res = await api.get('/wishlist');
      const list = res.data?.data;
      setWishlistCount(Array.isArray(list) ? list.length : 0);
    } catch {
      setWishlistCount(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
    refreshWishlist();
  }, [refreshCart, refreshWishlist]);

  const addToCart = async (courseId) => {
    await api.post('/cart', { courseId });
    await refreshCart();
  };

  const toggleWishlist = async (courseId) => {
    const res = await api.post(`/wishlist/${courseId}`);
    await refreshWishlist();
    return res.data.data.wishlisted;
  };

  return (
    <CartContext.Provider value={{ cart, wishlistCount, refreshCart, refreshWishlist, addToCart, toggleWishlist }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
