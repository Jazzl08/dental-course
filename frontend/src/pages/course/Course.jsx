import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { courses, enrollments } from '../../api.js';
import { useAuth } from '../../context/useAuth.js';
import './Course.css';

gsap.registerPlugin(ScrollTrigger);

export default function Course() {
  const { slug }     = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { isAuthenticated } = useAuth();

  const [course,     setCourse]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [enrolled,   setEnrolled]   = useState(false);
  const [openWeek,   setOpenWeek]   = useState(0);
  const pageRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await courses.getBySlug(slug);
        const course = data.course || data;
        setCourse(course);

        if (isAuthenticated && course?.id) {
          try {
            await enrollments.getOne(course.id);
            setEnrolled(true);
          } catch (err) {
            if (err.status === 404 || err.status === 403 || !err.status) {
              setEnrolled(false);
            }
          }
        }
      } catch {
        setError('Cursus niet gevonden.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, isAuthenticated]);

  useEffect(() => {
    if (!course || !pageRef.current) return;
    const ctx = gsap.context(() => {
      const topbarItems = pageRef.current.querySelectorAll('.course-topbar__left > *');
      if (topbarItems.length) {
        gsap.fromTo(topbarItems,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', delay: 0.1 }
        );
      }
      gsap.utils.toArray('.reveal').forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 32 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }
        );
      });
    }, pageRef.current);
    return () => ctx.revert();
  }, [course]);

  const handleEnroll = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    if (enrolled) {
      navigate('/dashboard');
      return;
    }
    navigate(`/winkelwagen?cursusId=${course.id}`);
  };

  const formatPrice = (cents) =>
    (cents / 100).toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' });

  if (loading) return <div className="course-loading page-wrapper"><p>Laden</p></div>;

  if (error && !course) {
    return (
      <div className="course-error page-wrapper">
        <div className="container">
          <p>{error}</p>
          <Link to="/" className="btn btn--outline" style={{ marginTop: '1.5rem' }}>
            Terug naar start
          </Link>
        </div>
      </div>
    );
  }

  const weeks = course?.weeks || [];

  return (
    <main ref={pageRef} className="page-wrapper course-page">

      <div className="course-topbar">
        <div className="container">
          <div className="course-topbar__inner">
            <div className="course-topbar__left">
              <p className="course-topbar__eyebrow">{course.level || 'Beginners cursus'}</p>
              <h1 className="course-topbar__title">{course.title}</h1>
              <div className="course-topbar__meta">
                <div className="course-meta-stat">
                  <span className="course-meta-stat__val">{weeks.length || 6}</span>
                  <span className="course-meta-stat__lbl">Weken</span>
                </div>
                <div className="course-meta-sep" />
                <div className="course-meta-stat">
                  <span className="course-meta-stat__val">
                    {weeks.reduce((t, w) => t + (w.lessons?.length || 0), 0) || 24}
                  </span>
                  <span className="course-meta-stat__lbl">Lessen</span>
                </div>
                <div className="course-meta-sep" />
                <div className="course-meta-stat">
                  <span className="course-meta-stat__val">{course.duration_min || 360}</span>
                  <span className="course-meta-stat__lbl">Minuten</span>
                </div>
              </div>
            </div>

            <div className="course-topbar__price-block">
              <div>
                <div className="course-topbar__price">{formatPrice(course.price_cents || 7999)}</div>
                <div className="course-topbar__price-sub">Eenmalig · levenslange toegang</div>
              </div>
              <div>
                <button
                  onClick={handleEnroll}
                  className={`course-topbar__enroll${enrolled ? ' course-topbar__enroll--enrolled' : ''}`}
                >
                  {enrolled ? 'Ga naar dashboard' : 'Nu inschrijven'}
                </button>
                {!isAuthenticated && (
                  <p className="course-topbar__login-note">
                    Al ingeschreven?{' '}
                    <Link
                      to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
                      className="course-topbar__login-link"
                    >
                      Inloggen
                    </Link>
                  </p>
                )}
                {enrolled && (
                  <p className="course-topbar__login-note" style={{ color: 'rgba(34,181,160,0.8)' }}>
                    Je hebt al toegang tot deze cursus.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {weeks.length > 0 && (
        <section className="curriculum">
          <div className="container">
            <div className="curriculum__header reveal">
              <p className="curriculum__eyebrow">Programma</p>
              <h2 className="curriculum__title">Wat staat er op het programma?</h2>
            </div>

            <div className="curriculum__weeks">
              {weeks.map((week, index) => (
                <div key={week.id} className="curriculum-week reveal">
                  <button
                    className={`curriculum-week__header ${openWeek === index ? 'curriculum-week__header--open' : ''}`}
                    onClick={() => setOpenWeek(openWeek === index ? -1 : index)}
                    aria-expanded={openWeek === index}
                  >
                    <span className="curriculum-week__number-badge">
                      {String(week.week_number || index + 1).padStart(2, '0')}
                    </span>
                    <span className="curriculum-week__title">{week.title}</span>
                    <span className="curriculum-week__toggle">
                      {openWeek === index ? 'Sluiten' : 'Bekijken'}
                    </span>
                  </button>

                  {openWeek === index && (
                    <div className="curriculum-week__body">
                      {week.description && (
                        <p className="curriculum-week__desc">{week.description}</p>
                      )}
                      {week.lessons?.length > 0 && (
                        <ul className="curriculum-week__lessons">
                          {week.lessons.map((lesson, li) => (
                            <li key={lesson.id} className="curriculum-lesson">
                              <span className="curriculum-lesson__num">{String(li + 1).padStart(2, '0')}</span>
                              <span className="curriculum-lesson__title">{lesson.title}</span>
                              <span className="curriculum-lesson__type">{lesson.lesson_type}</span>
                              {lesson.duration_min && (
                                <span className="curriculum-lesson__duration">{lesson.duration_min} min</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="course-cta">
        <div className="container">
          <div className="course-cta__inner reveal">
            <div>
              <p className="course-cta__eyebrow">Start vandaag</p>
              <h2 className="course-cta__title">Klaar om te beginnen?</h2>
              <p className="course-cta__desc">
                Eenmalige betaling van {formatPrice(course.price_cents || 7999)}.
                Levenslange toegang inclusief certificaat.
              </p>
            </div>
            <button onClick={handleEnroll} className="course-cta__btn">
              {enrolled ? 'Ga naar dashboard' : 'Schrijf je in'}
            </button>
          </div>
        </div>
      </div>

    </main>
  );
}
