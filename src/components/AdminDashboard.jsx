import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Calendar, 
  Building2, 
  Clock, 
  PhoneCall, 
  Plus, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Briefcase, 
  Phone, 
  Video, 
  FileSpreadsheet,
  Layers,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Smartphone,
  QrCode,
  RefreshCw
} from 'lucide-react';
import { formatDuration } from '../data/mockData';
import { normalizePhoneNumber } from '../utils/phone';

export default function AdminDashboard({
  users = [],
  drives = [],
  students = [],
  tpos = [],
  followUps = [],
  callSessions = [],
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAddDrive,
  onUpdateDrive,
  onDeleteDrive,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onAddTpo,
  onUpdateTpo,
  onDeleteTpo,
  onAddFollowUp,
  onUpdateFollowUp,
  onDeleteFollowUp,
  onAddCallSession,
  onUpdateCallSession,
  onDeleteCallSession,
  onStartCall,
  onSelectTab,
  onLoadDemoData,
  defaultTab = 'staff'
}) {
  const [activeAdminTab, setActiveAdminTab] = useState(defaultTab); // 'staff' | 'drives' | 'students' | 'tpos' | 'followups' | 'calls'
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'MAIN_HR', // 'MAIN_HR' | 'HR_INTERN'
    title: '',
    dailyTargetHours: 3.5,
    dailyTargetLeads: 20
  });

  const [networkUrl, setNetworkUrl] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `${window.location.protocol}//${window.location.host}/`;
    }
    return 'http://192.168.29.254:5174/';
  });
  const [showMobileQr, setShowMobileQr] = useState(false);
  const [isSyncingServer, setIsSyncingServer] = useState(false);

  React.useEffect(() => {
    fetch('/api/network-info')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.networkUrl) setNetworkUrl(d.networkUrl);
      })
      .catch(() => {});
  }, []);

  const handleForceServerSync = async () => {
    setIsSyncingServer(true);
    try {
      await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users, drives, students, tpos, followUps })
      });
      showNotification('Successfully synced all employees and CRM data to central server!');
    } catch {
      showNotification('Could not connect to server for sync.', 'error');
    } finally {
      setIsSyncingServer(false);
    }
  };

  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [editingDrive, setEditingDrive] = useState(null);
  const [driveFormData, setDriveFormData] = useState({
    title: '',
    collegeName: '',
    jobRole: 'Graduate Software Engineer 2026',
    ctc: '14.0 LPA',
    criteria: 'B.Tech/BE with CGPA >= 7.0',
    driveDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: 'CONFIRMED'
  });

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentFormData, setStudentFormData] = useState({
    name: '',
    collegeName: '',
    rollNumber: '',
    branch: 'Computer Science',
    cgpa: '8.5',
    email: '',
    phone: '',
    stage: 'APPLIED',
    driveId: ''
  });

  const [isTpoModalOpen, setIsTpoModalOpen] = useState(false);
  const [editingTpo, setEditingTpo] = useState(null);
  const [tpoFormData, setTpoFormData] = useState({
    name: '',
    collegeName: '',
    email: '',
    phone: '',
    designation: 'Head - Training & Placement',
    status: 'LEAD',
    assignedInternId: ''
  });

  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [followUpFormData, setFollowUpFormData] = useState({
    entityTitle: '',
    entityType: 'TPO',
    scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    priority: 'HIGH',
    status: 'PENDING',
    notes: '',
    internId: '',
    internName: ''
  });

  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [editingCall, setEditingCall] = useState(null);
  const [callFormData, setCallFormData] = useState({
    internName: users.find(u => u.role !== 'ADMIN')?.name || 'Staff Recruiter',
    recipientName: '',
    recipientType: 'TPO',
    durationSeconds: 120,
    outcome: 'CONNECTED',
    notes: 'Outreach call regarding upcoming drive slot.'
  });

  // Flash message helper
  const showNotification = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Copy helper
  const handleCopyText = (text, key) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showNotification(`Copied credentials to clipboard!`);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Toggle password visibility
  const toggleShowPassword = (userId) => {
    setShowPasswordMap(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  // ---------------- User Management Handlers ----------------
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserFormData({
      name: '',
      email: '',
      password: `hr@${Math.random().toString(36).slice(-5)}`,
      role: 'MAIN_HR',
      title: 'Talent Acquisition Manager',
      dailyTargetHours: 3.5,
      dailyTargetLeads: 20
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name || '',
      email: user.email || '',
      password: user.password || '',
      role: user.role || 'HR_INTERN',
      title: user.title || '',
      dailyTargetHours: user.dailyTargetHours || 3.5,
      dailyTargetLeads: user.dailyTargetLeads || 20
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    const cleanName = userFormData.name.trim();
    const rawEmail = userFormData.email.trim();
    const cleanPass = userFormData.password.trim();
    if (!rawEmail || !cleanPass || !cleanName) return;

    const cleanEmail = rawEmail.toLowerCase();
    const cleanUsername = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;

    if (editingUser) {
      const updated = {
        ...editingUser,
        name: cleanName,
        email: cleanEmail,
        username: cleanUsername,
        password: cleanPass,
        role: userFormData.role,
        title: userFormData.title.trim() || (userFormData.role === 'MAIN_HR' ? 'HR Manager' : 'Recruitment Intern'),
        dailyTargetHours: parseFloat(userFormData.dailyTargetHours) || 3.5,
        dailyTargetLeads: parseInt(userFormData.dailyTargetLeads) || 20
      };
      setIsUserModalOpen(false);
      const ok = await onUpdateUser?.(updated);
      if (ok !== false) {
        showNotification(`Updated credentials for ${cleanName}! Synced across devices.`);
      } else {
        showNotification(`Saved locally, but PC server unreachable. Ensure phone is on same Wi-Fi.`, 'error');
      }
    } else {
      const newUser = {
        id: `${userFormData.role === 'MAIN_HR' ? 'hr' : 'intern'}-${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        username: cleanUsername,
        password: cleanPass,
        role: userFormData.role,
        title: userFormData.title.trim() || (userFormData.role === 'MAIN_HR' ? 'HR Manager' : 'Recruitment Intern'),
        avatar: userFormData.role === 'MAIN_HR' ? 'HR' : 'IN',
        status: 'online',
        dailyTargetHours: parseFloat(userFormData.dailyTargetHours) || 3.5,
        dailyTargetLeads: parseInt(userFormData.dailyTargetLeads) || 20
      };
      setIsUserModalOpen(false);
      const ok = await onAddUser?.(newUser);
      if (ok !== false) {
        showNotification(`Successfully provisioned account for ${cleanName}! Ready to log in.`);
      } else {
        showNotification(`Saved locally, but PC server unreachable. Ensure phone is on same Wi-Fi.`, 'error');
      }
    }
  };

  // ---------------- Campus Drives Handlers ----------------
  const handleOpenAddDrive = () => {
    setEditingDrive(null);
    setDriveFormData({
      title: '',
      collegeName: '',
      jobRole: 'Graduate Software Engineer 2026',
      ctc: '14.0 LPA',
      criteria: 'B.Tech/BE with CGPA >= 7.0',
      driveDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'CONFIRMED'
    });
    setIsDriveModalOpen(true);
  };

  const handleOpenEditDrive = (drive) => {
    setEditingDrive(drive);
    setDriveFormData({
      title: drive.title || '',
      collegeName: drive.collegeName || '',
      jobRole: drive.jobRole || '',
      ctc: drive.ctc || '',
      criteria: drive.criteria || '',
      driveDate: drive.driveDate || '',
      status: drive.status || 'CONFIRMED'
    });
    setIsDriveModalOpen(true);
  };

  const handleSaveDrive = (e) => {
    e.preventDefault();
    if (!driveFormData.title.trim() || !driveFormData.collegeName.trim()) return;

    if (editingDrive) {
      onUpdateDrive({
        ...editingDrive,
        title: driveFormData.title.trim(),
        collegeName: driveFormData.collegeName.trim(),
        jobRole: driveFormData.jobRole.trim(),
        ctc: driveFormData.ctc.trim(),
        criteria: driveFormData.criteria.trim(),
        driveDate: driveFormData.driveDate,
        status: driveFormData.status
      });
      showNotification(`Updated campus drive "${driveFormData.title}"!`);
    } else {
      const newDrive = {
        id: `drv-${Date.now()}`,
        title: driveFormData.title.trim(),
        collegeId: `col-${Date.now()}`,
        collegeName: driveFormData.collegeName.trim(),
        jobRole: driveFormData.jobRole.trim(),
        ctc: driveFormData.ctc.trim(),
        criteria: driveFormData.criteria.trim(),
        driveDate: driveFormData.driveDate,
        status: driveFormData.status,
        registeredStudents: 0,
        shortlistedStudents: 0
      };
      onAddDrive(newDrive);
      showNotification(`Posted new campus drive "${newDrive.title}"!`);
    }
    setIsDriveModalOpen(false);
  };

  // ---------------- Student Handlers ----------------
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setStudentFormData({
      name: '',
      collegeName: drives[0]?.collegeName || '',
      rollNumber: `CS26-${Math.floor(100 + Math.random() * 900)}`,
      branch: 'Computer Science',
      cgpa: '8.4',
      email: '',
      phone: '',
      stage: 'APPLIED',
      driveId: drives[0]?.id || ''
    });
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student) => {
    setEditingStudent(student);
    setStudentFormData({
      name: student.name || '',
      collegeName: student.collegeName || '',
      rollNumber: student.rollNumber || '',
      branch: student.branch || '',
      cgpa: student.cgpa || '',
      email: student.email || '',
      phone: student.phone || '',
      stage: student.stage || 'APPLIED',
      driveId: student.driveId || ''
    });
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (!studentFormData.name.trim() || !studentFormData.phone.trim()) return;

    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        ...studentFormData,
        name: studentFormData.name.trim()
      });
      showNotification(`Updated candidate ${studentFormData.name}!`);
    } else {
      const newStd = {
        id: `std-${Date.now()}`,
        ...studentFormData,
        name: studentFormData.name.trim()
      };
      onAddStudent([newStd]);
      showNotification(`Posted student candidate ${newStd.name}!`);
    }
    setIsStudentModalOpen(false);
  };

  // ---------------- TPO Handlers ----------------
  const handleOpenAddTpo = () => {
    setEditingTpo(null);
    setTpoFormData({
      name: '',
      collegeName: '',
      email: '',
      phone: '',
      designation: 'Head - Training & Placement',
      status: 'LEAD',
      assignedInternId: users.find(u => u.role === 'HR_INTERN')?.id || ''
    });
    setIsTpoModalOpen(true);
  };

  const handleOpenEditTpo = (tpo) => {
    setEditingTpo(tpo);
    setTpoFormData({
      name: tpo.name || '',
      collegeName: tpo.collegeName || '',
      email: tpo.email || '',
      phone: tpo.phone || '',
      designation: tpo.designation || '',
      status: tpo.status || 'LEAD',
      assignedInternId: tpo.assignedInternId || ''
    });
    setIsTpoModalOpen(true);
  };

  const handleSaveTpo = (e) => {
    e.preventDefault();
    if (!tpoFormData.name.trim() || !tpoFormData.collegeName.trim() || !tpoFormData.phone.trim()) return;

    if (editingTpo) {
      onUpdateTpo({
        ...editingTpo,
        ...tpoFormData,
        name: tpoFormData.name.trim(),
        collegeName: tpoFormData.collegeName.trim()
      });
      showNotification(`Updated TPO contact ${tpoFormData.name}!`);
    } else {
      const newT = {
        id: `tpo-${Date.now()}`,
        ...tpoFormData,
        name: tpoFormData.name.trim(),
        collegeName: tpoFormData.collegeName.trim()
      };
      onAddTpo(newT);
      showNotification(`Posted college TPO lead ${newT.name}!`);
    }
    setIsTpoModalOpen(false);
  };

  // ---------------- Follow-Up Handlers ----------------
  const handleOpenAddFollowUp = () => {
    setEditingFollowUp(null);
    const firstStaff = users.find(u => u.role !== 'ADMIN') || users[0];
    setFollowUpFormData({
      entityTitle: tpos[0]?.name ? `${tpos[0].name} (${tpos[0].collegeName})` : 'New Outreach Call',
      entityType: 'TPO',
      scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      priority: 'HIGH',
      status: 'PENDING',
      notes: 'Outreach follow up regarding campus hiring proposal.',
      internId: firstStaff ? firstStaff.id : '',
      internName: firstStaff ? firstStaff.name : 'Staff Recruiter'
    });
    setIsFollowUpModalOpen(true);
  };

  const handleOpenEditFollowUp = (fup) => {
    setEditingFollowUp(fup);
    setFollowUpFormData({
      entityTitle: fup.entityTitle || '',
      entityType: fup.entityType || 'TPO',
      scheduledDate: fup.scheduledDate || '',
      priority: fup.priority || 'MEDIUM',
      status: fup.status || 'PENDING',
      notes: fup.notes || '',
      internId: fup.internId || (users.find(u => u.role !== 'ADMIN')?.id || ''),
      internName: fup.internName || (users.find(u => u.role !== 'ADMIN')?.name || 'Staff Recruiter')
    });
    setIsFollowUpModalOpen(true);
  };

  const handleSaveFollowUp = (e) => {
    e.preventDefault();
    if (!followUpFormData.entityTitle.trim()) return;

    const assignedStaff = users.find(u => u.id === followUpFormData.internId) || users.find(u => u.role !== 'ADMIN');
    const staffId = assignedStaff ? assignedStaff.id : (followUpFormData.internId || 'staff-assigned');
    const staffName = assignedStaff ? assignedStaff.name : (followUpFormData.internName || 'Staff Recruiter');

    if (editingFollowUp) {
      onUpdateFollowUp({
        ...editingFollowUp,
        ...followUpFormData,
        entityTitle: followUpFormData.entityTitle.trim(),
        internId: staffId,
        internName: staffName
      });
      showNotification(`Updated follow-up!`);
    } else {
      const newF = {
        id: `fup-${Date.now()}`,
        ...followUpFormData,
        entityTitle: followUpFormData.entityTitle.trim(),
        internId: staffId,
        internName: staffName
      };
      onAddFollowUp(newF);
      showNotification(`Posted new scheduled follow-up!`);
    }
    setIsFollowUpModalOpen(false);
  };

  // ---------------- Call Log Handlers ----------------
  const handleOpenAddCall = () => {
    setEditingCall(null);
    const firstStaff = users.find(u => u.role !== 'ADMIN') || users[0];
    setCallFormData({
      internName: firstStaff ? firstStaff.name : 'Staff Recruiter',
      recipientName: tpos[0]?.name || 'Placement Officer',
      recipientType: 'TPO',
      durationSeconds: 180,
      outcome: 'CONNECTED',
      notes: 'Discussed recruitment dates and shortlist criteria.'
    });
    setIsCallModalOpen(true);
  };

  const handleOpenEditCall = (call) => {
    setEditingCall(call);
    setCallFormData({
      internName: call.internName || '',
      recipientName: call.recipientName || '',
      recipientType: call.recipientType || 'TPO',
      durationSeconds: call.durationSeconds || 60,
      outcome: call.outcome || 'CONNECTED',
      notes: call.notes || ''
    });
    setIsCallModalOpen(true);
  };

  const handleSaveCall = (e) => {
    e.preventDefault();
    if (!callFormData.recipientName.trim()) return;

    if (editingCall) {
      onUpdateCallSession({
        ...editingCall,
        ...callFormData,
        durationSeconds: parseInt(callFormData.durationSeconds) || 60
      });
      showNotification(`Updated call record!`);
    } else {
      const newCall = {
        id: `call-${Date.now()}`,
        ...callFormData,
        durationSeconds: parseInt(callFormData.durationSeconds) || 60,
        type: 'AUDIO',
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString()
      };
      onAddCallSession(newCall);
      showNotification(`Logged new call record!`);
    }
    setIsCallModalOpen(false);
  };

  // Filtered lists
  const hrStaffList = users.filter(u => u.role !== 'ADMIN');
  const totalCallSeconds = callSessions.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Toast Notification */}
      {feedbackMsg && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: '#154360',
          color: '#ffffff',
          padding: '12px 18px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.875rem',
          fontWeight: 600,
          border: '1px solid #FFDB58'
        }}>
          <CheckCircle2 size={18} color="#FFDB58" />
          {feedbackMsg}
        </div>
      )}

      {/* Admin Master Header Banner */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-navy-subtle" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} color="#154360" /> Geonixa Admin Control
            </span>
            <span style={{ fontSize: '0.72rem', color: '#71717a' }}>• Master Authority & Provisioning</span>
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#154360', letterSpacing: '-0.02em', margin: 0 }}>
            Admin Master Dashboard
          </h1>
          <p style={{ color: '#52525b', fontSize: '0.85rem', marginTop: '4px', maxWidth: '650px' }}>
            Provision login credentials for HR Managers & HR Interns, edit details across all CRM sections, and post new records.
          </p>
        </div>

        {/* Global Quick Post Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            type="button" 
            onClick={handleOpenAddUser}
            className="btn-mustard btn-black-sm"
            style={{ fontWeight: 800 }}
            title="Provision a new HR or Intern account with login credentials"
          >
            <Key size={14} color="#154360" /> Add HR / Intern
          </button>

          <button 
            type="button" 
            onClick={handleOpenAddDrive}
            className="btn-secondary btn-black-sm"
            title="Post a new campus recruitment drive"
          >
            <Plus size={14} /> Post Drive
          </button>

          <button 
            type="button" 
            onClick={handleOpenAddStudent}
            className="btn-secondary btn-black-sm"
            title="Post a new candidate to the student pipeline"
          >
            <UserPlus size={14} /> Post Student
          </button>

          <button 
            type="button" 
            onClick={handleOpenAddTpo}
            className="btn-secondary btn-black-sm"
            title="Post a new college placement officer lead"
          >
            <Building2 size={14} /> Post TPO
          </button>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="metrics-grid">
        <div className="metric-card" onClick={() => setActiveAdminTab('staff')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-title">HR Staff Accounts</span>
            <div className="metric-icon-box" style={{ background: '#ebf5fb', borderColor: '#aed6f1' }}>
              <Users size={18} color="#154360" />
            </div>
          </div>
          <div className="metric-value">{hrStaffList.length}</div>
          <div className="metric-subtext">
            <span>{users.filter(u => u.role === 'MAIN_HR').length} HR Managers • {users.filter(u => u.role === 'HR_INTERN').length} Interns</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => setActiveAdminTab('drives')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-title">Drives</span>
            <div className="metric-icon-box" style={{ background: '#fffdf0', borderColor: '#fae27a' }}>
              <Calendar size={18} color="#154360" />
            </div>
          </div>
          <div className="metric-value">{drives.length}</div>
          <div className="metric-subtext">
            <span>Scheduled campus drives</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => setActiveAdminTab('students')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-title">Students</span>
            <div className="metric-icon-box" style={{ background: '#ebf5fb', borderColor: '#aed6f1' }}>
              <Briefcase size={18} color="#154360" />
            </div>
          </div>
          <div className="metric-value">{students.length}</div>
          <div className="metric-subtext">
            <span>{students.filter(s => s.stage === 'SELECTED').length} selected • {students.filter(s => s.stage === 'TECH_INTERVIEW' || s.stage === 'HR_INTERVIEW').length} in interviews</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => setActiveAdminTab('tpos')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-title">College TPOs</span>
            <div className="metric-icon-box" style={{ background: '#fffdf0', borderColor: '#fae27a' }}>
              <Building2 size={18} color="#154360" />
            </div>
          </div>
          <div className="metric-value">{tpos.length}</div>
          <div className="metric-subtext">
            <span>{tpos.filter(t => t.status === 'DRIVE_CONFIRMED').length} confirmed colleges</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => setActiveAdminTab('calls')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-title">Total Calling Time</span>
            <div className="metric-icon-box" style={{ background: '#ebf5fb', borderColor: '#aed6f1' }}>
              <PhoneCall size={18} color="#154360" />
            </div>
          </div>
          <div className="metric-value">{formatDuration(totalCallSeconds)}</div>
          <div className="metric-subtext">
            <span>Across {callSessions.length} total call sessions</span>
          </div>
        </div>
      </div>

      {/* Admin Section Tabs */}
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        marginBottom: '16px',
        paddingBottom: '4px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        {[
          { id: 'staff', label: 'HR Staff & Credentials' },
          { id: 'drives', label: 'Drives' },
          { id: 'students', label: 'Students' },
          { id: 'tpos', label: 'College TPOs' },
          { id: 'followups', label: 'Follow-Ups' },
          { id: 'calls', label: 'Call Records' }
        ].map(tab => {
          const isActive = activeAdminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: isActive ? '#154360' : 'transparent',
                background: isActive ? '#154360' : '#ffffff',
                color: isActive ? '#ffffff' : '#52525b',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.825rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: HR STAFF & LOGIN CREDENTIALS PROVISIONING        */}
      {/* ======================================================== */}
      {activeAdminTab === 'staff' && (
        <div className="content-card">
          <div className="card-header-row" style={{ padding: '14px 18px' }}>
            <div>
              <h2 className="card-title">
                HR Managers & HR Interns Login Credentials
              </h2>
              <p className="card-subtitle">
                Admin-exclusive credential generator. Provide login email and password for HR staff to access the CRM.
              </p>
            </div>
            <button onClick={handleOpenAddUser} className="btn-mustard btn-black-sm" style={{ fontWeight: 800 }}>
              <Plus size={14} color="#154360" /> Provision New Staff Account
            </button>
          </div>

          <div style={{ padding: '16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.825rem', color: '#154360', fontWeight: 600 }}>
                <ShieldCheck size={18} color="#154360" />
                <span>Admin Master Controls: Employees created here synchronize instantly across PCs, laptops, and mobile devices.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleForceServerSync}
                  disabled={isSyncingServer}
                  className="btn-secondary btn-black-sm"
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  title="Push all employees to central server database"
                >
                  <RefreshCw size={12} className={isSyncingServer ? 'spinning' : ''} />
                  {isSyncingServer ? 'Syncing...' : 'Sync to Server'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMobileQr(prev => !prev)}
                  className="btn-secondary btn-black-sm"
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  title="Show Mobile QR code to open CRM on smartphone"
                >
                  <Smartphone size={12} color="#154360" />
                  {showMobileQr ? 'Hide Mobile Link' : 'Mobile Access'}
                </button>
              </div>
            </div>

            {/* Mobile / Other PC Access Box */}
            {showMobileQr && (
              <div style={{
                background: '#ffffff',
                border: '1px solid #bae6fd',
                borderRadius: '10px',
                padding: '14px',
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  background: '#ffffff',
                  padding: '6px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '90px',
                  height: '90px',
                  flexShrink: 0
                }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=84x84&data=${encodeURIComponent(networkUrl)}`}
                    alt="Scan for Mobile Login"
                    style={{ width: '84px', height: '84px' }}
                  />
                </div>
                <div style={{ flex: '1 1 220px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0369a1', marginBottom: '4px' }}>
                    📱 Connect from Mobile or Another PC
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#52525b', marginBottom: '8px' }}>
                    Scan with your phone camera or enter this URL in any browser on the same Wi-Fi:
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <code style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0284c7', padding: '4px 10px', borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem' }}>
                      {networkUrl}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyText(networkUrl, 'network-url')}
                      className="btn-secondary btn-black-sm"
                      style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                    >
                      {copiedKey === 'network-url' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      {copiedKey === 'network-url' ? 'Copied' : 'Copy URL'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="desktop-only" style={{ width: '100%', overflowX: 'hidden' }}>
            <table className="crm-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Staff Member</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Role</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Login Username / Email</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Password</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Daily Target</th>
                  <th style={{ background: '#154360', color: '#ffffff', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hrStaffList.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b' }}>
                      <Users size={32} color="#94a3b8" style={{ margin: '0 auto 8px', display: 'block' }} />
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#154360' }}>No Staff Accounts Provisioned Yet</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                        Click "+ Provision New Staff Account" above to create login credentials for your HR staff or interns.
                      </div>
                    </td>
                  </tr>
                )}
                {hrStaffList.map(user => {
                  const isPassVisible = showPasswordMap[user.id];
                  const userPassword = user.password || 'admin';
                  return (
                    <tr key={user.id}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: user.role === 'MAIN_HR' ? '#154360' : '#FFDB58',
                            color: user.role === 'MAIN_HR' ? '#FFDB58' : '#154360',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            border: '1.5px solid #0e2e42'
                          }}>
                            {user.avatar || 'HR'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#154360', fontSize: '0.85rem' }}>{user.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#71717a' }}>{user.title || (user.role === 'MAIN_HR' ? 'HR Manager' : 'HR Intern')}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <span className={user.role === 'MAIN_HR' ? 'badge badge-navy-subtle' : 'badge badge-mustard'}>
                          {user.role === 'MAIN_HR' ? 'HR Manager' : 'HR Intern'}
                        </span>
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <code style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem', color: '#09090b', fontWeight: 600 }}>
                            {user.email}
                          </code>
                          <button 
                            type="button"
                            onClick={() => handleCopyText(user.email, `email-${user.id}`)}
                            className="btn-icon"
                            style={{ width: '24px', height: '24px' }}
                            title="Copy Email"
                          >
                            {copiedKey === `email-${user.id}` ? <Check size={12} color="#10b981" /> : <Copy size={12} color="#71717a" />}
                          </button>
                        </div>
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <code style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem', color: '#09090b', fontWeight: 700, letterSpacing: isPassVisible ? 'normal' : '0.15em' }}>
                            {isPassVisible ? userPassword : '••••••••'}
                          </code>
                          <button 
                            type="button" 
                            onClick={() => toggleShowPassword(user.id)} 
                            className="btn-icon" 
                            style={{ width: '24px', height: '24px' }}
                            title={isPassVisible ? 'Hide Password' : 'Show Password'}
                          >
                            {isPassVisible ? <EyeOff size={12} color="#71717a" /> : <Eye size={12} color="#71717a" />}
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleCopyText(userPassword, `pass-${user.id}`)}
                            className="btn-icon"
                            style={{ width: '24px', height: '24px' }}
                            title="Copy Password"
                          >
                            {copiedKey === `pass-${user.id}` ? <Check size={12} color="#10b981" /> : <Copy size={12} color="#71717a" />}
                          </button>
                        </div>
                      </td>

                      <td style={{ padding: '10px 14px', fontSize: '0.8rem' }}>
                        {user.role === 'HR_INTERN' ? (
                          <span style={{ color: '#154360', fontWeight: 600 }}>
                            {user.dailyTargetHours || 3.5}h calling • {user.dailyTargetLeads || 20} leads
                          </span>
                        ) : (
                          <span style={{ color: '#71717a' }}>Full Management</span>
                        )}
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleOpenEditUser(user)}
                            className="btn-secondary btn-black-sm"
                            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                            title="Edit User or Reset Password"
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm(`Delete ${user.name}'s account and credentials?`)) {
                                onDeleteUser(user.id);
                                showNotification(`Removed account for ${user.name}`);
                              }
                            }}
                            className="btn-secondary btn-black-sm"
                            style={{ padding: '3px 8px', fontSize: '0.72rem', color: '#ef4444', borderColor: '#fca5a5' }}
                            title="Delete Account"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile view for Staff Credentials */}
          <div className="mobile-only" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {hrStaffList.map(user => {
              const isPassVisible = showPasswordMap[user.id];
              const userPassword = user.password || 'admin';
              return (
                <div key={user.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 700, color: '#154360' }}>{user.name}</div>
                    <span className={user.role === 'MAIN_HR' ? 'badge badge-navy-subtle' : 'badge badge-mustard'}>
                      {user.role === 'MAIN_HR' ? 'HR Manager' : 'HR Intern'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', marginBottom: '4px' }}>
                    <strong>Email:</strong> <code>{user.email}</code>
                  </div>
                  <div style={{ fontSize: '0.75rem', marginBottom: '10px' }}>
                    <strong>Password:</strong> <code>{isPassVisible ? userPassword : '••••••••'}</code>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button onClick={() => toggleShowPassword(user.id)} className="btn-secondary btn-black-sm" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                      {isPassVisible ? 'Hide Pass' : 'Show Pass'}
                    </button>
                    <button onClick={() => handleCopyText(`${user.email} / ${userPassword}`, `card-${user.id}`)} className="btn-secondary btn-black-sm" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                      Copy Credentials
                    </button>
                    <button onClick={() => handleOpenEditUser(user)} className="btn-secondary btn-black-sm" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MASTER CAMPUS DRIVES (EDIT & POST)                */}
      {/* ======================================================== */}
      {activeAdminTab === 'drives' && (
        <div className="content-card">
          <div className="card-header-row" style={{ padding: '14px 18px' }}>
            <div>
              <h2 className="card-title">
                Master Drives Control
              </h2>
              <p className="card-subtitle">
                Edit drive dates, packages, roles, or post new campus recruitment drives across all colleges.
              </p>
            </div>
            <button onClick={handleOpenAddDrive} className="btn-mustard btn-black-sm" style={{ fontWeight: 800 }}>
              <Plus size={14} color="#154360" /> Post New Campus Drive
            </button>
          </div>

          <div className="desktop-only" style={{ width: '100%', overflowX: 'hidden' }}>
            <table className="crm-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Drive Title & Role</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>College</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Package (CTC)</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Drive Date</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Candidates</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Status</th>
                  <th style={{ background: '#154360', color: '#ffffff', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drives.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '28px', color: '#71717a' }}>
                      No campus drives created yet. Click "Post New Campus Drive" above.
                    </td>
                  </tr>
                ) : (
                  drives.map(drive => {
                    const candidateCount = students.filter(s => s.driveId === drive.id).length;
                    return (
                      <tr key={drive.id}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#154360', fontSize: '0.85rem' }}>{drive.title}</div>
                          <div style={{ fontSize: '0.72rem', color: '#52525b' }}>Role: <strong>{drive.jobRole}</strong></div>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '0.825rem', fontWeight: 600 }}>{drive.collegeName}</td>
                        <td style={{ padding: '10px 14px', fontSize: '0.825rem', fontWeight: 700, color: '#154360' }}>{drive.ctc}</td>
                        <td style={{ padding: '10px 14px', fontSize: '0.8rem' }}>{drive.driveDate || 'Upcoming'}</td>
                        <td style={{ padding: '10px 14px', fontSize: '0.8rem' }}>
                          <span style={{ fontWeight: 700, color: '#154360' }}>{candidateCount}</span> candidates
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className={drive.status === 'CONFIRMED' ? 'badge badge-green' : 'badge badge-mustard'}>
                            {drive.status || 'CONFIRMED'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => handleOpenEditDrive(drive)}
                              className="btn-secondary btn-black-sm"
                              style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                              title="Edit Drive Details"
                            >
                              <Edit3 size={12} /> Edit
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm(`Delete drive "${drive.title}"?`)) {
                                  onDeleteDrive(drive.id);
                                  showNotification(`Deleted drive "${drive.title}"`);
                                }
                              }}
                              className="btn-secondary btn-black-sm"
                              style={{ padding: '3px 8px', fontSize: '0.72rem', color: '#ef4444', borderColor: '#fca5a5' }}
                              title="Delete Drive"
                            >
                              <Trash2 size={12} />
                            </button>
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
      )}

      {/* ======================================================== */}
      {/* TAB 3: MASTER POSTED STUDENTS (EDIT & POST)              */}
      {/* ======================================================== */}
      {activeAdminTab === 'students' && (
        <div className="content-card">
          <div className="card-header-row" style={{ padding: '14px 18px' }}>
            <div>
              <h2 className="card-title">
                Master Students Control
              </h2>
              <p className="card-subtitle">
                Edit candidate contact details, change recruitment stages, or post new candidates directly.
              </p>
            </div>
            <button onClick={handleOpenAddStudent} className="btn-mustard btn-black-sm" style={{ fontWeight: 800 }}>
              <UserPlus size={14} color="#154360" /> Post New Student
            </button>
          </div>

          <div className="desktop-only" style={{ width: '100%', overflowX: 'hidden' }}>
            <table className="crm-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Candidate Name</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>College & Branch</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>CGPA</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Phone</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Hiring Stage</th>
                  <th style={{ background: '#154360', color: '#ffffff', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '28px', color: '#71717a' }}>
                      No student candidates found. Click "Post New Student" above.
                    </td>
                  </tr>
                ) : (
                  students.map(student => (
                    <tr key={student.id}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#154360', fontSize: '0.85rem' }}>{student.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#71717a' }}>Roll: {student.rollNumber || 'N/A'} • {student.email}</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.8rem' }}>
                        <div>{student.collegeName}</div>
                        <div style={{ fontSize: '0.7rem', color: '#71717a' }}>{student.branch || 'Engg'}</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.825rem', fontWeight: 700, color: '#154360' }}>
                        {student.cgpa || 'N/A'}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.8rem' }}>
                        <a href={normalizePhoneNumber(student.phone).telUrl || `tel:${student.phone}`} style={{ color: '#154360', fontWeight: 600 }}>{student.phone}</a>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <select
                          className="form-select"
                          value={student.stage || 'APPLIED'}
                          onChange={(e) => {
                            onUpdateStudent({ ...student, stage: e.target.value });
                            showNotification(`Updated ${student.name}'s stage to ${e.target.value}!`);
                          }}
                          style={{ fontSize: '0.75rem', padding: '4px 8px', fontWeight: 700 }}
                        >
                          <option value="APPLIED">Applied</option>
                          <option value="SCREENING">Screening</option>
                          <option value="TECH_INTERVIEW">Tech Interview</option>
                          <option value="HR_INTERVIEW">HR Interview</option>
                          <option value="SELECTED">Selected</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {onStartCall && (
                            <>
                              <button 
                                type="button"
                                onClick={() => onStartCall({
                                  recipientType: 'STUDENT',
                                  recipientName: student.name,
                                  recipientDetail: `${student.branch || 'Engg'} • ${student.phone} • ${student.collegeName || 'Campus'}`,
                                  recipientPhone: student.phone,
                                  type: 'AUDIO',
                                  studentId: student.id,
                                  student
                                })}
                                className="btn-mustard btn-black-sm"
                                style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '3px' }}
                                title="Call candidate immediately"
                              >
                                <Phone size={11} color="#154360" /> Call
                              </button>
                              <button 
                                type="button"
                                onClick={() => onStartCall({
                                  recipientType: 'STUDENT',
                                  recipientName: student.name,
                                  recipientDetail: `${student.branch || 'Engg'} • ${student.phone} • ${student.collegeName || 'Campus'}`,
                                  recipientPhone: student.phone,
                                  type: 'VIDEO',
                                  studentId: student.id,
                                  student
                                })}
                                className="btn-navy btn-black-sm"
                                style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '3px' }}
                                title="Start video interview room"
                              >
                                <Video size={11} color="#FFDB58" /> Video
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => handleOpenEditStudent(student)}
                            className="btn-secondary btn-black-sm"
                            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                            title="Edit Student Info"
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm(`Delete candidate ${student.name}?`)) {
                                onDeleteStudent(student.id);
                                showNotification(`Deleted candidate ${student.name}`);
                              }
                            }}
                            className="btn-secondary btn-black-sm"
                            style={{ padding: '3px 8px', fontSize: '0.72rem', color: '#ef4444', borderColor: '#fca5a5' }}
                            title="Delete Student"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: MASTER COLLEGE TPOS (EDIT & POST)                 */}
      {/* ======================================================== */}
      {activeAdminTab === 'tpos' && (
        <div className="content-card">
          <div className="card-header-row" style={{ padding: '14px 18px' }}>
            <div>
              <h2 className="card-title">
                Master College TPOs Control
              </h2>
              <p className="card-subtitle">
                Manage placement officer contacts, outreach status, and post new college TPO records.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                type="button"
                onClick={() => {
                  if (onSelectTab) onSelectTab('tpos');
                }} 
                className="btn-navy-outline btn-black-sm" 
                style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                title="Link Google Sheets or import spreadsheet TPO records"
              >
                <FileSpreadsheet size={14} color="#154360" /> Link Sheets
              </button>
              <button onClick={handleOpenAddTpo} className="btn-mustard btn-black-sm" style={{ fontWeight: 800 }}>
                <Building2 size={14} color="#154360" /> Post New College TPO
              </button>
            </div>
          </div>

          <div className="desktop-only" style={{ width: '100%', overflowX: 'hidden' }}>
            <table className="crm-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ background: '#154360', color: '#ffffff' }}>TPO Officer</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>College Institution</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Phone</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Email</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Outreach Status</th>
                  <th style={{ background: '#154360', color: '#ffffff', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tpos.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '28px', color: '#71717a' }}>
                      No college TPOs found. Click "Post New College TPO" above.
                    </td>
                  </tr>
                ) : (
                  tpos.map(tpo => (
                    <tr key={tpo.id}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#154360', fontSize: '0.85rem' }}>{tpo.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#71717a' }}>{tpo.designation || 'Placement Officer'}</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.825rem', fontWeight: 600 }}>{tpo.collegeName}</td>
                      <td style={{ padding: '10px 14px', fontSize: '0.8rem' }}>
                        <a href={normalizePhoneNumber(tpo.phone).telUrl || `tel:${tpo.phone}`} style={{ color: '#154360', fontWeight: 600 }}>{tpo.phone}</a>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#52525b' }}>{tpo.email || 'N/A'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <select
                          className="form-select"
                          value={tpo.status || 'LEAD'}
                          onChange={(e) => {
                            onUpdateTpo({ ...tpo, status: e.target.value });
                            showNotification(`Updated ${tpo.name}'s status to ${e.target.value}!`);
                          }}
                          style={{ fontSize: '0.75rem', padding: '4px 8px', fontWeight: 700 }}
                        >
                          <option value="LEAD">Lead</option>
                          <option value="CONTACTED">Contacted</option>
                          <option value="DRIVE_CONFIRMED">Drive Confirmed</option>
                          <option value="FOLLOW_UP">Follow Up</option>
                          <option value="NOT_INTERESTED">Not Interested</option>
                        </select>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {onStartCall && (
                            <button 
                              type="button"
                              onClick={() => onStartCall({
                                recipientType: 'TPO',
                                recipientName: `${tpo.name} (${tpo.collegeName})`,
                                recipientDetail: `${tpo.designation || 'Placement Officer'} • ${tpo.phone}`,
                                recipientPhone: tpo.phone,
                                type: 'AUDIO',
                                tpoId: tpo.id
                              })}
                              className="btn-mustard btn-black-sm"
                              style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '3px' }}
                              title="Call TPO Officer"
                            >
                              <Phone size={11} color="#154360" /> Call
                            </button>
                          )}
                          <button 
                            onClick={() => handleOpenEditTpo(tpo)}
                            className="btn-secondary btn-black-sm"
                            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                            title="Edit TPO"
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm(`Delete TPO ${tpo.name}?`)) {
                                onDeleteTpo(tpo.id);
                                showNotification(`Deleted TPO ${tpo.name}`);
                              }
                            }}
                            className="btn-secondary btn-black-sm"
                            style={{ padding: '3px 8px', fontSize: '0.72rem', color: '#ef4444', borderColor: '#fca5a5' }}
                            title="Delete TPO"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: MASTER FOLLOW-UPS (EDIT & POST)                  */}
      {/* ======================================================== */}
      {activeAdminTab === 'followups' && (
        <div className="content-card">
          <div className="card-header-row" style={{ padding: '14px 18px' }}>
            <div>
              <h2 className="card-title">
                Master Follow-Ups Control
              </h2>
              <p className="card-subtitle">
                Schedule reminders, adjust priority, edit follow-up notes, and post new follow-up tasks.
              </p>
            </div>
            <button onClick={handleOpenAddFollowUp} className="btn-mustard btn-black-sm" style={{ fontWeight: 800 }}>
              <Clock size={14} color="#154360" /> Post New Follow-Up
            </button>
          </div>

          <div className="desktop-only" style={{ width: '100%', overflowX: 'hidden' }}>
            <table className="crm-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Target Contact</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Type</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Scheduled Date</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Priority</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Assigned Staff</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Notes</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Status</th>
                  <th style={{ background: '#154360', color: '#ffffff', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {followUps.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '28px', color: '#71717a' }}>
                      No follow-ups scheduled yet. Click "Post New Follow-Up" above.
                    </td>
                  </tr>
                ) : (
                  followUps.map(fup => (
                    <tr key={fup.id}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#154360', fontSize: '0.85rem' }}>
                        {fup.entityTitle}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.8rem' }}>
                        <span className="badge badge-navy-subtle">{fup.entityType || 'TPO'}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {fup.scheduledDate}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className={fup.priority === 'HIGH' ? 'badge badge-red' : 'badge badge-mustard'}>
                          {fup.priority || 'MEDIUM'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.8rem', fontWeight: 600, color: '#154360' }}>
                        {fup.internName || (users.find(u => u.role !== 'ADMIN')?.name || 'Staff Recruiter')}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.75rem', color: '#52525b', maxWidth: '240px' }}>
                        {fup.notes || 'No notes provided'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className={fup.status === 'COMPLETED' ? 'badge badge-green' : 'badge badge-mustard'}>
                          {fup.status || 'PENDING'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {onStartCall && fup.status !== 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() => {
                                const cleanName = (fup.entityTitle || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
                                const matched = fup.phone ? null : (
                                  students.find(s => s.id === fup.entityId || (s.name && (s.name.trim().toLowerCase() === cleanName || cleanName.includes(s.name.trim().toLowerCase()) || s.name.trim().toLowerCase().includes(cleanName)))) ||
                                  tpos.find(t => t.id === fup.entityId || (t.name && (t.name.trim().toLowerCase() === cleanName || cleanName.includes(t.name.trim().toLowerCase()) || t.name.trim().toLowerCase().includes(cleanName))))
                                );
                                onStartCall({
                                  recipientType: fup.entityType || 'CONTACT',
                                  recipientName: fup.entityTitle,
                                  recipientDetail: fup.notes || '',
                                  recipientPhone: fup.phone || matched?.phone || '',
                                  type: 'AUDIO',
                                  followUpId: fup.id
                                });
                              }}
                              className="btn-mustard btn-black-sm"
                              style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '3px' }}
                              title="Call immediately"
                            >
                              <Phone size={11} color="#154360" /> Call
                            </button>
                          )}
                          <button 
                            onClick={() => handleOpenEditFollowUp(fup)}
                            className="btn-secondary btn-black-sm"
                            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                            title="Edit Follow-Up"
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm(`Delete follow-up for ${fup.entityTitle}?`)) {
                                onDeleteFollowUp(fup.id);
                                showNotification(`Deleted follow-up`);
                              }
                            }}
                            className="btn-secondary btn-black-sm"
                            style={{ padding: '3px 8px', fontSize: '0.72rem', color: '#ef4444', borderColor: '#fca5a5' }}
                            title="Delete Follow-Up"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: MASTER CALL AUDIT & RECORDS (EDIT & POST)         */}
      {/* ======================================================== */}
      {activeAdminTab === 'calls' && (
        <div className="content-card">
          <div className="card-header-row" style={{ padding: '14px 18px' }}>
            <div>
              <h2 className="card-title">
                Master Call Audit & Records
              </h2>
              <p className="card-subtitle">
                Audit logged calling talk time, edit notes/durations, or log manual call sessions.
              </p>
            </div>
            <button onClick={handleOpenAddCall} className="btn-mustard btn-black-sm" style={{ fontWeight: 800 }}>
              <Plus size={14} color="#154360" /> Log Call Record
            </button>
          </div>

          <div className="desktop-only" style={{ width: '100%', overflowX: 'hidden' }}>
            <table className="crm-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Date & Caller</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Recipient</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Mode</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Duration</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Outcome</th>
                  <th style={{ background: '#154360', color: '#ffffff' }}>Call Notes</th>
                  <th style={{ background: '#154360', color: '#ffffff', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {callSessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '28px', color: '#71717a' }}>
                      No calls logged yet. Click "Log Call Record" above.
                    </td>
                  </tr>
                ) : (
                  callSessions.map(call => (
                    <tr key={call.id}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#154360', fontSize: '0.85rem' }}>{call.internName || 'HR Intern'}</div>
                        <div style={{ fontSize: '0.7rem', color: '#71717a' }}>{call.startedAt ? new Date(call.startedAt).toLocaleString() : 'Recent'}</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.825rem', fontWeight: 600 }}>
                        {call.recipientName} <span style={{ fontSize: '0.7rem', color: '#71717a' }}>({call.recipientType})</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.8rem' }}>
                        <span className="badge badge-navy-subtle">{call.type || 'AUDIO'}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.85rem', fontWeight: 800, color: '#154360' }}>
                        {formatDuration(call.durationSeconds || 0)}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className={call.outcome === 'CONNECTED' ? 'badge badge-green' : 'badge badge-mustard'}>
                          {call.outcome || 'CONNECTED'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.75rem', color: '#52525b', maxWidth: '240px' }}>
                        {call.notes || 'No call notes recorded'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleOpenEditCall(call)}
                            className="btn-secondary btn-black-sm"
                            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                            title="Edit Call Record"
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm(`Delete call record for ${call.recipientName}?`)) {
                                onDeleteCallSession(call.id);
                                showNotification(`Deleted call record`);
                              }
                            }}
                            className="btn-secondary btn-black-sm"
                            style={{ padding: '3px 8px', fontSize: '0.72rem', color: '#ef4444', borderColor: '#fca5a5' }}
                            title="Delete Call Record"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: PROVISION / EDIT HR OR INTERN ACCOUNT          */}
      {/* ======================================================== */}
      {isUserModalOpen && (
        <div className="modal-overlay" onClick={() => setIsUserModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Key size={18} color="#154360" /> {editingUser ? 'Edit Staff Credentials' : 'Provision HR / Intern Account'}
                </h3>
                <p className="modal-subtitle">
                  {editingUser ? 'Update login credentials or assignment goals' : 'Create new login credentials for HR staff members'}
                </p>
              </div>
              <button onClick={() => setIsUserModalOpen(false)} className="modal-close-btn">&times;</button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Role Type *</label>
                  <select 
                    className="form-select"
                    value={userFormData.role}
                    onChange={e => setUserFormData(prev => ({ 
                      ...prev, 
                      role: e.target.value,
                      title: e.target.value === 'MAIN_HR' ? 'HR Manager' : 'Recruitment Intern'
                    }))}
                    style={{ fontWeight: 700 }}
                  >
                    <option value="MAIN_HR">HR Manager (Full CRM Management)</option>
                    <option value="HR_INTERN">HR Intern (Calling & Lead Pipeline Outreach)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Priya Sharma or Rahul Verma"
                    value={userFormData.name}
                    onChange={e => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Login Username / Email *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. priya or priya@company.com"
                      value={userFormData.email}
                      onChange={e => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Password * 
                      <span 
                        onClick={() => setUserFormData(prev => ({ ...prev, password: `pass${Math.floor(1000 + Math.random() * 9000)}` }))}
                        style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#154360', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        (Auto-generate)
                      </span>
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Password"
                      value={userFormData.password}
                      onChange={e => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Job Title / Designation</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Senior Talent Acquisition Specialist"
                    value={userFormData.title}
                    onChange={e => setUserFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                {userFormData.role === 'HR_INTERN' && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#154360', marginBottom: '8px' }}>
                      Intern Daily Outreach Targets:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#52525b' }}>Daily Calling Hours</label>
                        <input 
                          type="number" 
                          step="0.5" 
                          className="form-input"
                          value={userFormData.dailyTargetHours}
                          onChange={e => setUserFormData(prev => ({ ...prev, dailyTargetHours: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#52525b' }}>Daily Lead Target</label>
                        <input 
                          type="number" 
                          className="form-input"
                          value={userFormData.dailyTargetLeads}
                          onChange={e => setUserFormData(prev => ({ ...prev, dailyTargetLeads: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '14px 20px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-mustard" style={{ fontWeight: 800 }}>
                  {editingUser ? 'Save Credentials' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT / POST CAMPUS DRIVE                        */}
      {/* ======================================================== */}
      {isDriveModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDriveModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{editingDrive ? 'Edit Campus Drive' : 'Post New Campus Drive'}</h3>
                <p className="modal-subtitle">Configure drive parameters, hiring role, and dates</p>
              </div>
              <button onClick={() => setIsDriveModalOpen(false)} className="modal-close-btn">&times;</button>
            </div>

            <form onSubmit={handleSaveDrive}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Drive Title *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Graduate Software Engineer 2026"
                    value={driveFormData.title}
                    onChange={e => setDriveFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">College Institution *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. IIT Bombay or BITS Pilani"
                    value={driveFormData.collegeName}
                    onChange={e => setDriveFormData(prev => ({ ...prev, collegeName: e.target.value }))}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Job Role</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={driveFormData.jobRole}
                      onChange={e => setDriveFormData(prev => ({ ...prev, jobRole: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Package (CTC)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={driveFormData.ctc}
                      onChange={e => setDriveFormData(prev => ({ ...prev, ctc: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Drive Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={driveFormData.driveDate}
                      onChange={e => setDriveFormData(prev => ({ ...prev, driveDate: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select 
                      className="form-select"
                      value={driveFormData.status}
                      onChange={e => setDriveFormData(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="TENTATIVE">Tentative</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Eligibility Criteria</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={driveFormData.criteria}
                    onChange={e => setDriveFormData(prev => ({ ...prev, criteria: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '14px 20px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setIsDriveModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-mustard" style={{ fontWeight: 800 }}>
                  {editingDrive ? 'Update Drive' : 'Post Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: EDIT / POST STUDENT                             */}
      {/* ======================================================== */}
      {isStudentModalOpen && (
        <div className="modal-overlay" onClick={() => setIsStudentModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{editingStudent ? 'Edit Student Details' : 'Post New Candidate'}</h3>
                <p className="modal-subtitle">Add or modify student record in recruitment pipeline</p>
              </div>
              <button onClick={() => setIsStudentModalOpen(false)} className="modal-close-btn">&times;</button>
            </div>

            <form onSubmit={handleSaveStudent}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Full Candidate Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Ananya Roy"
                    value={studentFormData.name}
                    onChange={e => setStudentFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">College Institution *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={studentFormData.collegeName}
                      onChange={e => setStudentFormData(prev => ({ ...prev, collegeName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Roll Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={studentFormData.rollNumber}
                      onChange={e => setStudentFormData(prev => ({ ...prev, rollNumber: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Branch / Major</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={studentFormData.branch}
                      onChange={e => setStudentFormData(prev => ({ ...prev, branch: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CGPA</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={studentFormData.cgpa}
                      onChange={e => setStudentFormData(prev => ({ ...prev, cgpa: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input 
                      type="tel" 
                      className="form-input" 
                      placeholder="+91 98765 43210"
                      value={studentFormData.phone}
                      onChange={e => setStudentFormData(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="student@college.edu"
                      value={studentFormData.email}
                      onChange={e => setStudentFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Hiring Stage</label>
                  <select 
                    className="form-select"
                    value={studentFormData.stage}
                    onChange={e => setStudentFormData(prev => ({ ...prev, stage: e.target.value }))}
                  >
                    <option value="APPLIED">Applied</option>
                    <option value="SCREENING">Screening</option>
                    <option value="TECH_INTERVIEW">Tech Interview</option>
                    <option value="HR_INTERVIEW">HR Interview</option>
                    <option value="SELECTED">Selected</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '14px 20px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setIsStudentModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-mustard" style={{ fontWeight: 800 }}>
                  {editingStudent ? 'Update Candidate' : 'Post Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: EDIT / POST TPO                                 */}
      {/* ======================================================== */}
      {isTpoModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTpoModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{editingTpo ? 'Edit TPO Contact' : 'Post College TPO Lead'}</h3>
                <p className="modal-subtitle">Placement officer outreach records</p>
              </div>
              <button onClick={() => setIsTpoModalOpen(false)} className="modal-close-btn">&times;</button>
            </div>

            <form onSubmit={handleSaveTpo}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Officer Full Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Prof. Rajesh Kumar"
                    value={tpoFormData.name}
                    onChange={e => setTpoFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">College Institution *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. National Institute of Technology"
                    value={tpoFormData.collegeName}
                    onChange={e => setTpoFormData(prev => ({ ...prev, collegeName: e.target.value }))}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input 
                      type="tel" 
                      className="form-input" 
                      placeholder="+91 98765 00000"
                      value={tpoFormData.phone}
                      onChange={e => setTpoFormData(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="tpo@college.edu"
                      value={tpoFormData.email}
                      onChange={e => setTpoFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={tpoFormData.designation}
                      onChange={e => setTpoFormData(prev => ({ ...prev, designation: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select 
                      className="form-select"
                      value={tpoFormData.status}
                      onChange={e => setTpoFormData(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="LEAD">Lead</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="DRIVE_CONFIRMED">Drive Confirmed</option>
                      <option value="FOLLOW_UP">Follow Up</option>
                      <option value="NOT_INTERESTED">Not Interested</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '14px 20px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setIsTpoModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-mustard" style={{ fontWeight: 800 }}>
                  {editingTpo ? 'Update TPO' : 'Post TPO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: EDIT / POST FOLLOW-UP                           */}
      {/* ======================================================== */}
      {isFollowUpModalOpen && (
        <div className="modal-overlay" onClick={() => setIsFollowUpModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{editingFollowUp ? 'Edit Follow-Up' : 'Post Scheduled Follow-Up'}</h3>
                <p className="modal-subtitle">Task reminder for college or candidate outreach</p>
              </div>
              <button onClick={() => setIsFollowUpModalOpen(false)} className="modal-close-btn">&times;</button>
            </div>

            <form onSubmit={handleSaveFollowUp}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Contact / Organization *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Dr. Ramesh (IIT Bombay)"
                    value={followUpFormData.entityTitle}
                    onChange={e => setFollowUpFormData(prev => ({ ...prev, entityTitle: e.target.value }))}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Scheduled Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={followUpFormData.scheduledDate}
                      onChange={e => setFollowUpFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select 
                      className="form-select"
                      value={followUpFormData.priority}
                      onChange={e => setFollowUpFormData(prev => ({ ...prev, priority: e.target.value }))}
                    >
                      <option value="HIGH">High Priority</option>
                      <option value="MEDIUM">Medium Priority</option>
                      <option value="LOW">Low Priority</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Staff Member (HR / Intern) *</label>
                  <select 
                    className="form-select"
                    value={followUpFormData.internId}
                    onChange={e => {
                      const sel = users.find(u => u.id === e.target.value);
                      setFollowUpFormData(prev => ({ 
                        ...prev, 
                        internId: e.target.value,
                        internName: sel ? sel.name : prev.internName
                      }));
                    }}
                  >
                    {users.filter(u => u.role !== 'ADMIN').map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role === 'MAIN_HR' ? 'HR Manager' : 'HR Intern'})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Follow-Up Action Notes</label>
                  <textarea 
                    className="form-input" 
                    rows={3}
                    placeholder="Describe discussion points..."
                    value={followUpFormData.notes}
                    onChange={e => setFollowUpFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '14px 20px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setIsFollowUpModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-mustard" style={{ fontWeight: 800 }}>
                  {editingFollowUp ? 'Update Follow-Up' : 'Post Follow-Up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: LOG / EDIT CALL RECORD                          */}
      {/* ======================================================== */}
      {isCallModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCallModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{editingCall ? 'Edit Call Record' : 'Log Manual Call Session'}</h3>
                <p className="modal-subtitle">Clock calling talk time and record conversation notes</p>
              </div>
              <button onClick={() => setIsCallModalOpen(false)} className="modal-close-btn">&times;</button>
            </div>

            <form onSubmit={handleSaveCall}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Caller (Staff Member)</label>
                    <select 
                      className="form-select" 
                      value={callFormData.internName}
                      onChange={e => setCallFormData(prev => ({ ...prev, internName: e.target.value }))}
                    >
                      {users.filter(u => u.role !== 'ADMIN').map(u => (
                        <option key={u.id} value={u.name}>{u.name} ({u.role === 'MAIN_HR' ? 'HR Manager' : 'HR Intern'})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Recipient Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Placement Officer or Candidate"
                      value={callFormData.recipientName}
                      onChange={e => setCallFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Call Duration (Seconds)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={callFormData.durationSeconds}
                      onChange={e => setCallFormData(prev => ({ ...prev, durationSeconds: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Call Outcome</label>
                    <select 
                      className="form-select"
                      value={callFormData.outcome}
                      onChange={e => setCallFormData(prev => ({ ...prev, outcome: e.target.value }))}
                    >
                      <option value="CONNECTED">Connected & Discussed</option>
                      <option value="BUSY">Busy / Call Later</option>
                      <option value="NO_ANSWER">No Answer</option>
                      <option value="WRONG_NUMBER">Wrong Number</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Conversation Notes</label>
                  <textarea 
                    className="form-input" 
                    rows={3}
                    placeholder="Details discussed during the call..."
                    value={callFormData.notes}
                    onChange={e => setCallFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '14px 20px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setIsCallModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-mustard" style={{ fontWeight: 800 }}>
                  {editingCall ? 'Update Record' : 'Save Call Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
