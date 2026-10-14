import React, { useState } from 'react';
import {
  Globe,
  Video,
  Phone,
  Download,
  Search,
  Share2,
  Check,
  Building2,
  FileSpreadsheet,
  Trash2,
  Calendar,
  Users
} from 'lucide-react';

export default function PublishedDriveBoard({
  drives,
  students,
  formResponses,
  onStartCall,
  onDeleteStudent,
  onNavigateToBlast,
  onUpdateCandidateStage,
  onLoadDemoData,
  onNavigateToDrives,
  hrPhoneNumber,
  onOpenPhoneConnectModal
}) {
  const [selectedDriveId, setSelectedDriveId] = useState(drives[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const activeDrive = drives.find(d => d.id === selectedDriveId) || drives[0] || null;
  const driveStudents = activeDrive ? students.filter(s => s.driveId === activeDrive.id) : students;
  const branches = Array.from(new Set(driveStudents.map(s => s.branch))).filter(Boolean);

  const filteredStudents = driveStudents.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBranch = branchFilter === 'ALL' || s.branch === branchFilter;
    return matchesSearch && matchesBranch;
  });

  const handleCopyBoardLink = () => {
    if (!activeDrive) return;
    const url = `${window.location.origin}/drive-board/${activeDrive.id}`;
    navigator.clipboard.writeText(url);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2500);
  };

  const handleExportCsv = () => {
    if (filteredStudents.length === 0) return;
    const headers = ['Roll Number', 'Name', 'Email', 'Phone', 'Branch', 'CGPA', 'Stage'];
    const rows = filteredStudents.map(s => [
      s.rollNumber,
      `"${s.name}"`,
      s.email,
      s.phone,
      `"${s.branch}"`,
      s.cgpa,
      s.stage
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const fileName = activeDrive ? `${activeDrive.collegeName.replace(/\s+/g, '_')}_Drive_List.csv` : 'Posted_Students.csv';
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (drives.length === 0) {
    return (
      <div className="content-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <Building2 size={40} color="#154360" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#154360', marginBottom: '6px' }}>
          No Campus Drives Created Yet
        </h3>
        <p style={{ color: '#71717a', fontSize: '0.875rem', maxWidth: '460px', margin: '0 auto 20px' }}>
          Create a campus drive in "Campus Drives" or import students via "Google Sheets Intake" to view candidates on this board.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {onNavigateToDrives && (
            <button onClick={onNavigateToDrives} className="btn-navy btn-black-sm">
              <Calendar size={13} color="#FFDB58" /> Go to Campus Drives
            </button>
          )}
          <button onClick={onNavigateToBlast} className="btn-secondary btn-black-sm">
            Go to Google Sheets Intake
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Drive Summary & Action Bar */}
      <div className="content-card" style={{ marginBottom: '12px', padding: '12px 14px', background: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: 'var(--font-sm)', color: '#154360', lineHeight: 'var(--lh-sm)' }}>
                Campus Drive:
              </span>
              <select
                className="form-select"
                value={selectedDriveId || activeDrive?.id}
                onChange={(e) => setSelectedDriveId(e.target.value)}
                style={{ fontWeight: 700, width: 'auto', padding: '5px 10px', fontSize: 'var(--font-xs)', borderColor: '#154360', color: '#154360' }}
              >
                {drives.map(d => (
                  <option key={d.id} value={d.id}>{d.title} ({d.collegeName})</option>
                ))}
              </select>
            </div>
            {activeDrive && (
              <div style={{ fontSize: 'var(--font-11)', lineHeight: 'var(--lh-11)', color: '#52525b', marginTop: '4px' }}>
                Role: <strong style={{ color: '#154360' }}>{activeDrive.jobRole}</strong> • CTC: <strong style={{ color: '#154360' }}>{activeDrive.ctc}</strong> • Date: <strong>{activeDrive.driveDate || 'Upcoming'}</strong>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Mustard Yellow Total Counter Badge */}
            <div style={{ background: '#FFDB58', border: '1px solid #fae27a', borderRadius: 'var(--radius-sm)', padding: '4px 10px', textAlign: 'center', boxShadow: '0 1px 3px rgba(255, 219, 88, 0.3)' }}>
              <span style={{ fontSize: 'var(--font-10)', lineHeight: 'var(--lh-10)', fontWeight: 800, color: '#154360', marginRight: '6px' }}>TOTAL:</span>
              <span style={{ fontSize: 'var(--font-base)', fontWeight: 800, color: '#154360', fontFamily: 'Space Grotesk, sans-serif' }}>
                {driveStudents.length}
              </span>
            </div>

            {/* Navy Blue In-Interviews Counter Badge */}
            <div style={{ background: '#154360', border: '1px solid #0e2e42', borderRadius: 'var(--radius-sm)', padding: '4px 10px', textAlign: 'center', boxShadow: '0 1px 3px rgba(21, 67, 96, 0.3)' }}>
              <span style={{ fontSize: 'var(--font-10)', lineHeight: 'var(--lh-10)', fontWeight: 700, color: '#ffffff', marginRight: '6px' }}>IN INTERVIEWS:</span>
              <span style={{ fontSize: 'var(--font-base)', fontWeight: 800, color: '#FFDB58', fontFamily: 'Space Grotesk, sans-serif' }}>
                {driveStudents.filter(s => s.stage === 'TECH_INTERVIEW' || s.stage === 'HR_INTERVIEW').length}
              </span>
            </div>

            <button onClick={handleExportCsv} className="btn-navy-outline btn-black-sm" disabled={filteredStudents.length === 0} title="Export CSV list">
              <Download size={13} color="#154360" /> Export (CSV)
            </button>
            <button onClick={handleCopyBoardLink} className="btn-mustard btn-black-sm" title="Share candidate board link with TPO">
              {copiedShareLink ? <Check size={13} color="#154360" /> : <Share2 size={13} color="#154360" />}
              {copiedShareLink ? 'Link Copied!' : 'Share with TPO'}
            </button>

            {onNavigateToDrives && (
              <button onClick={onNavigateToDrives} className="btn-secondary btn-black-sm" title="Go to Campus Drives management">
                <Calendar size={13} color="#154360" /> Drives
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Candidate Table Card */}
      <div className="content-card">
        <div className="card-header-row" style={{ padding: '10px 14px' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: 'var(--font-base)', lineHeight: 'var(--lh-base)', color: '#154360', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} color="#154360" /> Posted Students ({filteredStudents.length})
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} color="#71717a" style={{ position: 'absolute', left: '9px', top: '8px' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '28px', fontSize: 'var(--font-xs)', padding: '5px 8px 5px 28px', borderRadius: '6px' }}
              />
            </div>

            <select
              className="form-select"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              style={{ width: 'auto', fontSize: 'var(--font-xs)', padding: '5px 8px', borderRadius: '6px' }}
            >
              <option value="ALL">All Branches</option>
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop View: Full CRM Table without horizontal overflow */}
        <div className="desktop-only" style={{ width: '100%', overflowX: 'hidden' }}>
          <table className="crm-table" style={{ width: '100%', tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th style={{ background: '#154360', color: '#ffffff', fontSize: 'var(--font-xs)', padding: '7px 8px' }}>Roll No</th>
                <th style={{ background: '#154360', color: '#ffffff', fontSize: 'var(--font-xs)', padding: '7px 8px' }}>Student</th>
                <th style={{ background: '#154360', color: '#ffffff', fontSize: 'var(--font-xs)', padding: '7px 8px' }}>Branch</th>
                <th style={{ background: '#154360', color: '#ffffff', fontSize: 'var(--font-xs)', padding: '7px 8px' }}>CGPA</th>
                <th style={{ background: '#154360', color: '#ffffff', fontSize: 'var(--font-xs)', padding: '7px 8px' }}>Stage</th>
                <th style={{ background: '#154360', color: '#ffffff', fontSize: 'var(--font-xs)', padding: '7px 8px' }}>Contact</th>
                <th style={{ background: '#154360', color: '#ffffff', fontSize: 'var(--font-xs)', padding: '7px 8px' }}>Interview</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '28px', color: '#71717a', fontSize: 'var(--font-sm)' }}>
                    No students posted yet for this drive. Go to <strong>Google Sheets Intake</strong> and click <strong>"Post Students"</strong> to publish candidates here.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#09090b', fontSize: 'var(--font-xs)', padding: '6px 8px' }}>
                      {student.rollNumber}
                    </td>

                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ fontWeight: 700, color: '#154360', fontSize: 'var(--font-sm)' }}>
                        {student.name}
                      </div>
                      <div style={{ fontSize: 'var(--font-11)', color: '#52525b', lineHeight: 'var(--lh-11)' }}>
                        {student.email}
                      </div>
                    </td>

                    <td style={{ fontSize: 'var(--font-xs)', padding: '6px 8px' }}>
                      {student.branch}
                    </td>

                    <td style={{ padding: '6px 8px' }}>
                      <span style={{
                        fontWeight: 700,
                        background: '#f1f5f9',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: 'var(--font-xs)',
                        border: '1px solid #e2e8f0'
                      }}>
                        {student.cgpa}
                      </span>
                    </td>

                    <td style={{ padding: '6px 8px' }}>
                      {onUpdateCandidateStage ? (
                        <select
                          className="form-select"
                          value={student.stage || 'ONLINE_ASSESSMENT'}
                          onChange={(e) => onUpdateCandidateStage(student.id, e.target.value)}
                          style={{
                            fontSize: 'var(--font-11)',
                            padding: '3px 6px',
                            fontWeight: 700,
                            borderRadius: '6px',
                            width: 'auto',
                            background: student.stage === 'OFFERED' ? '#FFDB58' : student.stage === 'TECH_INTERVIEW' ? '#ebf5fb' : '#f8fafc',
                            color: student.stage === 'OFFERED' ? '#154360' : student.stage === 'TECH_INTERVIEW' ? '#154360' : '#09090b',
                            border: student.stage === 'OFFERED' ? '1px solid #fae27a' : student.stage === 'TECH_INTERVIEW' ? '1px solid #aed6f1' : '1px solid #cbd5e1'
                          }}
                        >
                          <option value="APPLIED">1. Applied</option>
                          <option value="ONLINE_ASSESSMENT">2. Online Test</option>
                          <option value="TECH_INTERVIEW">3. Interview</option>
                          <option value="OFFERED">4. Selected / Offered</option>
                        </select>
                      ) : (
                        <span className={`badge ${student.stage === 'OFFERED' || student.stage === 'JOINED'
                          ? 'badge-mustard'
                          : student.stage === 'TECH_INTERVIEW' || student.stage === 'HR_INTERVIEW'
                            ? 'badge-navy-subtle'
                            : 'badge-grey'
                          }`} style={{ fontSize: 'var(--font-10)' }}>
                          {student.stage ? student.stage.replace(/_/g, ' ') : 'ONLINE ASSESSMENT'}
                        </span>
                      )}
                    </td>

                    <td style={{ fontSize: 'var(--font-xs)', color: '#52525b', fontFamily: 'monospace', padding: '6px 8px' }}>
                      {student.phone}
                    </td>

                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => onStartCall({
                            recipientType: 'STUDENT',
                            recipientName: student.name,
                            recipientDetail: `${student.branch} • ${student.phone}`,
                            type: 'VIDEO',
                            studentId: student.id,
                            student
                          })}
                          className="btn-navy btn-black-sm"
                          style={{ padding: '3px 8px', fontSize: 'var(--font-xs)', gap: '4px' }}
                          title="Start Video Interview"
                        >
                          <Video size={12} color="#FFDB58" /> Video
                        </button>

                        <button
                          onClick={() => onStartCall({
                            recipientType: 'STUDENT',
                            recipientName: student.name,
                            recipientDetail: `${student.branch} • ${student.phone}`,
                            recipientPhone: student.phone,
                            type: 'AUDIO',
                            studentId: student.id,
                            student
                          })}
                          className="btn-mustard btn-black-sm"
                          style={{ padding: '3px 8px', fontSize: 'var(--font-xs)', gap: '4px' }}
                          title="Call via Phone"
                        >
                          <Phone size={12} color="#154360" /> Call
                        </button>

                        {onDeleteStudent && (
                          <button
                            onClick={() => onDeleteStudent(student.id)}
                            className="btn-icon"
                            style={{ width: '24px', height: '24px', color: '#ef4444' }}
                            title="Delete candidate"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Clean Candidate Cards */}
        <div className="mobile-only" style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filteredStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 10px', color: '#71717a', fontSize: 'var(--font-xs)' }}>
              No candidates posted yet for this drive. Go to <strong>Google Sheets Intake</strong> to import students.
            </div>
          ) : (
            filteredStudents.map(student => (
              <div key={student.id} style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #154360',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 'var(--font-sm)', lineHeight: 'var(--lh-sm)', color: '#154360' }}>
                      {student.name}
                    </div>
                    <div style={{ fontSize: 'var(--font-10)', lineHeight: 'var(--lh-10)', color: '#71717a' }}>
                      {student.rollNumber} • {student.branch}
                    </div>
                  </div>
                  <span style={{
                    fontWeight: 700,
                    background: '#FFDB58',
                    border: '1px solid #fae27a',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontSize: 'var(--font-10)',
                    lineHeight: 'var(--lh-10)',
                    color: '#154360'
                  }}>
                    ⭐ {student.cgpa} CGPA
                  </span>
                </div>

                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  gap: '6px', 
                  background: '#ffffff', 
                  padding: '6px 8px', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid #e2e8f0',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: 'var(--font-10)', color: '#154360', fontWeight: 700 }}>Stage:</span>
                    <select
                      className="form-select"
                      value={student.stage || 'ONLINE_ASSESSMENT'}
                      onChange={(e) => onUpdateCandidateStage && onUpdateCandidateStage(student.id, e.target.value)}
                      style={{
                        fontSize: 'var(--font-10)',
                        lineHeight: 'var(--lh-10)',
                        padding: '2px 4px',
                        fontWeight: 700,
                        borderRadius: '4px',
                        width: 'auto',
                        background: student.stage === 'OFFERED' ? '#FFDB58' : student.stage === 'TECH_INTERVIEW' ? '#ebf5fb' : '#f8fafc',
                        color: student.stage === 'OFFERED' ? '#154360' : student.stage === 'TECH_INTERVIEW' ? '#154360' : '#09090b',
                        border: student.stage === 'OFFERED' ? '1px solid #fae27a' : student.stage === 'TECH_INTERVIEW' ? '1px solid #aed6f1' : '1px solid #cbd5e1'
                      }}
                    >
                      <option value="APPLIED">1. Applied</option>
                      <option value="ONLINE_ASSESSMENT">2. Test</option>
                      <option value="TECH_INTERVIEW">3. Interview</option>
                      <option value="OFFERED">4. Selected</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button
                      onClick={() => onStartCall({
                        recipientType: 'STUDENT',
                        recipientName: student.name,
                        recipientDetail: `${student.branch} • ${student.phone}`,
                        recipientPhone: student.phone,
                        type: 'AUDIO',
                        studentId: student.id,
                        student
                      })}
                      className="btn-mustard btn-black-sm"
                      style={{ padding: '3px 8px', fontSize: 'var(--font-xs)', gap: '4px' }}
                      title="Direct Phone Call"
                    >
                      <Phone size={11} color="#154360" /> Call
                    </button>

                    <button
                      onClick={() => onStartCall({
                        recipientType: 'STUDENT',
                        recipientName: student.name,
                        recipientDetail: `${student.branch} • ${student.phone}`,
                        recipientPhone: student.phone,
                        type: 'VIDEO',
                        studentId: student.id,
                        student
                      })}
                      className="btn-navy btn-black-sm"
                      style={{ padding: '3px 8px', fontSize: 'var(--font-xs)', gap: '4px' }}
                      title="Video Interview Room"
                    >
                      <Video size={11} color="#FFDB58" /> Video
                    </button>

                    {onDeleteStudent && (
                      <button
                        onClick={() => onDeleteStudent(student.id)}
                        className="btn-icon"
                        style={{ width: '24px', height: '24px', color: '#ef4444' }}
                        title="Delete candidate"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}