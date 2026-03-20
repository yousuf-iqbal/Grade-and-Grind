// src/pages/StudentPublicProfilePage.jsx
// public view of a student profile — seen by clients
// cv download only shown if profile is published

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function StudentPublicProfilePage() {
  const { userID }  = useParams();
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [profile, setProfile] = useState(null);
  const [skills,  setSkills]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const isOwn = user?.id === parseInt(userID);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get(`/profile/${userID}`);
        setProfile(res.data.profile);
        setSkills(res.data.skills.map(s => s.SkillName));
      } catch (err) {
        if (err.response?.status === 404) {
          setError('This profile is not available.');
        } else {
          setError('Failed to load profile.');
        }
      }
      setLoading(false);
    };
    load();
  }, [userID]);

  if (loading) return <LoadingScreen />;

  if (error) return (
    <div style={{
      minHeight: '100vh', background: '#0f0f0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '1rem',
    }}>
      <span style={{ fontSize: '3rem' }}>🔍</span>
      <p style={{ color: '#888', fontSize: '1rem' }}>{error}</p>
      <button onClick={() => navigate(-1)}
        style={{
          padding: '0.5rem 1.25rem', borderRadius: 8, cursor: 'pointer',
          background: 'transparent', border: '1px solid #2a2a2a', color: '#aaa',
          fontWeight: 600, fontSize: '0.85rem',
        }}>
        ← Go Back
      </button>
    </div>
  );

  const isDraft = !profile.IsPublished;

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: 'system-ui' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#0f0f0f', borderBottom: '1px solid #1e1e1e',
        padding: '0 2rem', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          onClick={() => navigate('/dashboard')}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: '#f59e0b', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '1rem',
          }}>🎓</div>
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>
            Grade<span style={{ color: '#f59e0b' }}>&</span>Grind
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {isOwn && (
            <button onClick={() => navigate('/profile/edit')}
              style={{
                padding: '0.4rem 1rem', borderRadius: 8, fontSize: '0.82rem',
                fontWeight: 600, cursor: 'pointer',
                background: '#f59e0b', border: 'none', color: '#000',
              }}>
              ✏️ Edit Profile
            </button>
          )}
          <button onClick={() => navigate(-1)}
            style={{
              padding: '0.4rem 1rem', borderRadius: 8, fontSize: '0.82rem',
              fontWeight: 600, cursor: 'pointer',
              background: 'transparent', border: '1px solid #2a2a2a', color: '#aaa',
            }}>
            ← Back
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* draft badge — only visible to owner/admin */}
        {isDraft && (
          <div style={{
            padding: '0.6rem 1rem', borderRadius: 10, marginBottom: '1.25rem',
            background: '#f59e0b10', border: '1px solid #f59e0b30',
            fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600,
          }}>
            🟡 Draft — this profile is not visible to clients yet
          </div>
        )}

        {/* ── PROFILE HEADER ── */}
        <div style={{
          padding: '2rem', borderRadius: 20,
          background: 'linear-gradient(135deg, #111 0%, #1a1200 100%)',
          border: '1px solid #2a1a00', marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>

            {/* avatar */}
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: '#1e1e1e', flexShrink: 0, overflow: 'hidden',
              border: '2px solid #f59e0b30',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {profile.ProfilePic
                ? <img src={profile.ProfilePic} alt="Profile"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '2.5rem' }}>👤</span>
              }
            </div>

            {/* info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900 }}>
                  {profile.FullName}
                </h1>
                {profile.IsVerified === 1 && (
                  <span title="Verified student" style={{
                    padding: '0.15rem 0.5rem', borderRadius: 20, fontSize: '0.65rem',
                    background: '#f59e0b20', border: '1px solid #f59e0b40',
                    color: '#f59e0b', fontWeight: 700,
                  }}>✓ Verified</span>
                )}
                {profile.IsAvailable === 1 && (
                  <span style={{
                    padding: '0.15rem 0.5rem', borderRadius: 20, fontSize: '0.65rem',
                    background: '#22d3a510', border: '1px solid #22d3a530',
                    color: '#22d3a5', fontWeight: 700,
                  }}>● Available</span>
                )}
              </div>

              <p style={{ color: '#888', margin: '0 0 0.2rem', fontSize: '0.95rem' }}>
                {profile.Degree && `${profile.Degree}`}
                {profile.Degree && profile.GraduationYear && ' · '}
                {profile.GraduationYear && `Class of ${profile.GraduationYear}`}
              </p>
              <p style={{ color: '#555', margin: 0, fontSize: '0.85rem' }}>
                {profile.University}
              </p>

              {/* stats row */}
              {(profile.AverageRating > 0 || profile.TotalReviews > 0 || profile.CompletedGigs > 0) && (
                <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  {profile.AverageRating > 0 && (
                    <Stat value={`⭐ ${parseFloat(profile.AverageRating).toFixed(1)}`} label="Rating" />
                  )}
                  {profile.TotalReviews > 0 && (
                    <Stat value={profile.TotalReviews} label="Reviews" />
                  )}
                  {profile.CompletedGigs > 0 && (
                    <Stat value={profile.CompletedGigs} label="Gigs Done" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* bio */}
          {profile.Bio && (
            <p style={{
              marginTop: '1.5rem', lineHeight: 1.7, fontSize: '0.95rem',
              color: '#ccc', borderTop: '1px solid #2a2a2a', paddingTop: '1.25rem',
            }}>
              {profile.Bio}
            </p>
          )}

          {/* action links */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            {profile.PortfolioURL && (
              <LinkBtn href={profile.PortfolioURL} icon="🌐" label="Portfolio" />
            )}
            {profile.LinkedInURL && (
              <LinkBtn href={profile.LinkedInURL} icon="💼" label="LinkedIn" />
            )}
            {/* cv download — only if published */}
            {profile.CVURL && profile.IsPublished === 1 && (
              <a href={profile.CVURL} target="_blank" rel="noreferrer"
                download
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.45rem 1rem', borderRadius: 8,
                  background: '#f59e0b', color: '#000',
                  fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                📄 Download CV
              </a>
            )}
          </div>
        </div>

        {/* ── SKILLS ── */}
        {skills.length > 0 && (
          <div style={{
            padding: '1.5rem', borderRadius: 16,
            background: '#111', border: '1px solid #1e1e1e',
            marginBottom: '1.25rem',
          }}>
            <SectionTitle>Skills</SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {skills.map(s => (
                <span key={s} style={{
                  padding: '0.35rem 0.85rem', borderRadius: 20,
                  background: '#1a1200', border: '1px solid #f59e0b40',
                  color: '#f59e0b', fontSize: '0.82rem', fontWeight: 600,
                }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* empty state for no skills */}
        {skills.length === 0 && (
          <div style={{
            padding: '1.5rem', borderRadius: 16,
            background: '#111', border: '1px solid #1e1e1e',
            marginBottom: '1.25rem', textAlign: 'center',
            color: '#444', fontSize: '0.85rem',
          }}>
            No skills listed yet
          </div>
        )}
      </div>
    </div>
  );
}

// ── SMALL COMPONENTS ──────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <h3 style={{
      margin: '0 0 1rem', fontSize: '0.75rem',
      color: '#555', fontWeight: 700, letterSpacing: '0.1em',
    }}>{children.toUpperCase()}</h3>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f59e0b' }}>{value}</span>
      <span style={{ fontSize: '0.75rem', color: '#555', marginLeft: '0.3rem' }}>{label}</span>
    </div>
  );
}

function LinkBtn({ href, icon, label }) {
  return (
    <a href={href} target="_blank" rel="noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.4rem 0.9rem', borderRadius: 8,
        background: 'transparent', border: '1px solid #2a2a2a',
        color: '#aaa', fontSize: '0.8rem', fontWeight: 600,
        textDecoration: 'none', transition: 'border-color 0.2s, color 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.color = '#f59e0b'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#aaa'; }}
    >
      {icon} {label}
    </a>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '1rem',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid #1e1e1e', borderTopColor: '#f59e0b',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#555', fontSize: '0.85rem' }}>Loading profile...</p>
    </div>
  );
}