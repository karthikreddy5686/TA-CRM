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
        borderRadius: 'var(--radius-md)', 
        padding: '12px 14px',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        boxShadow: 'var(--shadow-card)',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <span style={{ 
              background: drives.length > 0 ? '#ebf5fb' : '#f1f5f9', 
              color: drives.length > 0 ? '#154360' : '#52525b', 
              border: drives.length > 0 ? '1px solid #aed6f1' : '1px solid #e2e8f0',
              padding: '2px 7px', 
              borderRadius: '20px', 
              fontSize: 'var(--font-10)', 
              lineHeight: 'var(--lh-10)',
              fontWeight: 800,
              letterSpacing: '0.04em'
            }}>
              {drives.length > 0 ? '● WORKSPACE ACTIVE' : '○ EMPTY STATE (0)'}
            </span>
            <span style={{ fontSize: 'var(--font-xs)', lineHeight: 'var(--lh-xs)', color: '#71717a' }}>
              {drives.length} Drives • {students.length} Candidates • {tpos.length} TPOs
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--font-2xl)', lineHeight: 'var(--lh-2xl)', fontWeight: 800, color: '#154360', letterSpacing: '-0.02em', margin: 0 }}>
            HR Dashboard
          </h1>
          <p style={{ color: '#52525b', fontSize: 'var(--font-xs)', lineHeight: 'var(--lh-xs)', marginTop: '2px' }}>
            Track intern calling hours, college outreach, and campus recruitment drives.
          </p>
        </div>

        {/* Dashboard Direct Action Buttons (All 100% Functional) */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {onOpenNewDriveModal && (
            <button 
              type="button" 
              onClick={onOpenNewDriveModal} 
              className="btn-mustard btn-black-sm"
              style={{ fontWeight: 800 }}
              title="Schedule a new campus recruitment drive"
            >
              <Plus size={14} color="#154360" /> New Drive
            </button>
          )}

          {onOpenNewStudentModal && (
            <button 
              type="button" 
              onClick={onOpenNewStudentModal} 
              className="btn-secondary btn-black-sm"
              title="Add a candidate directly to the student list"
            >
              <UserPlus size={14} /> Add Student
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
            <span className="metric-title" style={{ color: '#154360' }}>Team Call Time</span>
            <div className="metric-icon-box" style={{ background: '#ebf5fb', borderColor: '#aed6f1' }}>
              <Clock size={18} color="#154360" />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#154360' }}>{formatDuration(totalCallSeconds)}</div>
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
            <span className="metric-title" style={{ color: '#154360' }}>College TPOs</span>
            <div className="metric-icon-box" style={{ background: '#fffdf0', borderColor: '#fae27a' }}>
              <Building2 size={18} color="#154360" />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#154360' }}>{totalTpos}</div>
          <div className="metric-subtext">
            <span>{tpos.filter(t => t.status === 'DRIVE_CONFIRMED').length} confirmed • Click to view</span>
          </div>
        </div>

        <div 
          className="metric-card" 
          onClick={() => onSelectTab('drives')}
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          title="Click to view Campus Drives & Students"
        >
          <div className="metric-header">
            <span className="metric-title" style={{ color: '#154360' }}>Total Students</span>
            <div className="metric-icon-box" style={{ background: '#ebf5fb', borderColor: '#aed6f1' }}>
              <Users size={18} color="#154360" />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#154360' }}>{totalStudents}</div>
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
            <span className="metric-title" style={{ color: '#154360' }}>Active Drives</span>
            <div className="metric-icon-box" style={{ background: '#fffdf0', borderColor: '#fae27a' }}>
              <Calendar size={18} color="#154360" />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#154360' }}>{drives.length}</div>
          <div className="metric-subtext">
            <span>{confirmedDrives} confirmed • Click to view</span>
          </div>
        </div>
      </div>

      {/* Intern Productivity Leaderboard */}
      <div className="content-card">
        <div className="card-header-row" style={{ padding: '10px 14px' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: 'var(--font-base)', lineHeight: 'var(--lh-base)' }}>Intern Leaderboard</h2>
            <p className="card-subtitle" style={{ fontSize: 'var(--font-11)', lineHeight: 'var(--lh-11)', color: '#71717a' }}>Ranked by total call time logged today</p>
          </div>
          <span className="badge badge-grey" style={{ fontSize: 'var(--font-10)', lineHeight: 'var(--lh-10)' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className={`rank-badge ${index === 0 ? 'top-1' : ''}`} style={{ width: '20px', height: '20px', fontSize: 'var(--font-10)' }}>
                        {index + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#09090b', fontSize: 'var(--font-sm)' }}>
                          {intern.name}
                        </div>
                        <div style={{ fontSize: 'var(--font-11)', color: '#71717a', lineHeight: 'var(--lh-11)' }}>
                          {intern.title}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className={`badge ${intern.status === 'on-call' ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: 'var(--font-10)' }}>
                      {intern.status === 'on-call' ? 'On Call' : 'Available'}
                    </span>
                  </td>

                  <td>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 'var(--font-sm)' }}>
                      {formatDuration(intern.totalSeconds)}
                    </div>
                  </td>

                  <td style={{ minWidth: '120px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-11)', fontWeight: 600, marginBottom: '2px' }}>
                      <span>{intern.targetProgress}%</span>
                      <span style={{ color: '#71717a' }}>{intern.dailyTargetHours}h goal</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${intern.targetProgress}%`, 
                          height: '100%', 
                          background: intern.targetProgress >= 80 ? '#10b981' : '#154360',
                        }} 
                      />
                    </div>
                  </td>

                  <td>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-xs)' }}>{intern.callCount}</span>
                  </td>

                  <td>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-xs)' }}>{intern.tpoCount}</span>
                  </td>

                  <td>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-xs)' }}>{intern.studentCount}</span>
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
                      className="btn-mustard btn-black-sm"
                      style={{ padding: '3px 8px', fontSize: 'var(--font-xs)', gap: '4px' }}
                      title="Quick sync call"
                    >
                      <Phone size={11} color="#154360" /> Call
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Clean, Simple Intern Cards */}
        <div className="mobile-only" style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {internStats.map((intern, index) => (
            <div key={intern.id} style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #154360',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className={`rank-badge ${index === 0 ? 'top-1' : ''}`} style={{ width: '20px', height: '20px', fontSize: 'var(--font-10)' }}>
                    #{index + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: '#154360' }}>{intern.name}</div>
                    <div style={{ fontSize: 'var(--font-10)', color: '#71717a', lineHeight: 'var(--lh-10)' }}>{intern.title}</div>
                  </div>
                </div>
                <span className={`badge ${intern.status === 'on-call' ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: 'var(--font-10)' }}>
                  {intern.status === 'on-call' ? 'On Call' : 'Available'}
                </span>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: '#ffffff', 
                padding: '6px 8px', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px solid #e2e8f0' 
              }}>
                <div>
                  <div style={{ fontSize: 'var(--font-10)', color: '#71717a', fontWeight: 600 }}>Talk Time</div>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 'var(--font-sm)', color: '#154360' }}>
                    {formatDuration(intern.totalSeconds)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--font-10)', color: '#71717a', fontWeight: 600 }}>Calls</div>
                  <div style={{ fontWeight: 800, fontSize: 'var(--font-xs)', color: '#154360' }}>{intern.callCount}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--font-10)', color: '#71717a', fontWeight: 600 }}>Goal</div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-xs)' }}>{intern.targetProgress}%</div>
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
                  className="btn-mustard btn-black-sm"
                  style={{ padding: '3px 8px', fontSize: 'var(--font-xs)', gap: '4px' }}
                >
                  <Phone size={11} color="#154360" /> Call
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call History */}
      <div className="content-card">
        <div className="card-header-row" style={{ padding: '10px 14px' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: 'var(--font-base)', lineHeight: 'var(--lh-base)' }}>Call History</h2>
            <p className="card-subtitle" style={{ fontSize: 'var(--font-11)', lineHeight: 'var(--lh-11)', color: '#71717a' }}>Calls made inside the app with recorded talk time</p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <select 
              className="form-select" 
              style={{ padding: '4px 8px', fontSize: 'var(--font-xs)', width: 'auto' }}
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
              style={{ padding: '4px 8px', fontSize: 'var(--font-xs)', width: 'auto' }}
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
                  <td colSpan={7} style={{ textAlign: 'center', padding: '28px', color: '#71717a', fontSize: 'var(--font-sm)' }}>
                    No calls logged yet. Start an audio or video call with any contact to track talk time.
                  </td>
                </tr>
              ) : (
                filteredCalls.map(call => (
                  <tr key={call.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 'var(--font-xs)', color: '#52525b' }}>
                      {new Date(call.startedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>

                    <td>
                      <strong style={{ fontSize: 'var(--font-sm)' }}>{call.internName}</strong>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{call.recipientName}</div>
                      <span className="badge badge-grey" style={{ fontSize: 'var(--font-10)', padding: '1px 5px' }}>
                        {call.recipientType}
                      </span>
                    </td>

                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-xs)' }}>
                        {call.callType === 'VIDEO' ? <Video size={12} /> : <Phone size={12} />}
                        {call.callType === 'VIDEO' ? 'Video' : 'Audio'}
                      </span>
                    </td>

                    <td>
                      <span style={{ 
                        fontFamily: 'Space Grotesk, sans-serif', 
                        fontWeight: 700, 
                        color: '#154360',
                        background: '#ebf5fb',
                        border: '1px solid #aed6f1',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: 'var(--font-xs)'
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
                      }`} style={{ fontSize: 'var(--font-10)' }}>
                        {call.disposition ? call.disposition.replace(/_/g, ' ') : 'COMPLETED'}
                      </span>
                    </td>

                    <td style={{ maxWidth: '280px', fontSize: 'var(--font-xs)', color: '#52525b' }}>
                      {call.notes || 'No notes.'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Clean Call Record Cards */}
        <div className="mobile-only" style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filteredCalls.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 10px', color: '#71717a', fontSize: 'var(--font-xs)' }}>
              No calls logged yet. Dial any candidate or TPO to record talk time.
            </div>
          ) : (
            filteredCalls.map(call => (
              <div key={call.id} style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: '#09090b' }}>
                      {call.recipientName}
                    </div>
                    <div style={{ fontSize: 'var(--font-10)', color: '#71717a', lineHeight: 'var(--lh-10)' }}>
                      {call.recipientType} • By {call.internName}
                    </div>
                  </div>
                  <span className={`badge ${
                    call.disposition === 'DRIVE_CONFIRMED' || call.disposition === 'SCREENING_PASSED'
                      ? 'badge-green'
                      : 'badge-amber'
                  }`} style={{ fontSize: 'var(--font-10)' }}>
                    {call.disposition ? call.disposition.replace(/_/g, ' ') : 'COMPLETED'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-xs)', color: '#52525b' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {call.callType === 'VIDEO' ? <Video size={11} /> : <Phone size={11} />}
                    {call.callType === 'VIDEO' ? 'Video Meet' : 'Audio Call'}
                  </span>
                  <span style={{ 
                    fontFamily: 'Space Grotesk, sans-serif', 
                    fontWeight: 700, 
                    background: '#ffffff', 
                    border: '1px solid #e2e8f0', 
                    padding: '1px 5px', 
                    borderRadius: '4px',
                    color: '#09090b'
                  }}>
                    {formatDuration(call.durationSeconds)}
                  </span>
                  <span style={{ fontSize: 'var(--font-11)' }}>{new Date(call.startedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
