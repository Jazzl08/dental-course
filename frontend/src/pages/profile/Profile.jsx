import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { users } from '../../api.js';
import { useAuth } from '../../context/useAuth.js';
import './Profile.css';

export default function Profile() {
  const { refreshUser } = useAuth();

  const [profile,        setProfile]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [successMsg,     setSuccessMsg]     = useState('');

  const [profileForm,    setProfileForm]    = useState({ name: '' });
  const [savingProfile,  setSavingProfile]  = useState(false);

  const [passwordForm,   setPasswordForm]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError,  setPasswordError]  = useState('');
  const [passwordMsg,    setPasswordMsg]    = useState('');

  const pageRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await users.getProfile();
        const u = data.profile || data;
        setProfile(u);
        setProfileForm({ name: u.name || '' });
      } catch (err) {
        setError(err.message || 'Profiel kon niet worden geladen.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (loading || !pageRef.current) return;
    gsap.fromTo(pageRef.current.children,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power2.out' }
    );
  }, [loading]);

  const handleProfileChange = (e) => {
    setProfileForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setError('');
    setSuccessMsg('');

    try {
      await users.updateProfile(profileForm);
      await refreshUser();
      setSuccessMsg('Profiel succesvol opgeslagen.');
    } catch (err) {
      setError(err.message || 'Profiel opslaan mislukt.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (passwordError) setPasswordError('');
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Nieuwe wachtwoorden komen niet overeen.');
      return;
    }

    if (
      passwordForm.newPassword.length < 8 ||
      !/[A-Z]/.test(passwordForm.newPassword) ||
      !/[0-9]/.test(passwordForm.newPassword)
    ) {
      setPasswordError('Nieuw wachtwoord moet minimaal 8 tekens, een hoofdletter en een cijfer bevatten.');
      return;
    }

    setSavingPassword(true);
    setPasswordError('');
    setPasswordMsg('');

    try {
      await users.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMsg('Wachtwoord succesvol gewijzigd.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.message || 'Wachtwoord wijzigen mislukt.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading page-wrapper">
        <p>Laden</p>
      </div>
    );
  }

  return (
    <main className="page-wrapper profile-page">
      <div className="container profile-container" ref={pageRef}>
        <header className="profile-header">
          <p className="profile-header__label">Mijn account</p>
          <h1 className="profile-header__title">Profiel</h1>
        </header>

        {error && <div className="auth-error">{error}</div>}
        {successMsg && <div className="auth-success">{successMsg}</div>}

        <section className="profile-section">
          <div className="profile-section__head">
            <h2 className="profile-section__title">Persoonlijke gegevens</h2>
            <p className="profile-section__desc">Uw naam en e-mailadres</p>
          </div>

          <form onSubmit={handleProfileSave} className="profile-form">
            <div className="form-field">
              <label htmlFor="name" className="form-field__label">Volledige naam</label>
              <input
                id="name"
                type="text"
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                className="form-field__input"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="profile-email" className="form-field__label">E-mailadres</label>
              <input
                id="profile-email"
                type="email"
                value={profile?.email || ''}
                className="form-field__input"
                readOnly
                disabled
              />
            </div>

            <button type="submit" className="btn btn--primary" disabled={savingProfile}>
              {savingProfile ? 'Opslaan...' : 'Gegevens opslaan'}
            </button>
          </form>
        </section>

        <div className="profile-divider" />

        <section className="profile-section">
          <div className="profile-section__head">
            <h2 className="profile-section__title">Wachtwoord wijzigen</h2>
            <p className="profile-section__desc">Houd uw account veilig</p>
          </div>

          {passwordError && <div className="auth-error">{passwordError}</div>}
          {passwordMsg && <div className="auth-success">{passwordMsg}</div>}

          <form onSubmit={handlePasswordSave} className="profile-form">
            <div className="form-field">
              <label htmlFor="currentPassword" className="form-field__label">
                Huidig wachtwoord
              </label>
              <input
                id="currentPassword"
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                className="form-field__input"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="newPassword" className="form-field__label">
                Nieuw wachtwoord
              </label>
              <input
                id="newPassword"
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                className="form-field__input"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>

            <div className="form-field">
              <label htmlFor="confirmPassword" className="form-field__label">
                Nieuw wachtwoord herhalen
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                className="form-field__input"
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" className="btn btn--primary" disabled={savingPassword}>
              {savingPassword ? 'Opslaan...' : 'Wachtwoord wijzigen'}
            </button>
          </form>
        </section>

        <div className="profile-divider" />

        <section className="profile-section profile-section--info">
          <div className="profile-section__head">
            <h2 className="profile-section__title">Accountinformatie</h2>
          </div>
          <div className="profile-info-grid">
            <div className="profile-info-item">
              <span className="profile-info-item__label">Rol</span>
              <span className="profile-info-item__value">{profile?.role || 'Cursist'}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-item__label">E-mail geverifieerd</span>
              <span className="profile-info-item__value">
                {profile?.is_verified ? 'Ja' : 'Nee'}
              </span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-item__label">Lid sinds</span>
              <span className="profile-info-item__value">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('nl-NL', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })
                  : 'Onbekend'}
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
