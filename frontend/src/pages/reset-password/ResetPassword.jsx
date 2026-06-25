import { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { auth } from '../../api.js';
import './ResetPassword.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const token          = searchParams.get('token');

  const [form, setForm]       = useState({ password: '', confirm: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 }
    );
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirm) {
      setError('Wachtwoorden komen niet overeen.');
      return;
    }

    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setError('Wachtwoord moet minimaal 8 tekens, een hoofdletter en een cijfer bevatten.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await auth.resetPassword({ token, password: form.password });
      navigate('/login', { state: { message: 'Wachtwoord succesvol gewijzigd. U kunt nu inloggen.' } });
    } catch (err) {
      setError(err.message || 'Resetlink is verlopen of ongeldig. Vraag een nieuwe aan.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page page-wrapper">
        <div className="auth-page__inner">
          <div className="auth-card">
            <div className="auth-error">
              Ongeldige resetlink. Vraag een nieuwe aan via{' '}
              <Link to="/wachtwoord-vergeten" className="auth-card__footer-link">
                wachtwoord vergeten
              </Link>.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page page-wrapper">
      <div className="auth-page__inner">
        <div ref={cardRef} className="auth-card">
          <div className="auth-card__header">
            <p className="auth-card__label">Nieuw wachtwoord</p>
            <h1 className="auth-card__title">Wachtwoord instellen</h1>
          </div>

          {error && (
            <div className="auth-error" role="alert">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-field">
              <label htmlFor="password" className="form-field__label">Nieuw wachtwoord</label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="form-field__input"
                placeholder="Minimaal 8 tekens, hoofdletter en cijfer"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="confirm" className="form-field__label">Herhaal wachtwoord</label>
              <input
                id="confirm"
                type="password"
                name="confirm"
                value={form.confirm}
                onChange={handleChange}
                className="form-field__input"
                placeholder="Herhaal uw nieuwe wachtwoord"
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn--primary auth-form__submit"
              disabled={loading}
            >
              {loading ? 'Opslaan...' : 'Wachtwoord opslaan'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
