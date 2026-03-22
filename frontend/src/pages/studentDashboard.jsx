// src/pages/StudentDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const STATUS_COLORS = {
  pending:   { bg: '#1a1400', border: '#f59e0b40', text: '#f59e0b' },
  accepted:  { bg: '#001a0d', border: '#22d3a540', text: '#22d3a5' },
  rejected:  { bg: '#1a0000', border: '#ff5e7840', text: '#ff8090' },
  withdrawn: { bg: '#111',    border: '#44444440', text: '#666'    },
};

const GIG_STATUS_COLORS = {
  open:        { text: '#22d3a5' },
  in_progress: { text: '#f59e0b' },
  completed:   { text: '#888'    },
  cancelled:   { text: '#ff8090' },
};

export default function StudentDashboard() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [profile,      setProfile]      = useState(null);
  const [applications, setApplications] = useState([]);
  const [openGigs,     setOpenGigs]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState('overview');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [profileRes, appRes, gigsRes] = await Promise.all([
        API.get('/student/profile'),
        API.get('/student/applications'),
        API.get('/gigs'),
      ]);
      setProfile(profileRes.data.profile);
      setApplications(appRes.data.applications);
      setOpenGigs(gigsRes.data.gigs.slice(0, 6));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(getAuth());
    localStorage.removeItem('gg_user');
    setUser(null);
    navigate('/auth');
  };

  if (loading) return <LoadingScreen />;

  const stats = [
    { label: 'Applied',   value: applications.length,                                                  icon: '📨' },
    { label: 'Accepted',  value: applications.filter(a => a.ApplicationStatus === 'accepted').length,  icon: '✅' },
    { label: 'Pending',   value: applications.filter(a => a.ApplicationStatus === 'pending').length,   icon: '⏳' },
    { label: 'Rating',    value: profile?.AverageRating ? profile.AverageRating.toFixed(1) : '—',      icon: '⭐' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: 'system-ui' }}>

      {/* ── NAV ── */}
      <nav style={{ borderBottom: '1px solid #1e1e1e', padding: '0 2rem', background: '#111' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.5rem' }}>🎓</span>
            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
              Grade<span style={{ color: '#f59e0b' }}>&</span>Grind
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link to="/gigs" style={{ padding: '6px 14px', borderRadius: 8, color: '#888', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
              Browse Gigs
            </Link>
            <Link to="/profile/edit" style={{ padding: '6px 14px', borderRadius: 8, color: '#888', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
              Edit Profile
            </Link>
            <button onClick={handleLogout}
              style={{ padding: '6px 14px', borderRadius: 8, background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#888', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#1a1a1a', border: '2px solid #2a2a2a', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
              {profile?.ProfilePic
                ? <img src={profile.ProfilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : '👤'}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
                Welcome back, <span style={{ color: '#f59e0b' }}>{user?.fullName?.split(' ')[0]}</span>!
              </h1>
              <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>
                {profile?.University || 'Student'} · {profile?.IsAvailable ? '🟢 Available' : '🔴 Unavailable'}
              </p>
            </div>
          </div>
          <Link to="/gigs"
            style={{ padding: '10px 20px', background: '#f59e0b', color: '#000', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
            Browse Gigs →
          </Link>
        </div>

        {/* ── STATS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: '1.2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>{s.value}</div>
              <div style={{ color: '#555', fontSize: '0.8rem', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 4 }}>
          {['overview', 'applications', 'profile'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ flex: 1, padding: '8px 0', border: 'none', borderRadius: 9, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s',
                background: activeTab === tab ? '#f59e0b' : 'transparent',
                color:      activeTab === tab ? '#000'    : '#555',
              }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ color: '#888', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Recommended Gigs
            </h2>
            {openGigs.length === 0
              ? <EmptyState message="No open gigs right now. Check back soon!" />
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                  {openGigs.map(gig => (
                    <GigCard key={gig.GigID} gig={gig} showApply />
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ── APPLICATIONS TAB ── */}
        {activeTab === 'applications' && (
          <div>
            <h2 style={{ color: '#888', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              My Applications ({applications.length})
            </h2>
            {applications.length === 0
              ? <EmptyState message="You haven't applied to any gigs yet." cta="Browse Gigs" ctaLink="/gigs" />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {applications.map(app => (
                    <ApplicationRow key={app.ApplicationID} app={app} />
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {activeTab === 'profile' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ color: '#888', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                My Profile
              </h2>
              <Link to="/profile/edit"
                style={{ padding: '8px 16px', background: '#f59e0b', color: '#000', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem' }}>
                Edit Profile
              </Link>
            </div>
            <ProfileCard profile={profile} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function GigCard({ gig }) {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(`/gigs/${gig.GigID}`)}
      style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 14, padding: '1.2rem', cursor: 'pointer', transition: 'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#f59e0b50'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e1e'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: '0.72rem', padding: '3px 8px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6, color: '#888' }}>
          {gig.Category || 'General'}
        </span>
        <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem' }}>
          {gig.Budget ? `PKR ${Number(gig.Budget).toLocaleString()}` : 'Budget TBD'}
        </span>
      </div>
      <h3 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.3 }}>{gig.Title}</h3>
      <p style={{ margin: '0 0 10px', color: '#555', fontSize: '0.8rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {gig.Description || 'No description provided.'}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#444', fontSize: '0.75rem' }}>
          {gig.CompanyName || gig.ClientName} · {gig.ApplicationCount} applied
        </span>
        {gig.Deadline && (
          <span style={{ color: '#555', fontSize: '0.75rem' }}>
            Due {new Date(gig.Deadline).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}

function ApplicationRow({ app }) {
  const s = STATUS_COLORS[app.ApplicationStatus] || STATUS_COLORS.pending;
  const g = GIG_STATUS_COLORS[app.GigStatus] || {};
  return (
    <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>{app.GigTitle}</div>
        <div style={{ color: '#555', fontSize: '0.78rem' }}>
          {app.CompanyName || app.ClientName} ·{' '}
          <span style={{ color: g.text }}>{app.GigStatus?.replace('_', ' ')}</span>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '0.72rem', padding: '3px 10px', background: s.bg, border: `1px solid ${s.border}`, color: s.text, borderRadius: 20, display: 'inline-block', marginBottom: 4, fontWeight: 600 }}>
          {app.ApplicationStatus}
        </div>
        <div style={{ color: '#444', fontSize: '0.72rem' }}>
          Match: <span style={{ color: app.MatchScore >= 70 ? '#22d3a5' : '#f59e0b' }}>{app.MatchScore}%</span>
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ profile }) {
  if (!profile) return null;
  return (
    <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 14, padding: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        {[
          { label: 'Degree',          value: profile.Degree          || '—' },
          { label: 'Graduation Year', value: profile.GraduationYear  || '—' },
          { label: 'University',      value: profile.University       || '—' },
          { label: 'Availability',    value: profile.IsAvailable ? 'Open to gigs' : 'Unavailable' },
        ].map(f => (
          <div key={f.label}>
            <div style={{ color: '#444', fontSize: '0.75rem', marginBottom: 4 }}>{f.label}</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{f.value}</div>
          </div>
        ))}
      </div>
      {profile.Bio && (
        <div style={{ marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid #1e1e1e' }}>
          <div style={{ color: '#444', fontSize: '0.75rem', marginBottom: 6 }}>Bio</div>
          <p style={{ margin: 0, color: '#aaa', fontSize: '0.85rem', lineHeight: 1.6 }}>{profile.Bio}</p>
        </div>
      )}
      {profile.skills?.length > 0 && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid #1e1e1e' }}>
          <div style={{ color: '#444', fontSize: '0.75rem', marginBottom: 8 }}>Skills</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {profile.skills.map(s => (
              <span key={s} style={{ padding: '4px 10px', background: '#1a1200', border: '1px solid #f59e0b30', color: '#f59e0b', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message, cta, ctaLink }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem', background: '#111', border: '1px solid #1e1e1e', borderRadius: 14 }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📭</div>
      <p style={{ color: '#555', marginBottom: cta ? 16 : 0 }}>{message}</p>
      {cta && ctaLink && (
        <Link to={ctaLink} style={{ padding: '8px 18px', background: '#f59e0b', color: '#000', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
          {cta}
        </Link>
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
      Loading...
    </div>
  );
}