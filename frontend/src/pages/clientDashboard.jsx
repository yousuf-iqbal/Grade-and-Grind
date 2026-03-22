// src/pages/ClientDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const STATUS_COLORS = {
  open:        { bg: '#001a0d', border: '#22d3a540', text: '#22d3a5' },
  in_progress: { bg: '#1a1200', border: '#f59e0b40', text: '#f59e0b' },
  completed:   { bg: '#111',    border: '#44444440', text: '#888'    },
  cancelled:   { bg: '#1a0000', border: '#ff5e7840', text: '#ff8090' },
};

export default function ClientDashboard() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [gigs,     setGigs]     = useState([]);
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState('gigs');
  const [deleteId,  setDeleteId]  = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [gigsRes, studentsRes] = await Promise.all([
        API.get('/gigs/my'),
        API.get('/student/browse'),
      ]);
      setGigs(gigsRes.data.gigs);
      setStudents(studentsRes.data.students);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (gigID) => {
    try {
      await API.delete(`/gigs/${gigID}`);
      setGigs(g => g.filter(x => x.GigID !== gigID));
      setDeleteId(null);
    } catch (err) {
      alert(err.response?.data?.error || 'could not delete gig.');
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
    { label: 'Total Gigs',  value: gigs.length,                                            icon: '📋' },
    { label: 'Open',        value: gigs.filter(g => g.Status === 'open').length,            icon: '🟢' },
    { label: 'In Progress', value: gigs.filter(g => g.Status === 'in_progress').length,     icon: '⚙️' },
    { label: 'Completed',   value: gigs.filter(g => g.Status === 'completed').length,       icon: '✅' },
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
            <Link to="/post-gig"
              style={{ padding: '6px 16px', background: '#f59e0b', color: '#000', borderRadius: 8, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>
              + Post Gig
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
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 800 }}>
            Welcome, <span style={{ color: '#f59e0b' }}>{user?.fullName?.split(' ')[0]}</span>!
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>Client Dashboard</p>
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
          {['gigs', 'students'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ flex: 1, padding: '8px 0', border: 'none', borderRadius: 9, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s',
                background: activeTab === tab ? '#f59e0b' : 'transparent',
                color:      activeTab === tab ? '#000'    : '#555',
              }}>
              {tab === 'gigs' ? 'My Gigs' : 'Browse Students'}
            </button>
          ))}
        </div>

        {/* ── GIGS TAB ── */}
        {activeTab === 'gigs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ color: '#888', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                My Posted Gigs ({gigs.length})
              </h2>
              <Link to="/post-gig"
                style={{ padding: '8px 16px', background: '#f59e0b', color: '#000', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem' }}>
                + New Gig
              </Link>
            </div>

            {gigs.length === 0
              ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: '#111', border: '1px solid #1e1e1e', borderRadius: 14 }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
                  <p style={{ color: '#555', marginBottom: 16 }}>You haven't posted any gigs yet.</p>
                  <Link to="/post-gig" style={{ padding: '8px 18px', background: '#f59e0b', color: '#000', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
                    Post Your First Gig
                  </Link>
                </div>
              )
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {gigs.map(gig => {
                    const s = STATUS_COLORS[gig.Status] || STATUS_COLORS.open;
                    return (
                      <div key={gig.GigID} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: '1rem 1.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{gig.Title}</span>
                              <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: s.bg, border: `1px solid ${s.border}`, color: s.text, borderRadius: 20, fontWeight: 600 }}>
                                {gig.Status?.replace('_', ' ')}
                              </span>
                            </div>
                            <div style={{ color: '#555', fontSize: '0.8rem', display: 'flex', gap: 16 }}>
                              <span>📨 {gig.TotalApplications || 0} applications</span>
                              <span>⏳ {gig.PendingCount || 0} pending</span>
                              {gig.Budget && <span>💰 PKR {Number(gig.Budget).toLocaleString()}</span>}
                              {gig.Deadline && <span>📅 {new Date(gig.Deadline).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <Link to={`/gigs/${gig.GigID}/applications`}
                              style={{ padding: '5px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: 7, textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600 }}>
                              View Applicants
                            </Link>
                            <Link to={`/gigs/${gig.GigID}/edit`}
                              style={{ padding: '5px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: 7, textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600 }}>
                              Edit
                            </Link>
                            {gig.Status === 'open' && (
                              deleteId === gig.GigID
                                ? (
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <button onClick={() => handleDelete(gig.GigID)}
                                      style={{ padding: '5px 10px', background: '#ff5e7820', border: '1px solid #ff5e7840', color: '#ff8090', borderRadius: 7, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                                      Confirm
                                    </button>
                                    <button onClick={() => setDeleteId(null)}
                                      style={{ padding: '5px 10px', background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#555', borderRadius: 7, fontSize: '0.78rem', cursor: 'pointer' }}>
                                      Cancel
                                    </button>
                                  </div>
                                )
                                : (
                                  <button onClick={() => setDeleteId(gig.GigID)}
                                    style={{ padding: '5px 12px', background: '#1a0000', border: '1px solid #ff5e7820', color: '#ff8090', borderRadius: 7, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                                    Delete
                                  </button>
                                )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>
        )}

        {/* ── STUDENTS TAB ── */}
        {activeTab === 'students' && (
          <div>
            <h2 style={{ color: '#888', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Browse Students ({students.length})
            </h2>
            {students.length === 0
              ? <div style={{ textAlign: 'center', padding: '3rem', color: '#555' }}>No students found.</div>
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {students.map(s => (
                    <StudentCard key={s.UserID} student={s} />
                  ))}
                </div>
              )
            }
          </div>
        )}
      </div>
    </div>
  );
}

function StudentCard({ student }) {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(`/student/${student.UserID}`)}
      style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 14, padding: '1.2rem', cursor: 'pointer', transition: 'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#f59e0b50'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e1e'}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1a1a1a', border: '1px solid #2a2a2a', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {student.ProfilePic
            ? <img src={student.ProfilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '1.2rem' }}>👤</span>}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{student.FullName}</div>
          <div style={{ color: '#555', fontSize: '0.78rem' }}>{student.University || '—'}</div>
        </div>
      </div>
      {student.Bio && (
        <p style={{ margin: '0 0 10px', color: '#666', fontSize: '0.8rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {student.Bio}
        </p>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
        {student.skills?.slice(0, 4).map(sk => (
          <span key={sk} style={{ padding: '2px 8px', background: '#1a1200', border: '1px solid #f59e0b20', color: '#f59e0b', borderRadius: 20, fontSize: '0.72rem' }}>
            {sk}
          </span>
        ))}
        {student.skills?.length > 4 && (
          <span style={{ padding: '2px 8px', color: '#444', fontSize: '0.72rem' }}>+{student.skills.length - 4}</span>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: student.IsAvailable ? '#22d3a5' : '#ff8090' }}>
          {student.IsAvailable ? '🟢 Available' : '🔴 Unavailable'}
        </span>
        <span style={{ fontSize: '0.78rem', color: '#555' }}>
          ⭐ {student.AverageRating > 0 ? student.AverageRating.toFixed(1) : '—'} · {student.CompletedGigs} gigs
        </span>
      </div>
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