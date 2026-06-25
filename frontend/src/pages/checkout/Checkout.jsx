import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { payments } from '../../api.js';
import { useAuth } from '../../context/useAuth.js';
import './Checkout.css';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [status, setStatus] = useState('loading');
  const [courseName, setCourseName] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!orderId) { navigate('/'); return; }
    if (!isAuthenticated) { navigate('/login'); return; }

    payments.getStatus(orderId)
      .then(data => {
        const pay = data.payment || data;
        if (pay.course_title) setCourseName(pay.course_title);
        setStatus(pay.status || 'unknown');
      })
      .catch(() => setStatus('error'));
  }, [orderId, isAuthenticated, authLoading, navigate]);

  if (status === 'loading') {
    return (
      <main className="page-wrapper checkout-page">
        <div className="container checkout-container">
          <div className="checkout-card checkout-card--loading">
            <div className="checkout-spinner" />
            <p className="checkout-loading-text">Betaling controleren…</p>
          </div>
        </div>
      </main>
    );
  }

  if (status === 'paid') {
    return (
      <main className="page-wrapper checkout-page">
        <div className="container checkout-container">
          <div className="checkout-card checkout-card--success" style={{ opacity: 1 }}>
            <div className="checkout-checkmark" aria-hidden="true"><span /></div>
            <p className="checkout-card__label">Betaling geslaagd</p>
            <h1 className="checkout-card__title">Bedankt voor je aankoop!</h1>
            <p className="checkout-card__desc">
              Je betaling is ontvangen en je hebt nu direct toegang tot de cursus.
              Je ontvangt ook een bevestigingsmail.
            </p>
            {courseName && (
              <div className="checkout-course-badge">
                <span className="checkout-course-badge__label">Ingeschreven voor</span>
                <span className="checkout-course-badge__title">{courseName}</span>
              </div>
            )}
            <div className="checkout-actions">
              <Link to="/dashboard" className="btn btn--primary checkout-actions__primary">
                Naar mijn dashboard
              </Link>
              <Link to="/" className="btn btn--outline">Terug naar start</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (status === 'canceled' || status === 'cancelled') {
    return (
      <main className="page-wrapper checkout-page">
        <div className="container checkout-container">
          <div className="checkout-card checkout-card--timeout" style={{ opacity: 1 }}>
            <p className="checkout-card__label">Betaling geannuleerd</p>
            <h1 className="checkout-card__title">Betaling niet voltooid</h1>
            <p className="checkout-card__desc">
              Je hebt de betaling geannuleerd. Je hebt geen toegang gekregen tot de cursus.
              Je kunt het opnieuw proberen wanneer je wilt.
            </p>
            <div className="checkout-actions">
              <Link to="/cursus/binnen-6-weken-gezond-tandvlees-en-een-gezond-gebit" className="btn btn--primary checkout-actions__primary">
                Opnieuw proberen
              </Link>
              <Link to="/" className="btn btn--outline">Terug naar start</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (status === 'failed' || status === 'expired') {
    return (
      <main className="page-wrapper checkout-page">
        <div className="container checkout-container">
          <div className="checkout-card checkout-card--failed" style={{ opacity: 1 }}>
            <div className="checkout-cross" aria-hidden="true"><span /><span /></div>
            <p className="checkout-card__label">
              {status === 'failed' ? 'Betaling mislukt' : 'Betaling verlopen'}
            </p>
            <h1 className="checkout-card__title">Er ging iets mis</h1>
            <p className="checkout-card__desc">
              {status === 'failed'
                ? 'De betaling is mislukt. Controleer je betaalgegevens en probeer het opnieuw.'
                : 'De betaling is verlopen. Probeer het opnieuw via de cursuspagina.'}
            </p>
            <div className="checkout-actions">
              <Link to="/cursus/binnen-6-weken-gezond-tandvlees-en-een-gezond-gebit" className="btn btn--primary checkout-actions__primary">
                Opnieuw proberen
              </Link>
              <Link to="/" className="btn btn--outline">Terug naar start</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (status === 'pending' || status === 'open' || status === 'authorized') {
    return (
      <main className="page-wrapper checkout-page">
        <div className="container checkout-container">
          <div className="checkout-card checkout-card--pending" style={{ opacity: 1 }}>
            <div className="checkout-pulse" aria-hidden="true" />
            <p className="checkout-card__label">Betaling in behandeling</p>
            <h1 className="checkout-card__title">We verwerken je betaling</h1>
            <p className="checkout-card__desc">
              Dit kan even duren. Je ontvangt een bevestigingsmail zodra de betaling is verwerkt.
              Controleer ook je dashboard.
            </p>
            <div className="checkout-actions">
              <Link to="/dashboard" className="btn btn--primary checkout-actions__primary">
                Naar mijn dashboard
              </Link>
              <Link to="/" className="btn btn--outline">Terug naar start</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-wrapper checkout-page">
      <div className="container checkout-container">
        <div className="checkout-card checkout-card--timeout" style={{ opacity: 1 }}>
          <p className="checkout-card__label">Onbekende status</p>
          <h1 className="checkout-card__title">Iets ging mis</h1>
          <p className="checkout-card__desc">
            We konden de betalingsstatus niet ophalen. Controleer je dashboard of neem contact op.
          </p>
          <div className="checkout-actions">
            <Link to="/dashboard" className="btn btn--primary checkout-actions__primary">
              Naar mijn dashboard
            </Link>
            <Link to="/" className="btn btn--outline">Terug naar start</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
