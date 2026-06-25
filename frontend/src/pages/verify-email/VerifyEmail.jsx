import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { auth } from '../../api.js';
import './VerifyEmail.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status,  setStatus]  = useState(() => token ? 'verifying' : 'invalid');
  const [error,   setError]   = useState('');
  const cardRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    auth.verifyEmail({ token })
      .then(() => setStatus('success'))
      .catch((err) => {
        setError(err.message || 'De verificatielink is ongeldig of verlopen.');
        setStatus('error');
      });
  }, [token]);

  useEffect(() => {
    if (status === 'verifying' || !cardRef.current) return;
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }
    );
  }, [status]);

  return (
    <div className="verify-page page-wrapper">
      <div className="verify-inner">

        {status === 'verifying' && (
          <div className="verify-card verify-card--loading">
            <div className="verify-spinner" />
            <p className="verify-loading-text">E-mail verifiëren</p>
          </div>
        )}

        {status === 'success' && (
          <div ref={cardRef} className="verify-card verify-card--success">
            <div className="verify-icon verify-icon--check">
              <span />
            </div>
            <p className="verify-card__label">Geverifieerd</p>
            <h1 className="verify-card__title">E-mail bevestigd</h1>
            <p className="verify-card__desc">
              Uw e-mailadres is succesvol geverifieerd. U heeft nu volledige toegang tot uw account.
            </p>
            <div className="verify-actions">
              <Link to="/login" className="btn btn--primary verify-actions__btn">
                Inloggen
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div ref={cardRef} className="verify-card verify-card--error">
            <div className="verify-icon verify-icon--cross">
              <span /><span />
            </div>
            <p className="verify-card__label">Mislukt</p>
            <h1 className="verify-card__title">Verificatie mislukt</h1>
            <p className="verify-card__desc">{error}</p>
            <div className="verify-actions">
              <ResendForm />
              <Link to="/login" className="btn btn--outline">
                Terug naar inloggen
              </Link>
            </div>
          </div>
        )}

        {status === 'invalid' && (
          <div ref={cardRef} className="verify-card verify-card--error">
            <p className="verify-card__label">Ongeldige link</p>
            <h1 className="verify-card__title">Geen verificatietoken</h1>
            <p className="verify-card__desc">
              Deze link is ongeldig. Vraag een nieuwe verificatiemail aan via de knop hieronder.
            </p>
            <div className="verify-actions">
              <ResendForm />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function ResendForm() {
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await auth.resendVerification({ email });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Kon de e-mail niet versturen.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <p className="verify-resend-sent">
        Als dit e-mailadres bij ons bekend is, ontvangt u een nieuwe verificatielink.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="verify-resend-form">
      <p className="verify-resend-label">Nieuwe verificatiemail aanvragen</p>
      {error && <p className="verify-resend-error">{error}</p>}
      <div className="verify-resend-row">
        <label htmlFor="resend-email" className="sr-only">E-mailadres</label>
        <input
          id="resend-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-field__input verify-resend-input"
          placeholder="uw@email.nl"
          required
        />
        <button type="submit" className="btn btn--accent" disabled={loading}>
          {loading ? 'Versturen...' : 'Versturen'}
        </button>
      </div>
    </form>
  );
}
