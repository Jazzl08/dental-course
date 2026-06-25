import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              Tandvlees<span>Coach</span>
            </Link>
            <p className="footer__tagline">
              Professionele kennis voor een gezond tandvlees en gebit.
            </p>
          </div>

          <div className="footer__nav">
            <div className="footer__nav-group">
              <p className="footer__nav-title">Cursus</p>
              <Link to="/" className="footer__nav-link">Start</Link>
              <Link to="/cursus/binnen-6-weken-gezond-tandvlees-en-een-gezond-gebit" className="footer__nav-link">Programma</Link>
              <Link to="/registreren" className="footer__nav-link">Inschrijven</Link>
            </div>

            <div className="footer__nav-group">
              <p className="footer__nav-title">Account</p>
              <Link to="/login" className="footer__nav-link">Inloggen</Link>
              <Link to="/registreren" className="footer__nav-link">Registreren</Link>
              <Link to="/dashboard" className="footer__nav-link">Dashboard</Link>
            </div>

            <div className="footer__nav-group">
              <p className="footer__nav-title">Support</p>
              <Link to="/wachtwoord-vergeten" className="footer__nav-link">Wachtwoord vergeten</Link>
              <a href="mailto:info@tandvleescoach.nl" className="footer__nav-link">Contact</a>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copy">&copy; {year} Tandvlees Coach. Alle rechten voorbehouden.</p>
          <div className="footer__legal">
            <Link to="/privacy" className="footer__legal-link">Privacybeleid</Link>
            <Link to="/algemene-voorwaarden" className="footer__legal-link">Algemene voorwaarden</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
