// src/pages/StudentDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

const statusColors = {
  pending:    { bg: '#1a1a2e', color: '#a78bfa', border: '#4c1d95' },
  accepted:   { bg: '#052e16', color: '#4ade80', border: '#14532d' },
  rejected:   { bg: '#2d1212', color: '#f87171', border: '#7f1d1d' },
  withdrawn:  { bg: '#1c1c1c', color: '#888',    border: '#333' },
};

const gigStatusColors = {
  open:        { bg: '#0c1f17', color: '#34d399', border: '#064e3b' },
  in_progress: { bg: '#1c1207', color: '#fbbf24', border: '#78350f' },
  completed:   { bg: '#0f172a', color: '#60a5fa', border: '#1e3a5f' },
  cancelled:   { bg: '#1c1212', color: '#888',    border: '#333' },
};

function MatchBadge({ score }) {
  const color = score >= 80 ? '#4ade80' : score >= 50 ? '#fbbf24' : '#f87171';
  return (
    <span style={{
      background: `${color}22`, color, border: `1px solid ${color}44`,
      borderRadius: '20px', padding: '2px 10px', fontSize: '0.72rem',
      fontWeight: 700, letterSpacing: '0.03em',
    }}>
      {score}% match
    </span>
  );
}

function StatusPill({ status, map }) {
  const s = map[status] || map.pending;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: '20px', padding: '3px 12px', fontSize: '0.72rem', fontWeight: 700,
    }}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [matchedGigs,    setMatchedGigs]    = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [applyModal,     setApplyModal]     = useState(null); // gig object
  const [coverLetter,    setCoverLetter]    = useState('');
  const [submitting,     setSubmitting]     = useState(false);
  const [toast,          setToast]          = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [gigsRes, appsRes] = await Promise.all([
          API.get('/gigs/matched'),
          API.get('/gigs/applications/mine'),
        ]);
        setMatchedGigs(gigsRes.data.gigs);
        setMyApplications(appsRes.data.applications);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleApply = async (gig) => {
    setApplyModal(gig);
    setCoverLetter('');
  };

  const submitApplication = async () => {
    if (!applyModal) return;
    setSubmitting(true);
    try {
      await API.post(`/gigs/${applyModal.GigID}/apply`, {
        coverLetter,
        matchScore: applyModal.matchScore || 0,
      });
      showToast('Application submitted!');
      setApplyModal(null);
      // refresh applications
      const appsRes = await API.get('/gigs/applications/mine');
      setMyApplications(appsRes.data.applications);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to apply.', false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (appID) => {
    try {
      await API.patch(`/gigs/applications/${appID}/withdraw`);
      showToast('Application withdrawn.');
      const appsRes = await API.get('/gigs/applications/mine');
      setMyApplications(appsRes.data.applications);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to withdraw.', false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    localStorage.removeItem('gg_user');
    window.location.href = '/auth';
  };

  if (loading) return (
    <div style={styles.loadingWrap}>
      <div style={styles.spinner} />
    </div>
  );

  const appliedGigIDs = new Set(myApplications.map(a => a.GigID));

  return (
    <div style={styles.root}>
      {/* NAVBAR */}
      <nav style={styles.nav}>
        <span style={styles.navBrand}>Grade &amp; Grind</span>
        <div style={styles.navRight}>
          <button style={styles.navBtn}>Messages</button>
          <div style={styles.userChip}>
            <span style={styles.chipName}>{user?.fullName?.split(' ')[0]}</span>
            <span style={styles.chipRole}>Student</span>
          </div>
          <button style={styles.signOutBtn} onClick={handleSignOut}>Sign out</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={styles.hero}>
        <div>
          <h1 style={styles.heroTitle}>Student Dashboard</h1>
          <p style={styles.heroSub}>Find gigs matched to your skills and manage your assignments</p>
        </div>
      </div>

      <div style={styles.body}>
        {/* LEFT: Matched Gigs */}
        <div style={styles.col}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Matched Gigs</h2>
            <button style={styles.linkBtn} onClick={() => window.location.href = '/profile'}>
              Update profile/CV
            </button>
          </div>

          {matchedGigs.length === 0 ? (
            <div style={styles.empty}>
              No matched gigs right now. Update your skills to get matches!
            </div>
          ) : (
            matchedGigs.map(gig => (
              <div key={gig.GigID} style={styles.gigCard}>
                <div style={styles.gigCardTop}>
                  <div>
                    <div style={styles.gigTitle}>{gig.Title}</div>
                    <div style={styles.gigDesc}>{gig.Description}</div>
                  </div>
                  <span style={styles.chevron}>›</span>
                </div>
                <div style={styles.gigMeta}>
                  <span style={styles.gigBudget}>
                    ${gig.Budget?.toLocaleString()} &nbsp;|&nbsp; Due {new Date(gig.Deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <MatchBadge score={gig.matchScore} />
                </div>
                {!appliedGigIDs.has(gig.GigID) ? (
                  <button style={styles.applyBtn} onClick={() => handleApply(gig)}>
                    Apply Now
                  </button>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: '#4ade80', marginTop: '10px', display: 'block' }}>
                    ✓ Applied
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* RIGHT: Assignments + Skills */}
        <div style={styles.col}>
          <h2 style={styles.sectionTitle}>Your Assignments</h2>
          {myApplications.length === 0 ? (
            <div style={styles.empty}>No applications yet.</div>
          ) : (
            myApplications.map(app => (
              <div key={app.ApplicationID} style={styles.assignCard}>
                <div style={styles.assignTitle}>{app.GigTitle}</div>
                <div style={styles.assignMeta}>
                  <StatusPill status={app.ApplicationStatus} map={statusColors} />
                  <StatusPill status={app.GigStatus} map={gigStatusColors} />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <button style={styles.viewBtn}
                    onClick={() => window.location.href = `/gigs/${app.GigID}`}>
                    View gig
                  </button>
                  {app.ApplicationStatus === 'pending' && (
                    <button style={styles.withdrawBtn}
                      onClick={() => handleWithdraw(app.ApplicationID)}>
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* APPLY MODAL */}
      {applyModal && (
        <div style={styles.overlay} onClick={() => setApplyModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Apply to: {applyModal.Title}</h3>
            <p style={styles.modalSub}>{applyModal.Description}</p>
            <label style={styles.label}>Cover Letter</label>
            <textarea
              style={styles.textarea}
              placeholder="Tell the client why you're a great fit..."
              value={coverLetter}
              onChange={e => setCoverLetter(e.target.value)}
              rows={5}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button style={styles.applyBtn} onClick={submitApplication} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
              <button style={styles.cancelBtn} onClick={() => setApplyModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
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
  chipRole: { background: '#14532d', color: '#4ade80', borderRadius: '20px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 },
  signOutBtn: { background: '#f59e0b', color: '#000', border: 'none', borderRadius: '8px', padding: '7px 16px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' },

  hero: { padding: '28px 32px 20px', borderBottom: '1px solid #1e1e1e', background: '#0f0f0f' },
  heroTitle: { margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#fff' },
  heroSub: { margin: '4px 0 0', color: '#666', fontSize: '0.9rem' },

  body: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', padding: '28px 32px', maxWidth: '1100px' },

  col: { display: 'flex', flexDirection: 'column', gap: '14px' },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' },
  sectionTitle: { margin: 0, fontSize: '1rem', fontWeight: 700, color: '#e5e5e5' },
  linkBtn: { background: 'none', border: 'none', color: '#f59e0b', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 },

  gigCard: { background: '#141414', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '16px 18px', transition: 'border-color 0.2s', cursor: 'default' },
  gigCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' },
  gigTitle: { fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: '4px' },
  gigDesc: { color: '#777', fontSize: '0.82rem', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  chevron: { color: '#444', fontSize: '1.4rem', lineHeight: 1 },
  gigMeta: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  gigBudget: { color: '#999', fontSize: '0.82rem' },

  applyBtn: { marginTop: '12px', background: '#f59e0b', color: '#000', border: 'none', borderRadius: '8px', padding: '7px 18px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' },
  cancelBtn: { marginTop: '12px', background: '#1a1a1a', color: '#aaa', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '7px 18px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },

  assignCard: { background: '#141414', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '14px 16px' },
  assignTitle: { fontWeight: 700, fontSize: '0.93rem', color: '#fff', marginBottom: '8px' },
  assignMeta: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  viewBtn: { background: 'none', border: 'none', color: '#f59e0b', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 },
  withdrawBtn: { background: 'none', border: 'none', color: '#f87171', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 },

  empty: { color: '#555', fontSize: '0.85rem', padding: '20px 0' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#141414', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '28px', width: '480px', maxWidth: '90vw' },
  modalTitle: { margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#fff' },
  modalSub: { color: '#777', fontSize: '0.85rem', margin: '0 0 18px', lineHeight: 1.5 },
  label: { display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '6px', fontWeight: 600 },
  textarea: { width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', padding: '10px 12px', fontSize: '0.88rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },

  toast: { position: 'fixed', bottom: '28px', right: '28px', border: '1px solid', borderRadius: '10px', padding: '12px 20px', fontSize: '0.88rem', fontWeight: 600, zIndex: 200 },
};