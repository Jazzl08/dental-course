import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { learning } from '../../api.js';
import { useAuth } from '../../context/useAuth.js';
import './Dashboard.css';

function getLessonStatus(lesson, prevCompleted, isFirst) {
  if (lesson.completedAt) return 'done';
  if (isFirst || prevCompleted) return 'current';
  return 'locked';
}

export default function Dashboard() {
  const { user } = useAuth();

  const [dashboard,   setDashboard]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [openWeeks,   setOpenWeeks]   = useState({});
  const pageRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await learning.getDashboard();
        const db = data.dashboard || data;
        setDashboard(db);
        if (db.courses?.[0]?.weeks?.[0]) {
          setOpenWeeks({ [`${db.courses[0].id}-0`]: true });
        }
      } catch (err) {
        setError(err.message || 'Dashboard kon niet worden geladen.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.dashboard-header, .dashboard-stats, .dashboard-courses, .dashboard-empty',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power2.out' }
      );
    }, pageRef);
    return () => ctx.revert();
  }, [loading]);

  const toggleWeek = (key) =>
    setOpenWeeks((prev) => ({ ...prev, [key]: !prev[key] }));

  if (loading) {
    return (
      <div className="dashboard-loading page-wrapper">
        <p>Laden</p>
      </div>
    );
  }

  const courses   = dashboard?.courses || [];
  const stats     = dashboard?.stats   || {};
  const firstName = user?.name?.split(' ')[0] || 'Cursist';

  return (
    <main ref={pageRef} className="page-wrapper dashboard-page">
      <div className="container">

        <header className="dashboard-header">
          <div>
            <p className="dashboard-header__eyebrow">Mijn leeromgeving</p>
            <h1 className="dashboard-header__title">Welkom terug, {firstName}</h1>
          </div>
          {courses[0]?.slug && (
            <Link
              to={`/cursus/${courses[0].slug}`}
              className="btn btn--outline"
            >
              Cursus bekijken
            </Link>
          )}
        </header>

        {error && <div className="auth-error">{error}</div>}

        {courses.length > 0 ? (
          <>
            <div className="dashboard-stats">
              <div className="dash-stat-card dash-stat-card--dark">
                <span className="dash-stat-card__label">Cursussen</span>
                <span className="dash-stat-card__value">{stats.activeCourses ?? courses.length}</span>
              </div>
              <div className="dash-stat-card dash-stat-card--green">
                <span className="dash-stat-card__label">Lessen voltooid</span>
                <span className="dash-stat-card__value">{stats.completedLessons ?? 0}</span>
              </div>
              <div className="dash-stat-card dash-stat-card--gold">
                <span className="dash-stat-card__label">Nog te gaan</span>
                <span className="dash-stat-card__value">{stats.remainingLessons ?? 0}</span>
              </div>
            </div>

            <div className="dashboard-courses">
              {courses.map((course) => (
                <CourseBlock
                  key={course.id}
                  course={course}
                  openWeeks={openWeeks}
                  onToggleWeek={toggleWeek}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="dashboard-empty">
            <div className="dashboard-empty__icon" aria-hidden="true" />
            <h2 className="dashboard-empty__title">Nog geen cursussen</h2>
            <p className="dashboard-empty__desc">
              Schrijf u in voor de cursus en begin vandaag met uw reis naar
              optimale mondgezondheid.
            </p>
            <Link
              to="/cursus/binnen-6-weken-gezond-tandvlees-en-een-gezond-gebit"
              className="btn btn--primary"
            >
              Bekijk de cursus
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}

function CourseBlock({ course, openWeeks, onToggleWeek }) {
  const progress  = course.progressPct || 0;
  const completed = !!course.completedAt;

  const allLessons = (course.weeks || []).flatMap((w) => w.lessons || []);

  return (
    <div className="dashboard-course">
      <div className="dashboard-course__header">
        <div className="dashboard-course__meta">
          <p className={`dashboard-course__badge ${completed ? 'dashboard-course__badge--done' : 'dashboard-course__badge--active'}`}>
            {completed ? 'Afgerond' : 'Bezig'}
          </p>
          <h2 className="dashboard-course__title">{course.title}</h2>
          <div className="dashboard-course__progress-row">
            <div className="progress-track">
              <div className="progress-track__fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="dashboard-course__pct">{progress}%</span>
          </div>
        </div>
        {completed ? (
          <a
            href={`/api/learning/certificates/${course.id}/download`}
            className="btn btn--outline"
            target="_blank"
            rel="noreferrer"
          >
            Certificaat downloaden
          </a>
        ) : null}
      </div>

      <div className="dashboard-weeks">
        {(course.weeks || []).map((week, wi) => {
          const key     = `${course.id}-${wi}`;
          const isOpen  = !!openWeeks[key];
          const weekLessons = week.lessons || [];
          const doneCount   = weekLessons.filter((l) => l.completedAt).length;

          const weekOffset = (course.weeks || [])
            .slice(0, wi)
            .reduce((sum, w) => sum + (w.lessons?.length || 0), 0);

          return (
            <div key={week.id} className="dashboard-week">
              <button
                className="dashboard-week__toggle"
                onClick={() => onToggleWeek(key)}
                aria-expanded={isOpen}
              >
                <span className="dashboard-week__num">Week {week.weekNumber}</span>
                <span className="dashboard-week__title">{week.title}</span>
                <span className="dashboard-week__meta">
                  {doneCount}/{weekLessons.length}
                </span>
                <span className="dashboard-week__chevron">
                  {isOpen ? 'Sluiten' : 'Bekijken'}
                </span>
              </button>

              {isOpen && (
                <div className="dashboard-lessons">
                  {weekLessons.map((lesson, li) => {
                    const globalIdx = weekOffset + li;
                    const prevCompleted = globalIdx === 0 || !!allLessons[globalIdx - 1]?.completedAt;
                    const status = getLessonStatus(lesson, prevCompleted, globalIdx === 0);

                    return (
                      <Link
                        key={lesson.id}
                        to={`/cursus/${course.id}/les/${lesson.id}`}
                        className={`dashboard-lesson${status === 'locked' ? ' dashboard-lesson--locked' : ''}`}
                      >
                        <span className="lesson-pos">
                          {String(lesson.position || li + 1).padStart(2, '0')}
                        </span>
                        <span className={`lesson-status lesson-status--${status === 'locked' ? 'preview' : status}`} aria-hidden="true" />
                        <div className="lesson-info">
                          <span className="lesson-info__title">{lesson.title}</span>
                          <div className="lesson-info__sub">
                            <span className="lesson-info__type">{lesson.lessonType}</span>
                            {lesson.durationMin && (
                              <span className="lesson-info__duration">{lesson.durationMin} min</span>
                            )}
                          </div>
                        </div>
                        {status === 'done' && (
                          <span className="lesson-badge lesson-badge--done">Voltooid</span>
                        )}
                        {status === 'locked' && (
                          <span className="lesson-badge lesson-badge--preview">Voorbeeld</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
