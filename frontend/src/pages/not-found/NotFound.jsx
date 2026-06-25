import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="page-wrapper" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="container" style={{ textAlign: 'center', maxWidth: '480px' }}>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.6875rem',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
          marginBottom: 'var(--space-3)',
        }}>
          404
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 400,
          letterSpacing: '-0.03em',
          color: 'var(--color-text)',
          marginBottom: 'var(--space-4)',
        }}>
          Pagina niet gevonden
        </h1>
        <p style={{
          color: 'var(--color-text-muted)',
          lineHeight: 1.7,
          marginBottom: 'var(--space-8)',
        }}>
          De pagina die je zoekt bestaat niet of is nog niet beschikbaar.
        </p>
        <Link to="/" className="btn btn--accent">Terug naar start</Link>
      </div>
    </main>
  );
}
