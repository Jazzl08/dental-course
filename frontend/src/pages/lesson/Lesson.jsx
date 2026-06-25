import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { learning } from '../../api.js';
import './Lesson.css';

export default function Lesson() {
  const { courseId, lessonId } = useParams();

  const [lessonData, setLessonData]     = useState(null);
  const [loading,    setLoading]        = useState(true);
  const [error,      setError]          = useState('');
  const [completed,  setCompleted]      = useState(false);
  const [completing, setCompleting]     = useState(false);

  const [quizAnswers,  setQuizAnswers]  = useState({});
  const [quizResult,   setQuizResult]   = useState(null);
  const [submittingQ,  setSubmittingQ]  = useState(false);

  const contentRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      setCompleted(false);
      setQuizResult(null);
      setQuizAnswers({});

      try {
        const data = await learning.getLesson(courseId, lessonId);
        const lesson = data.lesson || data;
        setLessonData(lesson);
        setCompleted(!!lesson.completedAt);
      } catch (err) {
        setError(err.message || 'Les kon niet worden geladen.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, lessonId]);

  useEffect(() => {
    if (loading || !contentRef.current) return;

    gsap.fromTo(contentRef.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }
    );
  }, [loading, lessonId]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await learning.completeLesson(lessonId);
      setCompleted(true);
    } catch (err) {
      setError(err.message || 'Kon les niet markeren als voltooid.');
    } finally {
      setCompleting(false);
    }
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    const quiz = lessonData?.quiz;
    if (!quiz) return;

    setSubmittingQ(true);

    const answers = quiz.questions.map((q) => ({
      questionId: q.id,
      answer: quizAnswers[q.id] || '',
    }));

    try {
      const data = await learning.submitQuiz(quiz.id, { answers });
      setQuizResult(data.result || data);
    } catch (err) {
      setError(err.message || 'Toets kon niet worden ingediend.');
    } finally {
      setSubmittingQ(false);
    }
  };

  if (loading) {
    return (
      <div className="lesson-loading page-wrapper">
        <p>Les laden</p>
      </div>
    );
  }

  if (error && !lessonData) {
    return (
      <div className="lesson-error page-wrapper">
        <div className="container">
          <p>{error}</p>
          <Link to="/dashboard" className="btn btn--outline" style={{ marginTop: '1.5rem' }}>
            Naar dashboard
          </Link>
        </div>
      </div>
    );
  }

  const lesson   = lessonData || {};
  const quiz     = lessonData?.quiz;
  const isLocked = !!lesson.isLocked;

  return (
    <main className="lesson-layout page-wrapper">
      <aside className="lesson-sidebar">
        <div className="lesson-sidebar__inner">
          <Link to="/dashboard" className="lesson-sidebar__back">
            Dashboard
          </Link>

          <div className="lesson-sidebar__week">
            <p className="lesson-sidebar__week-label">
              {lesson.weekTitle || `Week ${lesson.weekNumber || ''}`}
            </p>
          </div>
        </div>
      </aside>

      <div className="lesson-main" ref={contentRef}>
        {isLocked && (
          <div className="lesson-preview-banner">
            <p className="lesson-preview-banner__text">
              <span className="lesson-preview-banner__label">Voorbeeldweergave.</span>
              U kunt de inhoud lezen, maar om de les te voltooien moet u eerst de vorige les afronden.{' '}
              <Link to="/dashboard" className="lesson-preview-banner__link">
                Terug naar dashboard
              </Link>
            </p>
          </div>
        )}

        <div className="lesson-main__inner">
          <header className="lesson-header">
            <p className="lesson-type">{lesson.lessonType}</p>
            <h1 className="lesson-title">{lesson.title}</h1>
            {lesson.durationMin && (
              <p className="lesson-duration">{lesson.durationMin} minuten</p>
            )}
          </header>

          {lesson.videoUrl && (
            <div className="lesson-video">
              <video
                src={lesson.videoUrl}
                controls
                className="lesson-video__player"
                preload="metadata"
              />
            </div>
          )}

          {lesson.content && (
            <div className="lesson-content">
              <div className="lesson-content__body">
                {lesson.content.split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}

          {lesson.lessonType === 'download' && lesson.downloadUrl && (
            <div className="lesson-download">
              <p className="lesson-download__label">Downloadbaar bestand</p>
              <a
                href={lesson.downloadUrl}
                download
                className="btn btn--outline"
                target="_blank"
                rel="noreferrer"
              >
                Bestand downloaden
              </a>
            </div>
          )}

          {lesson.lessonType === 'assignment' && lesson.assignmentPrompt && (
            <div className="lesson-assignment">
              <p className="lesson-assignment__label">Opdracht</p>
              <div className="lesson-assignment__prompt">{lesson.assignmentPrompt}</div>
            </div>
          )}

          {quiz && !quizResult && (
            <div className="lesson-quiz">
              <header className="lesson-quiz__header">
                <p className="lesson-quiz__label">Kennistoets</p>
                <h2 className="lesson-quiz__title">{quiz.title}</h2>
                <p className="lesson-quiz__hint">Behaalde score van {quiz.passPct ?? 70}% vereist.</p>
              </header>

              <form onSubmit={handleQuizSubmit} className="quiz-form">
                {quiz.questions?.map((q, qi) => (
                  <div key={q.id} className="quiz-question">
                    <p className="quiz-question__num">Vraag {qi + 1}</p>
                    <p className="quiz-question__text">{q.question}</p>
                    <div className="quiz-question__options">
                      {q.options?.map((opt, oi) => (
                        <label key={oi} className="quiz-option">
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            value={opt}
                            checked={quizAnswers[q.id] === opt}
                            onChange={() => setQuizAnswers(prev => ({ ...prev, [q.id]: opt }))}
                            className="quiz-option__radio"
                          />
                          <span className="quiz-option__label">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={submittingQ}
                >
                  {submittingQ ? 'Indienen...' : 'Toets indienen'}
                </button>
              </form>
            </div>
          )}

          {quizResult && (
            <div className={`quiz-result ${quizResult.passed ? 'quiz-result--passed' : 'quiz-result--failed'}`}>
              <p className="quiz-result__label">
                {quizResult.passed ? 'Geslaagd' : 'Niet geslaagd'}
              </p>
              <p className="quiz-result__score">
                {quizResult.score} van {quizResult.max_score} punten
              </p>
              {!quizResult.passed && (
                <button
                  onClick={() => { setQuizResult(null); setQuizAnswers({}); }}
                  className="btn btn--outline"
                  style={{ marginTop: '1rem' }}
                >
                  Opnieuw proberen
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="auth-error">{error}</div>
          )}

          <footer className="lesson-footer">
            <div className="lesson-footer__nav">
              <Link to="/dashboard" className="btn btn--outline">
                Dashboard
              </Link>

              {completed ? (
                <span className="lesson-footer__done">Voltooid</span>
              ) : isLocked ? (
                <span className="lesson-footer__locked">Voltooi eerst de vorige les</span>
              ) : lesson.lessonType === 'quiz' ? (
                <span className="lesson-footer__locked">Dien de toets in om deze les te voltooien</span>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={completing}
                  className="btn btn--primary"
                >
                  {completing ? 'Opslaan...' : 'Markeer als voltooid'}
                </button>
              )}
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
