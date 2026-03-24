// src/components/PostGigModal.jsx
import { useState } from 'react';
import API from '../api/axios';

const CATEGORIES = ['Development', 'Design', 'Writing', 'Data', 'Marketing', 'Video', 'Other'];

export default function PostGigModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '', description: '', budget: '', deadline: '',
    category: '', requiredSkills: '',
  });
  const [error,     setError]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await API.post('/gigs', {
        title:          form.title.trim(),
        description:    form.description.trim() || undefined,
        budget:         form.budget ? parseFloat(form.budget) : undefined,
        deadline:       form.deadline || undefined,
        category:       form.category || undefined,
        requiredSkills: form.requiredSkills.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post gig.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Post a gig</h2>
            <p style={styles.sub}>Describe your project and required skills</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Fields */}
        <div style={styles.fields}>
          <Field label="Title" required>
            <input
              style={styles.input}
              placeholder="e.g. Logo design for startup"
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
          </Field>

          <Field label="Description">
            <textarea
              style={{ ...styles.input, minHeight: '90px', resize: 'vertical' }}
              placeholder="Describe your gig in detail..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </Field>

          <div style={styles.row}>
            <Field label="Budget ($)">
              <input
                style={styles.input}
                type="number"
                min="0"
                placeholder="0"
                value={form.budget}
                onChange={e => set('budget', e.target.value)}
              />
            </Field>
            <Field label="Deadline">
              <input
                style={styles.input}
                type="date"
                value={form.deadline}
                onChange={e => set('deadline', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Category">
            <select
              style={{ ...styles.input, cursor: 'pointer' }}
              value={form.category}
              onChange={e => set('category', e.target.value)}
            >
              <option value="">Select a category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Required Skills">
            <input
              style={styles.input}
              placeholder="e.g. React, Node.js, Figma  (comma-separated)"
              value={form.requiredSkills}
              onChange={e => set('requiredSkills', e.target.value)}
            />
            <p style={styles.hint}>Comma-separated keywords — used to match students automatically</p>
          </Field>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Posting...' : 'Post Gig'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={styles.label}>
        {label}{required && <span style={{ color: '#f87171' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' },
  modal: { background: '#141414', border: '1px solid #2a2a2a', borderRadius: '16px', width: '520px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' },

  header: { padding: '24px 24px 16px', borderBottom: '1px solid #1e1e1e', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff' },
  sub: { margin: '3px 0 0', color: '#666', fontSize: '0.85rem' },
  closeBtn: { background: 'none', border: 'none', color: '#555', fontSize: '1.1rem', cursor: 'pointer', padding: '4px', lineHeight: 1 },

  fields: { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },

  label: { fontSize: '0.82rem', fontWeight: 600, color: '#aaa' },
  input: {
    background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px',
    color: '#fff', padding: '10px 12px', fontSize: '0.88rem', outline: 'none',
    fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  hint: { margin: '3px 0 0', color: '#555', fontSize: '0.75rem' },
  error: { margin: '0 24px', color: '#f87171', fontSize: '0.83rem' },

  footer: { padding: '16px 24px 24px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #1e1e1e' },
  cancelBtn: { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: '8px', padding: '9px 20px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  submitBtn: { background: '#f59e0b', color: '#000', border: 'none', borderRadius: '8px', padding: '9px 24px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' },
};