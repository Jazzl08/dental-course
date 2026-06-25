import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { courses, payments } from '../../api.js';
import { useAuth } from '../../context/useAuth.js';
import './Cart.css';


export default function Cart() {
  const [searchParams]              = useSearchParams();
  const courseId                    = searchParams.get('cursusId');
  const navigate                    = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [course,    setCourse]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [paying,    setPaying]    = useState(false);
  const [error,     setError]     = useState('');
  const [enrolled,  setEnrolled]  = useState(false);
  const pageRef = useRef(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/winkelwagen?cursusId=${courseId}` } } });
      return;
    }
    if (!courseId) {
      navigate('/');
      return;
    }

    const load = async () => {
      try {
        const data = await courses.getById(courseId);
        setCourse(data.course || data);
      } catch {
        setError('Cursus kon niet worden geladen.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (loading || !pageRef.current) return;
    gsap.fromTo(
      ['.cart-summary', '.cart-order'],
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.75, stagger: 0.12, ease: 'power3.out' }
    );
  }, [loading]);

  const handlePayment = async () => {
    setPaying(true);
    setError('');
    try {
      const data = await payments.create({ courseId: course.id });
      const url  = data.checkoutUrl || data.checkout_url;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Geen betalingslink ontvangen.');
      }
    } catch (err) {
      if (err.status === 409) {
        setEnrolled(true);
      } else {
        setError(err.message || 'Betaling kon niet worden aangemaakt. Probeer het opnieuw.');
      }
      setPaying(false);
    }
  };

  const formatPrice = (cents) =>
    (cents / 100).toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' });

  if (loading || authLoading) {
    return (
      <div className="cart-loading page-wrapper">
        <p>Laden</p>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="cart-error page-wrapper">
        <div className="container">
          <p>{error}</p>
          <Link to="/" className="btn btn--outline" style={{ marginTop: '1.5rem' }}>Terug</Link>
        </div>
      </div>
    );
  }

  const price = course?.price_cents ?? 7999;

  return (
    <main className="page-wrapper cart-page" ref={pageRef}>
      <div className="container cart-container">

        <header className="cart-header">
          <Link to={`/cursus/${course?.slug || courseId}`} className="cart-header__back">
            Terug naar cursus
          </Link>
          <h1 className="cart-header__title">Bestelling afronden</h1>
        </header>

        <div className="cart-layout">

          <section className="cart-summary">
            <p className="cart-summary__label">Cursus</p>
            <h2 className="cart-summary__title">{course?.title}</h2>
            <p className="cart-summary__desc">{course?.short_desc || course?.description}</p>

            <div className="cart-includes">
              <p className="cart-includes__title">Inbegrepen</p>
              <div className="cart-includes__list">
                <div className="cart-include-item">
                  <span className="cart-include-item__label">Duur</span>
                  <span className="cart-include-item__value">{course?.duration_min ?? 360} minuten</span>
                </div>
                <div className="cart-include-item">
                  <span className="cart-include-item__label">Programma</span>
                  <span className="cart-include-item__value">6 weken, 10 lessen</span>
                </div>
                <div className="cart-include-item">
                  <span className="cart-include-item__label">Niveau</span>
                  <span className="cart-include-item__value" style={{ textTransform: 'capitalize' }}>
                    {course?.level || 'Beginners'}
                  </span>
                </div>
                <div className="cart-include-item">
                  <span className="cart-include-item__label">Certificaat</span>
                  <span className="cart-include-item__value">Ja, na voltooiing</span>
                </div>
                <div className="cart-include-item">
                  <span className="cart-include-item__label">Toegang</span>
                  <span className="cart-include-item__value">Levenslang</span>
                </div>
              </div>
            </div>

            <div className="cart-guarantee">
              <p className="cart-guarantee__title">Veilig betalen</p>
              <p className="cart-guarantee__text">
                U betaalt via Mollie, een gereguleerde betaaldienstverlener. Uw
                betaalgegevens worden nooit door ons opgeslagen. Beschikbare betaalmethodes
                zoals iDEAL, creditcard en Bancontact worden op de betaalpagina getoond.
              </p>
            </div>
          </section>

          <aside className="cart-order">
            <div className="cart-order__inner">
              <p className="cart-order__label">Overzicht</p>

              <div className="cart-order__row">
                <span className="cart-order__item-name">{course?.title}</span>
                <span className="cart-order__item-price">{formatPrice(price)}</span>
              </div>

              <div className="cart-order__divider" />

              <div className="cart-order__total-row">
                <span className="cart-order__total-label">Totaal</span>
                <div className="cart-order__total-price">
                  <span className="cart-order__price-currency">€</span>
                  <span className="cart-order__price-amount">
                    {Math.floor(price / 100)}
                  </span>
                  <span className="cart-order__price-cents">
                    ,{String(price % 100).padStart(2, '0')}
                  </span>
                </div>
              </div>

              <p className="cart-order__vat">Inclusief BTW</p>

              {enrolled && (
                <div className="auth-error cart-order__error">
                  U heeft deze cursus al gekocht.{' '}
                  <Link to="/dashboard" className="checkout-contact-link">Naar dashboard</Link>
                </div>
              )}

              {error && !enrolled && (
                <div className="auth-error cart-order__error">{error}</div>
              )}

              <button
                onClick={handlePayment}
                disabled={paying}
                className="btn btn--primary cart-order__pay-btn"
              >
                {paying ? 'Betalingspagina laden...' : 'Naar betalen'}
              </button>

              <p className="cart-order__secure-note">
                U wordt doorgestuurd naar de beveiligde betaalpagina van Mollie.
              </p>

              <div className="cart-order__methods">
                <span className="cart-order__method">iDEAL</span>
                <span className="cart-order__method">Creditcard</span>
                <span className="cart-order__method">Bancontact</span>
                <span className="cart-order__method">PayPal</span>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}
