import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="udemy-footer">
      <div className="footer-cta">
        <div className="container footer-cta-inner">
          <div>
            <h3>Teach the world online</h3>
            <p>Turn your expertise into a course on Udemy.</p>
          </div>
          <Link to="/register" className="btn btn-dark">Get started</Link>
        </div>
      </div>

      <div className="footer-links container">
        <div className="footer-col">
          <h4>Udemy Business</h4>
          <a href="#">Get the app</a>
          <a href="#">Teach on Udemy</a>
        </div>
        <div className="footer-col">
          <h4>About us</h4>
          <Link to="/courses">Browse courses</Link>
          <Link to="/pricing">Plans & Pricing</Link>
        </div>
        <div className="footer-col">
          <h4>Discover</h4>
          <Link to="/courses?category=development">Development</Link>
          <Link to="/courses?category=business">Business</Link>
          <Link to="/courses?category=design">Design</Link>
        </div>
        <div className="footer-col">
          <h4>Support</h4>
          <Link to="/live-classes">Live classes</Link>
          <Link to="/my-courses">My learning</Link>
        </div>
      </div>

      <div className="footer-bottom container">
        <span className="footer-logo">Udemy</span>
        <span>© {new Date().getFullYear()} Udemy, Inc.</span>
      </div>
    </footer>
  );
}
