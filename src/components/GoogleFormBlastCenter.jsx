import React, { useState } from 'react';
import { 
  Send, 
  FileSpreadsheet, 
  ExternalLink, 
  CheckCircle2, 
  Globe, 
  Copy, 
  Check, 
  Search, 
  X,
  Link,
  Clipboard,
  AlertCircle,
  Plus,
  UserPlus,
  Building2,
  Trash2
} from 'lucide-react';

// Intelligent parser for Google Sheet or WhatsApp pasted table text
function parseSheetInput(text, targetDrive) {
  if (!text || !text.trim()) return [];
  const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  // Determine delimiter: Tab (from copy-pasting Google Sheets) or Comma (CSV)
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : ',';
  
  const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
  
  const results = [];
  const startIndex = lines.length > 1 && (headers.some(h => h.includes('name') || h.includes('roll') || h.includes('email') || h.includes('student'))) ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length === 0 || !cols.some(c => c)) continue;

    let name = '', rollNumber = '', email = '', phone = '', branch = 'General', cgpa = 7.0, backlogs = 0, resumeUrl = '';

    if (startIndex === 1) {
      headers.forEach((h, idx) => {
        const val = cols[idx] || '';
        if (h.includes('name')) name = val;
        else if (h.includes('roll') || h.includes('reg') || h.includes('id')) rollNumber = val;
        else if (h.includes('email') || h.includes('mail')) email = val;
        else if (h.includes('phone') || h.includes('mobile') || h.includes('whatsapp') || h.includes('contact')) phone = val;
        else if (h.includes('branch') || h.includes('dept') || h.includes('department')) branch = val;
        else if (h.includes('cgpa') || h.includes('gpa') || h.includes('score')) cgpa = parseFloat(val) || 7.0;
        else if (h.includes('backlog')) backlogs = parseInt(val) || 0;
        else if (h.includes('resume') || h.includes('cv') || h.includes('drive')) resumeUrl = val;
      });
    }

    // Positional fallback if headers were not present
    if (!name) name = cols[0] || `Student ${i}`;
    if (!rollNumber) rollNumber = cols[1] || `REG-${1000 + i}`;
    if (!email) email = cols[2] && cols[2].includes('@') ? cols[2] : `${name.toLowerCase().replace(/\s+/g, '.')}@campus.edu`;
    if (!phone) phone = cols[3] || '+91 90000 00000';
    if (!branch && cols[4]) branch = cols[4];
    if (cols[5] && !isNaN(parseFloat(cols[5]))) cgpa = parseFloat(cols[5]);

    results.push({
      id: `gform-resp-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
      driveId: targetDrive ? targetDrive.id : 'drv-auto',
      driveTitle: targetDrive ? targetDrive.title : 'Campus Drive',
      timestamp: new Date().toISOString().split('T')[0],
      name,
      rollNumber,
      email,
      phone,
      collegeName: targetDrive ? targetDrive.collegeName : 'Campus',
      branch: branch || 'Engineering',
      cgpa: Number(cgpa) || 7.0,
      backlogs: Number(backlogs) || 0,
      resumeUrl: resumeUrl || '',
      status: 'PENDING_REVIEW',
      isBlasted: false,
      blastedAt: null,
      notes: 'Imported from Google Sheet / WhatsApp',
    });
  }

  return results;
}

export default function GoogleFormBlastCenter({ 
  formResponses, 
  drives, 
  users, 
  blastLogs, 
  currentUser, 
  onBlastStudents, 
  onImportStudentsFromSheet,
  onCreateDrive,
  onDeleteDrive,
  onDeleteFormResponse,
  onBatchDeleteFormResponses,
  onClearAllFormResponses,
  onGoToLiveBoard 
}) {
  const [selectedDriveId, setSelectedDriveId] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBlastModalOpen, setIsBlastModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Inline Quick Drive Setup
  const [inlineDriveTitle, setInlineDriveTitle] = useState('');
  const [inlineCollegeName, setInlineCollegeName] = useState('');

  // New Drive Modal state
  const [isNewDriveModalOpen, setIsNewDriveModalOpen] = useState(false);
  const [newDriveTitle, setNewDriveTitle] = useState('');
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newJobRole, setNewJobRole] = useState('Graduate Engineer Trainee');
  const [newCtc, setNewCtc] = useState('8.0 - 12.0 LPA');
  const [newDriveDate, setNewDriveDate] = useState('');

  // Manual Single Student Entry Modal
  const [isManualStudentModalOpen, setIsManualStudentModalOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualRoll, setManualRoll] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualBranch, setManualBranch] = useState('Computer Science');
  const [manualCgpa, setManualCgpa] = useState('8.0');
  const [manualResume, setManualResume] = useState('');

  // Google Sheet Import States
  const [sheetInputMode, setSheetInputMode] = useState('paste'); // 'paste' | 'url'
  const [pastedSheetText, setPastedSheetText] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [importStatusMessage, setImportStatusMessage] = useState(null);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);

  // Blast Configuration state
  const [blastOAUrl, setBlastOAUrl] = useState('');
  const [blastDate, setBlastDate] = useState('');
  const [includeAssessmentLink, setIncludeAssessmentLink] = useState(true);
  const [includeWhatsApp, setIncludeWhatsApp] = useState(true);
  const [includeEmail, setIncludeEmail] = useState(true);
  const [postToPublicWall, setPostToPublicWall] = useState(true);
  const [isBlastingInProgress, setIsBlastingInProgress] = useState(false);
  const [blastingProgress, setBlastingProgress] = useState(0);

  // Synchronize active drive (defaults to ALL so no incoming records are hidden)
  const activeDrive = selectedDriveId !== 'ALL' 
    ? (drives.find(d => d.id === selectedDriveId) || null)
    : null;

  const driveResponses = activeDrive 
    ? formResponses.filter(r => r.driveId === activeDrive.id) 
    : formResponses;

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (onBatchDeleteFormResponses) {
      onBatchDeleteFormResponses(selectedIds);
    } else if (onDeleteFormResponse) {
      selectedIds.forEach(id => onDeleteFormResponse(id));
    }
    setSelectedIds([]);
  };

  const filteredResponses = driveResponses.filter(r => {
    const matchesSearch = 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.branch.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'PENDING') return matchesSearch && !r.isBlasted;
    if (statusFilter === 'BLASTED') return matchesSearch && r.isBlasted;
    return matchesSearch;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredResponses.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Helper: Gets active drive or creates one if needed upon student import
  const getOrCreateTargetDrive = () => {
    if (activeDrive) return activeDrive;

    const resolvedTitle = inlineDriveTitle.trim() || 'Campus Recruitment Drive';
    const resolvedCollege = inlineCollegeName.trim() || 'College Campus';

    const newDrive = {
      id: `drv-${Date.now()}`,
      title: resolvedTitle,
      collegeId: `col-${Date.now()}`,
      collegeName: resolvedCollege,
      jobRole: 'Software Engineer / Graduate Trainee',
      ctc: 'Competitive',
      criteria: 'Eligible final year candidates',
      driveDate: new Date().toISOString().split('T')[0],
      status: 'CONFIRMED',
      registeredStudents: 0,
      shortlistedStudents: 0,
      createdById: currentUser?.id || 'admin',
    };

    if (onCreateDrive) {
      onCreateDrive(newDrive);
    }
    setSelectedDriveId(newDrive.id);
    return newDrive;
  };

  // 1. Process Pasted Google Sheet / WhatsApp data (Seamless without error blocks)
  const handleProcessPastedText = () => {
    if (!pastedSheetText.trim()) {
      setImportStatusMessage({ type: 'error', text: 'Please paste Google Sheet cells or table text first.' });
      return;
    }

    const driveToUse = getOrCreateTargetDrive();

    const parsedStudents = parseSheetInput(pastedSheetText, driveToUse);
    if (parsedStudents.length === 0) {
      setImportStatusMessage({ type: 'error', text: 'Could not parse student rows. Please make sure data has columns like Name, Roll No, Branch, CGPA.' });
      return;
    }

    if (onImportStudentsFromSheet) {
      onImportStudentsFromSheet(parsedStudents);
    }
    setPastedSheetText('');
    setImportStatusMessage({ 
      type: 'success', 
      text: `Successfully imported ${parsedStudents.length} students for ${driveToUse.title} (${driveToUse.collegeName})!` 
    });
  };

  // 2. Process Google Sheet URL (Seamless without error blocks)
  const handleFetchGoogleSheetUrl = async () => {
    if (!sheetUrl.trim()) {
      setImportStatusMessage({ type: 'error', text: 'Please enter a Google Sheet URL.' });
      return;
    }

    const driveToUse = getOrCreateTargetDrive();
    setIsLoadingSheet(true);
    setImportStatusMessage(null);

    const sheetIdMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      setIsLoadingSheet(false);
      setImportStatusMessage({ type: 'error', text: 'Invalid Google Sheet link. Make sure it contains /spreadsheets/d/...' });
      return;
    }

    const sheetId = sheetIdMatch[1];
    const csvExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    try {
      const response = await fetch(csvExportUrl);
      if (!response.ok) {
        throw new Error('Google Sheet is private or requires permission.');
      }
      const csvText = await response.text();
      const parsedStudents = parseSheetInput(csvText, driveToUse);

      if (parsedStudents.length > 0 && onImportStudentsFromSheet) {
        onImportStudentsFromSheet(parsedStudents);
        setImportStatusMessage({ 
          type: 'success', 
          text: `Fetched and imported ${parsedStudents.length} students from Google Sheet for ${driveToUse.collegeName}!` 
        });
        setSheetUrl('');
      } else {
        throw new Error('No student rows found.');
      }
    } catch {
      setImportStatusMessage({ 
        type: 'error', 
        text: 'Could not fetch public Google Sheet link (it may be restricted). Tip: In Google Sheets, select cells, press Ctrl+C, click "Paste Copied Cells (Ctrl+V)", and press Ctrl+V to import instantly.' 
      });
    } finally {
      setIsLoadingSheet(false);
    }
  };

  // 3. Quick Create Drive
  const handleCreateDriveSubmit = (e) => {
    e.preventDefault();
    if (!newDriveTitle.trim() || !newCollegeName.trim()) return;

    const newDrive = {
      id: `drv-${Date.now()}`,
      title: newDriveTitle.trim(),
      collegeId: `col-${Date.now()}`,
      collegeName: newCollegeName.trim(),
      jobRole: newJobRole.trim() || 'Software Engineer',
      ctc: newCtc.trim() || '8.0 - 12.0 LPA',
      criteria: 'Eligible final year students',
      driveDate: newDriveDate || new Date().toISOString().split('T')[0],
      status: 'CONFIRMED',
      registeredStudents: 0,
      shortlistedStudents: 0,
      createdById: currentUser?.id || 'admin',
    };

    if (onCreateDrive) {
      onCreateDrive(newDrive);
    }
    setSelectedDriveId(newDrive.id);
    setIsNewDriveModalOpen(false);
    setNewDriveTitle('');
    setNewCollegeName('');
    setImportStatusMessage({
      type: 'success',
      text: `Created new drive "${newDrive.title}" for ${newDrive.collegeName}!`
    });
  };

  // 4. Add Single Student Manually
  const handleManualStudentSubmit = (e) => {
    e.preventDefault();
    if (!manualName.trim() || !manualRoll.trim()) return;

    const driveToUse = getOrCreateTargetDrive();

    const newStudent = {
      id: `gform-resp-${Date.now()}`,
      driveId: driveToUse.id,
      driveTitle: driveToUse.title,
      timestamp: new Date().toISOString().split('T')[0],
      name: manualName.trim(),
      rollNumber: manualRoll.trim(),
      email: manualEmail.trim() || `${manualName.trim().toLowerCase().replace(/\s+/g, '.')}@campus.edu`,
      phone: manualPhone.trim() || '+91 90000 00000',
      collegeName: driveToUse.collegeName,
      branch: manualBranch.trim() || 'Computer Science',
      cgpa: parseFloat(manualCgpa) || 7.0,
      backlogs: 0,
      resumeUrl: manualResume.trim() || '',
      status: 'PENDING_REVIEW',
      isBlasted: false,
      blastedAt: null,
      notes: 'Added manually',
    };

    if (onImportStudentsFromSheet) {
      onImportStudentsFromSheet([newStudent]);
    }

    setIsManualStudentModalOpen(false);
    setManualName('');
    setManualRoll('');
    setManualPhone('');
    setManualEmail('');
    setManualResume('');
    setImportStatusMessage({
      type: 'success',
      text: `Added ${newStudent.name} (${newStudent.rollNumber}) to student list!`
    });
  };

  const handleExecuteBlast = () => {
    const driveToUse = getOrCreateTargetDrive();
    if (selectedIds.length === 0 || !driveToUse) return;
    setIsBlastingInProgress(true);
    setBlastingProgress(20);

    const interval = setInterval(() => {
      setBlastingProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          setTimeout(() => {
            onBlastStudents({
              selectedResponseIds: selectedIds,
              driveId: driveToUse.id,
              driveTitle: driveToUse.title,
              blastedBy: currentUser?.name || 'HR Team',
              channels: [
                postToPublicWall ? 'Posted on Site' : null,
                includeWhatsApp ? 'WhatsApp Broadcast' : null,
                includeEmail ? 'Email Schedule' : null,
                includeAssessmentLink ? 'Test Link' : null,
              ].filter(Boolean),
              testUrl: blastOAUrl || 'Assessment Link',
            });

            setIsBlastingInProgress(false);
            setIsBlastModalOpen(false);
            setSelectedIds([]);
            setBlastingProgress(0);
          }, 500);
          return 100;
        }
        return prev + 35;
      });
    }, 180);
  };

  const openBlastConfirmation = () => {
    if (filteredResponses.length === 0) {
      setImportStatusMessage({ type: 'error', text: 'No students available to blast. Please paste or add students first.' });
      return;
    }
    if (selectedIds.length === 0) {
      const autoIds = filteredResponses.filter(r => !r.isBlasted).map(r => r.id);
      setSelectedIds(autoIds.length > 0 ? autoIds : filteredResponses.map(r => r.id));
    }
    setIsBlastModalOpen(true);
  };

  return (
    <div>
      {/* Target Drive Selector & Drive Creator Bar */}
      <div className="content-card" style={{ marginBottom: '16px', padding: '16px 20px', background: '#f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          
          {/* Drive Selector / Inline Setup */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {drives.length > 0 ? (
              <>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#09090b' }}>
                  Target Drive:
                </span>
                <select 
                  className="form-select"
                  value={selectedDriveId}
                  onChange={(e) => {
                    setSelectedDriveId(e.target.value);
                    setSelectedIds([]);
                  }}
                  style={{ fontWeight: 600, width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  <option value="ALL">All Drives / All Candidates ({formResponses.length} records)</option>
                  {drives.map(d => {
                    const count = formResponses.filter(r => r.driveId === d.id).length;
                    return (
                      <option key={d.id} value={d.id}>{d.title} ({d.collegeName}) - {count} records</option>
                    );
                  })}
                </select>
                {activeDrive ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#71717a' }}>
                      Filtered to <strong>{activeDrive.collegeName}</strong>.
                    </span>
                    {onDeleteDrive && (
                      <button 
                        onClick={() => {
                          onDeleteDrive(activeDrive.id);
                          setSelectedDriveId('ALL');
                        }}
                        className="btn-secondary"
                        style={{ color: '#ef4444', borderColor: '#fca5a5', fontSize: '0.75rem', padding: '3px 8px' }}
                        title="Delete this drive"
                      >
                        <Trash2 size={12} /> Delete Drive
                      </button>
                    )}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#71717a' }}>
                    Showing all intake records across all campus drives.
                  </span>
                )}
              </>
            ) : (
              /* Inline Setup when no drives exist yet: NO ERROR, COMPLETELY SEAMLESS */
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#09090b' }}>
                  Drive Name:
                </span>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. Campus Drive 2026"
                  value={inlineDriveTitle}
                  onChange={(e) => setInlineDriveTitle(e.target.value)}
                  style={{ minWidth: '130px', maxWidth: '100%', flex: '1 1 140px', padding: '5px 10px', fontSize: '0.825rem' }}
                />
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#09090b', marginLeft: '6px' }}>
                  College:
                </span>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. University Campus"
                  value={inlineCollegeName}
                  onChange={(e) => setInlineCollegeName(e.target.value)}
                  style={{ minWidth: '130px', maxWidth: '100%', flex: '1 1 140px', padding: '5px 10px', fontSize: '0.825rem' }}
                />
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setIsNewDriveModalOpen(true)}
              className="btn-black btn-black-sm"
              style={{ fontSize: '0.78rem' }}
            >
              <Plus size={13} /> + New Drive
            </button>
            <button 
              onClick={() => setIsManualStudentModalOpen(true)}
              className="btn-secondary btn-black-sm"
              style={{ fontSize: '0.78rem' }}
            >
              <UserPlus size={13} /> + Add Student
            </button>
            <button 
              onClick={onGoToLiveBoard}
              className="btn-secondary btn-black-sm"
              style={{ fontSize: '0.78rem' }}
            >
              <Globe size={13} /> View Posted Students
            </button>
          </div>
        </div>
      </div>

      {/* GOOGLE SHEET & WHATSAPP PASTE BOX */}
      <div className="content-card" style={{ marginBottom: '20px', padding: '20px', border: '1px solid #cbd5e1' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={20} color="#09090b" />
            <h2 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#09090b' }}>
              Paste Google Sheet Details
            </h2>
          </div>

          {/* Toggle between Paste Rows vs Paste URL */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              onClick={() => setSheetInputMode('paste')}
              className={`role-btn ${sheetInputMode === 'paste' ? 'active' : ''}`}
              style={{ fontSize: '0.78rem', padding: '5px 12px' }}
            >
              <Clipboard size={12} /> Paste Copied Cells (Ctrl+V)
            </button>
            <button 
              onClick={() => setSheetInputMode('url')}
              className={`role-btn ${sheetInputMode === 'url' ? 'active' : ''}`}
              style={{ fontSize: '0.78rem', padding: '5px 12px' }}
            >
              <Link size={12} /> Paste Google Sheet Link
            </button>
          </div>
        </div>

        {/* Option 1: Paste Copied Rows */}
        {sheetInputMode === 'paste' && (
          <div>
            <textarea 
              rows={4}
              className="form-textarea"
              placeholder="Copy rows from your Google Sheet or WhatsApp message (Ctrl+C) and paste here (Ctrl+V)...

Columns accepted: Full Name, Roll Number, Email, Phone/WhatsApp, Branch, CGPA"
              value={pastedSheetText}
              onChange={(e) => setPastedSheetText(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: '#ffffff' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '10px', gap: '10px' }}>
              <button 
                onClick={handleProcessPastedText}
                className="btn-black btn-black-sm"
                style={{ padding: '8px 18px', fontWeight: 700 }}
              >
                <FileSpreadsheet size={14} /> Import & Show Student Details
              </button>
            </div>
          </div>
        )}

        {/* Option 2: Paste Google Sheet Link */}
        {sheetInputMode === 'url' && (
          <div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="url"
                className="form-input"
                placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />

              <button 
                onClick={handleFetchGoogleSheetUrl}
                disabled={isLoadingSheet}
                className="btn-black btn-black-sm"
                style={{ whiteSpace: 'nowrap', padding: '8px 18px', fontWeight: 700 }}
              >
                {isLoadingSheet ? 'Fetching...' : 'Fetch & Show Details'}
              </button>
            </div>
          </div>
        )}

        {/* Status Alert Banner */}
        {importStatusMessage && (
          <div style={{ 
            marginTop: '12px', 
            padding: '10px 14px', 
            borderRadius: '8px', 
            fontSize: '0.825rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: importStatusMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: importStatusMessage.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${importStatusMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`
          }}>
            {importStatusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {importStatusMessage.text}
          </div>
        )}
      </div>

      {/* Student List Table */}
      <div className="content-card">
        <div className="card-header-row" style={{ padding: '14px 20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: '0.98rem' }}>
              Student Details ({filteredResponses.length})
            </h2>
            <p className="card-subtitle">
              {activeDrive ? `Attached to drive for ${activeDrive.collegeName}` : (inlineCollegeName ? `Drive for ${inlineCollegeName}` : 'Paste rows or create a campus drive')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#71717a" style={{ position: 'absolute', left: '10px', top: '9px' }} />
              <input 
                type="text"
                className="form-input"
                placeholder="Search name, roll no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '30px', fontSize: '0.8rem', padding: '5px 10px 5px 30px' }}
              />
            </div>

            <select 
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 'auto', fontSize: '0.8rem', padding: '5px 10px' }}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending Blast</option>
              <option value="BLASTED">Already Posted</option>
            </select>

            {/* Batch Delete Selected Button */}
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="btn-secondary btn-black-sm"
                style={{ color: '#ef4444', borderColor: '#fca5a5', fontWeight: 700 }}
                title="Delete selected intake candidate rows"
              >
                <Trash2 size={13} /> Delete Selected ({selectedIds.length})
              </button>
            )}

            {/* Clear All Intake Records Button */}
            {filteredResponses.length > 0 && onClearAllFormResponses && (
              <button
                type="button"
                onClick={onClearAllFormResponses}
                className="btn-secondary btn-black-sm"
                style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                title="Clear all student intake rows"
              >
                <Trash2 size={13} /> Clear Intake ({filteredResponses.length})
              </button>
            )}

            {/* Meaningful Action Button */}
            <button 
              onClick={openBlastConfirmation}
              className="btn-black btn-black-sm"
              disabled={filteredResponses.length === 0}
              style={{ fontWeight: 700 }}
              title="Post candidates to drive roster and send WhatsApp invitations"
            >
              <Send size={13} /> {selectedIds.length > 0 ? `Post Selected (${selectedIds.length}) & Send WhatsApp Invites` : 'Post Students & Send WhatsApp Invites'}
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="crm-table">
            <thead>
              <tr>
                <th style={{ width: '36px' }}>
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={filteredResponses.length > 0 && selectedIds.length === filteredResponses.length}
                    style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#09090b' }}
                  />
                </th>
                <th>Student Name</th>
                <th>Roll No</th>
                <th>WhatsApp / Phone</th>
                <th>Branch</th>
                <th>CGPA</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredResponses.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#71717a' }}>
                    No students loaded yet. Paste your Google Sheet cells or click "+ Add Student" above.
                  </td>
                </tr>
              ) : (
                filteredResponses.map(resp => {
                  const isSelected = selectedIds.includes(resp.id);
                  return (
                    <tr key={resp.id} style={{ background: isSelected ? '#f8fafc' : 'transparent' }}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleToggleSelect(resp.id)}
                          style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#09090b' }}
                        />
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, color: '#09090b', fontSize: '0.875rem' }}>
                          {resp.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#52525b' }}>
                          {resp.email}
                        </div>
                      </td>

                      <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.825rem' }}>
                        {resp.rollNumber}
                      </td>

                      <td style={{ fontSize: '0.8rem', color: '#09090b', fontFamily: 'monospace' }}>
                        {resp.phone}
                      </td>

                      <td style={{ fontSize: '0.825rem' }}>
                        {resp.branch}
                      </td>

                      <td>
                        <span style={{ 
                          fontWeight: 700, 
                          color: '#09090b',
                          background: '#f1f5f9',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontSize: '0.8rem'
                        }}>
                          {resp.cgpa}
                        </span>
                      </td>

                      <td>
                        {resp.isBlasted ? (
                          <span className="badge badge-green" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={12} /> Posted on Site
                          </span>
                        ) : (
                          <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>
                            Ready to Invite
                          </span>
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <button 
                            onClick={() => {
                              setSelectedIds([resp.id]);
                              setIsBlastModalOpen(true);
                            }}
                            className="btn-secondary btn-black-sm"
                            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                            title="Send WhatsApp invite & post to site"
                          >
                            Invite
                          </button>

                          {onDeleteFormResponse && (
                            <button 
                              onClick={() => onDeleteFormResponse(resp.id)}
                              className="btn-icon"
                              style={{ width: '24px', height: '24px', color: '#ef4444' }}
                              title="Delete candidate row"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Create Drive Modal */}
      {isNewDriveModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3 className="card-title">Create Campus Drive</h3>
                <p className="card-subtitle">Set up a college drive to associate incoming student records with</p>
              </div>
              <button onClick={() => setIsNewDriveModalOpen(false)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDriveSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Drive Title *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Campus Recruitment 2026 - Software Engineers"
                    value={newDriveTitle}
                    onChange={(e) => setNewDriveTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">College / University Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. National Institute of Technology, Trichy"
                    value={newCollegeName}
                    onChange={(e) => setNewCollegeName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Associate Software Engineer"
                      value={newJobRole}
                      onChange={(e) => setNewJobRole(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">CTC / Package</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. 12.0 LPA"
                      value={newCtc}
                      onChange={(e) => setNewCtc(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Drive Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={newDriveDate}
                    onChange={(e) => setNewDriveDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setIsNewDriveModalOpen(false)} 
                  className="btn-secondary btn-black-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-black btn-black-sm">
                  Create Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Student Entry Modal */}
      {isManualStudentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3 className="card-title">Add Student Manually</h3>
                <p className="card-subtitle">
                  Enter student details for {activeDrive?.collegeName || inlineCollegeName}
                </p>
              </div>
              <button onClick={() => setIsManualStudentModalOpen(false)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleManualStudentSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Rahul Sharma"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Roll Number / Student ID *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. 106122130"
                      value={manualRoll}
                      onChange={(e) => setManualRoll(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">WhatsApp / Mobile Phone</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. +91 98401 99281"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="e.g. rahul@campus.edu"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Branch / Department</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Computer Science"
                      value={manualBranch}
                      onChange={(e) => setManualBranch(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">CGPA / Score</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-input" 
                      placeholder="e.g. 8.50"
                      value={manualCgpa}
                      onChange={(e) => setManualCgpa(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Resume / Drive Link (Optional)</label>
                  <input 
                    type="url" 
                    className="form-input" 
                    placeholder="https://drive.google.com/..."
                    value={manualResume}
                    onChange={(e) => setManualResume(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setIsManualStudentModalOpen(false)} 
                  className="btn-secondary btn-black-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-black btn-black-sm">
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blast Execution Modal */}
      {isBlastModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <h3 className="card-title">
                  Post Students & Send WhatsApp Invites
                </h3>
                <p className="card-subtitle">
                  Sending invitations to {selectedIds.length} candidate{selectedIds.length === 1 ? '' : 's'} for {activeDrive?.collegeName || inlineCollegeName}
                </p>
              </div>
              <button 
                onClick={() => !isBlastingInProgress && setIsBlastModalOpen(false)} 
                className="btn-icon"
                disabled={isBlastingInProgress}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              {isBlastingInProgress ? (
                <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#09090b', marginBottom: '8px' }}>
                    Broadcasting invitations & posting to live site...
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#52525b', marginBottom: '20px' }}>
                    Updating student rosters and triggering WhatsApp & Email notifications.
                  </p>

                  <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${blastingProgress}%`, 
                        height: '100%', 
                        background: '#09090b', 
                        transition: 'width 0.2s ease-in-out' 
                      }} 
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#09090b', marginTop: '6px' }}>
                    {blastingProgress}% Complete
                  </div>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Online Assessment / Test Link</label>
                    <input 
                      type="url"
                      className="form-input"
                      placeholder="e.g. https://assess.company.com/test-link"
                      value={blastOAUrl}
                      onChange={(e) => setBlastOAUrl(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Test Date & Time Window</label>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="e.g. Nov 15, 10:00 AM"
                      value={blastDate}
                      onChange={(e) => setBlastDate(e.target.value)}
                    />
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <label className="form-label" style={{ marginBottom: '8px' }}>Channels to Blast</label>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={postToPublicWall}
                          onChange={(e) => setPostToPublicWall(e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: '#09090b' }}
                        />
                        <span><strong>Publish onto Site Board:</strong> Adds candidates to the "Posted Students" live drive list</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={includeWhatsApp}
                          onChange={(e) => setIncludeWhatsApp(e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: '#09090b' }}
                        />
                        <span><strong>WhatsApp Broadcast:</strong> Send personalized invite message directly to student phone</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={includeEmail}
                          onChange={(e) => setIncludeEmail(e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: '#09090b' }}
                        />
                        <span><strong>Email Notification:</strong> Send drive details and candidate credentials</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>

            {!isBlastingInProgress && (
              <div className="modal-footer">
                <button 
                  onClick={() => setIsBlastModalOpen(false)}
                  className="btn-secondary btn-black-sm"
                >
                  Cancel
                </button>

                <button 
                  onClick={handleExecuteBlast}
                  className="btn-black btn-black-sm"
                  style={{ fontWeight: 800 }}
                >
                  <Send size={13} /> Confirm & Send Invites ({selectedIds.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
