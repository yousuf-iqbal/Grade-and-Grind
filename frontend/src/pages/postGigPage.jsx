// src/pages/PostGigPage.jsx
// used for both creating a new gig and editing an existing one

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';

const CATEGORIES = ['Development', 'Design', 'Writing', 'Data', 'Marketing', 'Video', 'Other'];

function InputField({ label, required, children, hint }) {
  return (
    <div style={{ marginBottom: '1.2rem' }}>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: '#555', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}{required && <span style={{ color: '#f59e0b' }}> *</span>}
      </label>
      {children}
      {hint && <p style={{ margin: '5px 0 0', color: '#444', fontSize: '0.75rem' }}>{hint}</p>}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 14px', background: '#1a1a1a',
  border: '1px solid #2a2a2a', borderRadius: 10, color: '#fff',
  fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
};

export default function PostGigPage() {
  const navigate    = useNavigate();
  const { id }      = useParams();   // present when editing
  const isEdit      = Boolean(id);

  const [form, setForm] = useState({
    title: '', description: '', budget: '', deadline: '',
    category: '', requiredSkills: '',
  });
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (!isEdit) return;
    API.get(`/gigs/${id}`)
      .then(res => {
        const g = res.data.gig;
        setForm({
          title:          g.Title          || '',
          description:    g.Description    || '',
          budget:         g.Budget         || '',
          deadline:       g.Deadline ? g.Deadline.split('T')[0] : '',
          category:       g.Category       || '',
          requiredSkills: g.RequiredSkills || '',
        });
      })
      .catch(() => setError('Could not load gig.'))
      .finally(() => setFetching(false));
  }, [id, isEdit]);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEdit) {
        await API.put(`/gigs/${id}`, form);
      } else {
        await API.post('/gigs', form);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
      Loading gig...
    </div>
  );

  // get tomorrow as min date for deadline
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: 'system-ui', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 640 }}>

        {/* header */}
        <div style={{ marginBottom: '2rem' }}>
          <button onClick={() => navigate('/dashboard')}
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.85rem', marginBottom: 16, padding: 0 }}>
            ← Back to Dashboard
          </button>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>
            {isEdit ? 'Edit Gig' : (
              <>Post a <span style={{ color: '#f59e0b' }}>Gig</span></>
            )}
          </h1>
          <p style={{ margin: '6px 0 0', color: '#555', fontSize: '0.85rem' }}>
            {isEdit ? 'Update your gig details below.' : 'Fill in the details and students will find you.'}
          </p>
        </div>

        {/* error */}
        {error && (
          <div style={{ marginBottom: '1rem', padding: '12px 16px', background: '#ff5e7815', border: '1px solid #ff5e7840', color: '#ff8090', borderRadius: 10, fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* form */}
        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 16, padding: '2rem' }}>
          <form onSubmit={handleSubmit}>

            <InputField label="Gig Title" required hint="Be specific — e.g. 'Build a React admin dashboard'">
              <input
                value={form.title} onChange={set('title')}
                placeholder="e.g. Build a React Admin Dashboard"
                required maxLength={150}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                onBlur={e  => e.target.style.borderColor = '#2a2a2a'}
              />
            </InputField>

            <InputField label="Description" hint="Describe what you need, deliverables, and any specific requirements.">
              <textarea
                value={form.description} onChange={set('description')}
                placeholder="Describe the gig in detail..."
                rows={5} maxLength={2000}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                onBlur={e  => e.target.style.borderColor = '#2a2a2a'}
              />
              <p style={{ margin: '4px 0 0', color: '#333', fontSize: '0.72rem', textAlign: 'right' }}>
                {form.description.length}/2000
              </p>
            </InputField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <InputField label="Budget (PKR)" hint="Leave blank if negotiable.">
                <input
                  type="number" min="0" value={form.budget} onChange={set('budget')}
                  placeholder="e.g. 5000"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#f59e0b'}
                  onBlur={e  => e.target.style.borderColor = '#2a2a2a'}
                />
              </InputField>

              <InputField label="Deadline">
                <input
                  type="date" min={minDate} value={form.deadline} onChange={set('deadline')}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                  onFocus={e => e.target.style.borderColor = '#f59e0b'}
                  onBlur={e  => e.target.style.borderColor = '#2a2a2a'}
                />
              </InputField>
            </div>

            <InputField label="Category">
              <select value={form.category} onChange={set('category')}
                style={{ ...inputStyle, color: form.category ? '#fff' : '#555' }}
                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                onBlur={e  => e.target.style.borderColor = '#2a2a2a'}>
                <option value="" disabled style={{ background: '#1a1a1a' }}>Select a category</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c} style={{ background: '#1a1a1a' }}>{c}</option>
                ))}
              </select>
            </InputField>

            <InputField
              label="Required Skills"
              hint="Comma-separated — e.g. React, Node.js, SQL. Used for student matching.">
              <input
                value={form.requiredSkills} onChange={set('requiredSkills')}
                placeholder="React, Tailwind, Node.js, SQL"
                maxLength={500}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                onBlur={e  => e.target.style.borderColor = '#2a2a2a'}
              />
              {/* live skill tags preview */}
              {form.requiredSkills && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                    <span key={skill} style={{ padding: '2px 10px', background: '#1a1200', border: '1px solid #f59e0b30', color: '#f59e0b', borderRadius: 20, fontSize: '0.75rem' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </InputField>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '13px', background: '#f59e0b', color: '#000', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1, marginTop: 8 }}>
              {loading ? 'Saving...' : isEdit ? 'Update Gig →' : 'Post Gig →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}