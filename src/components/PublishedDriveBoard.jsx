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
  Users,
  ExternalLink,
  Link2,
  Copy,
  RefreshCw,
  Upload,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

export default function PublishedDriveBoard({
  drives,
  students,
  formResponses,
  onStartCall,
  onAddStudentsBatch,
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

  // Link Google Sheets state
  const [isLinkSheetsModalOpen, setIsLinkSheetsModalOpen] = useState(false);
  const [linkedSheetUrl, setLinkedSheetUrl] = useState(() => localStorage.getItem('tacrm_candidates_sheet_url') || '');
  const [sheetInputUrl, setSheetInputUrl] = useState('');
  const [activeSheetTab, setActiveSheetTab] = useState('URL'); // 'URL' | 'PASTE'
  const [pasteText, setPasteText] = useState('');
  const [parsedCandidates, setParsedCandidates] = useState([]);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState(null);
  const [copiedSample, setCopiedSample] = useState(false);

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

  // Parse rows from Google Sheet CSV or pasted clipboard text
  const parseCandidateRows = (text, targetDrive) => {
    if (!text || !text.trim()) return [];
    const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return [];

    const firstLine = lines[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const delimiter = tabCount >= commaCount ? '\t' : ',';

    const parseLine = (line) => {
      if (delimiter === '\t') {
        return line.split('\t').map(c => c.trim().replace(/^["']|["']$/g, ''));
      }
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    const headerTokens = parseLine(firstLine).map(h => h.toLowerCase());
    const hasHeader = headerTokens.some(h => 
      h.includes('name') || h.includes('roll') || h.includes('phone') || 
      h.includes('email') || h.includes('branch') || h.includes('cgpa') || h.includes('candidate')
    );

    let colIndices = {
      name: -1,
      rollNumber: -1,
      phone: -1,
      email: -1,
      branch: -1,
      cgpa: -1,
      stage: -1,
    };

    if (hasHeader) {
      headerTokens.forEach((h, idx) => {
        if (colIndices.name === -1 && (h.includes('name') || h.includes('student') || h.includes('candidate'))) {
          colIndices.name = idx;
        } else if (colIndices.rollNumber === -1 && (h.includes('roll') || h.includes('reg') || h.includes('id') || h.includes('hall'))) {
          colIndices.rollNumber = idx;
        } else if (colIndices.phone === -1 && (h.includes('phone') || h.includes('mobile') || h.includes('contact') || h.includes('whatsapp') || h.includes('tel'))) {
          colIndices.phone = idx;
        } else if (colIndices.email === -1 && (h.includes('email') || h.includes('mail'))) {
          colIndices.email = idx;
        } else if (colIndices.branch === -1 && (h.includes('branch') || h.includes('dept') || h.includes('stream') || h.includes('course'))) {
          colIndices.branch = idx;
        } else if (colIndices.cgpa === -1 && (h.includes('cgpa') || h.includes('gpa') || h.includes('percentage') || h.includes('marks'))) {
          colIndices.cgpa = idx;
        } else if (colIndices.stage === -1 && (h.includes('stage') || h.includes('status'))) {
          colIndices.stage = idx;
        }
      });
    }

    const dataLines = hasHeader ? lines.slice(1) : lines;
    const driveObj = targetDrive || activeDrive || drives[0] || { id: 'drv-general', title: 'Campus Drive', collegeName: 'Campus' };

    const parsed = [];
    dataLines.forEach((line, rowIdx) => {
      const cols = parseLine(line);
      if (cols.length === 0 || cols.every(c => !c)) return;

      let name = '';
      let rollNumber = '';
      let phone = '';
      let email = '';
      let branch = 'Computer Science';
      let cgpa = 7.5;
      let stage = 'APPLIED';

      if (hasHeader) {
        name = colIndices.name !== -1 ? cols[colIndices.name] || '' : '';
        rollNumber = colIndices.rollNumber !== -1 ? cols[colIndices.rollNumber] || '' : '';
        phone = colIndices.phone !== -1 ? cols[colIndices.phone] || '' : '';
        email = colIndices.email !== -1 ? cols[colIndices.email] || '' : '';
        branch = colIndices.branch !== -1 ? cols[colIndices.branch] || 'Computer Science' : 'Computer Science';
        cgpa = colIndices.cgpa !== -1 ? parseFloat(cols[colIndices.cgpa]) || 7.5 : 7.5;
        stage = colIndices.stage !== -1 ? cols[colIndices.stage] || 'APPLIED' : 'APPLIED';
      } else {
        const phoneIdx = cols.findIndex(c => /^\+?[\d\s-]{8,15}$/.test(c.trim()));
        const emailIdx = cols.findIndex(c => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.trim()));
        if (phoneIdx !== -1) phone = cols[phoneIdx];
        if (emailIdx !== -1) email = cols[emailIdx];

        const remaining = cols.map((c, i) => ({ val: c, idx: i })).filter(item => item.idx !== phoneIdx && item.idx !== emailIdx && item.val);
        if (remaining.length > 0) name = remaining[0].val;
        if (remaining.length > 1) rollNumber = remaining[1].val;
        if (remaining.length > 2) branch = remaining[2].val;
      }

      if (!name && !rollNumber && !phone) return;

      const normStage = ['APPLIED', 'ONLINE_ASSESSMENT', 'TECH_INTERVIEW', 'HR_INTERVIEW', 'OFFERED', 'REJECTED'].includes((stage || '').toUpperCase().replace(/\s+/g, '_'))
        ? (stage || '').toUpperCase().replace(/\s+/g, '_')
        : 'APPLIED';

      parsed.push({
        id: `stu-${Date.now()}-${rowIdx}-${Math.random().toString(36).substring(2, 6)}`,
        driveId: driveObj.id,
        driveTitle: driveObj.title,
        collegeId: driveObj.collegeId || 'col-linked',
        collegeName: driveObj.collegeName || 'Campus',
        name: name || 'Student Candidate',
        rollNumber: rollNumber || `ROLL-${Date.now().toString().slice(-4)}-${rowIdx + 1}`,
        email: email || `${(name || 'student').toLowerCase().replace(/\s+/g, '.')}@campus.edu`,
        phone: phone || '',
        branch: branch || 'Computer Science',
        cgpa: cgpa || 7.5,
        stage: normStage,
        internId: 'staff-assigned',
        internName: 'Staff Recruiter',
        notes: 'Imported via Linked Sheets',
      });
    });

    return parsed;
  };

  const handlePasteChange = (e) => {
    const text = e.target.value;
    setPasteText(text);
    const parsed = parseCandidateRows(text, activeDrive);
    setParsedCandidates(parsed);
  };

  const handleFetchGoogleSheet = async (urlToFetch) => {
    const targetUrl = urlToFetch || sheetInputUrl || linkedSheetUrl;
    if (!targetUrl || !targetUrl.trim()) {
      setImportStatusMessage({ type: 'error', text: 'Please enter a valid Google Sheet link.' });
      return;
    }

    const sheetIdMatch = targetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      setImportStatusMessage({ type: 'error', text: 'Invalid Google Sheet link. Ensure it contains /spreadsheets/d/...' });
      return;
    }

    const sheetId = sheetIdMatch[1];
    const csvExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    setIsLoadingSheet(true);
    setImportStatusMessage(null);

    try {
      const response = await fetch(csvExportUrl);
      if (!response.ok) {
        throw new Error('Google Sheet is restricted or private.');
      }
      const csvText = await response.text();
      const parsed = parseCandidateRows(csvText, activeDrive);

      if (parsed.length > 0) {
        if (onAddStudentsBatch) {
          onAddStudentsBatch(parsed);
        }

        setLinkedSheetUrl(targetUrl.trim());
        localStorage.setItem('tacrm_candidates_sheet_url', targetUrl.trim());

        setImportStatusMessage({
          type: 'success',
          text: `Successfully synced & imported ${parsed.length} candidate records for ${activeDrive?.title || 'Drive'}!`
        });
        setSheetInputUrl('');
      } else {
        throw new Error('No valid candidate rows found in Google Sheet.');
      }
    } catch {
      setImportStatusMessage({
        type: 'error',
        text: 'Could not fetch public Google Sheet link (it may require public viewer access). Tip: In Google Sheets, select cells, copy (Ctrl+C), switch to "Paste Spreadsheet Cells" tab, and paste (Ctrl+V) to import instantly.'
      });
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const handleImportPastedCandidates = () => {
    if (parsedCandidates.length === 0) return;
    if (onAddStudentsBatch) {
      onAddStudentsBatch(parsedCandidates);
    }
    setImportStatusMessage({
      type: 'success',
      text: `Successfully imported ${parsedCandidates.length} candidates into ${activeDrive?.title || 'Drive'}!`
    });
    setPasteText('');
    setParsedCandidates([]);
    setTimeout(() => {
      setIsLinkSheetsModalOpen(false);
      setImportStatusMessage(null);
    }, 1500);
  };

  const handleUnlinkSheet = () => {
    setLinkedSheetUrl('');
    localStorage.removeItem('tacrm_candidates_sheet_url');
    setImportStatusMessage({ type: 'info', text: 'Google Sheet unlinked.' });
  };

  const sampleCandidateTemplate = "Name\tRoll No\tPhone\tEmail\tBranch\tCGPA\nRahul Sharma\t2026CS101\t+91 98765 11111\trahul.sharma@campus.edu\tComputer Science\t8.5\nPooja Patel\t2026IT102\t+91 98765 22222\tpooja.patel@campus.edu\tInformation Tech\t8.9";

  const handleCopySample = () => {
    navigator.clipboard.writeText(sampleCandidateTemplate);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
  };

  if (drives.length === 0) {
    return (
      <div className="content-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <Building2 size={40} color="#154360" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#154360', marginBottom: '6px' }}>
          No Campus Drives Created Yet
        </h3>
        <p style={{ color: '#71717a', fontSize: '0.875rem', maxWidth: '460px', margin: '0 auto 20px' }}>
          Create a campus drive in "Campus Drives" or click "Link Sheets" above to import candidates to this board.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {onNavigateToDrives && (
            <button onClick={onNavigateToDrives} className="btn-navy btn-black-sm">
              <Calendar size={13} color="#FFDB58" /> Go to Campus Drives
            </button>
          )}
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

            {/* Link Sheets Button */}
            <button 
              type="button"
              onClick={() => {
                setIsLinkSheetsModalOpen(true);
                setImportStatusMessage(null);
              }}
              className="btn-navy-outline btn-black-sm" 
              style={{ 
                fontWeight: 700, 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                fontSize: 'var(--font-xs)'
              }}
              title="Link Google Sheets or import student candidates"
            >
              <FileSpreadsheet size={14} color="#154360" /> Link Sheets
              {linkedSheetUrl && (
                <span 
                  style={{ 
                    width: '7px', 
                    height: '7px', 
                    borderRadius: '50%', 
                    background: '#10b981', 
                    display: 'inline-block' 
                  }} 
                  title="Google Sheet is connected" 
                />
              )}
            </button>
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
                    No students posted yet for this drive. Click <strong>"Link Sheets"</strong> above to sync or paste candidate records directly.
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
                            recipientPhone: student.phone,
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
              No candidates posted yet for this drive. Click <strong>"Link Sheets"</strong> above to import students.
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

      {/* =========================================================================
          LINK SHEETS / IMPORT CANDIDATES MODAL
          ========================================================================= */}
      {isLinkSheetsModalOpen && (
        <div className="modal-overlay" onClick={() => setIsLinkSheetsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileSpreadsheet size={18} color="#154360" /> Link Google Sheets & Import Candidates
                </h3>
                <p className="card-subtitle">
                  Connect a Google Sheet link or paste candidate rows for <strong>{activeDrive?.title || 'Active Drive'}</strong> ({activeDrive?.collegeName || 'Campus'})
                </p>
              </div>
              <button onClick={() => setIsLinkSheetsModalOpen(false)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              {/* Linked Sheet Status Badge */}
              {linkedSheetUrl && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid #10b981',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px', flex: 1 }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#065f46' }}>
                        ACTIVE LINKED GOOGLE SHEET
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#154360', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                        {linkedSheetUrl}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => window.open(linkedSheetUrl, '_blank')}
                      className="btn-navy-outline btn-black-sm"
                      style={{ padding: '4px 8px', fontSize: '0.72rem', gap: '4px' }}
                      title="Open in new tab"
                    >
                      <ExternalLink size={12} /> Open Sheet
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFetchGoogleSheet(linkedSheetUrl)}
                      className="btn-mustard btn-black-sm"
                      style={{ padding: '4px 8px', fontSize: '0.72rem', gap: '4px' }}
                      disabled={isLoadingSheet}
                      title="Sync latest candidate rows from Google Sheet"
                    >
                      <RefreshCw size={12} className={isLoadingSheet ? 'spin' : ''} /> Sync
                    </button>

                    <button
                      type="button"
                      onClick={handleUnlinkSheet}
                      className="btn-icon"
                      style={{ width: '26px', height: '26px', color: '#ef4444' }}
                      title="Unlink Sheet"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* Status Message */}
              {importStatusMessage && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  marginBottom: '14px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: importStatusMessage.type === 'success' ? '#ecfdf5' : importStatusMessage.type === 'error' ? '#fef2f2' : '#eff6ff',
                  border: `1px solid ${importStatusMessage.type === 'success' ? '#10b981' : importStatusMessage.type === 'error' ? '#ef4444' : '#3b82f6'}`,
                  color: importStatusMessage.type === 'success' ? '#065f46' : importStatusMessage.type === 'error' ? '#991b1b' : '#1e40af'
                }}>
                  {importStatusMessage.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  <span>{importStatusMessage.text}</span>
                </div>
              )}

              {/* Tab Selector */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActiveSheetTab('URL')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: activeSheetTab === 'URL' ? '#154360' : '#e2e8f0',
                    background: activeSheetTab === 'URL' ? '#154360' : '#ffffff',
                    color: activeSheetTab === 'URL' ? '#ffffff' : '#154360',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Link2 size={14} /> Link Google Sheet URL
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSheetTab('PASTE')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: activeSheetTab === 'PASTE' ? '#154360' : '#e2e8f0',
                    background: activeSheetTab === 'PASTE' ? '#154360' : '#ffffff',
                    color: activeSheetTab === 'PASTE' ? '#ffffff' : '#154360',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FileSpreadsheet size={14} /> Paste Cells Directly (Ctrl+V)
                </button>
              </div>

              {/* TAB 1: GOOGLE SHEET LINK */}
              {activeSheetTab === 'URL' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">
                      Google Spreadsheet URL *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <FileSpreadsheet size={15} color="#71717a" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                      <input
                        type="url"
                        className="form-input"
                        placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
                        value={sheetInputUrl}
                        onChange={(e) => setSheetInputUrl(e.target.value)}
                        style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '4px', display: 'block' }}>
                      💡 Make sure the Google Sheet sharing setting is set to <strong>"Anyone with the link can view"</strong> so our CRM can import candidate rows into <strong>{activeDrive?.title || 'this drive'}</strong>.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleFetchGoogleSheet(sheetInputUrl)}
                      className="btn-mustard"
                      disabled={isLoadingSheet || !sheetInputUrl.trim()}
                      style={{ fontWeight: 800, padding: '9px 18px' }}
                    >
                      {isLoadingSheet ? (
                        <>
                          <RefreshCw size={14} className="spin" /> Fetching & Syncing Candidates...
                        </>
                      ) : (
                        <>
                          <Upload size={14} /> Link & Import Candidates
                        </>
                      )}
                    </button>

                    {sheetInputUrl && (
                      <button
                        type="button"
                        onClick={() => window.open(sheetInputUrl, '_blank')}
                        className="btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '9px 14px' }}
                      >
                        <ExternalLink size={14} /> Test Link
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PASTE COPIED SPREADSHEET CELLS */}
              {activeSheetTab === 'PASTE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>
                        Paste Candidate Spreadsheet Cells (Tab or Comma Separated) *
                      </label>
                      <button
                        type="button"
                        onClick={handleCopySample}
                        className="btn-icon"
                        style={{ fontSize: '0.72rem', gap: '4px', padding: '2px 8px', width: 'auto', height: 'auto', color: '#154360' }}
                        title="Copy sample row to clipboard"
                      >
                        {copiedSample ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        {copiedSample ? 'Copied Template!' : 'Copy Sample Template'}
                      </button>
                    </div>

                    <textarea
                      className="form-textarea"
                      rows={6}
                      placeholder={`Name\tRoll No\tPhone\tEmail\tBranch\tCGPA\nRahul Sharma\t2026CS101\t+91 98765 11111\trahul.sharma@campus.edu\tComputer Science\t8.5`}
                      value={pasteText}
                      onChange={handlePasteChange}
                      style={{ fontFamily: 'monospace', fontSize: '0.78rem', whiteSpace: 'pre' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '4px', display: 'block' }}>
                      Tip: In Google Sheets or Excel, select candidate rows, press <strong>Ctrl+C</strong>, then click here and press <strong>Ctrl+V</strong>.
                    </span>
                  </div>

                  {/* Parsed Preview Table */}
                  {parsedCandidates.length > 0 && (
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#154360' }}>
                          ⚡ Detected {parsedCandidates.length} Valid Candidate{parsedCandidates.length > 1 ? 's' : ''}:
                        </span>
                        <button
                          type="button"
                          onClick={handleImportPastedCandidates}
                          className="btn-mustard btn-black-sm"
                          style={{ fontWeight: 800, padding: '4px 12px' }}
                        >
                          <Check size={13} /> Import {parsedCandidates.length} Candidates to {activeDrive?.title || 'Drive'}
                        </button>
                      </div>

                      <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                        <table className="crm-table" style={{ fontSize: '0.72rem' }}>
                          <thead>
                            <tr>
                              <th style={{ padding: '4px 8px' }}>Name</th>
                              <th style={{ padding: '4px 8px' }}>Roll No</th>
                              <th style={{ padding: '4px 8px' }}>Phone</th>
                              <th style={{ padding: '4px 8px' }}>Email</th>
                              <th style={{ padding: '4px 8px' }}>Branch</th>
                              <th style={{ padding: '4px 8px' }}>CGPA</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedCandidates.slice(0, 10).map((row, idx) => (
                              <tr key={idx}>
                                <td style={{ padding: '4px 8px', fontWeight: 600 }}>{row.name}</td>
                                <td style={{ padding: '4px 8px' }}>{row.rollNumber}</td>
                                <td style={{ padding: '4px 8px', fontFamily: 'monospace' }}>{row.phone}</td>
                                <td style={{ padding: '4px 8px' }}>{row.email}</td>
                                <td style={{ padding: '4px 8px' }}>{row.branch}</td>
                                <td style={{ padding: '4px 8px' }}>{row.cgpa}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {parsedCandidates.length > 10 && (
                          <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#71717a', paddingTop: '6px' }}>
                            ...and {parsedCandidates.length - 10} more records
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.72rem', color: '#71717a' }}>
                Columns recognized: Name, Roll Number, Phone, Email, Branch, CGPA, Stage
              </div>
              <button
                type="button"
                onClick={() => setIsLinkSheetsModalOpen(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}