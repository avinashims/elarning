import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, isTeacher, isAdmin } = useAuth();
  const { cart, wishlistCount } = useCart();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [showStudy, setShowStudy] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        const list = res.data?.data;
        setCategories(Array.isArray(list) ? list : []);
      })
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/batches?q=${encodeURIComponent(search.trim())}`);
    setMobileOpen(false);
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand" onClick={closeMobile}>
          Avi SkillStream
        </Link>

        <div
          className="navbar-explore"
          onMouseEnter={() => setShowStudy(true)}
          onMouseLeave={() => setShowStudy(false)}
        >
          <span>Study</span>
          {showStudy && (
            <div className="categories-dropdown">
              {categories.slice(0, 10).map((cat) => (
                <Link key={cat.id} to={`/batches?category=${cat.slug}`} onClick={() => setShowStudy(false)}>
                  {cat.icon} {cat.name}
                </Link>
              ))}
              <Link to="/batches" onClick={() => setShowStudy(false)}>All batches</Link>
            </div>
          )}
        </div>

        <form className="navbar-search" onSubmit={handleSearch}>
          <button type="submit" className="search-icon" aria-label="Search">🔍</button>
          <input type="text" placeholder="Search batches" value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>

        <div className="navbar-links">
          <Link to="/batches">Batches</Link>
          <Link to="/live-classes">Live Classes</Link>
          <Link to="/test-series">Test Series</Link>
          <Link to="/pricing" className="hide-mobile">Plans</Link>
          {isTeacher && <Link to="/teacher">Teach</Link>}
          {isAdmin && <Link to="/admin">Admin</Link>}
        </div>

        <div className="navbar-actions">
          {user ? (
            <>
              <Link to="/my-courses" className="nav-link hide-mobile">My Learning</Link>
              <Link to="/wishlist" className="nav-icon" title="Wishlist">♡ {wishlistCount > 0 && <span className="badge-count">{wishlistCount}</span>}</Link>
              <Link to="/cart" className="nav-icon" title="Cart">🛒 {(cart?.count ?? 0) > 0 && <span className="badge-count">{cart.count}</span>}</Link>
              <span className="user-name">{user.name.split(' ')[0]}</span>
              <button onClick={handleLogout} className="btn btn-sm btn-secondary hide-mobile">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-sm btn-secondary hide-mobile">Log in</Link>
              <Link to="/register" className="btn btn-sm btn-primary hide-mobile">Sign up</Link>
            </>
          )}
          <button
            type="button"
            className="mobile-menu-btn"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            ☰
          </button>
        </div>
      </div>

      <form className="mobile-search-bar container" onSubmit={handleSearch}>
        <input type="text" placeholder="Search batches" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="submit" className="btn btn-primary btn-sm">Search</button>
      </form>

      {mobileOpen && (
        <div className="mobile-nav-overlay" onClick={closeMobile}>
          <div className="mobile-nav-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <strong>Menu</strong>
              <button type="button" onClick={closeMobile} aria-label="Close menu">✕</button>
            </div>

            <Link to="/batches" onClick={closeMobile}>Batches</Link>
            <Link to="/live-classes" onClick={closeMobile}>Live Classes</Link>
            <Link to="/test-series" onClick={closeMobile}>Test Series</Link>
            <Link to="/pricing" onClick={closeMobile}>Plans</Link>
            {user && <Link to="/my-courses" onClick={closeMobile}>My Learning</Link>}
            {user && <Link to="/wishlist" onClick={closeMobile}>Wishlist</Link>}
            {user && <Link to="/cart" onClick={closeMobile}>Cart ({cart?.count ?? 0})</Link>}
            {isTeacher && <Link to="/teacher" onClick={closeMobile}>Teach</Link>}
            {isAdmin && <Link to="/admin" onClick={closeMobile}>Admin</Link>}

            <div className="mobile-nav-categories">
              <span>Study</span>
              {categories.map((cat) => (
                <Link key={cat.id} to={`/batches?category=${cat.slug}`} onClick={closeMobile}>
                  {cat.icon} {cat.name}
                </Link>
              ))}
            </div>

            <div className="mobile-nav-auth">
              {user ? (
                <>
                  <p>Signed in as {user.name}</p>
                  <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%' }}>Log out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-secondary" onClick={closeMobile} style={{ width: '100%', marginBottom: '0.5rem' }}>Log in</Link>
                  <Link to="/register" className="btn btn-primary" onClick={closeMobile} style={{ width: '100%' }}>Sign up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
