// src/components/NotificationBell.jsx
// drop this into StudentDashboard and ClientDashboard navbars
// shows a bell icon with an unread count badge
// clicking opens a dropdown list of all notifications

import { useState, useEffect, useRef } from 'react';
import API from '../api/axios';

const typeColors = {
  application: { bg: '#1a2744', color: '#60a5fa', border: '#1e3a5f' },
  gig:         { bg: '#1c1207', color: '#fbbf24', border: '#78350f' },
  payment:     { bg: '#052e16', color: '#4ade80', border: '#14532d' },
  message:     { bg: '#1a1a2e', color: '#a78bfa', border: '#4c1d95' },
  review:      { bg: '#1c0a0a', color: '#f87171', border: '#7f1d1d' },
  system:      { bg: '#1a1a1a', color: '#888',    border: '#2a2a2a' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell() {
  const [open,    setOpen]    = useState(false);
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef();

  const unreadCount = notifs.filter(n => !n.IsRead).length;

  // load on mount
  useEffect(() => {
    loadNotifs();
    // poll every 60 seconds for new notifications
    const interval = setInterval(loadNotifs, 60000);
    return () => clearInterval(interval);
  }, []);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadNotifs = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifs(res.data.notifications || []);
    } catch {
      // fail silently — notifications shouldn't break the dashboard
    }
  };

  const handleOpen = async () => {
    setOpen(o => !o);
    if (!open && unreadCount > 0) {
      // mark all as read when dropdown opened
      try {
        await API.patch('/notifications/read-all');
        setNotifs(prev => prev.map(n => ({ ...n, IsRead: 1 })));
      } catch { /* ignore */ }
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        style={{
          position: 'relative',
          background: 'transparent',
          border: '1px solid #2a2a2a',
          borderRadius: '8px',
          padding: '6px 12px',
          cursor: 'pointer',
          color: '#ccc',
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            background: '#f59e0b',
            color: '#000',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '0.65rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '42px',
          right: 0,
          width: '340px',
          background: '#141414',
          border: '1px solid #2a2a2a',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 999,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px 10px',
            borderBottom: '1px solid #1e1e1e',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
              Notifications
            </span>
            {notifs.length > 0 && (
              <button
                style={{ background: 'none', border: 'none', color: '#f59e0b', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                onClick={async () => {
                  try {
                    await API.patch('/notifications/read-all');
                    setNotifs(prev => prev.map(n => ({ ...n, IsRead: 1 })));
                  } catch { /* ignore */ }
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: '#555', fontSize: '0.85rem' }}>
                No notifications yet
              </div>
            ) : (
              notifs.map(n => {
                const tc = typeColors[n.Type] || typeColors.system;
                return (
                  <div
                    key={n.NotificationID}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #1a1a1a',
                      background: n.IsRead ? 'transparent' : '#1a1a1a',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                    }}
                  >
                    {/* Type pill */}
                    <span style={{
                      flexShrink: 0,
                      background: tc.bg,
                      color: tc.color,
                      border: `1px solid ${tc.border}`,
                      borderRadius: '20px',
                      padding: '2px 8px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      marginTop: '2px',
                    }}>
                      {n.Type}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.83rem', color: '#e5e5e5', marginBottom: '2px' }}>
                        {n.Title}
                      </div>
                      <div style={{ color: '#888', fontSize: '0.78rem', lineHeight: 1.4 }}>
                        {n.Message}
                      </div>
                      <div style={{ color: '#555', fontSize: '0.72rem', marginTop: '4px' }}>
                        {timeAgo(n.CreatedAt)}
                      </div>
                    </div>
                    {!n.IsRead && (
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: '#f59e0b', flexShrink: 0, marginTop: '6px',
                      }} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}