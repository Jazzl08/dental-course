import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { auth } from '../../api.js';
import './ForgotPassword.css';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 }
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await auth.forgotPassword({ email });
      setSuccess('Als dit e-mailadres bij ons bekend is, ontvangt u een link om uw wachtwoord te resetten.');
    } catch (err) {
      setError(err.message || 'Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page-wrapper">
      <div className="auth-page__inner">
        <div ref={cardRef} className="auth-card">
          <div className="auth-card__header">
            <p className="auth-card__label">Toegang herstellen</p>
            <h1 className="auth-card__title">Wachtwoord vergeten</h1>
          </div>

          {error && (
            <div className="auth-error" role="alert">{error}</div>
          )}

          {success ? (
            <div className="auth-success" role="status">
              <p style={{ marginBottom: '1rem' }}>{success}</p>
              <Link to="/login" className="auth-card__footer-link">Terug naar inloggen</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <p className="fp-intro">
                Voer uw e-mailadres in. Als het bij ons bekend is, sturen wij u een
                resetlink toe.
              </p>

              <div className="form-field">
                <label htmlFor="email" className="form-field__label">E-mailadres</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-field__input"
                  placeholder="naam@voorbeeld.nl"
                  autoComplete="email"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn--primary auth-form__submit"
                disabled={loading}
              >
                {loading ? 'Versturen...' : 'Resetlink versturen'}
              </button>
            </form>
          )}

          <p className="auth-card__footer">
            <Link to="/login" className="auth-card__footer-link">
              Terug naar inloggen
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
