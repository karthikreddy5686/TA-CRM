import React, { useState } from 'react';
import { 
  Phone, 
  Video, 
  Clock, 
  Building2, 
  Users, 
  CheckCircle2, 
  Upload, 
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatDuration } from '../data/mockData';

export default function InternDashboard({ 
  currentIntern, 
  tpos, 
  students, 
  followUps, 
  callSessions, 
  onStartCall, 
  onSelectTab,
  onCompleteFollowUp
}) {
  const mySessions = callSessions.filter(c => c.internId === currentIntern.id);
  const myTotalSeconds = mySessions.reduce((sum, c) => sum + (c.durationSeconds || 0), 0);
  const targetSeconds = (currentIntern.dailyTargetHours || 3.5) * 3600;
  const progressPercent = Math.min(100, Math.round((myTotalSeconds / targetSeconds) * 100));

  const myTpos = tpos.filter(t => t.assignedInternId === currentIntern.id);
  const myStudents = students.filter(s => s.internId === currentIntern.id);
  const myFollowUps = followUps.filter(f => f.internId === currentIntern.id && f.status === 'PENDING');
  const [expandedFupIds, setExpandedFupIds] = useState({});
  const toggleFupExpand = (id) => {
    setExpandedFupIds(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const [expandedTpoIds, setExpandedTpoIds] = useState({});
  const toggleTpoExpand = (id) => {
    setExpandedTpoIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div>
      {/* Top Banner */}
      <div style={{ 
        background: '#ffffff', 
        border: '1px solid #e2e8f0', 
        borderRadius: '14px', 
        padding: '20px 24px',
        marginBottom: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#154360', letterSpacing: '-0.02em' }}>
            My Workspace
          </h1>
          <p style={{ color: '#52525b', fontSize: '0.85rem', marginTop: '2px' }}>
            Logged in as <strong>{currentIntern.name}</strong>. Manage your calls, colleges, and tasks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => onSelectTab('drives')} className="btn-secondary btn-black-sm">
            <Upload size={14} /> Upload Students
          </button>
          <button onClick={() => onSelectTab('tpos')} className="btn-mustard btn-black-sm" style={{ fontWeight: 800 }}>
            <Phone size={14} color="#154360" /> Call TPOs
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title" style={{ color: '#154360' }}>My Call Time</span>
            <div className="metric-icon-box" style={{ background: '#ebf5fb', borderColor: '#aed6f1' }}>
              <Clock size={18} color="#154360" />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#154360' }}>{formatDuration(myTotalSeconds)}</div>
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 600, marginBottom: '3px' }}>
              <span>{progressPercent}% completed</span>
              <span style={{ color: '#71717a' }}>{currentIntern.dailyTargetHours}h goal</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${progressPercent}%`, 
                  height: '100%', 
                  background: progressPercent >= 80 ? '#10b981' : '#154360',
                }} 
              />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title" style={{ color: '#154360' }}>My Colleges</span>
            <div className="metric-icon-box" style={{ background: '#fffdf0', borderColor: '#fae27a' }}>
              <Building2 size={18} color="#154360" />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#154360' }}>{myTpos.length}</div>
          <div className="metric-subtext">
            <span>{myTpos.filter(t => t.status === 'DRIVE_CONFIRMED').length} confirmed drives</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title" style={{ color: '#154360' }}>My Students</span>
            <div className="metric-icon-box" style={{ background: '#ebf5fb', borderColor: '#aed6f1' }}>
              <Users size={18} color="#154360" />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#154360' }}>{myStudents.length}</div>
          <div className="metric-subtext">
            <span>Across campus drives</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title" style={{ color: '#154360' }}>Pending Follow-Ups</span>
            <div className="metric-icon-box" style={{ background: '#fffdf0', borderColor: '#fae27a' }}>
              <Calendar size={18} color="#154360" />
            </div>
          </div>
          <div className="metric-value" style={{ color: myFollowUps.length > 0 ? '#ef4444' : '#154360' }}>
            {myFollowUps.length}
          </div>
          <div className="metric-subtext">
            <span>Calls to complete</span>
          </div>
        </div>
      </div>

      {/* Priority Follow-ups */}
      <div className="content-card">
        <div className="card-header-row" style={{ padding: '14px 20px' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: '0.98rem' }}>Today's Follow-Ups</h2>
            <p className="card-subtitle">Scheduled calls and reminders</p>
          </div>
          <button onClick={() => onSelectTab('followups')} className="btn-secondary btn-black-sm">
            View All ({followUps.length}) <ArrowRight size={13} />
          </button>
        </div>

        {myFollowUps.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#71717a' }}>
            <CheckCircle2 size={30} color="#10b981" style={{ margin: '0 auto 8px' }} />
            <h3 style={{ fontSize: '0.95rem', color: '#09090b' }}>No pending follow-ups</h3>
            <p style={{ fontSize: '0.8rem', marginTop: '2px' }}>You are all caught up!</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper desktop-only">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Priority</th>
                    <th>Contact</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Note</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myFollowUps.map(fup => (
                    <tr key={fup.id}>
                      <td>
                        <span className={`badge ${
                          fup.priority === 'URGENT' ? 'badge-red' : fup.priority === 'HIGH' ? 'badge-amber' : 'badge-grey'
                        }`} style={{ fontSize: '0.72rem' }}>
                          {fup.priority}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, color: '#09090b', fontSize: '0.875rem' }}>
                          {fup.entityTitle}
                        </div>
                      </td>

                      <td>
                        <span className="badge badge-grey" style={{ fontSize: '0.7rem' }}>
                          {fup.entityType}
                        </span>
                      </td>

                      <td style={{ fontWeight: 600, fontSize: '0.825rem' }}>
                        {fup.scheduledDate}
                      </td>

                      <td style={{ maxWidth: '280px', fontSize: '0.8rem', color: '#52525b' }}>
                        {fup.notes}
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            onClick={() => {
                              const cleanTitle = (fup.entityTitle || '').replace(/\s*\([^)]*\)/g, '').replace(/\s*-\s*.*$/, '').trim().toLowerCase();
                              const matched = fup.phone ? null : (
                                students?.find(s => s.id === fup.entityId || (s.name && (s.name.trim().toLowerCase() === cleanTitle || cleanTitle.includes(s.name.trim().toLowerCase()) || s.name.trim().toLowerCase().includes(cleanTitle)))) ||
                                tpos?.find(t => t.id === fup.entityId || (t.name && (t.name.trim().toLowerCase() === cleanTitle || cleanTitle.includes(t.name.trim().toLowerCase()) || t.name.trim().toLowerCase().includes(cleanTitle))))
                              );
                              onStartCall({
                                recipientType: fup.entityType,
                                recipientName: fup.entityTitle,
                                recipientDetail: fup.notes,
                                recipientPhone: fup.phone || matched?.phone || '',
                                type: 'AUDIO',
                                followUpId: fup.id
                              });
                            }}
                            className="btn-mustard btn-black-sm"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
                          >
                            <Phone size={12} color="#154360" /> Call
                          </button>

                          <button 
                            onClick={() => onCompleteFollowUp(fup.id)}
                            className="btn-secondary btn-black-sm"
                            style={{ padding: '4px 8px' }}
                            title="Mark done"
                          >
                            <CheckCircle2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Follow-Ups (Click to expand details) */}
            <div className="mobile-only" style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myFollowUps.map(fup => {
                const isExpanded = !!expandedFupIds[fup.id];
                return (
                  <div 
                    key={fup.id} 
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: isExpanded ? '6px' : '0px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Row 1: Clickable Title, Priority Badge & Chevron */}
                    <div 
                      onClick={() => toggleFupExpand(fup.id)}
                      role="button"
                      tabIndex={0}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#154360' }}>
                        {fup.entityTitle}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`badge ${
                          fup.priority === 'URGENT' ? 'badge-red' : fup.priority === 'HIGH' ? 'badge-amber' : 'badge-grey'
                        }`} style={{ fontSize: '0.65rem' }}>
                          {fup.priority}
                        </span>
                        {isExpanded ? <ChevronUp size={14} color="#154360" /> : <ChevronDown size={14} color="#64748b" />}
                      </div>
                    </div>

                    {/* Expanded Body: Notes, Date & Actions */}
                    {isExpanded && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px dashed #e2e8f0', paddingTop: '6px', marginTop: '4px' }}>
                        {fup.notes && (
                          <div style={{ fontSize: '0.72rem', color: '#52525b', background: '#ffffff', padding: '4px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>{fup.notes}</div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#71717a' }}>📅 {fup.scheduledDate}</span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              onClick={() => {
                                const cleanTitle = (fup.entityTitle || '').replace(/\s*\([^)]*\)/g, '').replace(/\s*-\s*.*$/, '').trim().toLowerCase();
                                const matched = fup.phone ? null : (
                                  students?.find(s => s.id === fup.entityId || (s.name && (s.name.trim().toLowerCase() === cleanTitle || cleanTitle.includes(s.name.trim().toLowerCase()) || s.name.trim().toLowerCase().includes(cleanTitle)))) ||
                                  tpos?.find(t => t.id === fup.entityId || (t.name && (t.name.trim().toLowerCase() === cleanTitle || cleanTitle.includes(t.name.trim().toLowerCase()) || t.name.trim().toLowerCase().includes(cleanTitle))))
                                );
                                onStartCall({
                                  recipientType: fup.entityType,
                                  recipientName: fup.entityTitle,
                                  recipientDetail: fup.notes,
                                  recipientPhone: fup.phone || matched?.phone || '',
                                  type: 'AUDIO',
                                  followUpId: fup.id
                                });
                              }}
                              className="btn-mustard btn-black-sm"
                              style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '3px' }}
                            >
                              <Phone size={11} color="#154360" /> Call
                            </button>
                            <button 
                              onClick={() => onCompleteFollowUp(fup.id)}
                              className="btn-secondary btn-black-sm"
                              style={{ padding: '3px 6px' }}
                            >
                              <CheckCircle2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Assigned TPOs */}
      <div className="content-card">
        <div className="card-header-row" style={{ padding: '14px 20px' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: '0.98rem' }}>Assigned College TPOs</h2>
            <p className="card-subtitle">Click to call or video meet</p>
          </div>
          <button onClick={() => onSelectTab('tpos')} className="btn-secondary btn-black-sm">
            All TPOs <ArrowRight size={13} />
          </button>
        </div>

        <div className="table-wrapper desktop-only">
          <table className="crm-table">
            <thead>
              <tr>
                <th>College & TPO</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {myTpos.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '28px', color: '#71717a', fontSize: '0.8rem' }}>
                    No college TPOs assigned to you yet. Explore the <strong>TPO Directory</strong> to request assignments or start outreach.
                  </td>
                </tr>
              ) : (
                myTpos.map(tpo => (
                  <tr key={tpo.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#09090b', fontSize: '0.875rem' }}>
                        {tpo.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#52525b' }}>
                        {tpo.collegeName}
                      </div>
                    </td>

                    <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.825rem' }}>
                      {tpo.phone}
                    </td>

                    <td style={{ fontSize: '0.8rem', color: '#52525b' }}>
                      {tpo.email}
                    </td>

                    <td>
                      <span className={`badge ${
                        tpo.status === 'DRIVE_CONFIRMED' ? 'badge-green' : tpo.status === 'PITCHED' ? 'badge-amber' : 'badge-grey'
                      }`} style={{ fontSize: '0.72rem' }}>
                        {tpo.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => onStartCall({
                            recipientType: 'TPO',
                            recipientName: `${tpo.name} (${tpo.collegeName})`,
                            recipientDetail: `${tpo.designation} • ${tpo.phone}`,
                            recipientPhone: tpo.phone,
                            type: 'AUDIO',
                            tpoId: tpo.id
                          })}
                          className="btn-black btn-black-sm"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          <Phone size={12} /> Call
                        </button>

                        <button 
                          onClick={() => onStartCall({
                            recipientType: 'TPO',
                            recipientName: `${tpo.name} (${tpo.collegeName})`,
                            recipientDetail: `${tpo.designation} • ${tpo.phone}`,
                            recipientPhone: tpo.phone,
                            type: 'VIDEO',
                            tpoId: tpo.id
                          })}
                          className="btn-secondary btn-black-sm"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          <Video size={12} /> Video
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Assigned TPOs (Click to expand details) */}
        <div className="mobile-only" style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {myTpos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 10px', color: '#71717a', fontSize: '0.8rem' }}>
              No college TPOs assigned to you yet. Tap "All TPOs" to browse and reach out.
            </div>
          ) : (
            myTpos.map(tpo => {
            const isExpanded = !!expandedTpoIds[tpo.id];
            return (
              <div 
                key={tpo.id} 
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: isExpanded ? '6px' : '0px',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Row 1: Clickable Name, Badge & Chevron */}
                <div 
                  onClick={() => toggleTpoExpand(tpo.id)}
                  role="button"
                  tabIndex={0}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#154360' }}>{tpo.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#71717a' }}>{tpo.collegeName}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`badge ${
                      tpo.status === 'DRIVE_CONFIRMED' ? 'badge-green' : tpo.status === 'PITCHED' ? 'badge-amber' : 'badge-grey'
                    }`} style={{ fontSize: '0.65rem' }}>
                      {tpo.status.replace(/_/g, ' ')}
                    </span>
                    {isExpanded ? <ChevronUp size={14} color="#154360" /> : <ChevronDown size={14} color="#64748b" />}
                  </div>
                </div>

                {/* Expanded Body: Phone & Call Buttons */}
                {isExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px dashed #e2e8f0', paddingTop: '6px', marginTop: '4px' }}>
                    <div style={{ fontSize: '0.74rem', fontFamily: 'monospace', color: '#154360', fontWeight: 600 }}>
                      📞 {tpo.phone || 'No phone'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                      <button 
                        onClick={() => onStartCall({
                          recipientType: 'TPO',
                          recipientName: `${tpo.name} (${tpo.collegeName})`,
                          recipientDetail: `${tpo.designation} • ${tpo.phone}`,
                          recipientPhone: tpo.phone,
                          type: 'AUDIO',
                          tpoId: tpo.id
                        })}
                        className="btn-mustard btn-black-sm"
                        style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '3px' }}
                      >
                        <Phone size={11} color="#154360" /> Call
                      </button>
                      <button 
                        onClick={() => onStartCall({
                          recipientType: 'TPO',
                          recipientName: `${tpo.name} (${tpo.collegeName})`,
                          recipientDetail: `${tpo.designation} • ${tpo.phone}`,
                          recipientPhone: tpo.phone,
                          type: 'VIDEO',
                          tpoId: tpo.id
                        })}
                        className="btn-navy btn-black-sm"
                        style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '3px' }}
                      >
                        <Video size={11} color="#FFDB58" /> Video
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          }))}
        </div>
      </div>
    </div>
  );
}
