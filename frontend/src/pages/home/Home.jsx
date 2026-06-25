import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { courses } from '../../api.js';
import './Home.css';

const imgBefore = '/ontstokentandvlees.jpg';
const imgAfter  = '/gezondgebit.png';

gsap.registerPlugin(ScrollTrigger);

function BeforeAfterSlider() {
  const trackRef  = useRef(null);
  const [position, setPosition] = useState(50);
  const dragging  = useRef(false);
  const hasMoved  = useRef(false);

  const getPercent = useCallback((clientX) => {
    if (!trackRef.current) return 50;
    const rect = trackRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      hasMoved.current = true;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      setPosition(getPercent(x));
    };
    const onUp = () => { dragging.current = false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
  }, [getPercent]);

  const handleTrackClick = (e) => {
    if (hasMoved.current) { hasMoved.current = false; return; }
    setPosition(getPercent(e.clientX));
  };

  return (
    <div className="ba-wrap">
      <div className="ba-track" ref={trackRef} onClick={handleTrackClick} role="none">
        <div className="ba-after">
          <img src={imgAfter} alt="Gezond gebit na het programma" />
          <span className="ba-label ba-label--after">Na</span>
        </div>
        <div className="ba-before" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <img src={imgBefore} alt="Gebit voor het programma" className="ba-before-img" />
          <span className="ba-label ba-label--before">Vóór</span>
        </div>
        <div
          className="ba-handle"
          style={{ left: `${position}%` }}
          onMouseDown={(e) => { dragging.current = true; hasMoved.current = false; e.preventDefault(); e.stopPropagation(); }}
          onTouchStart={() => { dragging.current = true; }}
          role="slider"
          tabIndex={0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          aria-label="Vergelijkingsschuif voor/na"
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft')  setPosition(p => Math.max(0, p - 5));
            if (e.key === 'ArrowRight') setPosition(p => Math.min(100, p + 5));
          }}
        >
          <div className="ba-line" />
          <div className="ba-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [courseList, setCourseList] = useState([]);
  const [loading, setLoading]       = useState(true);
  const spotlightRef = useRef(null);
  const cardsRef     = useRef(null);

  useEffect(() => {
    courses.getAll()
      .then(data => setCourseList(Array.isArray(data) ? data : data.courses || []))
      .catch(() => setCourseList([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!spotlightRef.current) return;
    const ctx = gsap.context(() => {
      const path = spotlightRef.current.querySelector('#sp-path');
      if (path) {
        const len = path.getTotalLength();
        path.style.strokeDasharray  = len;
        path.style.strokeDashoffset = len;
        gsap.to(path, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: { trigger: spotlightRef.current, start: 'top top', end: 'bottom bottom', scrub: 1.5 },
        });
      }
      gsap.utils.toArray('.sp-card--dark, .sp-card--solution, .ba-wrap, .sp-img-frame, .sp-pullquote, .sp-feat').forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 36 },
          { opacity: 1, y: 0, duration: .85, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true } }
        );
      });
    }, spotlightRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (loading || !cardsRef.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.home-course-card').forEach((card, i) => {
        gsap.fromTo(card,
          { opacity: 0, y: 28 },
          { opacity: 1, y: 0, duration: .7, ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 88%', once: true },
            delay: i * 0.07 }
        );
      });
    }, cardsRef);
    return () => ctx.revert();
  }, [loading]);

  const formatPrice = (cents) =>
    ((cents ?? 7999) / 100).toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' });

  return (
    <main className="home-page">

      <section className="hm-hero" id="hero">
        <div className="hm-hero__bg">
          <img src="/glimlach.png" alt="Gezond tandvlees en gebit" className="hm-hero__photo" />
        </div>

        <div className="hm-hero__shape" aria-hidden="true" />

        <div className="hm-hero__content">
          <h1 className="hm-hero__title">
            <span>gezond</span>
            <span>tandvlees</span>
            <span>en gebit</span>
            <em>binnen 6 weken</em>
          </h1>
          <div className="hm-hero__pills">
            <p className="hm-hero__pills-label">Direct naar:</p>
            <div className="hm-hero__pills-row">
              <a href="#programma" className="hm-hero__pill">
                het programma
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </a>
              <a href="#cursussen" className="hm-hero__pill">
                cursussen
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </a>
              <Link to="/registreren" className="hm-hero__pill hm-hero__pill--solid">
                inschrijven
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
            </div>
          </div>
        </div>

        <a href="#programma" className="hm-hero__scroll" aria-label="Scroll omlaag">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
          </svg>
        </a>
      </section>

      <section ref={spotlightRef} className="hm-spotlight" id="programma">

        <div className="sp-svg" aria-hidden="true">
          <svg viewBox="0 0 360 1400" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            <path id="sp-path"
              d="M295.573 35C194.867 50 95 73 95 170C95 267 361 242 321 350C281 458 -41 548 52 385C145 222 291 451 238 591C185 731 95 790 183 863C271 936 338 994 200 1090C130 1165 155 1270 240 1360"
              stroke="#3EB489" strokeWidth="65" strokeLinecap="round" fill="none"/>
          </svg>
        </div>

          <div className="sp-block sp-block--split">
            <div className="sp-block__main">
              <div className="sp-card--dark">
                <span className="sp-badge sp-badge--red">Het probleem</span>
                <h2>Bloedend tandvlees, gevoelige tanden of slechte adem?</h2>
                <p>Veel mensen lopen jarenlang rond met klachten die ze voor lief nemen. Dit zijn signalen dat er iets misgaat — en ze worden alleen maar erger als je niets doet.</p>
                <ul className="sp-list">
                  <li>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    Bloedend tandvlees bij het poetsen
                  </li>
                  <li>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    Tanden gevoelig voor koud of warm
                  </li>
                  <li>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    Nare smaak of slechte adem
                  </li>
                </ul>
              </div>
            </div>
            <div className="sp-block__aside sp-block__aside--offset">
              <BeforeAfterSlider />
            </div>
          </div>

          <div className="sp-block sp-block--center">
            <div className="sp-pullquote">
              <span className="sp-pullquote__num">93<span className="sp-pullquote__pct">%</span></span>
              <div className="sp-pullquote__text">
                <p>van de gebruikers ziet aantoonbare verbetering<br />binnen de eerste drie weken van het programma.</p>
                <span className="sp-pullquote__source">— Gebruikersonderzoek 2024</span>
              </div>
            </div>
          </div>

          <div className="sp-block sp-block--overlap">
            <div className="sp-block__img">
              <div className="sp-img-frame">
                <img src="/glimlach.png" alt="Cursusprogramma stap voor stap" />
              </div>
            </div>
            <div className="sp-block__card">
              <div className="sp-card--solution">
                <span className="sp-badge sp-badge--green">De oplossing</span>
                <h2>Een bewezen methode, stap voor stap uitgelegd</h2>
                <p>In 6 weken leer je precies hoe je thuis zorgt voor gezond tandvlees en een schoon gebit. Van de juiste poetstechniek tot voeding die ontstekingen remt.</p>
                <div className="sp-steps">
                  {[
                    { n:'01', t:'Inzicht',   s:'Begrijp jouw mondgezondheid' },
                    { n:'02', t:'Routine',   s:'Juiste poets- en flosroutine' },
                    { n:'03', t:'Voeding',   s:'Eet gericht voor gezond tandvlees' },
                    { n:'04', t:'Onderhoud', s:'Langdurig resultaat behouden' },
                  ].map(({ n, t, s }) => (
                    <div key={n} className="sp-step">
                      <span className="sp-step-num">{n}</span>
                      <div className="sp-step-body">
                        <strong>{t}</strong>
                        <span>{s}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="sp-block sp-block--feats">
            <div className="sp-feat sp-feat--light">
              <div className="sp-feat__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <h3>15 minuten per dag</h3>
              <p>Geen urenlange sessies. Korte, gerichte lessen die je moeiteloos inpast in je dag.</p>
              <span className="sp-feat__tag">Eigen tempo</span>
            </div>
            <div className="sp-feat sp-feat--dark">
              <div className="sp-feat__stat">
                <span>6</span><small>weken</small>
              </div>
              <h3>Volledig programma</h3>
              <p>Een complete aanpak van oorzaak tot resultaat. Geen losse tips — een coherent plan.</p>
              <span className="sp-feat__tag">Stap voor stap</span>
            </div>
            <div className="sp-feat sp-feat--light">
              <div className="sp-feat__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3>Thuis, zonder tandarts</h3>
              <p>Alles wat je nodig hebt zit in het programma. Geen dure behandelingen of abonnementen.</p>
              <span className="sp-feat__tag">Direct toepasbaar</span>
            </div>
          </div>

      </section>

      <section id="cursussen" className="home-courses" ref={cardsRef}>
        <div className="container">
          <div className="home-courses__header">
            <p className="home-courses__eyebrow">Ons aanbod</p>
            <h2 className="home-courses__title">Beschikbare cursussen</h2>
            <p className="home-courses__subtitle">
              Kies de cursus die bij uw leerdoelen past en start vandaag nog.
            </p>
          </div>

          {loading && (
            <div className="home-courses__loading">
              {[1,2,3].map(i => <div key={i} className="home-courses__skeleton" />)}
            </div>
          )}
          {!loading && courseList.length === 0 && (
            <p className="home-courses__empty">Er zijn momenteel geen cursussen beschikbaar.</p>
          )}
          {!loading && courseList.length > 0 && (
            <div className="home-courses__grid">
              {courseList.map((course) => (
                <Link key={course.id} to={`/cursus/${course.slug}`} className="home-course-card">
                  <div className="home-course-card__top">
                    <span className="home-course-card__level">{course.level || 'Bijscholing'}</span>
                    <span className="home-course-card__price">{formatPrice(course.price_cents)}</span>
                  </div>
                  <h3 className="home-course-card__title">{course.title}</h3>
                  {course.description && <p className="home-course-card__desc">{course.description}</p>}
                  <div className="home-course-card__meta">
                    {course.duration_min != null && (
                      <span className="home-course-card__meta-item">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {course.duration_min} min
                      </span>
                    )}
                  </div>
                  <div className="home-course-card__cta">
                    Meer informatie
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="home-cta">
        <div className="container">
          <div className="home-cta__inner">
            <div>
              <h2 className="home-cta__title">Klaar om te starten?</h2>
              <p className="home-cta__desc">Maak een gratis account aan en begin vandaag met leren.</p>
            </div>
            <div className="home-cta__actions">
              <Link to="/registreren" className="btn btn--cta-primary">Account aanmaken</Link>
              <Link to="/login" className="btn btn--cta-outline">Inloggen</Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
