// src/pages/GigBoardPage.jsx
// students browse and apply to open gigs

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';

const CATEGORIES = ['All', 'Development', 'Design', 'Writing', 'Data', 'Marketing', 'Video', 'Other'];

export default function GigBoardPage() {
  const navigate = useNavigate();
  const [gigs,       setGigs]       = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('All');
  const [applying,   setApplying]   = useState(null);   // gigID currently in apply modal
  const [coverLetter, setCoverLetter] = useState('');
  const [applyMsg,   setApplyMsg]   = useState({ type: '', text: '' });
  const [applyLoading, setApplyLoading] = useState(false);

  useEffect(() => {
    API.get('/gigs')
      .then(res => {
        setGigs(res.data.gigs);
        setFiltered(res.data.gigs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // filter whenever search or category changes
  useEffect(() => {
    let result = gigs;
    if (category !== 'All') {
      result = result.filter(g => g.Category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(g =>
        g.Title.toLowerCase().includes(q) ||
        g.Description?.toLowerCase().includes(q) ||
        g.RequiredSkills?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, category, gigs]);

  const handleApply = async (gigID) => {
    setApplyLoading(true);
    setApplyMsg({ type: '', text: '' });
    try {
      const res = await API.post(`/gigs/${gigID}/apply`, { coverLetter });
      setApplyMsg({ type: 'success', text: `Application submitted! Your match score: ${res.data.matchScore}%` });
      setTimeout(() => { setApplying(null); setCoverLetter(''); setApplyMsg({ type: '', text: '' }); }, 2000);
    } catch (err) {
      setApplyMsg({ type: 'error', text: err.response?.data?.error || 'Could not apply. Please try again.' });
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
      Loading gigs...
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: 'system-ui' }}>

      {/* ── NAV ── */}
      <nav style={{ borderBottom: '1px solid #1e1e1e', padding: '0 2rem', background: '#111' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff' }}>
            <span style={{ fontSize: '1.5rem' }}>🎓</span>
            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
              Grade<span style={{ color: '#f59e0b' }}>&</span>Grind
            </span>
          </Link>
          <Link to="/dashboard" style={{ color: '#888', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
            ← Dashboard
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ margin: '0 0 6px', fontSize: '1.5rem', fontWeight: 800 }}>
            Open <span style={{ color: '#f59e0b' }}>Gigs</span>
          </h1>
          <p style={{ margin: 0, color: '#555', fontSize: '0.85rem' }}>
            {filtered.length} gig{filtered.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* ── SEARCH + FILTER ── */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search gigs, skills..."
            style={{ flex: 1, minWidth: 200, padding: '10px 14px', background: '#111', border: '1px solid #2a2a2a', borderRadius: 10, color: '#fff', fontSize: '0.9rem', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = '#f59e0b'}
            onBlur={e  => e.target.style.borderColor = '#2a2a2a'}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                style={{ padding: '8px 14px', borderRadius: 20, border: '1px solid', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  background:   category === cat ? '#f59e0b' : '#111',
                  borderColor:  category === cat ? '#f59e0b' : '#2a2a2a',
                  color:        category === cat ? '#000'    : '#666',
                }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── GIG GRID ── */}
        {filtered.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#555' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
              <p>No gigs match your search. Try different keywords.</p>
            </div>
          )
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
              {filtered.map(gig => (
                <GigCard key={gig.GigID} gig={gig} onApply={() => { setApplying(gig.GigID); setCoverLetter(''); setApplyMsg({ type: '', text: '' }); }} />
              ))}
            </div>
          )
        }
      </div>

      {/* ── APPLY MODAL ── */}
      {applying && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}
          onClick={e => { if (e.target === e.currentTarget) setApplying(null); }}>
          <div style={{ width: '100%', maxWidth: 480, background: '#111', border: '1px solid #2a2a2a', borderRadius: 16, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Apply for Gig</h2>
              <button onClick={() => setApplying(null)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            {applyMsg.text && (
              <div style={{ marginBottom: '1rem', padding: '10px 14px', background: applyMsg.type === 'success' ? '#001a0d' : '#1a0000', border: `1px solid ${applyMsg.type === 'success' ? '#22d3a540' : '#ff5e7840'}`, color: applyMsg.type === 'success' ? '#22d3a5' : '#ff8090', borderRadius: 10, fontSize: '0.85rem' }}>
                {applyMsg.text}
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: '#555', textTransform: 'uppercase', marginBottom: 8 }}>
                Cover Letter <span style={{ color: '#444', fontWeight: 400 }}>(Optional)</span>
              </label>
              <textarea
                value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
                placeholder="Briefly explain why you're a great fit for this gig..."
                rows={5} maxLength={1000}
                style={{ width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, color: '#fff', fontSize: '0.9rem', outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                onBlur={e  => e.target.style.borderColor = '#2a2a2a'}
              />
              <p style={{ margin: '4px 0 0', color: '#333', fontSize: '0.72rem', textAlign: 'right' }}>{coverLetter.length}/1000</p>
            </div>

            <p style={{ color: '#444', fontSize: '0.78rem', marginBottom: '1rem' }}>
              💡 Your match score will be calculated automatically based on your profile skills.
            </p>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleApply(applying)} disabled={applyLoading}
                style={{ flex: 1, padding: '11px', background: '#f59e0b', color: '#000', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: '0.95rem', cursor: applyLoading ? 'not-allowed' : 'pointer', opacity: applyLoading ? 0.8 : 1 }}>
                {applyLoading ? 'Submitting...' : 'Submit Application →'}
              </button>
              <button onClick={() => setApplying(null)}
                style={{ padding: '11px 16px', background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#666', borderRadius: 10, fontSize: '0.9rem', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GigCard({ gig, onApply }) {
  const navigate = useNavigate();
  return (
    <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 14, padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: 0 }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#f59e0b30'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e1e'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: '0.72rem', padding: '3px 8px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6, color: '#888' }}>
          {gig.Category || 'General'}
        </span>
        <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.95rem' }}>
          {gig.Budget ? `PKR ${Number(gig.Budget).toLocaleString()}` : 'Negotiable'}
        </span>
      </div>

      <h3 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.3, cursor: 'pointer' }}
        onClick={() => navigate(`/gigs/${gig.GigID}`)}>
        {gig.Title}
      </h3>

      <p style={{ margin: '0 0 10px', color: '#555', fontSize: '0.8rem', lineHeight: 1.5, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {gig.Description || 'No description provided.'}
      </p>

      {gig.RequiredSkills && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
          {gig.RequiredSkills.split(',').slice(0, 4).map(s => s.trim()).filter(Boolean).map(skill => (
            <span key={skill} style={{ padding: '2px 8px', background: '#1a1200', border: '1px solid #f59e0b20', color: '#f59e0b', borderRadius: 20, fontSize: '0.72rem' }}>
              {skill}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ color: '#444', fontSize: '0.75rem' }}>
          {gig.ClientVerified ? '✅ ' : ''}{gig.CompanyName || gig.ClientName}
        </span>
        <span style={{ color: '#444', fontSize: '0.75rem' }}>
          {gig.ApplicationCount} applied
          {gig.Deadline && ` · Due ${new Date(gig.Deadline).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}`}
        </span>
      </div>

      <button onClick={onApply}
        style={{ width: '100%', padding: '9px', background: '#f59e0b', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
        Apply Now →
      </button>
    </div>
  );
}