import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="udemy-footer">
      <div className="footer-cta">
        <div className="container footer-cta-inner">
          <div>
            <h3>Teach on Avi SkillStream</h3>
            <p>Launch live batches and test series for your students.</p>
          </div>
          <Link to="/register" className="btn btn-dark">Get started</Link>
        </div>
      </div>

      <div className="footer-links container">
        <div className="footer-col">
          <h4>Study</h4>
          <Link to="/batches">Batches</Link>
          <Link to="/test-series">Test series</Link>
          <Link to="/live-classes">Live classes</Link>
        </div>
        <div className="footer-col">
          <h4>Exams</h4>
          <Link to="/batches?examTrack=IIT-JEE">IIT JEE</Link>
          <Link to="/batches?examTrack=NEET">NEET</Link>
          <Link to="/batches?examTrack=SSC">SSC</Link>
        </div>
        <div className="footer-col">
          <h4>Account</h4>
          <Link to="/pricing">Plans</Link>
          <Link to="/my-courses">My learning</Link>
        </div>
        <div className="footer-col">
          <h4>Support</h4>
          <Link to="/login">Log in</Link>
          <Link to="/register">Sign up</Link>
        </div>
      </div>

      <div className="footer-bottom container">
        <span className="footer-logo">Avi SkillStream</span>
        <span>© {new Date().getFullYear()} Avi SkillStream</span>
      </div>
    </footer>
  );
}
