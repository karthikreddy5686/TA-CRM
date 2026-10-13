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
  Trash2,
  Plus,
  UserPlus,
  FileSpreadsheet,
  ChevronRight
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
  onResetCleanData,
  onOpenNewDriveModal,
  onOpenNewStudentModal,
  onOpenNewTpoModal,
  onOpenQuickCallModal,
  onOpenQuickActions
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
      {/* Unified Simple Header Card */}
      <div className="dashboard-banner" style={{ 
        background: '#ffffff', 
        border: '1px solid #e2e8f0', 
        borderRadius: '14px', 
        padding: '16px 20px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: 'var(--shadow-card)',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ 
              background: drives.length > 0 ? '#ecfdf5' : '#f1f5f9', 
              color: drives.length > 0 ? '#065f46' : '#52525b', 
              padding: '2px 8px', 
              borderRadius: '20px', 
              fontSize: '0.68rem', 
              fontWeight: 800,
              letterSpacing: '0.04em'
            }}>
              {drives.length > 0 ? '● WORKSPACE ACTIVE' : '○ EMPTY STATE (0)'}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#71717a' }}>
              {drives.length} Drives • {students.length} Candidates • {tpos.length} TPOs
            </span>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em', margin: 0 }}>
            HR Dashboard
          </h1>
          <p style={{ color: '#52525b', fontSize: '0.84rem', marginTop: '2px' }}>
            Track intern calling hours, college outreach, and campus recruitment drives.
          </p>
        </div>

        {/* Dashboard Direct Action Buttons (All 100% Functional) */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {onOpenNewDriveModal && (
            <button 
              type="button" 
              onClick={onOpenNewDriveModal} 
              className="btn-black btn-black-sm"
              style={{ fontWeight: 700 }}
              title="Schedule a new campus recruitment drive"
            >
              <Plus size={14} /> + New Drive
            </button>
          )}

          {onOpenNewStudentModal && (
            <button 
              type="button" 
              onClick={onOpenNewStudentModal} 
              className="btn-secondary btn-black-sm"
              title="Add a candidate directly to the student list"
            >
              <UserPlus size={14} /> + Add Student
            </button>
          )}

          <button 
            type="button" 
            onClick={() => onSelectTab('googleFormBlast')} 
            className="btn-secondary btn-black-sm"
            title="Import student rows from Google Sheets or WhatsApp"
          >
            <FileSpreadsheet size={14} /> Import Sheets
          </button>

          {drives.length === 0 && onLoadDemoData && (
            <button 
              type="button" 
              onClick={onLoadDemoData} 
              className="btn-secondary btn-black-sm"
              style={{ color: '#8b5cf6', borderColor: '#c4b5fd' }}
              title="Load sample recruitment data across all tabs"
            >
              <Sparkles size={14} /> Load Demo Data
            </button>
          )}

          {(drives.length > 0 || students.length > 0 || tpos.length > 0) && onResetCleanData && (
            <button 
              type="button" 
              onClick={onResetCleanData} 
              className="btn-secondary btn-black-sm" 
              style={{ color: '#ef4444', borderColor: '#fca5a5' }} 
              title="Reset all recruitment records to clean empty state (0)"
            >
              <Trash2 size={13} /> Reset to 0
            </button>
          )}
        </div>
      </div>

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

        {/* Desktop View: Full CRM Table */}
        <div className="table-wrapper desktop-only">
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

        {/* Mobile View: Clean, Simple Intern Cards */}
        <div className="mobile-only" style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {internStats.map((intern, index) => (
            <div key={intern.id} style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className={`rank-badge ${index === 0 ? 'top-1' : ''}`} style={{ width: '22px', height: '22px', fontSize: '0.72rem' }}>
                    #{index + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#09090b' }}>{intern.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#71717a' }}>{intern.title}</div>
                  </div>
                </div>
                <span className={`badge ${intern.status === 'on-call' ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: '0.68rem' }}>
                  {intern.status === 'on-call' ? 'On Call' : 'Available'}
                </span>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: '#ffffff', 
                padding: '8px 10px', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0' 
              }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#71717a', fontWeight: 600 }}>Talk Time</div>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '0.925rem', color: '#09090b' }}>
                    {formatDuration(intern.totalSeconds)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#71717a', fontWeight: 600 }}>Calls</div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{intern.callCount}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#71717a', fontWeight: 600 }}>Goal</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{intern.targetProgress}%</div>
                </div>
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
                  style={{ padding: '5px 10px', fontSize: '0.72rem', gap: '4px' }}
                >
                  <Phone size={11} /> Call
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call History */}
      <div className="content-card">
        <div className="card-header-row" style={{ padding: '14px 20px' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: '0.98rem' }}>Call History</h2>
            <p className="card-subtitle">Calls made inside the app with recorded talk time</p>
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

        {/* Desktop View: Full CRM Table */}
        <div className="table-wrapper desktop-only">
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

        {/* Mobile View: Clean Call Record Cards */}
        <div className="mobile-only" style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredCalls.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 12px', color: '#71717a', fontSize: '0.8rem' }}>
              No calls logged yet. Dial any candidate or TPO to record talk time.
            </div>
          ) : (
            filteredCalls.map(call => (
              <div key={call.id} style={{
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
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#09090b' }}>
                      {call.recipientName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#71717a' }}>
                      {call.recipientType} • By {call.internName}
                    </div>
                  </div>
                  <span className={`badge ${
                    call.disposition === 'DRIVE_CONFIRMED' || call.disposition === 'SCREENING_PASSED'
                      ? 'badge-green'
                      : 'badge-amber'
                  }`} style={{ fontSize: '0.65rem' }}>
                    {call.disposition ? call.disposition.replace(/_/g, ' ') : 'COMPLETED'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#52525b' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {call.callType === 'VIDEO' ? <Video size={12} /> : <Phone size={12} />}
                    {call.callType === 'VIDEO' ? 'Video Meet' : 'Audio Call'}
                  </span>
                  <span style={{ 
                    fontFamily: 'Space Grotesk, sans-serif', 
                    fontWeight: 700, 
                    background: '#ffffff', 
                    border: '1px solid #e2e8f0', 
                    padding: '2px 6px', 
                    borderRadius: '4px',
                    color: '#09090b'
                  }}>
                    {formatDuration(call.durationSeconds)}
                  </span>
                  <span>{new Date(call.startedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
