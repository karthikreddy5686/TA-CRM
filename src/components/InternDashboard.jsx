import React from 'react';
import { 
  Phone, 
  Video, 
  Clock, 
  Building2, 
  Users, 
  CheckCircle2, 
  Upload, 
  ArrowRight,
  Calendar
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
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em' }}>
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
          <button onClick={() => onSelectTab('tpos')} className="btn-black btn-black-sm">
            <Phone size={14} /> Call TPOs
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">My Call Time</span>
            <div className="metric-icon-box">
              <Clock size={18} color="#09090b" />
            </div>
          </div>
          <div className="metric-value">{formatDuration(myTotalSeconds)}</div>
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
                  background: progressPercent >= 80 ? '#10b981' : '#09090b',
                }}
              />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">My Colleges</span>
            <div className="metric-icon-box">
              <Building2 size={18} color="#09090b" />
            </div>
          </div>
          <div className="metric-value">{myTpos.length}</div>
          <div className="metric-subtext">
            <span>{myTpos.filter(t => t.status === 'DRIVE_CONFIRMED').length} confirmed drives</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">My Students</span>
            <div className="metric-icon-box">
              <Users size={18} color="#09090b" />
            </div>
          </div>
          <div className="metric-value">{myStudents.length}</div>
          <div className="metric-subtext">
            <span>Across campus drives</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Pending Follow-Ups</span>
            <div className="metric-icon-box">
              <Calendar size={18} color="#09090b" />
            </div>
          </div>
          <div className="metric-value" style={{ color: myFollowUps.length > 0 ? '#ef4444' : '#09090b' }}>
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
                              onStartCall({
                                recipientType: fup.entityType,
                                recipientName: fup.entityTitle,
                                recipientDetail: fup.notes,
                                type: 'AUDIO',
                                followUpId: fup.id
                              });
                            }}
                            className="btn-black btn-black-sm"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            <Phone size={12} /> Call
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

            {/* Mobile View: Follow-Ups */}
            <div className="mobile-only" style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myFollowUps.map(fup => (
                <div key={fup.id} style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#09090b' }}>
                      {fup.entityTitle}
                    </div>
                    <span className={`badge ${
                      fup.priority === 'URGENT' ? 'badge-red' : fup.priority === 'HIGH' ? 'badge-amber' : 'badge-grey'
                    }`} style={{ fontSize: '0.65rem' }}>
                      {fup.priority}
                    </span>
                  </div>
                  {fup.notes && (
                    <div style={{ fontSize: '0.72rem', color: '#52525b' }}>{fup.notes}</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#71717a' }}>📅 {fup.scheduledDate}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        onClick={() => {
                          onStartCall({
                            recipientType: fup.entityType,
                            recipientName: fup.entityTitle,
                            recipientDetail: fup.notes,
                            type: 'AUDIO',
                            followUpId: fup.id
                          });
                        }}
                        className="btn-black btn-black-sm"
                        style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                      >
                        <Phone size={11} /> Call
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
              ))}
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
              {myTpos.map(tpo => (
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Assigned TPOs */}
        <div className="mobile-only" style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {myTpos.map(tpo => (
            <div key={tpo.id} style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#09090b' }}>{tpo.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#71717a' }}>{tpo.collegeName}</div>
                  <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#52525b' }}>{tpo.phone}</div>
                </div>
                <span className={`badge ${
                  tpo.status === 'DRIVE_CONFIRMED' ? 'badge-green' : tpo.status === 'PITCHED' ? 'badge-amber' : 'badge-grey'
                }`} style={{ fontSize: '0.65rem' }}>
                  {tpo.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <button 
                  onClick={() => onStartCall({
                    recipientType: 'TPO',
                    recipientName: `${tpo.name} (${tpo.collegeName})`,
                    recipientDetail: `${tpo.designation} • ${tpo.phone}`,
                    type: 'AUDIO',
                    tpoId: tpo.id
                  })}
                  className="btn-black btn-black-sm"
                  style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '3px' }}
                >
                  <Phone size={11} /> Call
                </button>
                <button 
                  onClick={() => onStartCall({
                    recipientType: 'TPO',
                    recipientName: `${tpo.name} (${tpo.collegeName})`,
                    recipientDetail: `${tpo.designation} • ${tpo.phone}`,
                    type: 'VIDEO',
                    tpoId: tpo.id
                  })}
                  className="btn-secondary btn-black-sm"
                  style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '3px' }}
                >
                  <Video size={11} /> Video
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
