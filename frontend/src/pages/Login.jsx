import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { getAuthErrorMessage } from '../utils/authErrorMessage';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const redirectAfterAuth = (user) => {
    if (user.role === 'ADMIN') navigate('/admin');
    else if (user.role === 'TEACHER') navigate('/teacher');
    else navigate('/my-courses');
  };

  const handleGoogleCredential = async (idToken) => {
    setError('');
    setLoading(true);
    try {
      const user = await loginWithGoogle(idToken, 'STUDENT');
      redirectAfterAuth(user);
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      redirectAfterAuth(user);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container auth-page">
      <div className="card auth-card">
        <Link to="/" className="auth-brand">Udemy</Link>
        <h1>Log in to continue your learning journey</h1>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <GoogleSignInButton onCredential={handleGoogleCredential} disabled={loading} />

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>

        <div className="demo-accounts">
          <p>Demo accounts:</p>
          <small>admin@elearning.com / admin123</small><br />
          <small>teacher@elearning.com / teacher123</small><br />
          <small>student@elearning.com / student123</small>
        </div>
      </div>
    </div>
  );
}
