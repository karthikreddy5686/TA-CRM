import React, { useState } from 'react';
import { 
  Calendar, 
  Users, 
  Upload, 
  Plus, 
  CheckCircle2, 
  Video, 
  Phone, 
  Building2, 
  X,
  FileSpreadsheet,
  ArrowRight,
  LayoutGrid,
  List,
  UserPlus,
  Trash2,
  Download,
  Search,
  Share2,
  Check
} from 'lucide-react';

// 4 simple, natural hiring stages that anyone can understand immediately
const HIRING_STAGES = [
  { id: 'APPLIED', step: 'Step 1', label: '1. Applied', desc: 'Signed up for drive' },
  { id: 'ONLINE_ASSESSMENT', step: 'Step 2', label: '2. Online Test', desc: 'Taking aptitude test' },
  { id: 'TECH_INTERVIEW', step: 'Step 3', label: '3. Interview', desc: 'Video & phone round' },
  { id: 'OFFERED', step: 'Step 4', label: '4. Selected', desc: 'Job offer rolled out' },
];

function normalizeStage(stage) {
  if (stage === 'APPLIED' || stage === 'SHORTLISTED') return 'APPLIED';
  if (stage === 'ONLINE_ASSESSMENT') return 'ONLINE_ASSESSMENT';
  if (stage === 'TECH_INTERVIEW' || stage === 'HR_INTERVIEW') return 'TECH_INTERVIEW';
  if (stage === 'OFFERED' || stage === 'JOINED') return 'OFFERED';
  return 'APPLIED';
}

export default function DriveManagement({ 
  drives, 
  students, 
  tpos, 
  users, 
  currentRole, 
  onStartCall, 
  onCreateDrive, 
  onAddStudentsBatch,
  onUpdateCandidateStage,
  onDeleteStudent,
  onDeleteDrive,
  onClearAllDrives,
  onLoadDemoData,
  defaultTab = 'drives',
  hrPhoneNumber,
  onOpenPhoneConnectModal
}) {
  const [activeTab, setActiveTab] = useState(defaultTab); // 'drives' | 'pipeline'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'columns'
  const [selectedDriveId, setSelectedDriveId] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  
  // Independent Modals
  const [isCreateDriveOpen, setIsCreateDriveOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isManualStudentModalOpen, setIsManualStudentModalOpen] = useState(false);

  // New Drive Form state (All blank defaults for manual entry)
  const [driveTitle, setDriveTitle] = useState('');
  const [driveCollegeName, setDriveCollegeName] = useState('');
  const [driveCollegeId, setDriveCollegeId] = useState('');
  const [driveJobRole, setDriveJobRole] = useState('');
  const [driveCtc, setDriveCtc] = useState('');
  const [driveCriteria, setDriveCriteria] = useState('');
  const [driveDate, setDriveDate] = useState('');

  // Bulk Ingestion state (All blank defaults for manual entry)
  const [targetDriveForUpload, setTargetDriveForUpload] = useState(drives[0]?.id || '');
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [csvDriveTitle, setCsvDriveTitle] = useState('');
  const [csvCollegeName, setCsvCollegeName] = useState('');

  // Manual Single Student state (All blank defaults for manual entry)
  const [studentName, setStudentName] = useState('');
  const [studentRoll, setStudentRoll] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentBranch, setStudentBranch] = useState('');
  const [studentCgpa, setStudentCgpa] = useState('');
  const [studentStage, setStudentStage] = useState('APPLIED');
  const [manualDriveTitle, setManualDriveTitle] = useState('');
  const [manualCollegeName, setManualCollegeName] = useState('');

  // Derived effective target drive without cascading setState in effect
  const effectiveTargetDriveId = targetDriveForUpload && drives.some(d => d.id === targetDriveForUpload)
    ? targetDriveForUpload
    : (drives[0]?.id || '');

  const branches = Array.from(new Set(students.map(s => s.branch))).filter(Boolean);

  const driveStudents = selectedDriveId === 'ALL' 
    ? students 
    : students.filter(s => s.driveId === selectedDriveId);

  const filteredStudents = driveStudents.filter(s => {
    const matchesSearch = !searchTerm.trim() ||
      (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesBranch = branchFilter === 'ALL' || s.branch === branchFilter;
    return matchesSearch && matchesBranch;
  });

  const handleExportCsv = () => {
    if (filteredStudents.length === 0) return;
    const headers = ['Roll Number', 'Name', 'Email', 'Phone', 'Branch', 'CGPA', 'Stage', 'Drive', 'College'];
    const rows = filteredStudents.map(s => [
      s.rollNumber,
      `"${s.name}"`,
      s.email,
      s.phone,
      `"${s.branch}"`,
      s.cgpa,
      s.stage,
      `"${s.driveTitle || ''}"`,
      `"${s.collegeName || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Campus_Drive_Candidates_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/drive-board/${selectedDriveId !== 'ALL' ? selectedDriveId : 'public'}`;
    navigator.clipboard.writeText(url);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2500);
  };

  // Helper: gets existing selected drive or auto-creates one if none exist
  const getOrCreateDriveForStudent = (chosenDriveId, titleFallback, collegeFallback) => {
    const matched = drives.find(d => d.id === chosenDriveId);
    if (matched) return matched;
    if (drives.length > 0 && !chosenDriveId) return drives[0];

    const cleanTitle = (titleFallback && titleFallback.trim()) || 'Software Campus Drive';
    const cleanCollege = (collegeFallback && collegeFallback.trim()) || 'Engineering College';

    const newDrive = {
      id: `drv-${Date.now()}`,
      title: cleanTitle,
      collegeId: `col-${Date.now()}`,
      collegeName: cleanCollege,
      jobRole: 'Software Engineer',
      ctc: 'Competitive',
      criteria: 'Eligible candidates',
      driveDate: new Date().toISOString().split('T')[0],
      status: 'CONFIRMED',
      registeredStudents: 0,
      shortlistedStudents: 0,
      createdById: 'admin',
    };
    if (onCreateDrive) {
      onCreateDrive(newDrive);
    }
    return newDrive;
  };

  // 1. Create Drive Submit
  const handleCreateDriveSubmit = (e) => {
    e.preventDefault();
    if (!driveTitle.trim() || !driveCollegeName.trim()) return;

    const matchedTpo = tpos.find(t => t.collegeId === driveCollegeId);
    const resolvedCollege = driveCollegeName.trim() || (matchedTpo ? matchedTpo.collegeName : 'Engineering College');

    onCreateDrive({
      id: `drv-${Date.now()}`,
      title: driveTitle.trim(),
      collegeId: matchedTpo ? matchedTpo.collegeId : `col-${Date.now()}`,
      collegeName: resolvedCollege,
      jobRole: driveJobRole.trim() || 'Software Engineer',
      ctc: driveCtc.trim() || 'Competitive',
      criteria: driveCriteria.trim(),
      driveDate: driveDate || new Date().toISOString().split('T')[0],
      status: 'CONFIRMED',
      registeredStudents: 0,
      shortlistedStudents: 0,
      createdById: 'user-main-hr',
    });
    setIsCreateDriveOpen(false);
    setDriveTitle('');
    setDriveCollegeName('');
    setDriveJobRole('');
    setDriveCtc('');
    setDriveCriteria('');
    setDriveDate('');
  };

  // 2. Real CSV & Text Paste Parser
  const handleProcessCsvUpload = (e) => {
    e.preventDefault();
    if (!bulkCsvText.trim()) return;

    const targetDrive = getOrCreateDriveForStudent(effectiveTargetDriveId, csvDriveTitle, csvCollegeName);

    const lines = bulkCsvText.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const firstLineLower = lines[0].toLowerCase();
    const startIndex = (firstLineLower.includes('name') || firstLineLower.includes('roll')) ? 1 : 0;

    const parsedBatch = [];
    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length === 0 || !parts.some(Boolean)) continue;

      const name = parts[0] || `Student ${i}`;
      const rollNumber = parts[1] || `REG-${1000 + i}`;
      const email = parts[2] || `${name.toLowerCase().replace(/\s+/g, '.')}@campus.edu`;
      const phone = parts[3] || '';
      const branch = parts[4] || 'Engineering';
      const cgpa = parseFloat(parts[5]) || 0;

      parsedBatch.push({
        id: `stu-${Date.now()}-${i}`,
        driveId: targetDrive.id,
        driveTitle: targetDrive.title,
        collegeId: targetDrive.collegeId,
        collegeName: targetDrive.collegeName,
        name,
        rollNumber,
        email,
        phone,
        branch,
        cgpa,
        stage: 'APPLIED',
        internId: users.find(u => u.role === 'HR_INTERN')?.id || 'intern-1',
        notes: 'Imported via CSV/Text',
      });
    }

    if (parsedBatch.length > 0) {
      onAddStudentsBatch(parsedBatch);
    }
    setBulkCsvText('');
    setCsvDriveTitle('');
    setCsvCollegeName('');
    setIsCsvModalOpen(false);
  };

  // 3. Manual Single Student Submit
  const handleManualStudentSubmit = (e) => {
    e.preventDefault();
    if (!studentName.trim() || !studentRoll.trim()) return;

    const targetDrive = getOrCreateDriveForStudent(effectiveTargetDriveId, manualDriveTitle, manualCollegeName);

    const newStudent = {
      id: `stu-${Date.now()}`,
      driveId: targetDrive.id,
      driveTitle: targetDrive.title,
      collegeId: targetDrive.collegeId,
      collegeName: targetDrive.collegeName,
      name: studentName.trim(),
      rollNumber: studentRoll.trim(),
      email: studentEmail.trim() || `${studentName.trim().toLowerCase().replace(/\s+/g, '.')}@campus.edu`,
      phone: studentPhone.trim() || '',
      branch: studentBranch.trim() || 'General',
      cgpa: parseFloat(studentCgpa) || 0,
      stage: studentStage,
      internId: users.find(u => u.role === 'HR_INTERN')?.id || 'intern-1',
      notes: 'Manually added candidate',
    };

    onAddStudentsBatch([newStudent]);
    setIsManualStudentModalOpen(false);
    setStudentName('');
    setStudentRoll('');
    setStudentEmail('');
    setStudentPhone('');
    setStudentBranch('');
    setStudentCgpa('');
    setManualDriveTitle('');
    setManualCollegeName('');
  };

  return (
    <div>
      {/* Action Header Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '18px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Left Sub-tabs */}
        <div style={{ display: 'flex', gap: '6px', borderBottom: '2px solid transparent' }}>
          <button 
            onClick={() => setActiveTab('drives')}
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: activeTab === 'drives' ? '#ffffff' : 'transparent',
              border: '1px solid',
              borderColor: activeTab === 'drives' ? '#e2e8f0' : 'transparent',
              borderRadius: '8px',
              color: activeTab === 'drives' ? '#09090b' : '#71717a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Calendar size={14} /> Campus Drives ({drives.length})
          </button>

          <button 
            onClick={() => setActiveTab('pipeline')}
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: activeTab === 'pipeline' ? '#ffffff' : 'transparent',
              border: '1px solid',
              borderColor: activeTab === 'pipeline' ? '#e2e8f0' : 'transparent',
              borderRadius: '8px',
              color: activeTab === 'pipeline' ? '#09090b' : '#71717a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Users size={14} /> Candidate Roster & Pipeline ({students.length})
          </button>
        </div>

        {/* Right Distinct Action Buttons */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {activeTab === 'pipeline' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
              <button 
                onClick={() => setViewMode('table')}
                className={`role-btn ${viewMode === 'table' ? 'active' : ''}`}
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                title="Table list view"
              >
                <List size={12} /> Table
              </button>
              <button 
                onClick={() => setViewMode('columns')}
                className={`role-btn ${viewMode === 'columns' ? 'active' : ''}`}
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                title="4 column funnel view"
              >
                <LayoutGrid size={12} /> Funnel
              </button>
            </div>
          )}

          <button 
            onClick={() => {
              setIsManualStudentModalOpen(true);
              setIsCsvModalOpen(false);
              setIsCreateDriveOpen(false);
            }} 
            className="btn-secondary btn-black-sm"
            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
          >
            <UserPlus size={13} /> + Student
          </button>

          <button 
            onClick={() => {
              setIsCsvModalOpen(true);
              setIsManualStudentModalOpen(false);
              setIsCreateDriveOpen(false);
            }} 
            className="btn-secondary btn-black-sm"
            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
          >
            <Upload size={13} /> + CSV
          </button>

          <button 
            onClick={() => {
              setIsCreateDriveOpen(true);
              setIsManualStudentModalOpen(false);
              setIsCsvModalOpen(false);
            }} 
            className="btn-black btn-black-sm"
            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
          >
            <Plus size={13} /> + New Drive
          </button>
        </div>
      </div>

      {/* Filter and Action bar for Pipeline / Candidates */}
      {activeTab === 'pipeline' && (
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {drives.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#09090b' }}>Drive:</span>
                <select 
                  className="form-select"
                  value={selectedDriveId}
                  onChange={(e) => setSelectedDriveId(e.target.value)}
                  style={{ width: 'auto', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  <option value="ALL">All Drives ({drives.length} drives • {students.length} students)</option>
                  {drives.map(d => (
                    <option key={d.id} value={d.id}>{d.title} ({d.collegeName})</option>
                  ))}
                </select>
              </div>
            )}

            {branches.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#09090b' }}>Branch:</span>
                <select 
                  className="form-select"
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  style={{ width: 'auto', padding: '3px 8px', fontSize: '0.75rem' }}
                >
                  <option value="ALL">All Branches</option>
                  {branches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: '7px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '3px 8px 3px 24px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', width: '150px' }}
              />
            </div>

            {selectedDriveId !== 'ALL' && onDeleteDrive && (
              <button
                type="button"
                onClick={() => {
                  onDeleteDrive(selectedDriveId);
                  setSelectedDriveId('ALL');
                }}
                className="btn-secondary"
                style={{ color: '#ef4444', borderColor: '#fca5a5', fontSize: '0.72rem', padding: '2px 6px' }}
                title="Delete this selected drive"
              >
                <Trash2 size={11} /> Delete Drive
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button 
              type="button"
              onClick={handleExportCsv}
              className="btn-secondary btn-black-sm"
              style={{ fontSize: '0.72rem', padding: '3px 8px', gap: '4px' }}
              title="Download CSV roster"
              disabled={filteredStudents.length === 0}
            >
              <Download size={11} /> Export CSV
            </button>

            <button 
              type="button"
              onClick={handleCopyShareLink}
              className="btn-secondary btn-black-sm"
              style={{ fontSize: '0.72rem', padding: '3px 8px', gap: '4px' }}
              title="Copy shareable link"
            >
              {copiedShareLink ? <Check size={11} color="#16a34a" /> : <Share2 size={11} />}
              {copiedShareLink ? 'Copied Link!' : 'Share Board'}
            </button>

            {onClearAllDrives && drives.length > 0 && (
              <button
                type="button"
                onClick={onClearAllDrives}
                className="btn-secondary"
                style={{ color: '#ef4444', borderColor: '#fca5a5', fontSize: '0.72rem', padding: '3px 8px' }}
                title="Delete all campus recruitment drives"
              >
                <Trash2 size={11} /> Delete All ({drives.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* When no drives or students exist */}
      {drives.length === 0 && students.length === 0 && (
        <div className="content-card" style={{ padding: '60px 20px', textAlign: 'center', marginBottom: '20px' }}>
          <Building2 size={40} color="#a1a1aa" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#09090b', marginBottom: '6px' }}>
            No Campus Drives or Students Added Yet
          </h3>
          <p style={{ color: '#71717a', fontSize: '0.875rem', maxWidth: '440px', margin: '0 auto 20px' }}>
            Get started by creating a campus recruitment drive, adding an individual candidate, or pasting student rows.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {
                setIsCreateDriveOpen(true);
                setIsManualStudentModalOpen(false);
                setIsCsvModalOpen(false);
              }} 
              className="btn-black"
            >
              <Plus size={14} /> + Create Campus Drive
            </button>
            <button 
              onClick={() => {
                setIsManualStudentModalOpen(true);
                setIsCsvModalOpen(false);
                setIsCreateDriveOpen(false);
              }} 
              className="btn-secondary"
            >
              <UserPlus size={14} /> + Add Student
            </button>
            <button 
              onClick={() => {
                setIsCsvModalOpen(true);
                setIsManualStudentModalOpen(false);
                setIsCreateDriveOpen(false);
              }} 
              className="btn-secondary"
            >
              <Upload size={14} /> + Paste CSV
            </button>
          </div>
        </div>
      )}

      {/* Hiring Steps Tab (When items exist) */}
      {activeTab === 'pipeline' && (students.length > 0 || drives.length > 0) && (
        <>
          {viewMode === 'table' ? (
            <div className="content-card">
              <div className="card-header-row" style={{ padding: '14px 20px' }}>
                <div>
                  <h2 className="card-title" style={{ fontSize: '0.98rem' }}>
                    Candidate Roster ({filteredStudents.length})
                  </h2>
                  <p className="card-subtitle">
                    Select any student's step directly in the table or call them for interviews
                  </p>
                </div>
              </div>              <div className="desktop-only" style={{ width: '100%', overflowX: 'hidden' }}>
                <table className="crm-table" style={{ width: '100%', tableLayout: 'auto' }}>
                  <thead>
                    <tr>
                      <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Roll No</th>
                      <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Student Name</th>
                      <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>College</th>
                      <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Branch</th>
                      <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>CGPA</th>
                      <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Step</th>
                      <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Interview Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '28px', color: '#71717a', fontSize: '0.78rem' }}>
                          No students in this drive yet. Click "+ Student" or "+ CSV" above to add candidates.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(student => {
                        const currentStep = normalizeStage(student.stage);
                        return (
                          <tr key={student.id}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#09090b', fontSize: '0.78rem', padding: '6px 8px' }}>
                              {student.rollNumber}
                            </td>

                            <td style={{ padding: '6px 8px' }}>
                              <div style={{ fontWeight: 700, color: '#09090b', fontSize: '0.78rem' }}>
                                {student.name}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#52525b' }}>
                                {student.email}
                              </div>
                            </td>

                            <td style={{ fontSize: '0.75rem', fontWeight: 600, padding: '6px 8px' }}>
                              {student.collegeName}
                            </td>

                            <td style={{ fontSize: '0.75rem', padding: '6px 8px' }}>
                              {student.branch}
                            </td>

                            <td style={{ padding: '6px 8px' }}>
                              <span style={{ 
                                fontWeight: 700, 
                                background: '#f1f5f9', 
                                padding: '2px 5px', 
                                borderRadius: '4px', 
                                fontSize: '0.75rem'
                              }}>
                                {student.cgpa}
                              </span>
                            </td>

                            <td style={{ padding: '6px 8px' }}>
                              <select 
                                value={currentStep}
                                onChange={(e) => onUpdateCandidateStage(student.id, e.target.value)}
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  padding: '3px 6px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  background: currentStep === 'OFFERED' ? '#ecfdf5' : '#ffffff',
                                  color: currentStep === 'OFFERED' ? '#065f46' : '#09090b',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="APPLIED">1. Applied</option>
                                <option value="ONLINE_ASSESSMENT">2. Online Test</option>
                                <option value="TECH_INTERVIEW">3. Interview</option>
                                <option value="OFFERED">4. Selected</option>
                              </select>
                            </td>

                            <td>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <button 
                                  onClick={() => onStartCall({
                                    recipientType: 'STUDENT',
                                    recipientName: student.name,
                                    recipientDetail: `${student.branch} • ${student.phone} • ${student.collegeName}`,
                                    recipientPhone: student.phone,
                                    type: 'VIDEO',
                                    studentId: student.id,
                                    student
                                  })}
                                  className="btn-black btn-black-sm"
                                  style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                  title="Video interview on laptop"
                                >
                                  <Video size={12} /> Video
                                </button>

                                <button 
                                  onClick={() => onStartCall({
                                    recipientType: 'STUDENT',
                                    recipientName: student.name,
                                    recipientDetail: `${student.branch} • ${student.phone} • ${student.collegeName}`,
                                    recipientPhone: student.phone,
                                    type: 'AUDIO',
                                    studentId: student.id,
                                    student
                                  })}
                                  className="btn-secondary btn-black-sm"
                                  style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                  title="Phone call from HR mobile"
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
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile View: Clean Candidate Pipeline Cards */}
              <div className="mobile-only" style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredStudents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 12px', color: '#71717a', fontSize: '0.8rem' }}>
                    No candidates found. Tap "+ Add Student" above to add one.
                  </div>
                ) : (
                  filteredStudents.map(student => {
                    const currentStep = normalizeStage(student.stage);
                    return (
                      <div key={student.id} style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.925rem', color: '#09090b' }}>
                              {student.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#71717a' }}>
                              {student.rollNumber} • {student.branch}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#52525b' }}>
                              {student.collegeName}
                            </div>
                          </div>
                          <span style={{
                            fontWeight: 700,
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            color: '#09090b'
                          }}>
                            ⭐ {student.cgpa} CGPA
                          </span>
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          borderTop: '1px solid #e2e8f0',
                          paddingTop: '8px',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#71717a', fontWeight: 600 }}>Stage:</span>
                            <select
                              value={currentStep}
                              onChange={(e) => onUpdateCandidateStage(student.id, e.target.value)}
                              style={{
                                fontSize: '0.72rem',
                                padding: '2px 6px',
                                fontWeight: 700,
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                background: currentStep === 'OFFERED' ? '#ecfdf5' : '#ffffff',
                                color: currentStep === 'OFFERED' ? '#065f46' : '#09090b'
                              }}
                            >
                              <option value="APPLIED">1. Applied</option>
                              <option value="ONLINE_ASSESSMENT">2. Test</option>
                              <option value="TECH_INTERVIEW">3. Interview</option>
                              <option value="OFFERED">4. Selected</option>
                            </select>
                          </div>

                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
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
                              className="btn-black btn-black-sm"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
                            >
                              <Phone size={12} /> Call
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
                              className="btn-secondary btn-black-sm"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                            >
                              <Video size={12} /> Video
                            </button>

                            {onDeleteStudent && (
                              <button
                                onClick={() => onDeleteStudent(student.id)}
                                className="btn-icon"
                                style={{ width: '28px', height: '28px', color: '#ef4444' }}
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* 4 Columns View */
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
              gap: '14px',
              alignItems: 'start'
            }}>
              {HIRING_STAGES.map(stage => {
                const stageStudents = filteredStudents.filter(s => normalizeStage(s.stage) === stage.id);
                return (
                  <div key={stage.id} style={{ 
                    background: '#f8fafc', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '12px', 
                    padding: '14px',
                    minHeight: '380px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#09090b' }}>
                          {stage.label}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#71717a' }}>{stage.desc}</div>
                      </div>
                      <span style={{ 
                        background: '#ffffff', 
                        border: '1px solid #e2e8f0', 
                        fontWeight: 700, 
                        fontSize: '0.78rem', 
                        padding: '2px 8px', 
                        borderRadius: '10px' 
                      }}>
                        {stageStudents.length}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 350px)', paddingRight: '4px' }}>
                      {stageStudents.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px 8px', color: '#a1a1aa', fontSize: '0.78rem' }}>
                          No students in this step
                        </div>
                      ) : (
                        stageStudents.map(student => (
                          <div key={student.id} style={{ 
                            background: '#ffffff', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '10px', 
                            padding: '12px',
                            boxShadow: 'var(--shadow-sm)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#09090b' }}>
                                  {student.name}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#52525b' }}>
                                  {student.rollNumber} • {student.branch}
                                </div>
                              </div>
                              <span style={{ 
                                background: '#f1f5f9', 
                                padding: '1px 6px', 
                                borderRadius: '4px', 
                                fontSize: '0.72rem', 
                                fontWeight: 700, 
                                color: '#09090b' 
                              }}>
                                {student.cgpa}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '4px' }}>
                              {student.collegeName}
                            </div>

                            <div style={{ marginTop: '10px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <button 
                                onClick={() => onStartCall({
                                  recipientType: 'STUDENT',
                                  recipientName: student.name,
                                  recipientDetail: `${student.branch} • ${student.phone} • ${student.collegeName}`,
                                  recipientPhone: student.phone,
                                  type: 'VIDEO',
                                  studentId: student.id,
                                  student
                                })}
                                className="btn-black btn-black-sm"
                                style={{ padding: '3px 8px', fontSize: '0.72rem', flex: 1 }}
                              >
                                <Video size={11} /> Video
                              </button>

                              <button 
                                onClick={() => onStartCall({
                                  recipientType: 'STUDENT',
                                  recipientName: student.name,
                                  recipientDetail: `${student.branch} • ${student.phone} • ${student.collegeName}`,
                                  recipientPhone: student.phone,
                                  type: 'AUDIO',
                                  studentId: student.id,
                                  student
                                })}
                                className="btn-secondary btn-black-sm"
                                style={{ padding: '3px 6px' }}
                                title="Phone call from HR mobile"
                              >
                                <Phone size={11} />
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

                              <select 
                                value={stage.id}
                                onChange={(e) => onUpdateCandidateStage(student.id, e.target.value)}
                                style={{ 
                                  fontSize: '0.72rem', 
                                  padding: '3px 4px', 
                                  borderRadius: '5px', 
                                  border: '1px solid #cbd5e1',
                                  maxWidth: '90px'
                                }}
                              >
                                <option value="APPLIED">1. Applied</option>
                                <option value="ONLINE_ASSESSMENT">2. Test</option>
                                <option value="TECH_INTERVIEW">3. Interview</option>
                                <option value="OFFERED">4. Selected</option>
                              </select>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* All Drives Tab */}
      {activeTab === 'drives' && (
        <div className="content-card">
          <div className="card-header-row" style={{ padding: '14px 20px' }}>
            <div>
              <h2 className="card-title" style={{ fontSize: '0.98rem' }}>All Campus Drives ({drives.length})</h2>
              <p className="card-subtitle">Scheduled campus visits and hiring details</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {drives.length > 0 && onClearAllDrives && (
                <button 
                  type="button" 
                  onClick={onClearAllDrives} 
                  className="btn-secondary btn-black-sm"
                  style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                  title="Delete all campus recruitment drives"
                >
                  <Trash2 size={13} /> Delete All Drives ({drives.length})
                </button>
              )}
              <button onClick={() => setIsCreateDriveOpen(true)} className="btn-black btn-black-sm">
                <Plus size={13} /> + New Drive
              </button>
            </div>
          </div>

          <div className="desktop-only" style={{ width: '100%', overflowX: 'hidden' }}>
            <table className="crm-table" style={{ width: '100%', tableLayout: 'auto' }}>
              <thead>
                <tr>
                  <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Drive Name</th>
                  <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>College</th>
                  <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Role</th>
                  <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>CTC</th>
                  <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Date</th>
                  <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Status</th>
                  <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Candidates</th>
                  <th style={{ width: '30px', padding: '6px 4px' }}></th>
                </tr>
              </thead>
              <tbody>
                {drives.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '28px', color: '#71717a', fontSize: '0.78rem' }}>
                      No drives scheduled yet. Click "+ New Drive" to add your first campus drive.
                    </td>
                  </tr>
                ) : (
                  drives.map(drive => {
                    const driveCandidates = students.filter(s => s.driveId === drive.id);
                    return (
                      <tr key={drive.id}>
                        <td style={{ padding: '6px 8px' }}>
                          <div style={{ fontWeight: 700, color: '#09090b', fontSize: '0.8rem' }}>
                            {drive.title}
                          </div>
                        </td>

                        <td style={{ fontSize: '0.75rem', fontWeight: 600, padding: '6px 8px' }}>
                          {drive.collegeName}
                        </td>

                        <td style={{ fontSize: '0.75rem', padding: '6px 8px' }}>
                          {drive.jobRole}
                        </td>

                        <td style={{ padding: '6px 8px' }}>
                          <span style={{ fontWeight: 700, color: '#09090b', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {drive.ctc}
                          </span>
                        </td>

                        <td style={{ fontSize: '0.75rem', fontWeight: 600, padding: '6px 8px' }}>
                          {drive.driveDate || 'Upcoming'}
                        </td>

                        <td style={{ padding: '6px 8px' }}>
                          <span className={`badge ${drive.status === 'CONFIRMED' ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                            {drive.status}
                          </span>
                        </td>

                        <td style={{ padding: '6px 8px' }}>
                          <button 
                            onClick={() => {
                              setSelectedDriveId(drive.id);
                              setActiveTab('pipeline');
                            }}
                            className="btn-secondary btn-black-sm"
                            style={{ fontSize: '0.7rem', padding: '2px 7px', gap: '4px' }}
                            title="View and manage candidates in this drive"
                          >
                            <Users size={11} /> {driveCandidates.length} Students
                          </button>
                        </td>

                        <td style={{ padding: '6px 4px' }}>
                          {onDeleteDrive && (
                            <button 
                              onClick={() => onDeleteDrive(drive.id)}
                              className="btn-icon"
                              style={{ width: '22px', height: '22px', color: '#ef4444' }}
                              title="Delete campus drive"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View: Clean Campus Drive Cards */}
          <div className="mobile-only" style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', boxSizing: 'border-box' }}>
            {drives.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 10px', color: '#71717a', fontSize: '0.78rem' }}>
                No drives scheduled yet. Tap "+ New Drive" to add your first campus recruitment drive.
              </div>
            ) : (
              drives.map(drive => {
                const driveCandidates = students.filter(s => s.driveId === drive.id);
                return (
                  <div key={drive.id} style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.825rem', color: '#09090b' }}>
                          {drive.title}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#71717a' }}>
                          {drive.collegeName} • {drive.jobRole}
                        </div>
                      </div>
                      <span className={`badge ${drive.status === 'CONFIRMED' ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                        {drive.status}
                      </span>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      background: '#ffffff',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.7rem',
                      color: '#52525b'
                    }}>
                      <span>💰 {drive.ctc}</span>
                      <span>📅 {drive.driveDate || 'Upcoming'}</span>
                      <button
                        onClick={() => {
                          setSelectedDriveId(drive.id);
                          setActiveTab('pipeline');
                        }}
                        className="btn-secondary btn-black-sm"
                        style={{ padding: '2px 6px', fontSize: '0.68rem', gap: '3px' }}
                      >
                        <Users size={10} /> {driveCandidates.length} Students
                      </button>
                    </div>

                    {onDeleteDrive && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => onDeleteDrive(drive.id)}
                          className="btn-secondary btn-black-sm"
                          style={{ padding: '2px 6px', fontSize: '0.68rem', color: '#ef4444', borderColor: '#fca5a5', gap: '3px' }}
                        >
                          <Trash2 size={10} /> Delete Drive
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 1. Add Campus Drive Modal */}
      {isCreateDriveOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <span className="badge badge-black" style={{ marginBottom: '6px', fontSize: '0.7rem' }}>
                  NEW RECRUITMENT DRIVE
                </span>
                <h3 className="card-title">Create New Campus Drive</h3>
                <p className="card-subtitle">Schedule a campus recruitment drive with college and job role details</p>
              </div>
              <button onClick={() => setIsCreateDriveOpen(false)} className="btn-icon">
                <X size={15} />
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
                    value={driveTitle}
                    onChange={(e) => setDriveTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">College / University Name *</label>
                  {tpos.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <select 
                        className="form-select"
                        value={driveCollegeId}
                        onChange={(e) => setDriveCollegeId(e.target.value)}
                      >
                        <option value="">-- Choose from existing TPOs or type below --</option>
                        {tpos.map(t => (
                          <option key={t.collegeId} value={t.collegeId}>{t.collegeName}</option>
                        ))}
                      </select>
                      <input 
                        type="text"
                        className="form-input"
                        placeholder="Or enter a new college name..."
                        value={driveCollegeName}
                        onChange={(e) => setDriveCollegeName(e.target.value)}
                      />
                    </div>
                  ) : (
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="e.g. National Institute of Technology, Trichy"
                      value={driveCollegeName}
                      onChange={(e) => setDriveCollegeName(e.target.value)}
                      required
                    />
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Job Role *</label>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="e.g. Associate Software Engineer"
                      value={driveJobRole}
                      onChange={(e) => setDriveJobRole(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Package (CTC) *</label>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="e.g. 12.0 LPA"
                      value={driveCtc}
                      onChange={(e) => setDriveCtc(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Drive Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={driveDate}
                    onChange={(e) => setDriveDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsCreateDriveOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-black">
                  Create Campus Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Manual Single Student Modal */}
      {isManualStudentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <span className="badge badge-black" style={{ marginBottom: '6px', fontSize: '0.7rem' }}>
                  INDIVIDUAL CANDIDATE
                </span>
                <h3 className="card-title">Add Student Candidate</h3>
                <p className="card-subtitle">Enter a single candidate's academic and contact details</p>
              </div>
              <button onClick={() => setIsManualStudentModalOpen(false)} className="btn-icon">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleManualStudentSubmit}>
              <div className="modal-body">
                {drives.length > 0 ? (
                  <div className="form-group">
                    <label className="form-label">Target Campus Drive *</label>
                    <select 
                      className="form-select"
                      value={effectiveTargetDriveId}
                      onChange={(e) => setTargetDriveForUpload(e.target.value)}
                    >
                      {drives.map(d => (
                        <option key={d.id} value={d.id}>{d.title} ({d.collegeName})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '10px' }}>
                      💡 No campus drive created yet. Enter drive and college details to assign this candidate:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Drive Name *</label>
                        <input 
                          type="text"
                          className="form-input"
                          placeholder="e.g. Campus Drive 2026"
                          value={manualDriveTitle}
                          onChange={(e) => setManualDriveTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">College Name *</label>
                        <input 
                          type="text"
                          className="form-input"
                          placeholder="e.g. NIT Trichy"
                          value={manualCollegeName}
                          onChange={(e) => setManualCollegeName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Student Name *</label>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="e.g. Priya Sharma"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Roll Number / Student ID *</label>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="e.g. 106122045"
                      value={studentRoll}
                      onChange={(e) => setStudentRoll(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Phone / WhatsApp</label>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="e.g. +91 98401 22334"
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email"
                      className="form-input"
                      placeholder="e.g. priya@campus.edu"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
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
                      value={studentBranch}
                      onChange={(e) => setStudentBranch(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">CGPA / Percentage</label>
                    <input 
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="e.g. 8.50"
                      value={studentCgpa}
                      onChange={(e) => setStudentCgpa(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Hiring Step</label>
                  <select 
                    className="form-select"
                    value={studentStage}
                    onChange={(e) => setStudentStage(e.target.value)}
                  >
                    <option value="APPLIED">1. Applied</option>
                    <option value="ONLINE_ASSESSMENT">2. Online Test</option>
                    <option value="TECH_INTERVIEW">3. Interview</option>
                    <option value="OFFERED">4. Selected</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsManualStudentModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-black">
                  Save Student Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Bulk CSV / Paste Rows Modal */}
      {isCsvModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <span className="badge badge-black" style={{ marginBottom: '6px', fontSize: '0.7rem' }}>
                  BULK IMPORT
                </span>
                <h3 className="card-title">Paste Multiple Students (CSV / Sheets)</h3>
                <p className="card-subtitle">Paste spreadsheet rows copied from Excel or Google Sheets</p>
              </div>
              <button onClick={() => setIsCsvModalOpen(false)} className="btn-icon">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleProcessCsvUpload}>
              <div className="modal-body">
                {drives.length > 0 ? (
                  <div className="form-group">
                    <label className="form-label">Target Drive *</label>
                    <select 
                      className="form-select"
                      value={effectiveTargetDriveId}
                      onChange={(e) => setTargetDriveForUpload(e.target.value)}
                    >
                      {drives.map(d => (
                        <option key={d.id} value={d.id}>{d.title} ({d.collegeName})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '10px' }}>
                      💡 No campus drive created yet. Enter drive and college details to assign these imported rows:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Drive Name *</label>
                        <input 
                          type="text"
                          className="form-input"
                          placeholder="e.g. Campus Drive 2026"
                          value={csvDriveTitle}
                          onChange={(e) => setCsvDriveTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">College Name *</label>
                        <input 
                          type="text"
                          className="form-input"
                          placeholder="e.g. NIT Trichy"
                          value={csvCollegeName}
                          onChange={(e) => setCsvCollegeName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Paste Rows (Name, Roll, Email, Phone, Branch, CGPA) *</label>
                  <textarea 
                    rows={6}
                    className="form-textarea"
                    placeholder="Copy from Excel or Sheet and paste here...
Example format (tab or comma separated):
Aarav Patel	106122011	aarav@nitt.edu	+91 9840111223	CSE	8.85
Diya Sen	106122022	diya@nitt.edu	+91 9822033445	IT	9.10"
                    value={bulkCsvText}
                    onChange={(e) => setBulkCsvText(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsCsvModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-black">
                  Import Students from Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
