// src/pages/StudentProfilePage.jsx
// student edits their own profile — matches dark amber design of AuthPage

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const DEGREES = ['BSCS', 'BSDS', 'BSSE', 'BSAI', 'BSIT', 'BBA', 'BS Electrical', 'Other'];
const GRAD_YEARS = [2024, 2025, 2026, 2027, 2028, 2029];

export default function StudentProfilePage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [cvUploading, setCVUploading] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  // profile fields
  const [phone,          setPhone]          = useState('');
  const [university,     setUniversity]     = useState('');
  const [bio,            setBio]            = useState('');
  const [degree,         setDegree]         = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [portfolioURL,   setPortfolioURL]   = useState('');
  const [linkedInURL,    setLinkedInURL]    = useState('');
  const [isAvailable,    setIsAvailable]    = useState(true);
  const [isPublished,    setIsPublished]    = useState(false);
  const [skills,         setSkills]         = useState([]);
  const [skillInput,     setSkillInput]     = useState('');
  const [cvURL,          setCvURL]          = useState('');
  const [profilePic,     setProfilePic]     = useState('');
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState('');

  const cvInputRef  = useRef();
  const picInputRef = useRef();

  // load profile on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/profile/me');
        const { profile, skills: s } = res.data;
        setPhone(profile.Phone          || '');
        setUniversity(profile.University   || '');
        setBio(profile.Bio              || '');
        setDegree(profile.Degree          || '');
        setGraduationYear(profile.GraduationYear || '');
        setPortfolioURL(profile.PortfolioURL   || '');
        setLinkedInURL(profile.LinkedInURL    || '');
        setIsAvailable(profile.IsAvailable === 1 || profile.IsAvailable === true);
        setIsPublished(profile.IsPublished === 1 || profile.IsPublished === true);
        setCvURL(profile.CVURL           || '');
        setProfilePic(profile.ProfilePic     || '');
        setSkills(s.map(sk => sk.SkillName));
      } catch {
        setError('Failed to load profile.');
      }
      setLoading(false);
    };
    load();
  }, []);

  // profile pic file change
  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfilePicFile(file);
    setProfilePicPreview(URL.createObjectURL(file));
  };

  // add skill on Enter or comma
  const handleSkillKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && skillInput.trim()) {
      e.preventDefault();
      const name = skillInput.trim().replace(/,$/, '');
      if (name && !skills.includes(name) && skills.length < 20) {
        setSkills([...skills, name]);
      }
      setSkillInput('');
    }
    if (e.key === 'Backspace' && !skillInput && skills.length > 0) {
      setSkills(skills.slice(0, -1));
    }
  };

  const removeSkill = (skill) => setSkills(skills.filter(s => s !== skill));

  // save profile
  const handleSave = async (publish = false) => {
    setError(''); setSuccess('');
    setSaving(true);
    try {
      const form = new FormData();
      form.append('phone',          phone);
      form.append('university',     university);
      form.append('bio',            bio);
      form.append('degree',         degree);
      form.append('graduationYear', graduationYear);
      form.append('portfolioURL',   portfolioURL);
      form.append('linkedInURL',    linkedInURL);
      form.append('isAvailable',    isAvailable);
      form.append('publish',        publish);
      skills.forEach(s => form.append('skills[]', s));
      if (profilePicFile) form.append('profilePic', profilePicFile);

      const res = await API.put('/profile/me', form);
      setIsPublished(publish);
      setSuccess(res.data.message);
      if (profilePicFile) {
        setProfilePic(res.data.profile.ProfilePic || '');
        setProfilePicFile(null);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save profile.');
    }
    setSaving(false);
  };

  // upload cv
  const handleCVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted for CV upload.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('CV file must be under 5MB.');
      return;
    }
    setCVUploading(true); setError(''); setSuccess('');
    try {
      const form = new FormData();
      form.append('cv', file);
      const res = await API.post('/profile/me/cv', form);
      setCvURL(res.data.cvURL);
      setSuccess('CV uploaded successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'CV upload failed.');
    }
    setCVUploading(false);
  };

  // delete cv
  const handleCVDelete = async () => {
    if (!window.confirm('Remove your CV?')) return;
    try {
      await API.delete('/profile/me/cv');
      setCvURL('');
      setSuccess('CV removed.');
    } catch {
      setError('Failed to remove CV.');
    }
  };

  if (loading) return <LoadingScreen />;

  const avatarSrc = profilePicPreview || profilePic || null;

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
          <button
            onClick={() => setPreviewMode(!previewMode)}
            style={{
              padding: '0.4rem 1rem', borderRadius: 8, fontSize: '0.8rem',
              fontWeight: 600, cursor: 'pointer',
              background: previewMode ? '#f59e0b' : 'transparent',
              border: `1px solid ${previewMode ? '#f59e0b' : '#2a2a2a'}`,
              color: previewMode ? '#000' : '#aaa',
            }}>
            {previewMode ? '✏️ Edit' : '👁 Preview'}
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Btn onClick={() => handleSave(false)} disabled={saving}
              variant="outline">{saving ? 'Saving...' : 'Save Draft'}</Btn>
            <Btn onClick={() => handleSave(true)} disabled={saving}>
              {isPublished ? 'Update & Publish' : 'Publish Profile'}
            </Btn>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* status banner */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.75rem 1.25rem', borderRadius: 12, marginBottom: '1.5rem',
          background: isPublished ? '#22d3a510' : '#f59e0b10',
          border: `1px solid ${isPublished ? '#22d3a530' : '#f59e0b30'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem' }}>{isPublished ? '🟢' : '🟡'}</span>
            <span style={{ fontSize: '0.85rem', color: isPublished ? '#22d3a5' : '#f59e0b', fontWeight: 600 }}>
              {isPublished ? 'Profile is published — visible to clients' : 'Profile is a draft — only you and admins can see it'}
            </span>
          </div>
        </div>

        {/* alerts */}
        {error   && <Alert type="error"   msg={error}   onClose={() => setError('')} />}
        {success && <Alert type="success" msg={success} onClose={() => setSuccess('')} />}

        {previewMode
          ? <ProfilePreview
              user={user} phone={phone} university={university} bio={bio}
              degree={degree} graduationYear={graduationYear}
              portfolioURL={portfolioURL} linkedInURL={linkedInURL}
              isAvailable={isAvailable} isPublished={isPublished}
              skills={skills} cvURL={cvURL} avatarSrc={avatarSrc}
            />
          : <EditForm
              avatarSrc={avatarSrc} picInputRef={picInputRef}
              handlePicChange={handlePicChange}
              phone={phone} setPhone={setPhone}
              university={university} setUniversity={setUniversity}
              bio={bio} setBio={setBio}
              degree={degree} setDegree={setDegree}
              graduationYear={graduationYear} setGraduationYear={setGraduationYear}
              portfolioURL={portfolioURL} setPortfolioURL={setPortfolioURL}
              linkedInURL={linkedInURL} setLinkedInURL={setLinkedInURL}
              isAvailable={isAvailable} setIsAvailable={setIsAvailable}
              skills={skills} skillInput={skillInput}
              setSkillInput={setSkillInput} handleSkillKeyDown={handleSkillKeyDown}
              removeSkill={removeSkill}
              cvURL={cvURL} cvInputRef={cvInputRef}
              cvUploading={cvUploading} handleCVUpload={handleCVUpload}
              handleCVDelete={handleCVDelete}
            />
        }
      </div>
    </div>
  );
}

// ── EDIT FORM ──────────────────────────────────────────────────────────────────
function EditForm({
  avatarSrc, picInputRef, handlePicChange,
  phone, setPhone, university, setUniversity,
  bio, setBio, degree, setDegree,
  graduationYear, setGraduationYear,
  portfolioURL, setPortfolioURL,
  linkedInURL, setLinkedInURL,
  isAvailable, setIsAvailable,
  skills, skillInput, setSkillInput,
  handleSkillKeyDown, removeSkill,
  cvURL, cvInputRef, cvUploading,
  handleCVUpload, handleCVDelete,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── PROFILE PICTURE ── */}
      <Card title="Profile Picture">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div
            onClick={() => picInputRef.current.click()}
            style={{
              width: 90, height: 90, borderRadius: '50%',
              background: avatarSrc ? 'transparent' : '#1e1e1e',
              border: '2px dashed #2a2a2a', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0,
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#f59e0b'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2a2a'}
          >
            {avatarSrc
              ? <img src={avatarSrc} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '2rem' }}>👤</span>
            }
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '0.5rem' }}>
              Click the avatar to upload a photo
            </p>
            <p style={{ fontSize: '0.75rem', color: '#555' }}>
              JPG, PNG or WebP — recommended 300×300px
            </p>
          </div>
          <input ref={picInputRef} type="file" accept="image/*"
            style={{ display: 'none' }} onChange={handlePicChange} />
        </div>
      </Card>

      {/* ── BASIC INFO ── */}
      <Card title="Basic Information">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="PHONE (OPTIONAL)">
            <Input value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="03001234567" />
          </Field>
          <Field label="UNIVERSITY">
            <Input value={university} onChange={e => setUniversity(e.target.value)}
              placeholder="FAST-NU Lahore" />
          </Field>
          <Field label="DEGREE">
            <select value={degree} onChange={e => setDegree(e.target.value)}
              style={inputStyle}>
              <option value="">Select degree</option>
              {DEGREES.map(d => <option key={d} value={d} style={{ background: '#1a1a1a' }}>{d}</option>)}
            </select>
          </Field>
          <Field label="GRADUATION YEAR">
            <select value={graduationYear} onChange={e => setGraduationYear(e.target.value)}
              style={inputStyle}>
              <option value="">Select year</option>
              {GRAD_YEARS.map(y => <option key={y} value={y} style={{ background: '#1a1a1a' }}>{y}</option>)}
            </select>
          </Field>
        </div>

        <Field label="BIO" style={{ marginTop: '1rem' }}>
          <textarea value={bio} onChange={e => setBio(e.target.value)}
            placeholder="Tell clients about yourself, your skills, and what makes you a great hire..."
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
            onFocus={e => e.target.style.borderColor = '#f59e0b'}
            onBlur={e  => e.target.style.borderColor = '#2a2a2a'}
          />
        </Field>

        {/* availability toggle */}
        <div style={{
          marginTop: '1rem', display: 'flex', alignItems: 'center',
          gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: 10,
          background: '#1a1a1a', border: '1px solid #2a2a2a',
        }}>
          <div
            onClick={() => setIsAvailable(!isAvailable)}
            style={{
              width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
              background: isAvailable ? '#f59e0b' : '#333',
              position: 'relative', transition: 'background 0.2s',
              flexShrink: 0,
            }}>
            <div style={{
              position: 'absolute', top: 3,
              left: isAvailable ? 23 : 3,
              width: 18, height: 18, borderRadius: '50%',
              background: '#fff', transition: 'left 0.2s',
            }} />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
              {isAvailable ? 'Open to new gigs' : 'Not available'}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>
              Clients can see your availability status
            </p>
          </div>
        </div>
      </Card>

      {/* ── SKILLS ── */}
      <Card title="Skills">
        <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.75rem' }}>
          Type a skill and press <kbd style={{ background: '#222', padding: '1px 5px', borderRadius: 4, fontSize: '0.75rem' }}>Enter</kbd> or <kbd style={{ background: '#222', padding: '1px 5px', borderRadius: 4, fontSize: '0.75rem' }}>,</kbd> to add. Max 20 skills.
        </p>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
          padding: '0.75rem', borderRadius: 10,
          background: '#1a1a1a', border: '1px solid #2a2a2a',
          minHeight: 60, alignItems: 'center',
        }}
          onFocus={() => {}}
          onClick={() => document.getElementById('skill-input').focus()}
        >
          {skills.map(skill => (
            <span key={skill} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.3rem 0.75rem', borderRadius: 20,
              background: '#1a1200', border: '1px solid #f59e0b40',
              color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600,
            }}>
              {skill}
              <span
                onClick={(e) => { e.stopPropagation(); removeSkill(skill); }}
                style={{ cursor: 'pointer', opacity: 0.7, marginLeft: 2 }}>×</span>
            </span>
          ))}
          {skills.length < 20 && (
            <input
              id="skill-input"
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder={skills.length === 0 ? 'React, Node.js, Figma...' : ''}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: '#fff', fontSize: '0.85rem', minWidth: 120, flex: 1,
              }}
            />
          )}
        </div>
      </Card>

      {/* ── LINKS ── */}
      <Card title="Links & Portfolio">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="PORTFOLIO URL">
            <Input value={portfolioURL} onChange={e => setPortfolioURL(e.target.value)}
              placeholder="https://yourportfolio.com" type="url" />
          </Field>
          <Field label="LINKEDIN URL">
            <Input value={linkedInURL} onChange={e => setLinkedInURL(e.target.value)}
              placeholder="https://linkedin.com/in/yourname" type="url" />
          </Field>
        </div>
      </Card>

      {/* ── CV UPLOAD ── */}
      <Card title="CV / Resume">
        <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1rem' }}>
          PDF only · Max 5MB · Clients can download your CV from your public profile
        </p>

        {cvURL ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.75rem 1rem', borderRadius: 10,
            background: '#22d3a510', border: '1px solid #22d3a530',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📄</span>
              <div>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#22d3a5' }}>
                  CV uploaded
                </p>
                <a href={cvURL} target="_blank" rel="noreferrer"
                  style={{ fontSize: '0.75rem', color: '#22d3a5', opacity: 0.7 }}>
                  View / Download
                </a>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Btn variant="outline" onClick={() => cvInputRef.current.click()}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}>
                Replace
              </Btn>
              <Btn variant="danger" onClick={handleCVDelete}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}>
                Remove
              </Btn>
            </div>
          </div>
        ) : (
          <div
            onClick={() => cvInputRef.current.click()}
            style={{
              border: '2px dashed #2a2a2a', borderRadius: 12,
              padding: '2.5rem', textAlign: 'center', cursor: 'pointer',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.background = '#f59e0b08'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.background = 'transparent'; }}
          >
            {cvUploading
              ? <p style={{ color: '#f59e0b', margin: 0 }}>Uploading...</p>
              : <>
                  <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📎</p>
                  <p style={{ color: '#aaa', margin: 0, fontSize: '0.9rem' }}>
                    Click to upload your CV
                  </p>
                  <p style={{ color: '#555', margin: '0.25rem 0 0', fontSize: '0.75rem' }}>
                    PDF only, max 5MB
                  </p>
                </>
            }
          </div>
        )}

        <input ref={cvInputRef} type="file" accept="application/pdf"
          style={{ display: 'none' }} onChange={handleCVUpload} />
      </Card>
    </div>
  );
}

// ── PROFILE PREVIEW ────────────────────────────────────────────────────────────
function ProfilePreview({
  user, university, bio, degree, graduationYear,
  portfolioURL, linkedInURL, isAvailable, isPublished,
  skills, cvURL, avatarSrc,
}) {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{
        padding: '1rem 1.5rem', marginBottom: '1rem', borderRadius: 10,
        background: '#1a1a1a', border: '1px solid #2a2a2a',
        fontSize: '0.8rem', color: '#888', textAlign: 'center',
      }}>
        👁 This is how your profile appears to clients
      </div>

      {/* header */}
      <div style={{
        padding: '2rem', borderRadius: 16,
        background: '#111', border: '1px solid #1e1e1e',
        marginBottom: '1rem',
      }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: '#1e1e1e', flexShrink: 0, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #2a2a2a',
          }}>
            {avatarSrc
              ? <img src={avatarSrc} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '2rem' }}>👤</span>
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>{user?.fullName || '—'}</h2>
              {isAvailable && (
                <span style={{
                  padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.7rem',
                  background: '#22d3a510', border: '1px solid #22d3a530', color: '#22d3a5', fontWeight: 600,
                }}>Available</span>
              )}
            </div>
            <p style={{ color: '#888', margin: '0.25rem 0', fontSize: '0.9rem' }}>
              {degree && `${degree}`}{degree && graduationYear && ' · '}{graduationYear && `Class of ${graduationYear}`}
            </p>
            <p style={{ color: '#666', margin: 0, fontSize: '0.85rem' }}>{university}</p>
          </div>
        </div>

        {bio && <p style={{ color: '#aaa', marginTop: '1.25rem', lineHeight: 1.6, fontSize: '0.9rem' }}>{bio}</p>}

        {/* links */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {portfolioURL && (
            <a href={portfolioURL} target="_blank" rel="noreferrer"
              style={{ fontSize: '0.8rem', color: '#f59e0b', textDecoration: 'none' }}>
              🌐 Portfolio
            </a>
          )}
          {linkedInURL && (
            <a href={linkedInURL} target="_blank" rel="noreferrer"
              style={{ fontSize: '0.8rem', color: '#f59e0b', textDecoration: 'none' }}>
              💼 LinkedIn
            </a>
          )}
          {cvURL && isPublished && (
            <a href={cvURL} target="_blank" rel="noreferrer"
              style={{ fontSize: '0.8rem', color: '#f59e0b', textDecoration: 'none' }}>
              📄 Download CV
            </a>
          )}
        </div>
      </div>

      {/* skills */}
      {skills.length > 0 && (
        <div style={{
          padding: '1.5rem', borderRadius: 16,
          background: '#111', border: '1px solid #1e1e1e',
        }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#555', fontWeight: 700, letterSpacing: '0.1em' }}>
            SKILLS
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {skills.map(s => (
              <span key={s} style={{
                padding: '0.3rem 0.75rem', borderRadius: 20,
                background: '#1a1200', border: '1px solid #f59e0b40',
                color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600,
              }}>{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SMALL COMPONENTS ──────────────────────────────────────────────────────────

const inputStyle = {
  width: '100%', padding: '0.65rem 1rem', borderRadius: 10,
  background: '#1a1a1a', border: '1px solid #2a2a2a',
  color: '#fff', fontSize: '0.85rem', outline: 'none',
  boxSizing: 'border-box',
};

function Card({ title, children }) {
  return (
    <div style={{
      padding: '1.5rem', borderRadius: 16,
      background: '#111', border: '1px solid #1e1e1e',
    }}>
      <h3 style={{
        margin: '0 0 1.25rem', fontSize: '0.75rem',
        color: '#555', fontWeight: 700, letterSpacing: '0.1em',
      }}>{title.toUpperCase()}</h3>
      {children}
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <div style={style}>
      <label style={{
        display: 'block', fontSize: '0.7rem', fontWeight: 700,
        color: '#555', letterSpacing: '0.08em', marginBottom: '0.4rem',
      }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ type = 'text', value, onChange, placeholder, required }) {
  return (
    <input type={type} value={value} onChange={onChange}
      placeholder={placeholder} required={required}
      style={inputStyle}
      onFocus={e => e.target.style.borderColor = '#f59e0b'}
      onBlur={e  => e.target.style.borderColor = '#2a2a2a'}
    />
  );
}

function Btn({ children, onClick, disabled, variant = 'primary', style: extraStyle }) {
  const styles = {
    primary: { background: '#f59e0b', color: '#000', border: '1px solid #f59e0b' },
    outline:  { background: 'transparent', color: '#aaa', border: '1px solid #2a2a2a' },
    danger:   { background: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b40' },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        padding: '0.5rem 1.25rem', borderRadius: 8,
        fontWeight: 700, fontSize: '0.82rem', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1, transition: 'opacity 0.2s',
        ...styles[variant], ...extraStyle,
      }}>
      {children}
    </button>
  );
}

function Alert({ type, msg, onClose }) {
  const colors = {
    error:   { bg: '#ff5e7815', border: '#ff5e7840', text: '#ff8090' },
    success: { bg: '#22d3a515', border: '#22d3a540', text: '#22d3a5' },
  };
  const c = colors[type];
  return (
    <div style={{
      marginBottom: '1rem', padding: '0.75rem 1rem',
      borderRadius: 10, fontSize: '0.85rem',
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      {msg}
      <span onClick={onClose} style={{ cursor: 'pointer', marginLeft: '1rem', opacity: 0.7 }}>×</span>
    </div>
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