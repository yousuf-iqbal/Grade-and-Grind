// src/pages/ClientDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import PostGigModal from '../components/PostGigModal';
import ApplicationsModal from '../components/ApplicationsModal';

const statusColors = {
  open:        { bg: '#0c1f17', color: '#34d399', border: '#064e3b' },
  in_progress: { bg: '#1c1207', color: '#fbbf24', border: '#78350f' },
  completed:   { bg: '#0f172a', color: '#60a5fa', border: '#1e3a5f' },
  cancelled:   { bg: '#1c1212', color: '#888',    border: '#333' },
};

function StatusPill({ status }) {
  const s = statusColors[status] || statusColors.cancelled;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: '20px', padding: '3px 12px', fontSize: '0.72rem', fontWeight: 700,
    }}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const [gigs,           setGigs]           = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showPostModal,  setShowPostModal]  = useState(false);
  const [appsModal,      setAppsModal]      = useState(null); // gigID
  const [toast,          setToast]          = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const loadGigs = async () => {
    try {
      const res = await API.get('/gigs/my');
      setGigs(res.data.gigs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGigs(); }, []);

  const handleDelete = async (gigID) => {
    if (!window.confirm('Delete this gig? This cannot be undone.')) return;
    try {
      await API.delete(`/gigs/${gigID}`);
      showToast('Gig deleted.');
      loadGigs();
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not delete gig.', false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    localStorage.removeItem('gg_user');
    window.location.href = '/auth';
  };

  if (loading) return (
    <div style={styles.loadingWrap}><div style={styles.spinner} /></div>
  );

  return (
    <div style={styles.root}>
      {/* NAVBAR */}
      <nav style={styles.nav}>
        <span style={styles.navBrand}>Grade &amp; Grind</span>
        <div style={styles.navRight}>
          <button style={styles.navBtn}>Messages</button>
          <div style={styles.userChip}>
            <span style={styles.chipName}>{user?.fullName?.split(' ')[0]}</span>
            <span style={styles.chipRoleClient}>Client</span>
          </div>
          <button style={styles.signOutBtn} onClick={handleSignOut}>Sign out</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={styles.hero}>
        <div>
          <h1 style={styles.heroTitle}>Client Dashboard</h1>
          <p style={styles.heroSub}>Manage your gigs and hire talented students</p>
        </div>
        <button style={styles.postGigBtn} onClick={() => setShowPostModal(true)}>
          + Post Gig
        </button>
      </div>

      {/* GIGS */}
      <div style={styles.body}>
        <h2 style={styles.sectionTitle}>Your Gigs</h2>

        {gigs.length === 0 ? (
          <div style={styles.empty}>
            You haven't posted any gigs yet.{' '}
            <button style={styles.inlineLink} onClick={() => setShowPostModal(true)}>Post your first gig →</button>
          </div>
        ) : (
          <div style={styles.gigGrid}>
            {gigs.map(gig => (
              <div key={gig.GigID} style={styles.gigCard}>
                <div style={styles.gigTop}>
                  <div>
                    <div style={styles.gigTitle}>{gig.Title}</div>
                    <div style={styles.gigDesc}>{gig.Description}</div>
                  </div>
                  <StatusPill status={gig.Status} />
                </div>

                <div style={styles.gigMeta}>
                  <span style={styles.metaText}>
                    ${gig.Budget?.toLocaleString()} &nbsp;|&nbsp;
                    Due {new Date(gig.Deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div style={styles.statsRow}>
                  <div style={styles.statChip}>
                    <span style={styles.statNum}>{gig.TotalApplications}</span>
                    <span style={styles.statLabel}>applicants</span>
                  </div>
                  <div style={styles.statChip}>
                    <span style={styles.statNum}>{gig.PendingCount}</span>
                    <span style={styles.statLabel}>pending</span>
                  </div>
                  <div style={styles.statChip}>
                    <span style={styles.statNum}>{gig.AcceptedCount}</span>
                    <span style={styles.statLabel}>accepted</span>
                  </div>
                </div>

                <div style={styles.cardActions}>
                  {gig.TotalApplications > 0 && (
                    <button style={styles.viewAppsBtn} onClick={() => setAppsModal(gig.GigID)}>
                      View Applicants
                    </button>
                  )}
                  {gig.Status === 'open' && (
                    <button style={styles.deleteBtn} onClick={() => handleDelete(gig.GigID)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODALS */}
      {showPostModal && (
        <PostGigModal
          onClose={() => setShowPostModal(false)}
          onSuccess={() => { setShowPostModal(false); loadGigs(); showToast('Gig posted!'); }}
        />
      )}
      {appsModal && (
        <ApplicationsModal
          gigID={appsModal}
          onClose={() => setAppsModal(null)}
          onAccepted={() => { setAppsModal(null); loadGigs(); showToast('Applicant accepted!'); }}
        />
      )}

      {/* TOAST */}
      {toast && (
        <div style={{
          ...styles.toast,
          background: toast.ok ? '#052e16' : '#2d1212',
          borderColor: toast.ok ? '#14532d' : '#7f1d1d',
          color: toast.ok ? '#4ade80' : '#f87171',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const styles = {
  root: { minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif" },
  loadingWrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' },
  spinner: { width: 40, height: 40, border: '3px solid #222', borderTop: '3px solid #f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: '58px', background: '#111', borderBottom: '1px solid #1e1e1e' },
  navBrand: { fontWeight: 800, fontSize: '1.1rem', color: '#fff', letterSpacing: '-0.02em' },
  navRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  navBtn: { background: 'transparent', border: '1px solid #2a2a2a', color: '#ccc', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem' },
  userChip: { display: 'flex', alignItems: 'center', gap: '8px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '20px', padding: '4px 12px 4px 14px' },
  chipName: { fontSize: '0.85rem', fontWeight: 600, color: '#e5e5e5' },
  chipRoleClient: { background: '#1c3d6b', color: '#60a5fa', borderRadius: '20px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 },
  signOutBtn: { background: '#f59e0b', color: '#000', border: 'none', borderRadius: '8px', padding: '7px 16px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' },

  hero: { padding: '28px 32px 24px', borderBottom: '1px solid #1e1e1e', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  heroTitle: { margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#fff' },
  heroSub: { margin: '4px 0 0', color: '#666', fontSize: '0.9rem' },
  postGigBtn: { background: '#f59e0b', color: '#000', border: 'none', borderRadius: '10px', padding: '10px 22px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' },

  body: { padding: '28px 32px', maxWidth: '900px' },
  sectionTitle: { margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#e5e5e5' },

  gigGrid: { display: 'flex', flexDirection: 'column', gap: '14px' },
  gigCard: { background: '#141414', border: '1px solid #1e1e1e', borderRadius: '14px', padding: '18px 20px' },
  gigTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' },
  gigTitle: { fontWeight: 700, fontSize: '1rem', color: '#fff', marginBottom: '4px' },
  gigDesc: { color: '#777', fontSize: '0.82rem', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  gigMeta: { marginBottom: '12px' },
  metaText: { color: '#888', fontSize: '0.82rem' },

  statsRow: { display: 'flex', gap: '10px', marginBottom: '14px' },
  statChip: { background: '#1a1a1a', border: '1px solid #222', borderRadius: '8px', padding: '6px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' },
  statNum: { fontWeight: 800, fontSize: '1rem', color: '#f59e0b' },
  statLabel: { fontSize: '0.68rem', color: '#666', marginTop: '1px' },

  cardActions: { display: 'flex', gap: '10px' },
  viewAppsBtn: { background: '#1a1a1a', border: '1px solid #f59e0b33', color: '#f59e0b', borderRadius: '8px', padding: '7px 16px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
  deleteBtn: { background: 'transparent', border: '1px solid #2a2a2a', color: '#666', borderRadius: '8px', padding: '7px 14px', fontSize: '0.82rem', cursor: 'pointer' },

  empty: { color: '#555', fontSize: '0.88rem', padding: '20px 0' },
  inlineLink: { background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: '0.88rem', textDecoration: 'underline', padding: 0 },

  toast: { position: 'fixed', bottom: '28px', right: '28px', border: '1px solid', borderRadius: '10px', padding: '12px 20px', fontSize: '0.88rem', fontWeight: 600, zIndex: 200 },
};