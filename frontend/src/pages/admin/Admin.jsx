import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { admin, courses } from '../../api.js';
import { useAuth } from '../../context/useAuth.js';
import './Admin.css';

const tabs = [
  { id: 'dashboard',   label: 'Dashboard'    },
  { id: 'users',       label: 'Gebruikers'   },
  { id: 'payments',    label: 'Betalingen'   },
  { id: 'progress',    label: 'Voortgang'    },
  { id: 'certificates',label: 'Certificaten' },
];

function fmt(cents) {
  return `€${(cents / 100).toFixed(2).replace('.', ',')}`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function DashboardTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    admin.getDashboard().then(r => setData(r.dashboard)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">Laden…</div>;
  if (!data)   return <div className="admin-empty">Geen data beschikbaar.</div>;

  return (
    <>
      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Studenten</div>
          <div className="admin-stat-value admin-stat-value--accent">{data.students}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Actief bezig</div>
          <div className="admin-stat-value">{data.active_students}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Cursussen afgerond</div>
          <div className="admin-stat-value admin-stat-value--green">{data.completed_courses}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Totale omzet</div>
          <div className="admin-stat-value">{fmt(data.revenue_cents)}</div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <span className="admin-card-title">Recente inschrijvingen</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Naam</th>
                <th>E-mail</th>
                <th>Cursus</th>
                <th>Voortgang</th>
                <th>Ingeschreven</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_enrollments.length === 0 && (
                <tr><td colSpan={5} className="admin-empty">Geen inschrijvingen</td></tr>
              )}
              {data.recent_enrollments.map(e => (
                <tr key={e.id}>
                  <td>{e.user.name}</td>
                  <td>{e.user.email}</td>
                  <td>{e.course.title}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="progress-bar">
                        <div className="progress-bar__fill" style={{ width: `${e.progress_pct || 0}%` }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{e.progress_pct || 0}%</span>
                    </div>
                  </td>
                  <td>{fmtDate(e.enrolled_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function UsersTab() {
  const [users, setUsers]     = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([admin.getUsers(), courses.getAll()])
      .then(([ur, cr]) => {
        setUsers(ur.users);
        setAllCourses(cr.courses || []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleBlock(id, isBlocked) {
    await admin.setUserStatus(id, { isBlocked: !isBlocked });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_blocked: !isBlocked } : u));
  }

  async function handleDelete(id, name) {
    if (!confirm(`Gebruiker "${name}" verwijderen?`)) return;
    await admin.deleteUser(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  async function handleAssign(id) {
    if (!allCourses.length) return alert('Geen cursussen gevonden.');
    const courseId = prompt(`Cursus ID toewijzen aan gebruiker:\n${allCourses.map(c => `${c.id}: ${c.title}`).join('\n')}`);
    if (!courseId) return;
    await admin.assignCourse(id, { courseId: parseInt(courseId) });
    alert('Cursus toegewezen!');
  }

  if (loading) return <div className="admin-loading">Laden…</div>;

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <span className="admin-card-title">Alle gebruikers ({users.length})</span>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Naam</th>
              <th>E-mail</th>
              <th>Rol</th>
              <th>Status</th>
              <th>Aangemeld</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'badge--blue' : 'badge--gray'}`}>
                    {u.role}
                  </span>
                </td>
                <td>
                  {u.is_blocked
                    ? <span className="badge badge--red">Geblokkeerd</span>
                    : u.is_verified
                      ? <span className="badge badge--green">Actief</span>
                      : <span className="badge badge--yellow">Niet geverifieerd</span>
                  }
                </td>
                <td>{fmtDate(u.created_at)}</td>
                <td>
                  <div className="admin-actions">
                    <button className="admin-btn admin-btn--primary" onClick={() => handleAssign(u.id)}>
                      Cursus
                    </button>
                    <button className="admin-btn admin-btn--warn" onClick={() => handleBlock(u.id, u.is_blocked)}>
                      {u.is_blocked ? 'Deblokkeer' : 'Blokkeer'}
                    </button>
                    {u.role !== 'admin' && (
                      <button className="admin-btn admin-btn--danger" onClick={() => handleDelete(u.id, u.name)}>
                        Verwijder
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentsTab() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    admin.getPayments().then(r => setData(r)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">Laden…</div>;
  if (!data)   return <div className="admin-empty">Geen data.</div>;

  return (
    <>
      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Totale omzet</div>
          <div className="admin-stat-value admin-stat-value--green">{fmt(data.stats.total_revenue)}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Geslaagd</div>
          <div className="admin-stat-value admin-stat-value--accent">{data.stats.successful_count}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">In behandeling</div>
          <div className="admin-stat-value">{data.stats.pending_count}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Mislukt</div>
          <div className="admin-stat-value">{data.stats.failed_count}</div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <span className="admin-card-title">Betalingsoverzicht</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Naam</th>
                <th>E-mail</th>
                <th>Cursus</th>
                <th>Bedrag</th>
                <th>Status</th>
                <th>Datum</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{p.email}</td>
                  <td>{p.course_title}</td>
                  <td>{fmt(p.amount_cents)}</td>
                  <td>
                    <span className={`badge ${
                      p.status === 'paid'    ? 'badge--green' :
                      p.status === 'pending' ? 'badge--yellow' :
                      'badge--red'
                    }`}>{p.status}</span>
                  </td>
                  <td>{fmtDate(p.paid_at || p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function ProgressTab() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    admin.getProgress().then(r => setData(r)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">Laden…</div>;
  if (!data)   return <div className="admin-empty">Geen data.</div>;

  return (
    <>
      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Gem. voortgang</div>
          <div className="admin-stat-value admin-stat-value--accent">{data.stats.avg_progress}%</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Afgerond</div>
          <div className="admin-stat-value admin-stat-value--green">{data.stats.completed_count}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Gem. quizscore</div>
          <div className="admin-stat-value">{data.stats.avg_quiz_score || '—'}</div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <span className="admin-card-title">Studentenvoortgang</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Naam</th>
                <th>Cursus</th>
                <th>Voortgang</th>
                <th>Lessen voltooid</th>
                <th>Quiz gem.</th>
                <th>Laatste activiteit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>{s.course_title}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="progress-bar">
                        <div className="progress-bar__fill" style={{ width: `${s.progress_pct || 0}%` }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{s.progress_pct || 0}%</span>
                    </div>
                  </td>
                  <td>{s.completed_lessons}</td>
                  <td>{s.quiz_avg ?? '—'}</td>
                  <td>{fmtDate(s.last_active)}</td>
                  <td>
                    {s.completed_at
                      ? <span className="badge badge--green">Afgerond</span>
                      : <span className="badge badge--blue">Bezig</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function CertificatesTab() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    admin.getCertificates().then(r => setData(r)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">Laden…</div>;
  if (!data)   return <div className="admin-empty">Geen data.</div>;

  return (
    <>
      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Uitgegeven</div>
          <div className="admin-stat-value admin-stat-value--accent">{data.stats.total_issued}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Gedownload</div>
          <div className="admin-stat-value admin-stat-value--green">{data.stats.total_downloaded}</div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <span className="admin-card-title">Alle certificaten</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Naam</th>
                <th>E-mail</th>
                <th>Cursus</th>
                <th>Certificaatnr.</th>
                <th>Uitgegeven</th>
                <th>Gedownload</th>
              </tr>
            </thead>
            <tbody>
              {data.certificates.length === 0 && (
                <tr><td colSpan={6} className="admin-empty">Geen certificaten</td></tr>
              )}
              {data.certificates.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>{c.email}</td>
                  <td>{c.course_title}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{c.certificate_number}</td>
                  <td>{fmtDate(c.issued_at)}</td>
                  <td>{fmtDate(c.downloaded_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

const tabHeaders = {
  dashboard:    { title: 'Dashboard',    desc: 'Overzicht van het platform' },
  users:        { title: 'Gebruikers',   desc: 'Beheer alle accounts' },
  payments:     { title: 'Betalingen',   desc: 'Transacties en omzet' },
  progress:     { title: 'Voortgang',    desc: 'Studievoortgang per student' },
  certificates: { title: 'Certificaten', desc: 'Uitgegeven certificaten' },
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/');
  }, [isAdmin, loading, navigate]);

  if (loading) return null;

  const header = tabHeaders[activeTab];

  return (
    <div className="admin-page">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-title">Beheer</div>
          {tabs.map(t => (
            <button
              key={t.id}
              className={`admin-nav-btn ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </aside>

        <main className="admin-main">
          <div className="admin-header">
            <h1>{header.title}</h1>
            <p>{header.desc}</p>
          </div>

          {activeTab === 'dashboard'    && <DashboardTab />}
          {activeTab === 'users'        && <UsersTab />}
          {activeTab === 'payments'     && <PaymentsTab />}
          {activeTab === 'progress'     && <ProgressTab />}
          {activeTab === 'certificates' && <CertificatesTab />}
        </main>
      </div>
    </div>
  );
}
