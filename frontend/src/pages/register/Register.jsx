import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useAuth } from '../../context/useAuth.js';
import './Register.css';

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
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
    setLoading(true);
    setError('');
    setSuccess('');

    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setError('Wachtwoord moet minimaal 8 tekens, een hoofdletter en een cijfer bevatten.');
      setLoading(false);
      return;
    }

    try {
      await register(form);
      setSuccess('Account aangemaakt. Controleer uw e-mail voor de verificatielink.');
      setForm({ name: '', email: '', password: '' });
    } catch (err) {
      if (err.status === 409) {
        setError('Dit e-mailadres is al in gebruik. Wil je inloggen?');
      } else {
        setError(err.message || 'Registratie mislukt. Probeer het opnieuw.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page-wrapper">
      <div className="auth-page__inner">
        <div ref={cardRef} className="auth-card">
          <div className="auth-card__header">
            <p className="auth-card__label">Beginnen</p>
            <h1 className="auth-card__title">Account aanmaken</h1>
          </div>

          {error && (
            <div className="auth-error" role="alert">{error}</div>
          )}

          {success && (
            <div className="auth-success" role="status">{success}</div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="form-field">
                <label htmlFor="name" className="form-field__label">Volledige naam</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="form-field__input"
                  placeholder="Jan de Vries"
                  autoComplete="name"
                  required
                />
              </div>

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
                <label htmlFor="password" className="form-field__label">Wachtwoord</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="form-field__input"
                  placeholder="Minimaal 8 tekens"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
                <span className="form-field__hint">
                  Minimaal 8 tekens, een hoofdletter en een cijfer.
                </span>
              </div>

              <button
                type="submit"
                className="btn btn--primary auth-form__submit"
                disabled={loading}
              >
                {loading ? 'Account aanmaken...' : 'Account aanmaken'}
              </button>
            </form>
          )}

          <p className="auth-card__footer">
            Al een account?{' '}
            <Link to="/login" className="auth-card__footer-link">
              Inloggen
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
