import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { useAuth } from '../../context/useAuth.js';
import { auth as authApi } from '../../api.js';
import './Login.css';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const params    = new URLSearchParams(location.search);
  const from      = params.get('redirect') || location.state?.from?.pathname || '/dashboard';

  const [form, setForm]               = useState({ email: '', password: '' });
  const [error, setError]             = useState('');
  const successMsg = location.state?.message || '';
  const [loading, setLoading]         = useState(false);
  const [unverified, setUnverified]   = useState(false);
  const [resendSent, setResendSent]   = useState(false);
  const [resending, setResending]     = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 }
    );
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
    if (unverified) setUnverified(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUnverified(false);
    setResendSent(false);

    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.data?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverified(true);
      } else {
        setError(err.message || 'Inloggen mislukt. Controleer uw gegevens.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.resendVerification({ email: form.email });
      setResendSent(true);
    } catch {
      setError('Kon de verificatiemail niet opnieuw versturen.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page page-wrapper">
      <div className="auth-page__inner">
        <div ref={cardRef} className="auth-card">
          <div className="auth-card__header">
            <p className="auth-card__label">Welkom terug</p>
            <h1 className="auth-card__title">Inloggen</h1>
          </div>

          {successMsg && (
            <div className="auth-success" role="status">{successMsg}</div>
          )}

          {error && (
            <div className="auth-error" role="alert">{error}</div>
          )}

          {unverified && (
            <div className="login-unverified" role="alert">
              <p className="login-unverified__text">
                Uw e-mailadres is nog niet geverifieerd. Controleer uw inbox of vraag een
                nieuwe verificatiemail aan.
              </p>
              {resendSent ? (
                <p className="login-unverified__sent">
                  Verificatiemail verstuurd. Controleer uw inbox.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="login-unverified__btn"
                >
                  {resending ? 'Versturen...' : 'Opnieuw versturen'}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-field">
              <label htmlFor="email" className="form-field__label">E-mailadres</label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="form-field__input"
                placeholder="naam@voorbeeld.nl"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-field">
              <div className="form-field__top">
                <label htmlFor="password" className="form-field__label">Wachtwoord</label>
                <Link to="/wachtwoord-vergeten" className="form-field__link">
                  Vergeten?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="form-field__input"
                placeholder="Uw wachtwoord"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn--primary auth-form__submit"
              disabled={loading}
            >
              {loading ? 'Inloggen...' : 'Inloggen'}
            </button>
          </form>

          <p className="auth-card__footer">
            Nog geen account?{' '}
            <Link to="/registreren" className="auth-card__footer-link">
              Registreren
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
