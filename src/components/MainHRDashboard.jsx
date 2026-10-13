import React, { useState } from 'react';
import { 
  Clock, 
  Users, 
  Building2, 
  Calendar, 
  Video, 
  Phone,
  Sparkles,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { formatDuration } from '../data/mockData';

export default function MainHRDashboard({ 
  users, 
  tpos, 
  drives, 
  students, 
  callSessions, 
  followUps,
  onStartCall,
  onSelectTab,
  onLoadDemoData,
  onResetCleanData
}) {
  const [internFilter, setInternFilter] = useState('ALL');
  const [callTypeFilter, setCallTypeFilter] = useState('ALL');

  const interns = users.filter(u => u.role === 'HR_INTERN');

  const totalCallSeconds = callSessions.reduce((sum, c) => sum + (c.durationSeconds || 0), 0);
  const totalStudents = students.length;
  const totalTpos = tpos.length;
  const confirmedDrives = drives.filter(d => d.status === 'CONFIRMED').length;

  const internStats = interns.map(intern => {
    const sessions = callSessions.filter(c => c.internId === intern.id);
    const internCallSecs = sessions.reduce((sum, c) => sum + (c.durationSeconds || 0), 0);
    const assignedTpos = tpos.filter(t => t.assignedInternId === intern.id);
    const assignedStudents = students.filter(s => s.internId === intern.id);
    const targetSecs = (intern.dailyTargetHours || 3.5) * 3600;
    const targetProgress = Math.min(100, Math.round((internCallSecs / targetSecs) * 100));

    return {
      ...intern,
      totalSeconds: internCallSecs,
      callCount: sessions.length,
      tpoCount: assignedTpos.length,
      studentCount: assignedStudents.length,
      targetProgress,
    };
  }).sort((a, b) => b.totalSeconds - a.totalSeconds);

  const filteredCalls = callSessions.filter(call => {
    if (internFilter !== 'ALL' && call.internId !== internFilter) return false;
    if (callTypeFilter !== 'ALL' && call.callType !== callTypeFilter) return false;
    return true;
  });

  return (
    <div>
      {/* Top Banner */}
      <div className="dashboard-banner" style={{ 
        background: '#ffffff', 
        border: '1px solid #e2e8f0', 
        borderRadius: '14px', 
        padding: '20px 24px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: 'var(--shadow-card)',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em' }}>
            HR Dashboard
          </h1>
          <p style={{ color: '#52525b', fontSize: '0.85rem', marginTop: '2px' }}>
            Track intern calling hours, college outreach, and campus recruitment drives.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {(drives.length > 0 || students.length > 0 || tpos.length > 0) && onResetCleanData && (
            <button 
              type="button" 
              onClick={onResetCleanData} 
              className="btn-secondary btn-black-sm" 
              style={{ color: '#ef4444', borderColor: '#fca5a5' }} 
              title="Reset all recruitment records to clean empty state (0)"
            >
              <Trash2 size={13} /> Reset All to 0
            </button>
          )}
          {onLoadDemoData && (
            <button onClick={onLoadDemoData} className="btn-black btn-black-sm" title="Load sample recruitment data across all tabs">
              <Sparkles size={13} /> Load Demo Data
            </button>
          )}
          <button onClick={() => onSelectTab('drives')} className="btn-secondary btn-black-sm">
            <Calendar size={14} /> View Drives ({drives.length})
          </button>
          <button onClick={() => onSelectTab('tpos')} className="btn-secondary btn-black-sm">
            <Building2 size={14} /> College TPOs ({tpos.length})
          </button>
        </div>
      </div>

      {/* Empty State / Quick-Start Web App Guidance Banner */}
      {drives.length === 0 && students.length === 0 && tpos.length === 0 && (
        <div className="guidance-banner" style={{
          background: 'linear-gradient(135deg, #09090b 0%, #1c1917 100%)',
          color: '#ffffff',
          borderRadius: '14px',
          padding: '22px 24px',
          marginBottom: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid #27272a',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ 
                background: '#ffffff', 
                color: '#09090b', 
                padding: '2px 8px', 
                borderRadius: '20px', 
                fontSize: '0.68rem', 
                fontWeight: 800,
                letterSpacing: '0.04em'
              }}>
                ⚡ WEB APP GLOBAL MODE
              </span>
              <span style={{ fontSize: '0.78rem', color: '#a1a1aa' }}>All systems connected & synchronized</span>
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0' }}>
              Load Connected Demo Data or Add Your First Drive
            </h3>
            <p style={{ color: '#d4d4d8', fontSize: '0.84rem', maxWidth: '580px', margin: 0 }}>
              Instantly test in-app calling, Google sheet candidate intake, TPO outreach, drive pipelines, and real-time live boards with pre-configured IIT & BITS recruitment drives.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {onLoadDemoData && (
              <button 
                onClick={onLoadDemoData} 
                className="btn-black" 
                style={{ background: '#ffffff', color: '#09090b', fontWeight: 800, padding: '9px 16px' }}
              >
                <Sparkles size={14} /> Load Working Demo Data
              </button>
            )}
            <button 
              onClick={() => onSelectTab('drives')} 
              className="btn-secondary" 
              style={{ background: 'transparent', color: '#ffffff', borderColor: '#52525b', padding: '9px 14px' }}
            >
              + Create Drive
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid - Clickable for Instant Module Navigation */}
      <div className="metrics-grid">
        <div 
          className="metric-card" 
          onClick={() => onSelectTab('calls')}
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          title="Click to view Call Logs"
        >
          <div className="metric-header">
            <span className="metric-title">Team Call Time</span>
            <div className="metric-icon-box">
              <Clock size={18} color="#09090b" />
            </div>
          </div>
          <div className="metric-value">{formatDuration(totalCallSeconds)}</div>
          <div className="metric-subtext">
            <span>Across {callSessions.length} total calls • Click to view</span>
          </div>
        </div>

        <div 
          className="metric-card" 
          onClick={() => onSelectTab('tpos')}
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          title="Click to view College TPOs"
        >
          <div className="metric-header">
            <span className="metric-title">College TPOs</span>
            <div className="metric-icon-box">
              <Building2 size={18} color="#09090b" />
            </div>
          </div>
          <div className="metric-value">{totalTpos}</div>
          <div className="metric-subtext">
            <span>{tpos.filter(t => t.status === 'DRIVE_CONFIRMED').length} confirmed • Click to view</span>
          </div>
        </div>

        <div 
          className="metric-card" 
          onClick={() => onSelectTab('liveBoard')}
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          title="Click to view Posted Students"
        >
          <div className="metric-header">
            <span className="metric-title">Total Students</span>
            <div className="metric-icon-box">
              <Users size={18} color="#09090b" />
            </div>
          </div>
          <div className="metric-value">{totalStudents}</div>
          <div className="metric-subtext">
            <span>In recruitment pipeline • Click to view</span>
          </div>
        </div>

        <div 
          className="metric-card" 
          onClick={() => onSelectTab('drives')}
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          title="Click to view Campus Drives"
        >
          <div className="metric-header">
            <span className="metric-title">Active Drives</span>
            <div className="metric-icon-box">
              <Calendar size={18} color="#09090b" />
            </div>
          </div>
          <div className="metric-value">{drives.length}</div>
          <div className="metric-subtext">
            <span>{confirmedDrives} confirmed • Click to view</span>
          </div>
        </div>
      </div>

      {/* Intern Productivity Leaderboard */}
      <div className="content-card">
        <div className="card-header-row" style={{ padding: '14px 20px' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: '0.98rem' }}>Intern Leaderboard</h2>
            <p className="card-subtitle">Ranked by total call time logged today</p>
          </div>
          <span className="badge badge-grey" style={{ fontSize: '0.72rem' }}>
            {interns.length} Interns
          </span>
        </div>

        <div className="table-wrapper">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Intern</th>
                <th>Status</th>
                <th>Call Time</th>
                <th>Daily Goal</th>
                <th>Calls</th>
                <th>TPOs</th>
                <th>Students</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {internStats.map((intern, index) => (
                <tr key={intern.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className={`rank-badge ${index === 0 ? 'top-1' : ''}`} style={{ width: '22px', height: '22px', fontSize: '0.75rem' }}>
                        {index + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#09090b', fontSize: '0.875rem' }}>
                          {intern.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#71717a' }}>
                          {intern.title}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className={`badge ${intern.status === 'on-call' ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: '0.72rem' }}>
                      {intern.status === 'on-call' ? 'On Call' : 'Available'}
                    </span>
                  </td>

                  <td>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.925rem' }}>
                      {formatDuration(intern.totalSeconds)}
                    </div>
                  </td>

                  <td style={{ minWidth: '130px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 600, marginBottom: '3px' }}>
                      <span>{intern.targetProgress}%</span>
                      <span style={{ color: '#71717a' }}>{intern.dailyTargetHours}h goal</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${intern.targetProgress}%`, 
                          height: '100%', 
                          background: intern.targetProgress >= 80 ? '#10b981' : '#09090b',
                        }}
                      />
                    </div>
                  </td>

                  <td>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{intern.callCount}</span>
                  </td>

                  <td>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{intern.tpoCount}</span>
                  </td>

                  <td>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{intern.studentCount}</span>
                  </td>

                  <td>
                    <button 
                      onClick={() => {
                        onStartCall({
                          recipientType: 'INTERN_SYNC',
                          recipientName: intern.name,
                          recipientDetail: intern.title,
                          type: 'AUDIO'
                        });
                      }}
                      className="btn-black btn-black-sm"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      title="Quick sync call"
                    >
                      <Phone size={11} /> Call
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Call History */}
      <div className="content-card">
        <div className="card-header-row" style={{ padding: '14px 20px' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: '0.98rem' }}>Call History</h2>
            <p className="card-subtitle">Calls made inside the app with recorded time</p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <select 
              className="form-select" 
              style={{ padding: '5px 10px', fontSize: '0.8rem', width: 'auto' }}
              value={internFilter}
              onChange={(e) => setInternFilter(e.target.value)}
            >
              <option value="ALL">All Interns</option>
              {interns.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>

            <select 
              className="form-select" 
              style={{ padding: '5px 10px', fontSize: '0.8rem', width: 'auto' }}
              value={callTypeFilter}
              onChange={(e) => setCallTypeFilter(e.target.value)}
            >
              <option value="ALL">All Calls</option>
              <option value="AUDIO">Audio</option>
              <option value="VIDEO">Video</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Intern</th>
                <th>Recipient</th>
                <th>Mode</th>
                <th>Duration</th>
                <th>Result</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#71717a' }}>
                    No calls logged yet. Start an audio or video call with any contact to track talk time.
                  </td>
                </tr>
              ) : (
                filteredCalls.map(call => (
                  <tr key={call.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem', color: '#52525b' }}>
                      {new Date(call.startedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>

                    <td>
                      <strong>{call.internName}</strong>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{call.recipientName}</div>
                      <span className="badge badge-grey" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                        {call.recipientType}
                      </span>
                    </td>

                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                        {call.callType === 'VIDEO' ? <Video size={13} /> : <Phone size={13} />}
                        {call.callType === 'VIDEO' ? 'Video' : 'Audio'}
                      </span>
                    </td>

                    <td>
                      <span style={{ 
                        fontFamily: 'Space Grotesk, sans-serif', 
                        fontWeight: 700, 
                        color: '#09090b',
                        background: '#f1f5f9',
                        padding: '2px 7px',
                        borderRadius: '5px',
                        fontSize: '0.825rem'
                      }}>
                        {formatDuration(call.durationSeconds)}
                      </span>
                    </td>

                    <td>
                      <span className={`badge ${
                        call.disposition === 'DRIVE_CONFIRMED' || call.disposition === 'SCREENING_PASSED'
                          ? 'badge-green'
                          : call.disposition === 'PITCHED' || call.disposition === 'FOLLOW_UP_NEEDED'
                          ? 'badge-amber'
                          : 'badge-grey'
                      }`} style={{ fontSize: '0.72rem' }}>
                        {call.disposition ? call.disposition.replace(/_/g, ' ') : 'COMPLETED'}
                      </span>
                    </td>

                    <td style={{ maxWidth: '280px', fontSize: '0.8rem', color: '#52525b' }}>
                      {call.notes || 'No notes.'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
