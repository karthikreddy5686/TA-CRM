import React from 'react';
import { 
  Users, 
  Building2, 
  PhoneCall, 
  Clock, 
  Calendar, 
  PhoneIncoming, 
  GitFork, 
  Video, 
  MessageSquare, 
  Target 
} from 'lucide-react';

export default function MobileCallingHub({
  currentUser,
  students = [],
  tpos = [],
  drives = [],
  followUps = [],
  callSessions = [],
  onSelectTab,
  onStartCall,
  onOpenQuickCall,
  onOpenChat,
  onOpenPhoneConnect,
  hrPhoneNumber = '',
  unreadChatCount = 0
}) {
  // Calculate today's call stats
  const pendingFollowupsCount = followUps.filter(f => f.status === 'SCHEDULED' || f.status === 'PENDING').length;

  // Quick Tiles mapped to mobile calling grid (9 clean tiles)
  const hubTiles = [
    {
      id: 'students',
      label: 'Students',
      icon: <Users size={22} color="#0284c7" />,
      bg: '#e0f2fe',
      onClick: () => onSelectTab('liveBoard')
    },
    {
      id: 'tpos',
      label: 'TPOs',
      icon: <Building2 size={22} color="#16a34a" />,
      bg: '#dcfce7',
      onClick: () => onSelectTab('tpos')
    },
    {
      id: 'followups',
      label: 'Follow-Ups',
      icon: <Clock size={22} color="#d97706" />,
      bg: '#fef3c7',
      onClick: () => onSelectTab('followups'),
      badge: pendingFollowupsCount > 0 ? pendingFollowupsCount : null
    },
    {
      id: 'drives',
      label: 'Campus Drives',
      icon: <Calendar size={22} color="#7c3aed" />,
      bg: '#ede9fe',
      onClick: () => onSelectTab('drives')
    },
    {
      id: 'calls',
      label: 'Call Logs',
      icon: <PhoneIncoming size={22} color="#db2777" />,
      bg: '#fce7f3',
      onClick: () => onSelectTab('calls')
    },
    {
      id: 'pipeline',
      label: 'Pipeline',
      icon: <GitFork size={22} color="#0d9488" />,
      bg: '#ccfbf1',
      onClick: () => onSelectTab('pipeline')
    },
    {
      id: 'interviews',
      label: 'Interviews',
      icon: <Video size={22} color="#a21caf" />,
      bg: '#fae8ff',
      onClick: () => onSelectTab('liveBoard')
    },
    {
      id: 'chat',
      label: 'Team Chat',
      icon: <MessageSquare size={22} color="#ea580c" />,
      bg: '#ffedd5',
      onClick: () => onOpenChat(),
      badge: unreadChatCount > 0 ? unreadChatCount : null
    },
    {
      id: 'targets',
      label: 'Daily Target',
      icon: <Target size={22} color="#e11d48" />,
      bg: '#ffe4e6',
      onClick: () => onSelectTab('calls')
    }
  ];

  return (
    <div className="mobile-hub-container" style={{ padding: '12px 14px 80px', maxWidth: '600px', margin: '0 auto' }}>
      
      {/* Top Mobile Welcome Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '14px 16px',
        marginBottom: '14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        border: '1px solid #eef2f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: '#154360',
            color: '#FFDB58',
            fontWeight: 800,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #FFDB58',
            flexShrink: 0
          }}>
            {currentUser?.role === 'ADMIN' ? 'AD' : (currentUser?.name?.slice(0, 2).toUpperCase() || 'HR')}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#154360', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser?.name || 'Recruiter'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
              Calling & Outreach Hub
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenQuickCall}
          className="btn-mustard"
          style={{
            padding: '7px 12px',
            fontSize: '0.75rem',
            fontWeight: 800,
            gap: '5px',
            boxShadow: '0 2px 6px rgba(21, 67, 96, 0.15)',
            flexShrink: 0
          }}
        >
          <PhoneCall size={13} /> Dial
        </button>
      </div>

      {/* 3-Column Icons Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        marginBottom: '14px'
      }}>
        {hubTiles.map((tile) => (
          <div
            key={tile.id}
            onClick={tile.onClick}
            role="button"
            tabIndex={0}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '14px 6px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              border: '1px solid #eef2f6',
              cursor: 'pointer',
              position: 'relative',
              transition: 'transform 0.12s ease, box-shadow 0.12s ease'
            }}
          >
            {tile.badge && (
              <span style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.62rem',
                fontWeight: 800,
                borderRadius: '10px',
                padding: '1px 6px',
                lineHeight: 1.2
              }}>
                {tile.badge}
              </span>
            )}
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: tile.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '8px',
              flexShrink: 0
            }}>
              {tile.icon}
            </div>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 600,
              color: '#334155',
              textAlign: 'center',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '100%'
            }}>
              {tile.label}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
