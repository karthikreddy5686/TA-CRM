import React, { useState } from 'react';
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
  Target, 
  Smartphone, 
  Search, 
  Phone, 
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Sparkles,
  ChevronDown,
  ChevronUp
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
  const [activeCallListTab, setActiveCallListTab] = useState('students'); // 'students' | 'tpos'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDeskItems, setExpandedDeskItems] = useState({});
  const toggleItemExpand = (id) => {
    setExpandedDeskItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter students and TPOs for immediate calling
  const filteredStudents = students.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.collegeName && s.collegeName.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q)) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(q))
    );
  });

  const filteredTpos = tpos.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.collegeName && t.collegeName.toLowerCase().includes(q)) ||
      (t.phone && t.phone.includes(q))
    );
  });

  // Calculate today's call stats
  const totalCallsToday = callSessions.length;
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

      {/* 3-Column Icons Grid (Reference Image 2) */}
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

      {/* 2-Column KPI Summary Cards (Reference Image 2 Bottom) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        marginBottom: '18px'
      }}>
        {/* Card 1: Students to Call */}
        <div 
          onClick={() => onSelectTab('liveBoard')}
          role="button"
          tabIndex={0}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '14px 16px',
            border: '1px solid #eef2f6',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: '#e0f2fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px'
          }}>
            <Users size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
            {students.length}
          </div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '6px' }}>
            STUDENTS TO CALL
          </div>
        </div>

        {/* Card 2: College TPOs Active */}
        <div 
          onClick={() => onSelectTab('tpos')}
          role="button"
          tabIndex={0}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '14px 16px',
            border: '1px solid #eef2f6',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px'
          }}>
            <Building2 size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
            {tpos.length}
          </div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '6px' }}>
            COLLEGE TPOs
          </div>
        </div>
      </div>

      {/* Direct Mobile Calling Desk (Laser-Focused on Calling Students & TPOs) */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '16px',
        border: '1px solid #eef2f6',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#154360', margin: 0 }}>
              1-Tap Fast Calling
            </h3>
            <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '2px 0 0' }}>
              Direct in-app dialer & candidate phone outreach
            </p>
          </div>
        </div>

        {/* List Toggle: Students vs TPOs */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          borderRadius: '10px',
          padding: '3px',
          gap: '4px',
          marginBottom: '12px'
        }}>
          <button
            type="button"
            onClick={() => setActiveCallListTab('students')}
            style={{
              flex: 1,
              padding: '6px 10px',
              border: 'none',
              borderRadius: '7px',
              background: activeCallListTab === 'students' ? '#ffffff' : 'transparent',
              color: activeCallListTab === 'students' ? '#154360' : '#64748b',
              fontWeight: activeCallListTab === 'students' ? 700 : 500,
              fontSize: '0.76rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeCallListTab === 'students' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Users size={13} color={activeCallListTab === 'students' ? '#0284c7' : '#64748b'} />
            <span>Students ({students.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCallListTab('tpos')}
            style={{
              flex: 1,
              padding: '6px 10px',
              border: 'none',
              borderRadius: '7px',
              background: activeCallListTab === 'tpos' ? '#ffffff' : 'transparent',
              color: activeCallListTab === 'tpos' ? '#154360' : '#64748b',
              fontWeight: activeCallListTab === 'tpos' ? 700 : 500,
              fontSize: '0.76rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeCallListTab === 'tpos' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Building2 size={13} color={activeCallListTab === 'tpos' ? '#16a34a' : '#64748b'} />
            <span>College TPOs ({tpos.length})</span>
          </button>
        </div>

        {/* Quick Search */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '9px' }} />
          <input
            type="text"
            className="form-input"
            placeholder={activeCallListTab === 'students' ? 'Search student name, college, phone...' : 'Search TPO name, college, phone...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '32px', fontSize: '0.78rem', height: '34px', borderRadius: '8px' }}
          />
        </div>

        {/* Calling Cards List (Click to expand details & call) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
          {activeCallListTab === 'students' ? (
            filteredStudents.length > 0 ? (
              filteredStudents.slice(0, 20).map((student) => {
                const isExpanded = !!expandedDeskItems[`std_${student.id}`];
                return (
                  <div
                    key={student.id}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #eef2f6',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: isExpanded ? '8px' : '0px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Row 1: Clickable Name & Expand Chevron */}
                    <div 
                      onClick={() => toggleItemExpand(`std_${student.id}`)}
                      role="button"
                      tabIndex={0}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {student.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {student.collegeName || 'Campus Candidate'} • {student.branch || student.jobRole || 'Engineering'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
                        {isExpanded ? <ChevronUp size={15} color="#154360" /> : <ChevronDown size={15} color="#64748b" />}
                      </div>
                    </div>

                    {/* Expanded Body: Phone & Call Button */}
                    {isExpanded && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        borderTop: '1px dashed #e2e8f0', 
                        paddingTop: '8px', 
                        marginTop: '4px' 
                      }}>
                        <div style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 600 }}>
                          📞 {student.phone || 'No phone'}
                        </div>
                        <button
                          type="button"
                          onClick={() => onStartCall(student)}
                          style={{
                            background: '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                            flexShrink: 0,
                            boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)'
                          }}
                        >
                          <Phone size={12} fill="#ffffff" />
                          <span>Call</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>
                No students match your search.
              </div>
            )
          ) : (
            filteredTpos.length > 0 ? (
              filteredTpos.slice(0, 20).map((tpo) => {
                const isExpanded = !!expandedDeskItems[`tpo_${tpo.id}`];
                return (
                  <div
                    key={tpo.id}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #eef2f6',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: isExpanded ? '8px' : '0px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Row 1: Clickable Name & Expand Chevron */}
                    <div 
                      onClick={() => toggleItemExpand(`tpo_${tpo.id}`)}
                      role="button"
                      tabIndex={0}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tpo.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tpo.collegeName} • {tpo.designation || 'Placement Officer'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
                        {isExpanded ? <ChevronUp size={15} color="#154360" /> : <ChevronDown size={15} color="#64748b" />}
                      </div>
                    </div>

                    {/* Expanded Body: Phone & Call Button */}
                    {isExpanded && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        borderTop: '1px dashed #e2e8f0', 
                        paddingTop: '8px', 
                        marginTop: '4px' 
                      }}>
                        <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 600 }}>
                          📞 {tpo.phone || 'No phone'}
                        </div>
                        <button
                          type="button"
                          onClick={() => onStartCall({ ...tpo, role: 'TPO' })}
                          style={{
                            background: '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                            flexShrink: 0,
                            boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)'
                          }}
                        >
                          <Phone size={12} fill="#ffffff" />
                          <span>Call</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>
                No TPO contacts match your search.
              </div>
            )
          )}
        </div>

        {/* View All Button */}
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => onSelectTab(activeCallListTab === 'students' ? 'liveBoard' : 'tpos')}
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>View All {activeCallListTab === 'students' ? 'Students' : 'College TPOs'}</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

    </div>
  );
}
