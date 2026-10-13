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
  Trash2
} from 'lucide-react';

export default function PublishedDriveBoard({
  drives,
  students,
  formResponses,
  onStartCall,
  onDeleteStudent,
  onNavigateToBlast,
  onUpdateCandidateStage,
  onLoadDemoData
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
        <Building2 size={40} color="#a1a1aa" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#09090b', marginBottom: '6px' }}>
          No Campus Drives Created Yet
        </h3>
        <p style={{ color: '#71717a', fontSize: '0.875rem', maxWidth: '460px', margin: '0 auto 20px' }}>
          Create a campus drive in "Campus Drives", import students via "Google Sheets Intake", or load the instant demo dataset to view candidates on this board.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {onLoadDemoData && (
            <button onClick={onLoadDemoData} className="btn-black">
              ⚡ Load Working Demo Data
            </button>
          )}
          <button onClick={onNavigateToBlast} className="btn-secondary">
            Go to Google Sheets Intake
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Drive Summary & Action Bar */}
      <div className="content-card" style={{ marginBottom: '16px', padding: '16px 20px', background: '#f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#09090b' }}>
                Drive:
              </span>
              <select
                className="form-select"
                value={selectedDriveId || activeDrive?.id}
                onChange={(e) => setSelectedDriveId(e.target.value)}
                style={{ fontWeight: 600, width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
              >
                {drives.map(d => (
                  <option key={d.id} value={d.id}>{d.title} ({d.collegeName})</option>
                ))}
              </select>
            </div>
            {activeDrive && (
              <div style={{ fontSize: '0.8rem', color: '#52525b', marginTop: '6px' }}>
                Role: <strong>{activeDrive.jobRole}</strong> • CTC: <strong>{activeDrive.ctc}</strong> • Date: <strong>{activeDrive.driveDate || 'Upcoming'}</strong>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 14px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#71717a', marginRight: '6px' }}>TOTAL:</span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#09090b', fontFamily: 'Space Grotesk, sans-serif' }}>
                {driveStudents.length}
              </span>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 14px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#71717a', marginRight: '6px' }}>IN INTERVIEWS:</span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#09090b', fontFamily: 'Space Grotesk, sans-serif' }}>
                {driveStudents.filter(s => s.stage === 'TECH_INTERVIEW' || s.stage === 'HR_INTERVIEW').length}
              </span>
            </div>

            <button onClick={handleExportCsv} className="btn-secondary btn-black-sm" disabled={filteredStudents.length === 0}>
              <Download size={13} /> Export (CSV)
            </button>
            <button onClick={handleCopyBoardLink} className="btn-black btn-black-sm">
              {copiedShareLink ? <Check size={13} /> : <Share2 size={13} />}
              {copiedShareLink ? 'Link Copied!' : 'Share with TPO'}
            </button>
          </div>
        </div>
      </div>

      {/* Candidate Table */}
      <div className="content-card">
        <div className="card-header-row" style={{ padding: '14px 20px' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: '0.98rem' }}>
              Students ({filteredStudents.length})
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#71717a" style={{ position: 'absolute', left: '10px', top: '9px' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '30px', fontSize: '0.8rem', padding: '5px 10px 5px 30px' }}
              />
            </div>

            <select
              className="form-select"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              style={{ width: 'auto', fontSize: '0.8rem', padding: '5px 10px' }}
            >
              <option value="ALL">All Branches</option>
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student</th>
                <th>Branch</th>
                <th>CGPA</th>
                <th>Stage</th>
                <th>Contact</th>
                <th>Interview</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#71717a' }}>
                    No students posted yet for this drive. Go to <strong>Google Sheets Intake</strong> and click <strong>"🚀 Blast via WhatsApp & Post to Site"</strong> to publish candidates here.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#09090b', fontSize: '0.85rem' }}>
                      {student.rollNumber}
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: '#09090b', fontSize: '0.875rem' }}>
                        {student.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#52525b' }}>
                        {student.email}
                      </div>
                    </td>

                    <td style={{ fontSize: '0.825rem' }}>
                      {student.branch}
                    </td>

                    <td>
                      <span style={{
                        fontWeight: 700,
                        background: '#f1f5f9',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}>
                        {student.cgpa}
                      </span>
                    </td>

                    <td>
                      {onUpdateCandidateStage ? (
                        <select
                          className="form-select"
                          value={student.stage || 'ONLINE_ASSESSMENT'}
                          onChange={(e) => onUpdateCandidateStage(student.id, e.target.value)}
                          style={{
                            fontSize: '0.72rem',
                            padding: '3px 6px',
                            fontWeight: 700,
                            borderRadius: '12px',
                            width: 'auto',
                            background: student.stage === 'OFFERED' ? '#ecfdf5' : student.stage === 'TECH_INTERVIEW' ? '#fffbeb' : '#f8fafc',
                            color: student.stage === 'OFFERED' ? '#065f46' : student.stage === 'TECH_INTERVIEW' ? '#92400e' : '#09090b',
                            border: '1px solid #cbd5e1'
                          }}
                        >
                          <option value="APPLIED">Applied</option>
                          <option value="ONLINE_ASSESSMENT">Online Test</option>
                          <option value="TECH_INTERVIEW">Interview</option>
                          <option value="OFFERED">Selected / Offered</option>
                        </select>
                      ) : (
                        <span className={`badge ${student.stage === 'OFFERED' || student.stage === 'JOINED'
                          ? 'badge-green'
                          : student.stage === 'TECH_INTERVIEW' || student.stage === 'HR_INTERVIEW'
                            ? 'badge-amber'
                            : 'badge-grey'
                          }`} style={{ fontSize: '0.72rem' }}>
                          {student.stage ? student.stage.replace(/_/g, ' ') : 'ONLINE ASSESSMENT'}
                        </span>
                      )}
                    </td>

                    <td style={{ fontSize: '0.8rem', color: '#52525b', fontFamily: 'monospace' }}>
                      {student.phone}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => onStartCall({
                            recipientType: 'STUDENT',
                            recipientName: student.name,
                            recipientDetail: `${student.branch} • ${student.phone}`,
                            type: 'VIDEO',
                            studentId: student.id
                          })}
                          className="btn-black btn-black-sm"
                          style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                          title="Start Video Interview"
                        >
                          <Video size={12} /> Video
                        </button>

                        <button
                          onClick={() => onStartCall({
                            recipientType: 'STUDENT',
                            recipientName: student.name,
                            recipientDetail: `${student.branch} • ${student.phone}`,
                            type: 'AUDIO',
                            studentId: student.id
                          })}
                          className="btn-secondary btn-black-sm"
                          style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                          title="Call via Phone"
                        >
                          <Phone size={12} /> Call
                        </button>

                        {onDeleteStudent && (
                          <button
                            onClick={() => onDeleteStudent(student.id)}
                            className="btn-icon"
                            style={{ width: '26px', height: '26px', color: '#ef4444' }}
                            title="Delete candidate"
                          >
                            <Trash2 size={12} />
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
      </div>
    </div>
  );
}