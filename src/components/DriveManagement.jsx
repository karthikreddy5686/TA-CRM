import React, { useState, useMemo } from 'react';
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
  Check,
  Globe,
  MapPin,
  AlertCircle,
  ArrowLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp
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
  onOpenPhoneConnectModal,
  onNavigateToLiveBoard
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
  const [driveMode, setDriveMode] = useState('Offline'); // 'Offline' | 'Online'
  const [driveCollegeName, setDriveCollegeName] = useState('');
  const [driveCollegeId, setDriveCollegeId] = useState('');
  const [driveJobRole, setDriveJobRole] = useState('CGA'); // CGA as primary default
  const [driveCtc, setDriveCtc] = useState('');
  const [driveCriteria, setDriveCriteria] = useState('');
  const [driveDate, setDriveDate] = useState('');

  // Drives Table Interactive Sorting State
  const [drivesSortField, setDrivesSortField] = useState('date');
  const [drivesSortDir, setDrivesSortDir] = useState('asc');

  const handleToggleSort = (field) => {
    if (drivesSortField === field) {
      setDrivesSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setDrivesSortField(field);
      setDrivesSortDir('asc');
    }
  };

  const sortedDrives = useMemo(() => {
    return [...drives].sort((a, b) => {
      let valA = '';
      let valB = '';
      if (drivesSortField === 'title') {
        valA = (a.title || '').toLowerCase();
        valB = (b.title || '').toLowerCase();
      } else if (drivesSortField === 'college') {
        valA = (a.collegeName || '').toLowerCase();
        valB = (b.collegeName || '').toLowerCase();
      } else if (drivesSortField === 'role') {
        valA = (a.jobRole || '').toLowerCase();
        valB = (b.jobRole || '').toLowerCase();
      } else if (drivesSortField === 'mode') {
        valA = (a.mode || '').toLowerCase();
        valB = (b.mode || '').toLowerCase();
      } else if (drivesSortField === 'ctc') {
        valA = parseFloat(a.ctc) || 0;
        valB = parseFloat(b.ctc) || 0;
        return drivesSortDir === 'asc' ? valA - valB : valB - valA;
      } else if (drivesSortField === 'date') {
        valA = a.driveDate || '';
        valB = b.driveDate || '';
      } else if (drivesSortField === 'status') {
        valA = (a.status || '').toLowerCase();
        valB = (b.status || '').toLowerCase();
      } else if (drivesSortField === 'candidates') {
        valA = students.filter(s => s.driveId === a.id).length;
        valB = students.filter(s => s.driveId === b.id).length;
        return drivesSortDir === 'asc' ? valA - valB : valB - valA;
      }
      return drivesSortDir === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [drives, students, drivesSortField, drivesSortDir]);

  // Confirmation Review Popup State
  const [isConfirmDriveOpen, setIsConfirmDriveOpen] = useState(false);
  const [pendingDriveData, setPendingDriveData] = useState(null);

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
  const [expandedCandidateIds, setExpandedCandidateIds] = useState({});
  const toggleCandidateExpand = (id) => {
    setExpandedCandidateIds(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const [expandedDriveIds, setExpandedDriveIds] = useState({});
  const toggleDriveExpand = (id) => {
    setExpandedDriveIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

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

  // Handle CTC input change
  const handleCtcChange = (e) => {
    setDriveCtc(e.target.value);
  };

  // Handle CTC input blur - auto append LPA by default after entering amount
  const handleCtcBlur = () => {
    if (!driveCtc.trim()) return;
    const clean = driveCtc.trim().replace(/\s*lpa$/i, '').trim();
    if (clean) {
      setDriveCtc(`${clean} LPA`);
    }
  };

  // 1. Create Drive Submit -> validates and opens review confirmation popup
  const handleCreateDriveSubmit = (e) => {
    e.preventDefault();
    const matchedTpo = tpos.find(t => t.collegeId === driveCollegeId || t.id === driveCollegeId);
    const resolvedCollege = driveCollegeName.trim() || (matchedTpo ? matchedTpo.collegeName : '');
    
    if (!driveTitle.trim() || !resolvedCollege) {
      alert('Please fill in both the Drive Title and College / University Name.');
      return;
    }

    // Format CTC with default LPA suffix
    let formattedCtc = driveCtc.trim();
    if (formattedCtc) {
      const cleanCtc = formattedCtc.replace(/\s*lpa$/i, '').trim();
      formattedCtc = `${cleanCtc} LPA`;
      setDriveCtc(formattedCtc);
    } else {
      formattedCtc = 'Competitive LPA';
    }

    const payload = {
      id: `drv-${Date.now()}`,
      title: driveTitle.trim(),
      mode: driveMode || 'Offline', // 'Offline' | 'Online'
      collegeId: matchedTpo ? (matchedTpo.collegeId || matchedTpo.id) : `col-${Date.now()}`,
      collegeName: resolvedCollege,
      jobRole: driveJobRole.trim() || 'CGA',
      ctc: formattedCtc,
      criteria: driveCriteria.trim(),
      driveDate: driveDate || new Date().toISOString().split('T')[0],
      status: 'CONFIRMED',
      registeredStudents: 0,
      shortlistedStudents: 0,
      createdById: 'user-main-hr',
      createdAt: new Date().toISOString()
    };

    setPendingDriveData(payload);
    setIsConfirmDriveOpen(true);
  };

  // Final confirmation to publish drive
  const handlePublishConfirmedDrive = () => {
    if (!pendingDriveData) return;

    if (onCreateDrive) {
      onCreateDrive(pendingDriveData);
    }

    setIsConfirmDriveOpen(false);
    setIsCreateDriveOpen(false);
    setPendingDriveData(null);

    // Reset Form
    setDriveTitle('');
    setDriveMode('Offline');
    setDriveCollegeName('');
    setDriveCollegeId('');
    setDriveJobRole('CGA');
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
        internId: users.find(u => u.role === 'HR_INTERN')?.id || users.find(u => u.role !== 'ADMIN')?.id || 'staff-assigned',
        internName: users.find(u => u.role === 'HR_INTERN')?.name || (users.find(u => u.role !== 'ADMIN')?.name || 'Staff Recruiter'),
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

    const activeStaff = users.find(u => u.role === 'HR_INTERN') || users.find(u => u.role !== 'ADMIN');
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
      internId: activeStaff ? activeStaff.id : 'staff-assigned',
      internName: activeStaff ? activeStaff.name : 'Staff Recruiter',
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
              background: activeTab === 'drives' ? '#154360' : '#ffffff',
              border: '1px solid',
              borderColor: activeTab === 'drives' ? '#0e2e42' : '#aed6f1',
              borderRadius: '8px',
              color: activeTab === 'drives' ? '#ffffff' : '#154360',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeTab === 'drives' ? '0 1px 3px rgba(21, 67, 96, 0.2)' : 'none'
            }}
          >
            <Calendar size={14} color={activeTab === 'drives' ? '#FFDB58' : '#154360'} /> Drives ({drives.length})
            {activeTab === 'drives' && (
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFDB58', marginLeft: '2px' }} />
            )}
          </button>

          <button 
            onClick={() => setActiveTab('pipeline')}
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: activeTab === 'pipeline' ? '#154360' : '#ffffff',
              border: '1px solid',
              borderColor: activeTab === 'pipeline' ? '#0e2e42' : '#aed6f1',
              borderRadius: '8px',
              color: activeTab === 'pipeline' ? '#ffffff' : '#154360',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeTab === 'pipeline' ? '0 1px 3px rgba(21, 67, 96, 0.2)' : 'none'
            }}
          >
            <Users size={14} color={activeTab === 'pipeline' ? '#FFDB58' : '#154360'} /> Candidate Pipeline ({students.length})
            {activeTab === 'pipeline' && (
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFDB58', marginLeft: '2px' }} />
            )}
          </button>
        </div>

        {/* Right Distinct Action Buttons */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {onNavigateToLiveBoard && (
            <button
              onClick={onNavigateToLiveBoard}
              className="btn-navy-outline btn-black-sm"
              style={{ fontSize: '0.75rem', padding: '4px 9px', gap: '4px' }}
              title="Go to Students board"
            >
              <Users size={12} color="#154360" /> Students ({students.length})
            </button>
          )}

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
              setIsCreateDriveOpen(true);
              setIsManualStudentModalOpen(false);
              setIsCsvModalOpen(false);
            }} 
            className="btn-mustard btn-black-sm"
            style={{ fontSize: '0.75rem', padding: '4px 10px', boxShadow: '0 1px 3px rgba(255, 219, 88, 0.4)' }}
          >
            <Plus size={13} color="#154360" /> New Drive
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

          </div>
        </div>
      )}

      {/* When no drives or students exist */}
      {drives.length === 0 && students.length === 0 && (
        <div className="content-card" style={{ padding: '60px 20px', textAlign: 'center', marginBottom: '20px' }}>
          <Building2 size={40} color="#a1a1aa" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#09090b', marginBottom: '6px' }}>
            No Drives or Students Added Yet
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
              <Plus size={14} /> Create Drive
            </button>
            <button 
              onClick={() => {
                setIsManualStudentModalOpen(true);
                setIsCsvModalOpen(false);
                setIsCreateDriveOpen(false);
              }} 
              className="btn-secondary"
            >
              <UserPlus size={14} /> Add Student
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

              {/* Mobile View: Clean Candidate Pipeline Cards (Click to expand details) */}
              <div className="mobile-only" style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredStudents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 12px', color: '#71717a', fontSize: '0.8rem' }}>
                    No candidates found. Tap "+ Add Student" above to add one.
                  </div>
                ) : (
                  filteredStudents.map(student => {
                    const isExpanded = !!expandedCandidateIds[student.id];
                    const currentStep = normalizeStage(student.stage);
                    return (
                      <div 
                        key={student.id} 
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: isExpanded ? '8px' : '0px',
                          boxShadow: isExpanded ? '0 2px 4px rgba(0,0,0,0.04)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Row 1: Clickable Name, CGPA & Chevron */}
                        <div 
                          onClick={() => toggleCandidateExpand(student.id)}
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
                          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#154360' }}>
                            {student.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontWeight: 700,
                              background: '#FFDB58',
                              border: '1px solid #fae27a',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              color: '#154360'
                            }}>
                              ⭐ {student.cgpa} CGPA
                            </span>
                            {isExpanded ? <ChevronUp size={15} color="#154360" /> : <ChevronDown size={15} color="#64748b" />}
                          </div>
                        </div>

                        {/* Expanded Body: Only shown after clicking on individual name */}
                        {isExpanded && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed #e2e8f0', paddingTop: '8px', marginTop: '4px' }}>
                            <div style={{ fontSize: '0.72rem', color: '#71717a' }}>
                              {student.rollNumber} • {student.branch} • {student.collegeName}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600 }}>
                              📞 {student.phone || 'No phone'}
                            </div>

                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              background: '#ffffff',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              flexWrap: 'wrap'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                                    background: currentStep === 'OFFERED' ? '#FFDB58' : '#ffffff',
                                    color: '#154360'
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
                                  className="btn-mustard btn-black-sm"
                                  style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
                                >
                                  <Phone size={12} color="#154360" /> Call
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
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                                >
                                  <Video size={12} color="#FFDB58" /> Video
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
                        )}
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
              <h2 className="card-title" style={{ fontSize: '0.98rem', color: '#154360', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={16} color="#154360" /> All Drives ({drives.length})
              </h2>
              <p className="card-subtitle">Scheduled campus visits and hiring details</p>
            </div>
          </div>

          <div className="desktop-only" style={{ width: '100%', overflowX: 'hidden' }}>
            <table className="crm-table" style={{ width: '100%', tableLayout: 'auto' }}>
              <thead>
                <tr>
                  <th onClick={() => handleToggleSort('title')} style={{ fontSize: '0.68rem', padding: '6px 8px', background: '#154360', color: '#ffffff', cursor: 'pointer', userSelect: 'none' }} title="Click to sort by Drive Name">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Drive Name
                      {drivesSortField === 'title' ? (drivesSortDir === 'asc' ? <ArrowUp size={11} color="#FFDB58" /> : <ArrowDown size={11} color="#FFDB58" />) : <ArrowUpDown size={11} style={{ opacity: 0.5 }} />}
                    </div>
                  </th>
                  <th onClick={() => handleToggleSort('mode')} style={{ fontSize: '0.68rem', padding: '6px 8px', background: '#154360', color: '#ffffff', cursor: 'pointer', userSelect: 'none' }} title="Click to sort by Mode">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Mode
                      {drivesSortField === 'mode' ? (drivesSortDir === 'asc' ? <ArrowUp size={11} color="#FFDB58" /> : <ArrowDown size={11} color="#FFDB58" />) : <ArrowUpDown size={11} style={{ opacity: 0.5 }} />}
                    </div>
                  </th>
                  <th onClick={() => handleToggleSort('college')} style={{ fontSize: '0.68rem', padding: '6px 8px', background: '#154360', color: '#ffffff', cursor: 'pointer', userSelect: 'none' }} title="Click to sort by College">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      College
                      {drivesSortField === 'college' ? (drivesSortDir === 'asc' ? <ArrowUp size={11} color="#FFDB58" /> : <ArrowDown size={11} color="#FFDB58" />) : <ArrowUpDown size={11} style={{ opacity: 0.5 }} />}
                    </div>
                  </th>
                  <th onClick={() => handleToggleSort('role')} style={{ fontSize: '0.68rem', padding: '6px 8px', background: '#154360', color: '#ffffff', cursor: 'pointer', userSelect: 'none' }} title="Click to sort by Role">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Role
                      {drivesSortField === 'role' ? (drivesSortDir === 'asc' ? <ArrowUp size={11} color="#FFDB58" /> : <ArrowDown size={11} color="#FFDB58" />) : <ArrowUpDown size={11} style={{ opacity: 0.5 }} />}
                    </div>
                  </th>
                  <th onClick={() => handleToggleSort('ctc')} style={{ fontSize: '0.68rem', padding: '6px 8px', background: '#154360', color: '#ffffff', whiteSpace: 'nowrap', minWidth: '90px', cursor: 'pointer', userSelect: 'none' }} title="Click to sort by CTC">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      CTC
                      {drivesSortField === 'ctc' ? (drivesSortDir === 'asc' ? <ArrowUp size={11} color="#FFDB58" /> : <ArrowDown size={11} color="#FFDB58" />) : <ArrowUpDown size={11} style={{ opacity: 0.5 }} />}
                    </div>
                  </th>
                  <th onClick={() => handleToggleSort('date')} style={{ fontSize: '0.68rem', padding: '6px 8px', background: '#154360', color: '#ffffff', cursor: 'pointer', userSelect: 'none' }} title="Click to sort by Date">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Date
                      {drivesSortField === 'date' ? (drivesSortDir === 'asc' ? <ArrowUp size={11} color="#FFDB58" /> : <ArrowDown size={11} color="#FFDB58" />) : <ArrowUpDown size={11} style={{ opacity: 0.5 }} />}
                    </div>
                  </th>
                  <th onClick={() => handleToggleSort('status')} style={{ fontSize: '0.68rem', padding: '6px 8px', background: '#154360', color: '#ffffff', cursor: 'pointer', userSelect: 'none' }} title="Click to sort by Status">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Status
                      {drivesSortField === 'status' ? (drivesSortDir === 'asc' ? <ArrowUp size={11} color="#FFDB58" /> : <ArrowDown size={11} color="#FFDB58" />) : <ArrowUpDown size={11} style={{ opacity: 0.5 }} />}
                    </div>
                  </th>
                  <th onClick={() => handleToggleSort('candidates')} style={{ fontSize: '0.68rem', padding: '6px 8px', background: '#154360', color: '#ffffff', cursor: 'pointer', userSelect: 'none' }} title="Click to sort by Candidates Count">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Candidates
                      {drivesSortField === 'candidates' ? (drivesSortDir === 'asc' ? <ArrowUp size={11} color="#FFDB58" /> : <ArrowDown size={11} color="#FFDB58" />) : <ArrowUpDown size={11} style={{ opacity: 0.5 }} />}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedDrives.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '28px', color: '#71717a', fontSize: '0.78rem' }}>
                      No drives scheduled yet. Click "New Drive" to add your first campus drive.
                    </td>
                  </tr>
                ) : (
                  sortedDrives.map(drive => {
                    const driveCandidates = students.filter(s => s.driveId === drive.id);
                    return (
                      <tr key={drive.id}>
                        <td style={{ padding: '6px 8px' }}>
                          <div style={{ fontWeight: 700, color: '#154360', fontSize: '0.8rem' }}>
                            {drive.title}
                          </div>
                        </td>

                        <td style={{ padding: '6px 8px' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: drive.mode === 'Online' ? '#e0f2fe' : '#f1f5f9',
                            color: drive.mode === 'Online' ? '#0369a1' : '#334155',
                            border: drive.mode === 'Online' ? '1px solid #bae6fd' : '1px solid #cbd5e1',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            {drive.mode === 'Online' ? <Globe size={11} color="#0369a1" /> : <MapPin size={11} color="#334155" />}
                            {drive.mode || 'Offline'}
                          </span>
                        </td>

                        <td style={{ fontSize: '0.75rem', fontWeight: 600, padding: '6px 8px' }}>
                          {drive.collegeName}
                        </td>

                        <td style={{ fontSize: '0.75rem', padding: '6px 8px' }}>
                          {drive.jobRole}
                        </td>

                        <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
                          <span style={{ 
                            fontWeight: 700, 
                            color: '#154360', 
                            background: '#FFDB58', 
                            border: '1px solid #fae27a', 
                            borderRadius: '4px', 
                            padding: '3px 8px', 
                            fontFamily: 'monospace', 
                            fontSize: '0.75rem',
                            whiteSpace: 'nowrap',
                            display: 'inline-block'
                          }}>
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
                              if (onNavigateToLiveBoard) {
                                onNavigateToLiveBoard(drive.id);
                              } else {
                                setSelectedDriveId(drive.id);
                                setActiveTab('pipeline');
                              }
                            }}
                            className="btn-navy-outline btn-black-sm"
                            style={{ fontSize: '0.7rem', padding: '2px 7px', gap: '4px' }}
                            title="View and manage candidates in this drive"
                          >
                            <Users size={11} color="#154360" /> {driveCandidates.length} Students
                          </button>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View: Clean Campus Drive Cards (Click to expand details) */}
          <div className="mobile-only" style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', boxSizing: 'border-box' }}>
            {drives.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 10px', color: '#71717a', fontSize: '0.78rem' }}>
                No drives scheduled yet. Tap "New Drive" to add your first campus recruitment drive.
              </div>
            ) : (
              drives.map(drive => {
                const driveCandidates = students.filter(s => s.driveId === drive.id);
                const isExpanded = !!expandedDriveIds[drive.id];
                return (
                  <div 
                    key={drive.id} 
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: isExpanded ? '6px' : '0px',
                      width: '100%',
                      boxSizing: 'border-box',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Row 1: Clickable Drive Title, Badge & Chevron */}
                    <div 
                      onClick={() => toggleDriveExpand(drive.id)}
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
                      <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#154360' }}>
                        {drive.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`badge ${drive.status === 'CONFIRMED' ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                          {drive.status}
                        </span>
                        {isExpanded ? <ChevronUp size={14} color="#154360" /> : <ChevronDown size={14} color="#64748b" />}
                      </div>
                    </div>

                    {/* Expanded Body: Only shown after clicking */}
                    {isExpanded && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px dashed #e2e8f0', paddingTop: '6px', marginTop: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '0.72rem', color: '#71717a' }}>
                            {drive.collegeName} • {drive.jobRole}
                          </div>
                          <span style={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: drive.mode === 'Online' ? '#e0f2fe' : '#f1f5f9',
                            color: drive.mode === 'Online' ? '#0369a1' : '#475569',
                            border: drive.mode === 'Online' ? '1px solid #bae6fd' : '1px solid #cbd5e1',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}>
                            {drive.mode === 'Online' ? <Globe size={9} /> : <MapPin size={9} />}
                            {drive.mode || 'Offline'}
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
                          <span style={{ 
                            background: '#FFDB58', 
                            color: '#154360', 
                            fontWeight: 700, 
                            padding: '1px 6px', 
                            borderRadius: '4px',
                            border: '1px solid #fae27a'
                          }}>💰 {drive.ctc}</span>
                          <span>📅 {drive.driveDate || 'Upcoming'}</span>
                          <button
                            onClick={() => {
                              if (onNavigateToLiveBoard) {
                                onNavigateToLiveBoard(drive.id);
                              } else {
                                setSelectedDriveId(drive.id);
                                setActiveTab('pipeline');
                              }
                            }}
                            className="btn-navy-outline btn-black-sm"
                            style={{ padding: '2px 6px', fontSize: '0.68rem', gap: '3px' }}
                          >
                            <Users size={10} color="#154360" /> {driveCandidates.length} Students
                          </button>
                        </div>
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
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-card" style={{ maxWidth: '560px', width: '92%' }}>
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
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* 1. Drive Title */}
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

                {/* 2. Drive Mode */}
                <div className="form-group">
                  <label className="form-label">Drive Mode *</label>
                  <select 
                    className="form-select"
                    value={driveMode || 'Offline'}
                    onChange={(e) => setDriveMode(e.target.value)}
                    required
                  >
                    <option value="Offline">Offline (On-Campus)</option>
                    <option value="Online">Online (Virtual Drive)</option>
                  </select>
                </div>

                {/* 3. College / University Name */}
                <div className="form-group">
                  <label className="form-label">College / University Name *</label>
                  {tpos.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <select 
                        className="form-select"
                        value={driveCollegeId}
                        onChange={(e) => {
                          const selId = e.target.value;
                          setDriveCollegeId(selId);
                          const matched = tpos.find(t => t.collegeId === selId || t.id === selId);
                          if (matched) {
                            setDriveCollegeName(matched.collegeName);
                          }
                        }}
                      >
                        <option value="">-- Choose from existing TPOs or type below --</option>
                        {tpos.map(t => (
                          <option key={t.collegeId || t.id} value={t.collegeId || t.id}>
                            {t.collegeName} ({t.name})
                          </option>
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

                {/* 4. Job Role (Choose CGA, Digital Marketing, HR Operations, IT or type below) & Package (in LPA) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Job Role */}
                  <div className="form-group">
                    <label className="form-label">Job Title / Role *</label>
                    <select 
                      className="form-select"
                      value={driveJobRole || 'CGA'}
                      onChange={(e) => setDriveJobRole(e.target.value)}
                      required
                    >
                      <option value="CGA">CGA</option>
                      <option value="Digital Marketing">Digital Marketing</option>
                      <option value="HR Operations">HR Operations</option>
                      <option value="IT">IT</option>
                    </select>
                  </div>

                  {/* Package (CTC) with default LPA */}
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Package (CTC) *</span>
                      <span style={{ fontSize: '0.65rem', color: '#154360', fontWeight: 700 }}>
                        Default in LPA
                      </span>
                    </label>

                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text"
                        className="form-input"
                        placeholder="e.g. 6.0"
                        value={driveCtc}
                        onChange={handleCtcChange}
                        onBlur={handleCtcBlur}
                        style={{ paddingRight: '48px' }}
                        required
                      />
                      <span style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#154360',
                        background: '#FFDB58',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        pointerEvents: 'none'
                      }}>
                        LPA
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Drive Date */}
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

      {/* Confirmation Review Popup before publishing drive */}
      {isConfirmDriveOpen && pendingDriveData && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-card" style={{ maxWidth: '520px', width: '92%', borderTop: '4px solid #154360' }}>
            <div className="modal-header">
              <div>
                <span className="badge badge-black" style={{ marginBottom: '6px', fontSize: '0.7rem' }}>
                  CONFIRMATION REQUIRED
                </span>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color="#154360" /> Confirm Campus Drive Details
                </h3>
                <p className="card-subtitle">
                  Please review the entered details carefully before publishing this campus recruitment drive.
                </p>
              </div>
              <button onClick={() => setIsConfirmDriveOpen(false)} className="btn-icon">
                <X size={15} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                {/* Drive Title Banner */}
                <div style={{
                  background: '#154360',
                  color: '#ffffff',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#FFDB58', fontWeight: 600, textTransform: 'uppercase' }}>
                      Drive Title
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                      {pendingDriveData.title}
                    </div>
                  </div>
                  <span style={{
                    background: pendingDriveData.mode === 'Online' ? '#0284c7' : '#059669',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {pendingDriveData.mode === 'Online' ? <Globe size={12} /> : <MapPin size={12} />}
                    {pendingDriveData.mode || 'Offline'}
                  </span>
                </div>

                {/* Details Summary */}
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>College / University:</span>
                    <span style={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: 700 }}>{pendingDriveData.collegeName}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>Job Title / Role:</span>
                    <span style={{ fontSize: '0.82rem', color: '#154360', fontWeight: 700, background: '#eff6ff', padding: '2px 8px', borderRadius: '4px' }}>
                      {pendingDriveData.jobRole}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>Package (CTC):</span>
                    <span style={{ 
                      fontSize: '0.85rem', 
                      color: '#154360', 
                      fontWeight: 800, 
                      background: '#FFDB58', 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      border: '1px solid #fae27a',
                      fontFamily: 'monospace'
                    }}>
                      {pendingDriveData.ctc}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>Drive Mode:</span>
                    <span style={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: 600 }}>
                      {pendingDriveData.mode === 'Online' ? '🌐 Online (Virtual Drive)' : '🏢 Offline (On-Campus)'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>Drive Date:</span>
                    <span style={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: 600 }}>
                      {pendingDriveData.driveDate || 'Upcoming'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>Initial Status:</span>
                    <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>CONFIRMED</span>
                  </div>
                </div>
              </div>

              <div style={{
                background: '#fefce8',
                border: '1px solid #fef08a',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.75rem',
                color: '#854d0e',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} color="#854d0e" style={{ flexShrink: 0 }} />
                <span>
                  Ready to publish. Clicking <strong>"Confirm & Publish Drive"</strong> will post this recruitment drive to the CRM and make it active.
                </span>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button 
                type="button" 
                onClick={() => setIsConfirmDriveOpen(false)} 
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={14} /> Back to Edit
              </button>
              <button 
                type="button" 
                onClick={handlePublishConfirmedDrive} 
                className="btn-black"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  background: '#154360',
                  color: '#ffffff',
                  boxShadow: '0 2px 6px rgba(21, 67, 96, 0.35)'
                }}
              >
                <CheckCircle2 size={15} color="#FFDB58" /> Confirm & Publish Drive
              </button>
            </div>
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
