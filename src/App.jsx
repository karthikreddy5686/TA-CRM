import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Calendar, 
  Phone, 
  Video, 
  Clock, 
  Users, 
  CheckCircle2, 
  BarChart3, 
  LogOut,
  PhoneCall,
  FileSpreadsheet,
  Globe,
  Trash2,
  Plus,
  X,
  Search,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Maximize,
  Minimize,
  Smartphone,
  Download,
  Upload,
  ChevronDown,
  Menu
} from 'lucide-react';

import { 
  INITIAL_USERS, 
  WORKING_DEMO_DATA,
  formatDuration 
} from './data/mockData';

import { webAudio } from './utils/audio';

import LoginScreen from './components/LoginScreen';
import MainHRDashboard from './components/MainHRDashboard';
import InternDashboard from './components/InternDashboard';
import TPODirectory from './components/TPODirectory';
import DriveManagement from './components/DriveManagement';
import FollowUpTracker from './components/FollowUpTracker';
import CallModal from './components/CallModal';
import CallDispositionModal from './components/CallDispositionModal';
import GoogleFormBlastCenter from './components/GoogleFormBlastCenter';
import PublishedDriveBoard from './components/PublishedDriveBoard';
import HRPhoneConnectModal from './components/HRPhoneConnectModal';
import InstallAppModal from './components/InstallAppModal';
import {
  GlobalNewDriveModal,
  GlobalNewTpoModal,
  GlobalQuickCallModal,
  GlobalNewFollowUpModal,
  GlobalAddStudentModal,
  GlobalActionSheetModal
} from './components/GlobalModals';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('tacrm_auth_user');
    return savedUser ? JSON.parse(savedUser) : INITIAL_USERS[0]; // Defaults to Main HR if not logged out
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'googleFormBlast' | 'liveBoard' | 'drives' | 'tpos' | 'followups' | 'calls'

  // User State
  const [users, setUsers] = useState(INITIAL_USERS);

  // Sanitize helper to purge any phantom or placeholder records from storage
  const sanitizeDrives = (list) => {
    if (!Array.isArray(list)) return [];
    return list.filter(d => 
      d && 
      d.title && 
      !(d.collegeName && d.collegeName === 'University Campus') &&
      !(d.collegeName && d.collegeName === 'College Campus')
    );
  };

  const sanitizeStudents = (list) => {
    if (!Array.isArray(list)) return [];
    return list.filter(s => 
      s && 
      !(s.collegeName && s.collegeName === 'University Campus') &&
      !(s.collegeName && s.collegeName === 'College Campus')
    );
  };

  const sanitizeResponses = (list) => {
    if (!Array.isArray(list)) return [];
    return list.filter(r => 
      r && 
      !(r.collegeName && r.collegeName === 'University Campus') &&
      !(r.collegeName && r.collegeName === 'College Campus')
    );
  };

  // Data State with Local Storage fallback
  const [colleges, setColleges] = useState(() => {
    const saved = localStorage.getItem('tacrm_colleges');
    return saved ? JSON.parse(saved) : [];
  });

  const [tpos, setTpos] = useState(() => {
    const saved = localStorage.getItem('tacrm_tpos');
    return saved ? JSON.parse(saved) : [];
  });

  const [drives, setDrives] = useState(() => {
    const saved = localStorage.getItem('tacrm_drives');
    if (!saved) return [];
    try {
      return sanitizeDrives(JSON.parse(saved));
    } catch {
      return [];
    }
  });

  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('tacrm_students');
    if (!saved) return [];
    try {
      return sanitizeStudents(JSON.parse(saved));
    } catch {
      return [];
    }
  });

  const [followUps, setFollowUps] = useState(() => {
    const saved = localStorage.getItem('tacrm_followups');
    return saved ? JSON.parse(saved) : [];
  });

  const [callSessions, setCallSessions] = useState(() => {
    const saved = localStorage.getItem('tacrm_calls');
    return saved ? JSON.parse(saved) : [];
  });

  const [formResponses, setFormResponses] = useState(() => {
    const saved = localStorage.getItem('tacrm_form_responses');
    if (!saved) return [];
    try {
      return sanitizeResponses(JSON.parse(saved));
    } catch {
      return [];
    }
  });

  const [blastLogs, setBlastLogs] = useState(() => {
    const saved = localStorage.getItem('tacrm_blast_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Data is cleanly sanitized upon lazy state initialization

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('tacrm_tpos', JSON.stringify(tpos));
  }, [tpos]);
  useEffect(() => {
    localStorage.setItem('tacrm_drives', JSON.stringify(drives));
  }, [drives]);
  useEffect(() => {
    localStorage.setItem('tacrm_students', JSON.stringify(students));
  }, [students]);
  useEffect(() => {
    localStorage.setItem('tacrm_followups', JSON.stringify(followUps));
  }, [followUps]);
  useEffect(() => {
    localStorage.setItem('tacrm_calls', JSON.stringify(callSessions));
  }, [callSessions]);
  useEffect(() => {
    localStorage.setItem('tacrm_form_responses', JSON.stringify(formResponses));
  }, [formResponses]);
  useEffect(() => {
    localStorage.setItem('tacrm_blast_logs', JSON.stringify(blastLogs));
  }, [blastLogs]);

  // Auth Handlers
  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('tacrm_auth_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tacrm_auth_user');
  };

  // In-App Calling State Engine
  const [callState, setCallState] = useState({
    active: false,
    type: 'AUDIO', // 'AUDIO' | 'VIDEO'
    recipientType: 'TPO',
    recipientName: '',
    recipientDetail: '',
    callerName: '',
    internId: '',
    duration: 0,
    startTime: null,
    relatedEntityId: null,
  });

  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [dispositionData, setDispositionData] = useState(null);
  const [isDispositionOpen, setIsDispositionOpen] = useState(false);

  // Web App & PWA Shell States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Global Quick Action Modals & Action Sheet
  const [isGlobalNewMenuOpen, setIsGlobalNewMenuOpen] = useState(false);
  const [isGlobalDriveModalOpen, setIsGlobalDriveModalOpen] = useState(false);
  const [isGlobalStudentModalOpen, setIsGlobalStudentModalOpen] = useState(false);
  const [isGlobalTpoModalOpen, setIsGlobalTpoModalOpen] = useState(false);
  const [isGlobalQuickCallModalOpen, setIsGlobalQuickCallModalOpen] = useState(false);
  const [isGlobalFollowUpModalOpen, setIsGlobalFollowUpModalOpen] = useState(false);
  
  // HR Personal Calling Phone Line
  const [hrPhoneNumber, setHrPhoneNumber] = useState(() => {
    return localStorage.getItem('tacrm_hr_phone') || '+91 98201 55432';
  });
  const [isPhoneConnectModalOpen, setIsPhoneConnectModalOpen] = useState(false);

  const handleSaveHrPhone = (newPhone, callingMode) => {
    setHrPhoneNumber(newPhone);
    localStorage.setItem('tacrm_hr_phone', newPhone);
    if (callingMode) localStorage.setItem('tacrm_calling_mode', callingMode);
    addToast(`HR Calling Line connected: ${newPhone}`, 'success');
  };
  const importFileRef = useRef(null);

  const addToast = (message, type = 'info') => {
    webAudio.playNotification();
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  // 1. Web App PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      addToast('TalentConnect installed successfully as native Web App!', 'success');
    });
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = () => {
    setIsInstallModalOpen(true);
  };

  // 2. Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // 3. Online / Offline Status Detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast('Back online. Real-time workspace synchronization restored.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      addToast('Offline mode active. All candidate updates are saved locally.', 'warning');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 4. Cross-Tab & Multi-Window Real-Time State Synchronization (Storage Events)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (!e.key || !e.newValue) return;
      try {
        const val = JSON.parse(e.newValue);
        if (e.key === 'tacrm_drives') setDrives(sanitizeDrives(val));
        else if (e.key === 'tacrm_tpos') setTpos(val);
        else if (e.key === 'tacrm_students') setStudents(sanitizeStudents(val));
        else if (e.key === 'tacrm_followups') setFollowUps(val);
        else if (e.key === 'tacrm_calls') setCallSessions(val);
        else if (e.key === 'tacrm_form_responses') setFormResponses(sanitizeResponses(val));
        else if (e.key === 'tacrm_blast_logs') setBlastLogs(val);
      } catch (err) {}
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 5. Global Sample / Demo Data Loader
  const handleLoadDemoData = () => {
    setColleges(WORKING_DEMO_DATA.colleges);
    setTpos(WORKING_DEMO_DATA.tpos);
    setDrives(WORKING_DEMO_DATA.drives);
    setStudents(WORKING_DEMO_DATA.students);
    setFollowUps(WORKING_DEMO_DATA.followUps);
    setCallSessions(WORKING_DEMO_DATA.callSessions);
    setFormResponses(WORKING_DEMO_DATA.formResponses);
    setBlastLogs(WORKING_DEMO_DATA.blastLogs);

    localStorage.setItem('tacrm_colleges', JSON.stringify(WORKING_DEMO_DATA.colleges));
    localStorage.setItem('tacrm_tpos', JSON.stringify(WORKING_DEMO_DATA.tpos));
    localStorage.setItem('tacrm_drives', JSON.stringify(WORKING_DEMO_DATA.drives));
    localStorage.setItem('tacrm_students', JSON.stringify(WORKING_DEMO_DATA.students));
    localStorage.setItem('tacrm_followups', JSON.stringify(WORKING_DEMO_DATA.followUps));
    localStorage.setItem('tacrm_calls', JSON.stringify(WORKING_DEMO_DATA.callSessions));
    localStorage.setItem('tacrm_form_responses', JSON.stringify(WORKING_DEMO_DATA.formResponses));
    localStorage.setItem('tacrm_blast_logs', JSON.stringify(WORKING_DEMO_DATA.blastLogs));

    webAudio.playCallConnected();
    addToast('⚡ Working demo data loaded! All campus recruitment modules are live.', 'success');
  };

  // 6. Reset Database to Clean State
  const handleResetCleanData = () => {
    setColleges([]);
    setTpos([]);
    setDrives([]);
    setStudents([]);
    setFollowUps([]);
    setCallSessions([]);
    setFormResponses([]);
    setBlastLogs([]);

    localStorage.setItem('tacrm_colleges', JSON.stringify([]));
    localStorage.setItem('tacrm_tpos', JSON.stringify([]));
    localStorage.setItem('tacrm_drives', JSON.stringify([]));
    localStorage.setItem('tacrm_students', JSON.stringify([]));
    localStorage.setItem('tacrm_followups', JSON.stringify([]));
    localStorage.setItem('tacrm_calls', JSON.stringify([]));
    localStorage.setItem('tacrm_form_responses', JSON.stringify([]));
    localStorage.setItem('tacrm_blast_logs', JSON.stringify([]));

    addToast('System reset to clean state. Ready for fresh manual input.', 'info');
  };

  // 7. Global Export & Import CRM Backup (JSON)
  const handleExportBackup = () => {
    const backupData = {
      appName: 'TalentConnect TA CRM',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      colleges,
      tpos,
      drives,
      students,
      followUps,
      callSessions,
      formResponses,
      blastLogs,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TalentConnect_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('CRM database backup exported as JSON file!', 'success');
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (Array.isArray(data.colleges)) setColleges(data.colleges);
        if (Array.isArray(data.tpos)) setTpos(data.tpos);
        if (Array.isArray(data.drives)) setDrives(sanitizeDrives(data.drives));
        if (Array.isArray(data.students)) setStudents(sanitizeStudents(data.students));
        if (Array.isArray(data.followUps)) setFollowUps(data.followUps);
        if (Array.isArray(data.callSessions)) setCallSessions(data.callSessions);
        if (Array.isArray(data.formResponses)) setFormResponses(sanitizeResponses(data.formResponses));
        if (Array.isArray(data.blastLogs)) setBlastLogs(data.blastLogs);
        addToast('CRM database restored successfully from JSON backup!', 'success');
      } catch (err) {
        addToast('Could not import backup file. Ensure valid JSON format.', 'warning');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Web App Global Keyboard Shortcuts (Ctrl+K for Command Palette, Esc to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsNotificationsOpen(false);
        setIsGlobalNewMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Live Timer Effect while call is active
  useEffect(() => {
    let timer = null;
    if (callState.active) {
      timer = setInterval(() => {
        setCallState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState.active]);

  // Start Call Handler
  const handleStartCall = ({ recipientType, recipientName, recipientDetail, recipientPhone, type = 'AUDIO', tpoId, studentId, followUpId, student }) => {
    webAudio.startRinging();
    const caller = currentUser || { name: 'HR Agent', id: 'agent-1' };
    const rawRecipientPhone = recipientPhone || 
      (student?.phone) || 
      (recipientDetail && recipientDetail.includes('+91') ? recipientDetail.split('•').pop().trim() : '+91 98765 43210');

    setCallState({
      active: true,
      type,
      recipientType: recipientType || 'CONTACT',
      recipientName: recipientName || 'Campus Contact',
      recipientDetail: recipientDetail || '',
      recipientPhone: rawRecipientPhone,
      callerName: caller.name,
      internId: caller.id,
      duration: 0,
      startTime: new Date().toISOString(),
      relatedEntityId: studentId || tpoId || followUpId || null,
      studentData: student || null
    });
    setIsCallMinimized(false);

    // Update user status to 'on-call'
    setUsers(prev => prev.map(u => u.id === caller.id ? { ...u, status: 'on-call' } : u));
    addToast(`Dialing ${recipientName} (${type === 'VIDEO' ? 'Laptop Video Interview' : 'Phone Call'})...`, 'info');
  };

  // End Call Handler
  const handleEndCall = (notesDuringCall = '') => {
    webAudio.playCallEnded();
    const finalDuration = callState.duration;
    const finalState = { ...callState };

    // Reset calling state
    setCallState(prev => ({ ...prev, active: false }));
    setIsCallMinimized(false);

    // Restore user status
    setUsers(prev => prev.map(u => u.id === finalState.internId ? { ...u, status: 'online' } : u));

    // Open Disposition Modal with logged duration
    setDispositionData({
      internId: finalState.internId,
      internName: finalState.callerName,
      recipientType: finalState.recipientType,
      recipientName: finalState.recipientName,
      callType: finalState.type,
      duration: finalDuration,
      startedAt: finalState.startTime,
      endedAt: new Date().toISOString(),
      initialNotes: notesDuringCall,
      relatedEntityId: finalState.relatedEntityId,
    });
    setIsDispositionOpen(true);
  };

  // Save Call Disposition Handler
  const handleSaveDisposition = ({ disposition, notes, needFollowUp, followUpDate, followUpPriority, candidateStage }) => {
    if (!dispositionData) return;

    // 1. Create Call Session Record
    const newSession = {
      id: `call-${Date.now()}`,
      internId: dispositionData.internId,
      internName: dispositionData.internName,
      recipientType: dispositionData.recipientType,
      recipientName: dispositionData.recipientName,
      callType: dispositionData.callType,
      startedAt: dispositionData.startedAt,
      endedAt: dispositionData.endedAt,
      durationSeconds: dispositionData.duration,
      disposition,
      notes,
    };

    setCallSessions(prev => [newSession, ...prev]);

    // 2. If follow-up requested, append to follow-ups
    if (needFollowUp && followUpDate) {
      const newFup = {
        id: `fup-${Date.now()}`,
        internId: dispositionData.internId,
        internName: dispositionData.internName,
        entityType: dispositionData.recipientType,
        entityId: dispositionData.relatedEntityId || `ent-${Date.now()}`,
        entityTitle: dispositionData.recipientName,
        scheduledDate: followUpDate,
        priority: followUpPriority || 'HIGH',
        status: 'PENDING',
        notes: `Follow-up from call: ${notes}`,
      };
      setFollowUps(prev => [newFup, ...prev]);
    }

    // 3. Update TPO status if applicable
    if (dispositionData.recipientType === 'TPO') {
      let nextStatus = 'CONTACTED';
      if (disposition === 'DRIVE_CONFIRMED') nextStatus = 'DRIVE_CONFIRMED';
      else if (disposition === 'PITCHED') nextStatus = 'PITCHED';
      else if (disposition === 'NOT_INTERESTED') nextStatus = 'NOT_INTERESTED';

      setTpos(prev => prev.map(t => {
        if (t.name.includes(dispositionData.recipientName) || dispositionData.recipientName.includes(t.name)) {
          return { ...t, status: nextStatus, lastContacted: new Date().toISOString().split('T')[0] };
        }
        return t;
      }));
    }

    // 4. Update Candidate Stage and Notes if applicable
    if (dispositionData.recipientType === 'STUDENT' && dispositionData.relatedEntityId) {
      setStudents(prev => prev.map(s => {
        if (s.id === dispositionData.relatedEntityId) {
          const updatedStage = (candidateStage && candidateStage !== 'UNCHANGED') ? candidateStage : s.stage;
          const updatedNotes = notes ? `${s.notes ? s.notes + ' • ' : ''}${notes}` : s.notes;
          return {
            ...s,
            stage: updatedStage,
            notes: updatedNotes
          };
        }
        return s;
      }));
      if (candidateStage && candidateStage !== 'UNCHANGED') {
        addToast(`Candidate updated to stage: ${candidateStage.replace(/_/g, ' ')}`, 'success');
      }
    }

    setIsDispositionOpen(false);
    setDispositionData(null);
  };

  // Individual Item Deletion Handlers with Web App Toast Feedback
  const handleDeleteStudent = (studentId) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    addToast('Candidate removed from roster', 'info');
  };

  const handleDeleteDrive = (driveId) => {
    setDrives(prev => prev.filter(d => d.id !== driveId));
    setStudents(prev => prev.filter(s => s.driveId !== driveId));
    setFormResponses(prev => prev.filter(r => r.driveId !== driveId));
    setBlastLogs(prev => prev.filter(b => b.driveId !== driveId));
    addToast('Campus drive and linked candidate records removed', 'info');
  };

  const handleClearAllDrives = () => {
    setDrives([]);
    setStudents([]);
    setFormResponses([]);
    addToast('All campus recruitment drives cleared (0 drives)', 'info');
  };

  const handleDeleteFormResponse = (respId) => {
    setFormResponses(prev => prev.filter(r => r.id !== respId));
    addToast('Student intake record removed', 'info');
  };

  const handleBatchDeleteFormResponses = (respIds) => {
    if (!respIds || respIds.length === 0) return;
    setFormResponses(prev => prev.filter(r => !respIds.includes(r.id)));
    addToast(`${respIds.length} candidate intake records removed`, 'info');
  };

  const handleClearAllFormResponses = () => {
    setFormResponses([]);
    addToast('All student intake records cleared (0 intake)', 'info');
  };

  const handleDeleteTpo = (tpoId) => {
    setTpos(prev => prev.filter(t => t.id !== tpoId));
    addToast('TPO profile removed', 'info');
  };

  const handleDeleteFollowUp = (fupId) => {
    setFollowUps(prev => prev.filter(f => f.id !== fupId));
    addToast('Follow-up task removed', 'info');
  };

  const handleDeleteCallSession = (sessionId) => {
    setCallSessions(prev => prev.filter(c => c.id !== sessionId));
    addToast('Call session record removed', 'info');
  };

  // Google Form Student Blasting & Posting Handler
  const handleBlastStudents = ({ selectedResponseIds, driveId, driveTitle, blastedBy, channels, testUrl }) => {
    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 1. Mark selected form responses as blasted
    const updatedResponses = formResponses.map(r => {
      if (selectedResponseIds.includes(r.id)) {
        return {
          ...r,
          isBlasted: true,
          blastedAt: timestampStr,
          status: 'APPROVED_FOR_BLAST',
        };
      }
      return r;
    });
    setFormResponses(updatedResponses);

    // 2. Convert blasted responses into active candidate records on the site
    const targetDrive = drives.find(d => d.id === driveId) || drives[0] || {
      id: driveId || `drv-${Date.now()}`,
      title: driveTitle || 'Campus Drive',
      collegeId: 'col-manual',
      collegeName: 'Campus',
    };

    const newStudentsToAdd = formResponses
      .filter(r => selectedResponseIds.includes(r.id))
      .map(r => ({
        id: `stu-blasted-${Date.now()}-${r.id}`,
        driveId: targetDrive.id,
        driveTitle: targetDrive.title,
        collegeId: targetDrive.collegeId || 'col-manual',
        collegeName: r.collegeName || targetDrive.collegeName || 'Campus',
        name: r.name,
        rollNumber: r.rollNumber,
        email: r.email,
        phone: r.phone,
        branch: r.branch,
        cgpa: r.cgpa,
        stage: 'ONLINE_ASSESSMENT',
        internId: currentUser?.id || 'agent',
        notes: `Published via Blast on ${timestampStr}. Channels: ${channels.join(', ')}`,
      }));

    setStudents(prev => [...newStudentsToAdd, ...prev]);

    // 3. Log Blast History
    const newBlastLog = {
      id: `blast-${Date.now()}`,
      driveId: targetDrive.id,
      driveTitle: targetDrive.title,
      blastedBy,
      timestamp: timestampStr,
      channels,
      candidatesCount: selectedResponseIds.length,
      testUrl,
      status: 'DELIVERED_100_PERCENT',
      headline: `${selectedResponseIds.length} Students Published to Live Board & Test Link Dispatched`,
    };
    setBlastLogs(prev => [newBlastLog, ...prev]);

    // 4. Update drive shortlisted count
    setDrives(prev => prev.map(d => {
      if (d.id === driveId) {
        return {
          ...d,
          registeredStudents: (d.registeredStudents || 0) + selectedResponseIds.length,
          shortlistedStudents: (d.shortlistedStudents || 0) + selectedResponseIds.length,
        };
      }
      return d;
    }));
  };

  // General CRM Handlers
  const handleAddTpo = (newTpo) => setTpos(prev => [newTpo, ...prev]);
  const handleUpdateTpoStatus = (tpoId, newStatus) => setTpos(prev => prev.map(t => t.id === tpoId ? { ...t, status: newStatus } : t));
  const handleCreateDrive = (newDrive) => setDrives(prev => [newDrive, ...prev]);
  const handleAddStudentsBatch = (newStudents) => setStudents(prev => [...newStudents, ...prev]);
  const handleUpdateCandidateStage = (studentId, nextStage) => setStudents(prev => prev.map(s => s.id === studentId ? { ...s, stage: nextStage } : s));
  const handleAddFollowUp = (newFup) => setFollowUps(prev => [newFup, ...prev]);
  
  const handleToggleCompleteFollowUp = (fupId) => {
    setFollowUps(prev => prev.map(f => {
      if (f.id === fupId) {
        return { ...f, status: f.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' };
      }
      return f;
    }));
  };

  const handleSnoozeFollowUp = (fupId, days = 1) => {
    const nextDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setFollowUps(prev => prev.map(f => {
      if (f.id === fupId) {
        return { ...f, scheduledDate: nextDate };
      }
      return f;
    }));
  };

  const handleScheduleFollowUpFromTpo = (tpo) => {
    const newFup = {
      id: `fup-${Date.now()}`,
      internId: tpo.assignedInternId || currentUser?.id || 'agent',
      internName: tpo.assignedInternName || currentUser?.name || 'Agent',
      entityType: 'TPO',
      entityId: tpo.id,
      entityTitle: `${tpo.name} (${tpo.collegeName})`,
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'HIGH',
      status: 'PENDING',
      notes: `Scheduled outreach callback regarding upcoming campus drive slot.`,
    };
    setFollowUps(prev => [newFup, ...prev]);
    setActiveTab('followups');
  };

  const unblastedResponsesCount = formResponses.filter(r => !r.isBlasted).length;

  const NAV_MODULES = [
    { id: 'dashboard', name: 'Dashboard Overview', category: 'Main', icon: <BarChart3 size={15} /> },
    { id: 'googleFormBlast', name: 'Google Sheets Student Intake', category: 'Main', icon: <FileSpreadsheet size={15} /> },
    { id: 'drives', name: 'Campus Drives & Students', category: 'Main', icon: <Calendar size={15} /> },
    { id: 'tpos', name: 'College TPOs', category: 'Outreach & Calls', icon: <Building2 size={15} /> },
    { id: 'followups', name: 'Follow-Ups', category: 'Outreach & Calls', icon: <Clock size={15} /> },
    { id: 'calls', name: 'Call Logs', category: 'Outreach & Calls', icon: <PhoneCall size={15} /> },
  ];

  const matchingStudents = commandQuery.trim()
    ? students.filter(s => 
        (s.name && s.name.toLowerCase().includes(commandQuery.toLowerCase())) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(commandQuery.toLowerCase())) ||
        (s.collegeName && s.collegeName.toLowerCase().includes(commandQuery.toLowerCase())) ||
        (s.branch && s.branch.toLowerCase().includes(commandQuery.toLowerCase()))
      )
    : [];

  const matchingDrives = commandQuery.trim()
    ? drives.filter(d => 
        (d.title && d.title.toLowerCase().includes(commandQuery.toLowerCase())) ||
        (d.collegeName && d.collegeName.toLowerCase().includes(commandQuery.toLowerCase())) ||
        (d.jobRole && d.jobRole.toLowerCase().includes(commandQuery.toLowerCase()))
      )
    : [];

  const matchingTpos = commandQuery.trim()
    ? tpos.filter(t => 
        (t.name && t.name.toLowerCase().includes(commandQuery.toLowerCase())) ||
        (t.collegeName && t.collegeName.toLowerCase().includes(commandQuery.toLowerCase()))
      )
    : [];

  // If user is not authenticated, render Login Screen
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      {/* Mobile Sidebar Backdrop */}
      <div 
        className={`mobile-sidebar-backdrop ${isMobileSidebarOpen ? 'active' : ''}`} 
        onClick={() => setIsMobileSidebarOpen(false)} 
        aria-hidden="true"
      />

      {/* Sidebar Navigation (Desktop and Off-Canvas Mobile Drawer) */}
      <aside className={`sidebar ${isSidebarCollapsed && !isMobileSidebarOpen ? 'collapsed' : ''} ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            TA
          </div>
          <div className="brand-text">
            <div className="brand-title">TalentConnect</div>
            <div className="brand-subtitle">Campus Recruitment CRM</div>
          </div>
          <button 
            type="button"
            className="btn-icon mobile-sidebar-close-btn"
            onClick={() => setIsMobileSidebarOpen(false)}
            title="Close navigation menu"
          >
            <X size={15} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Main</div>

          <button 
            onClick={() => { setActiveTab('dashboard'); setIsMobileSidebarOpen(false); }}
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            title="Dashboard Overview"
          >
            <BarChart3 size={17} />
            <span className="nav-label">Dashboard</span>
          </button>

          <button 
            onClick={() => { setActiveTab('googleFormBlast'); setIsMobileSidebarOpen(false); }}
            className={`nav-item ${activeTab === 'googleFormBlast' ? 'active' : ''}`}
            title="Google Sheets Intake"
          >
            <FileSpreadsheet size={17} />
            <span className="nav-label">Google Sheets Intake</span>
          </button>

          <button 
            onClick={() => { setActiveTab('drives'); setIsMobileSidebarOpen(false); }}
            className={`nav-item ${activeTab === 'drives' || activeTab === 'liveBoard' ? 'active' : ''}`}
            title="Campus Drives & Students"
          >
            <Calendar size={17} />
            <span className="nav-label">Campus Drives & Students</span>
          </button>

          <div className="nav-section-title">Outreach & Calls</div>

          <button 
            onClick={() => { setActiveTab('tpos'); setIsMobileSidebarOpen(false); }}
            className={`nav-item ${activeTab === 'tpos' ? 'active' : ''}`}
            title="College TPOs"
          >
            <Building2 size={17} />
            <span className="nav-label">College TPOs</span>
          </button>

          <button 
            onClick={() => { setActiveTab('followups'); setIsMobileSidebarOpen(false); }}
            className={`nav-item ${activeTab === 'followups' ? 'active' : ''}`}
            title="Follow-Ups"
          >
            <Clock size={17} />
            <span className="nav-label">Follow-Ups</span>
          </button>

          <button 
            onClick={() => { setActiveTab('calls'); setIsMobileSidebarOpen(false); }}
            className={`nav-item ${activeTab === 'calls' ? 'active' : ''}`}
            title="Call Logs"
          >
            <PhoneCall size={17} />
            <span className="nav-label">Call Logs</span>
          </button>
        </nav>

        {/* Current User Card in Sidebar with Logout */}
        <div className="sidebar-user">
          <div className="user-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="user-avatar">
                {currentUser.avatar || 'U'}
                <span className={`status-indicator-dot ${currentUser.status === 'on-call' ? 'on-call' : 'online'}`} />
              </div>
              <div className="user-details user-card-info">
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#09090b', lineHeight: 1.2 }}>
                  {currentUser.name}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#71717a' }}>
                  {currentUser.role === 'MAIN_HR' ? 'Main HR' : 'HR Intern'}
                </div>
              </div>
            </div>

            <button 
              onClick={handleLogout} 
              className="btn-icon" 
              style={{ width: '26px', height: '26px' }}
              title="Sign Out"
            >
              <LogOut size={12} color="#71717a" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="main-content">
        {/* Mobile-only Top App Bar */}
        <div className="mobile-only mobile-top-bar" style={{
          height: '44px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          boxSizing: 'border-box',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="brand-dot" />
            <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#09090b', letterSpacing: '-0.02em' }}>
              TalentConnect
            </span>
          </div>
          <button 
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="btn-icon"
            style={{ width: '30px', height: '30px' }}
            title="Open Menu"
          >
            <Menu size={16} />
          </button>
        </div>

        {/* Page Body Viewport */}
        <main className="page-body">
          {activeTab === 'dashboard' && (
            currentUser.role === 'MAIN_HR' ? (
              <MainHRDashboard 
                users={users}
                tpos={tpos}
                drives={drives}
                students={students}
                callSessions={callSessions}
                followUps={followUps}
                onStartCall={handleStartCall}
                onSelectTab={setActiveTab}
                onLoadDemoData={handleLoadDemoData}
                onResetCleanData={handleResetCleanData}
                onOpenNewDriveModal={() => setIsGlobalDriveModalOpen(true)}
                onOpenNewStudentModal={() => setIsGlobalStudentModalOpen(true)}
                onOpenNewTpoModal={() => setIsGlobalTpoModalOpen(true)}
                onOpenQuickCallModal={() => setIsGlobalQuickCallModalOpen(true)}
                onOpenQuickActions={() => setIsGlobalNewMenuOpen(true)}
              />
            ) : (
              <InternDashboard 
                currentIntern={currentUser}
                tpos={tpos}
                students={students}
                followUps={followUps}
                callSessions={callSessions}
                onStartCall={handleStartCall}
                onSelectTab={setActiveTab}
                onCompleteFollowUp={handleToggleCompleteFollowUp}
              />
            )
          )}

          {activeTab === 'googleFormBlast' && (
            <GoogleFormBlastCenter 
              formResponses={formResponses}
              drives={drives}
              users={users}
              blastLogs={blastLogs}
              currentUser={currentUser}
              onBlastStudents={handleBlastStudents}
              onImportStudentsFromSheet={(newStudents) => {
                setFormResponses(prev => [...newStudents, ...prev]);
              }}
              onCreateDrive={handleCreateDrive}
              onDeleteDrive={handleDeleteDrive}
              onDeleteFormResponse={handleDeleteFormResponse}
              onBatchDeleteFormResponses={handleBatchDeleteFormResponses}
              onClearAllFormResponses={handleClearAllFormResponses}
              onGoToLiveBoard={() => setActiveTab('drives')}
            />
          )}

          {activeTab === 'tpos' && (
            <TPODirectory 
              tpos={tpos}
              colleges={colleges}
              users={users}
              currentRole={currentUser.role}
              onStartCall={handleStartCall}
              onAddTpo={handleAddTpo}
              onDeleteTpo={handleDeleteTpo}
              onUpdateTpoStatus={handleUpdateTpoStatus}
              onScheduleFollowUp={handleScheduleFollowUpFromTpo}
            />
          )}

          {(activeTab === 'drives' || activeTab === 'liveBoard') && (
            <DriveManagement 
              drives={drives}
              students={students}
              tpos={tpos}
              users={users}
              currentRole={currentUser.role}
              onStartCall={handleStartCall}
              onCreateDrive={handleCreateDrive}
              onAddStudentsBatch={handleAddStudentsBatch}
              onUpdateCandidateStage={handleUpdateCandidateStage}
              onDeleteStudent={handleDeleteStudent}
              onDeleteDrive={handleDeleteDrive}
              onClearAllDrives={handleClearAllDrives}
              onLoadDemoData={handleLoadDemoData}
              defaultTab={activeTab === 'liveBoard' ? 'pipeline' : 'drives'}
              hrPhoneNumber={hrPhoneNumber}
              onOpenPhoneConnectModal={() => setIsPhoneConnectModalOpen(true)}
            />
          )}

          {activeTab === 'followups' && (
            <FollowUpTracker 
              followUps={followUps}
              users={users}
              tpos={tpos}
              students={students}
              onStartCall={handleStartCall}
              onAddFollowUp={handleAddFollowUp}
              onToggleCompleteFollowUp={handleToggleCompleteFollowUp}
              onSnoozeFollowUp={handleSnoozeFollowUp}
              onDeleteFollowUp={handleDeleteFollowUp}
            />
          )}

          {activeTab === 'calls' && (
            <div className="content-card">
              <div className="card-header-row" style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <h2 className="card-title" style={{ fontSize: '0.95rem' }}>All Logged Call Records & Talk Time</h2>
                  <p className="card-subtitle" style={{ fontSize: '0.75rem' }}>
                    Total talk time clocked: <strong>{formatDuration(callSessions.reduce((s, c) => s + (c.durationSeconds || 0), 0))}</strong> across {callSessions.length} total sessions
                  </p>
                </div>
              </div>

              {/* Desktop Table View - Compact, small font, NO horizontal scroll */}
              <div className="desktop-only" style={{ width: '100%', overflowX: 'hidden' }}>
                <table className="crm-table" style={{ width: '100%', tableLayout: 'auto' }}>
                  <thead>
                    <tr>
                      <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Date & Time</th>
                      <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>HR Caller</th>
                      <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Recipient</th>
                      <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Mode</th>
                      <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Duration</th>
                      <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Outcome</th>
                      <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Notes</th>
                      <th style={{ width: '30px', padding: '6px 4px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {callSessions.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '28px', color: '#71717a', fontSize: '0.78rem' }}>
                          No calls recorded yet. Click Call or Video on any TPO or candidate to log and track talk-time.
                        </td>
                      </tr>
                    ) : (
                      callSessions.map(c => (
                        <tr key={c.id}>
                          <td style={{ whiteSpace: 'nowrap', fontSize: '0.72rem', color: '#52525b', padding: '6px 8px' }}>
                            {new Date(c.startedAt).toLocaleString([], { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </td>

                          <td style={{ fontSize: '0.75rem', padding: '6px 8px' }}>
                            <strong>{c.internName}</strong>
                          </td>

                          <td style={{ fontSize: '0.75rem', padding: '6px 8px' }}>
                            <div style={{ fontWeight: 600 }}>{c.recipientName}</div>
                            <span className="badge badge-grey" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                              {c.recipientType}
                            </span>
                          </td>

                          <td style={{ padding: '6px 8px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}>
                              {c.callType === 'VIDEO' ? <Video size={12} /> : <Phone size={12} />}
                              {c.callType}
                            </span>
                          </td>

                          <td style={{ padding: '6px 8px' }}>
                            <span style={{ 
                              fontFamily: 'monospace', 
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              background: '#f1f5f9',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {formatDuration(c.durationSeconds)}
                            </span>
                          </td>

                          <td style={{ padding: '6px 8px' }}>
                            <span className={`badge ${
                              c.disposition === 'DRIVE_CONFIRMED' || c.disposition === 'SCREENING_PASSED'
                                ? 'badge-green'
                                : 'badge-amber'
                            }`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                              {c.disposition ? c.disposition.replace(/_/g, ' ') : 'COMPLETED'}
                            </span>
                          </td>

                          <td style={{ fontSize: '0.72rem', color: '#52525b', padding: '6px 8px', maxWidth: '200px', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                            {c.notes || '—'}
                          </td>

                          <td style={{ padding: '6px 4px' }}>
                            <button 
                              onClick={() => handleDeleteCallSession(c.id)}
                              className="btn-icon"
                              style={{ width: '22px', height: '22px', color: '#ef4444' }}
                              title="Delete call log"
                            >
                              <Trash2 size={11} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View - Clean, compact, small font, NO horizontal scroll */}
              <div className="mobile-only" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', boxSizing: 'border-box' }}>
                {callSessions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 10px', color: '#71717a', fontSize: '0.78rem' }}>
                    No calls recorded yet.
                  </div>
                ) : (
                  callSessions.map(c => (
                    <div key={c.id} style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#09090b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {c.callType === 'VIDEO' ? <Video size={12} color="#0284c7" /> : <Phone size={12} color="#16a34a" />}
                            {c.recipientName}
                          </span>
                          <span className="badge badge-grey" style={{ fontSize: '0.62rem', padding: '1px 4px' }}>
                            {c.recipientType}
                          </span>
                        </div>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          background: '#e2e8f0',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {formatDuration(c.durationSeconds)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: '#71717a' }}>
                        <span>Caller: <strong>{c.internName}</strong></span>
                        <span>{new Date(c.startedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                        <span className={`badge ${
                          c.disposition === 'DRIVE_CONFIRMED' || c.disposition === 'SCREENING_PASSED'
                            ? 'badge-green'
                            : 'badge-amber'
                        }`} style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                          {c.disposition ? c.disposition.replace(/_/g, ' ') : 'COMPLETED'}
                        </span>
                        <button 
                          onClick={() => handleDeleteCallSession(c.id)}
                          className="btn-icon"
                          style={{ width: '22px', height: '22px', color: '#ef4444' }}
                          title="Delete call log"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>

                      {c.notes && (
                        <div style={{ fontSize: '0.7rem', color: '#475569', background: '#ffffff', padding: '4px 6px', borderRadius: '4px', border: '1px solid #f1f5f9', wordBreak: 'break-word', marginTop: '2px' }}>
                          {c.notes}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Web App Command Palette (Ctrl+K / ⌘K) */}
      {isCommandPaletteOpen && (
        <div className="command-palette-backdrop" onClick={() => setIsCommandPaletteOpen(false)}>
          <div className="command-palette-modal" onClick={e => e.stopPropagation()}>
            <div className="command-palette-input-row">
              <Search size={18} color="#71717a" />
              <input 
                autoFocus
                type="text"
                className="command-palette-input"
                placeholder="Type to search modules, candidates, campus drives, TPOs..."
                value={commandQuery}
                onChange={e => setCommandQuery(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => {
                  setIsCommandPaletteOpen(false);
                  setCommandQuery('');
                }} 
                className="btn-icon" 
                style={{ width: '28px', height: '28px' }}
              >
                <X size={14} />
              </button>
            </div>

            <div className="command-palette-list">
              {/* Global Actions Shortcut Group */}
              <div className="command-group-title">⚡ Quick Web App Actions</div>
              <button
                type="button"
                className="command-item"
                onClick={() => {
                  handleLoadDemoData();
                  setIsCommandPaletteOpen(false);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={15} color="#8b5cf6" />
                  <span style={{ fontWeight: 700 }}>Load Working Demo Data</span>
                </div>
                <span className="badge badge-grey" style={{ fontSize: '0.68rem' }}>1-Click Setup</span>
              </button>

              <button
                type="button"
                className="command-item"
                onClick={() => {
                  setIsGlobalDriveModalOpen(true);
                  setIsCommandPaletteOpen(false);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={15} color="#09090b" />
                  <span style={{ fontWeight: 600 }}>Create Campus Drive</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#71717a' }}>Action</span>
              </button>

              <button
                type="button"
                className="command-item"
                onClick={() => {
                  setIsGlobalTpoModalOpen(true);
                  setIsCommandPaletteOpen(false);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Building2 size={15} color="#09090b" />
                  <span style={{ fontWeight: 600 }}>Add College TPO Lead</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#71717a' }}>Action</span>
              </button>

              <button
                type="button"
                className="command-item"
                onClick={() => {
                  setIsGlobalQuickCallModalOpen(true);
                  setIsCommandPaletteOpen(false);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <PhoneCall size={15} color="#09090b" />
                  <span style={{ fontWeight: 600 }}>Quick In-App Call / Video</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#71717a' }}>Dialer</span>
              </button>

              <button
                type="button"
                className="command-item"
                onClick={() => {
                  handleExportBackup();
                  setIsCommandPaletteOpen(false);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Download size={15} color="#0284c7" />
                  <span style={{ fontWeight: 600 }}>Export CRM Backup (JSON)</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#71717a' }}>Backup</span>
              </button>

              <button
                type="button"
                className="command-item"
                onClick={() => {
                  handleInstallApp();
                  setIsCommandPaletteOpen(false);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Smartphone size={15} color="#16a34a" />
                  <span style={{ fontWeight: 600 }}>Install TalentConnect Web App</span>
                </div>
                <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>PWA</span>
              </button>

              {/* Module Navigation */}
              <div className="command-group-title">Navigation Modules</div>
              {NAV_MODULES.filter(m => !commandQuery || m.name.toLowerCase().includes(commandQuery.toLowerCase())).map(m => (
                <button
                  key={m.id}
                  type="button"
                  className="command-item"
                  onClick={() => {
                    setActiveTab(m.id);
                    setIsCommandPaletteOpen(false);
                    setCommandQuery('');
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {m.icon}
                    <span style={{ fontWeight: 600 }}>{m.name}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#71717a' }}>Jump to module</span>
                </button>
              ))}

              {/* Matching Students */}
              {matchingStudents.length > 0 && (
                <>
                  <div className="command-group-title">Matching Candidates ({matchingStudents.length})</div>
                  {matchingStudents.slice(0, 5).map(s => (
                    <button
                      key={s.id}
                      type="button"
                      className="command-item"
                      onClick={() => {
                        setActiveTab('drives');
                        setIsCommandPaletteOpen(false);
                        setCommandQuery('');
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={14} color="#52525b" />
                        <span style={{ fontWeight: 600 }}>{s.name}</span>
                        <span style={{ fontSize: '0.72rem', color: '#71717a' }}>({s.branch} • {s.rollNumber})</span>
                      </div>
                      <span className="badge badge-grey" style={{ fontSize: '0.68rem' }}>{s.collegeName}</span>
                    </button>
                  ))}
                </>
              )}

              {/* Matching Drives */}
              {matchingDrives.length > 0 && (
                <>
                  <div className="command-group-title">Matching Campus Drives ({matchingDrives.length})</div>
                  {matchingDrives.slice(0, 5).map(d => (
                    <button
                      key={d.id}
                      type="button"
                      className="command-item"
                      onClick={() => {
                        setActiveTab('drives');
                        setIsCommandPaletteOpen(false);
                        setCommandQuery('');
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} color="#52525b" />
                        <span style={{ fontWeight: 600 }}>{d.title}</span>
                        <span style={{ fontSize: '0.72rem', color: '#71717a' }}>({d.collegeName})</span>
                      </div>
                      <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>{d.status}</span>
                    </button>
                  ))}
                </>
              )}

              {/* Matching TPOs */}
              {matchingTpos.length > 0 && (
                <>
                  <div className="command-group-title">Matching TPO Contacts ({matchingTpos.length})</div>
                  {matchingTpos.slice(0, 5).map(t => (
                    <button
                      key={t.id}
                      type="button"
                      className="command-item"
                      onClick={() => {
                        setActiveTab('tpos');
                        setIsCommandPaletteOpen(false);
                        setCommandQuery('');
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={14} color="#52525b" />
                        <span style={{ fontWeight: 600 }}>{t.name}</span>
                        <span style={{ fontSize: '0.72rem', color: '#71717a' }}>({t.collegeName})</span>
                      </div>
                      <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>{t.status}</span>
                    </button>
                  ))}
                </>
              )}
            </div>

            <div className="command-palette-footer">
              <span>Navigate with click or keyboard</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <kbd className="kbd-chip">Esc</kbd> to close
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Web App Toast Notification Container */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className="toast-card">
              <CheckCircle2 size={15} color="#10b981" />
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Mobile Web App Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <button 
          type="button"
          onClick={() => { setActiveTab('dashboard'); setIsMobileSidebarOpen(false); }} 
          className={`mobile-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          <BarChart3 size={18} />
          <span>Dashboard</span>
        </button>
        <button 
          type="button"
          onClick={() => { setActiveTab('googleFormBlast'); setIsMobileSidebarOpen(false); }} 
          className={`mobile-nav-btn ${activeTab === 'googleFormBlast' ? 'active' : ''}`}
        >
          <FileSpreadsheet size={18} />
          <span>Intake</span>
        </button>
        <button 
          type="button"
          onClick={() => { setActiveTab('drives'); setIsMobileSidebarOpen(false); }} 
          className={`mobile-nav-btn ${activeTab === 'drives' || activeTab === 'liveBoard' ? 'active' : ''}`}
        >
          <Calendar size={18} />
          <span>Drives & Students</span>
        </button>
        <button 
          type="button"
          onClick={() => { setActiveTab('calls'); setIsMobileSidebarOpen(false); }} 
          className={`mobile-nav-btn ${activeTab === 'calls' ? 'active' : ''}`}
        >
          <PhoneCall size={18} />
          <span>Calls</span>
        </button>
        <button 
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)} 
          className={`mobile-nav-btn ${isMobileSidebarOpen ? 'active' : ''}`}
        >
          <Menu size={18} />
          <span>Menu</span>
        </button>
      </nav>

      {/* Hidden File Input for JSON Backup Import */}
      <input 
        type="file" 
        ref={importFileRef} 
        accept=".json" 
        style={{ display: 'none' }} 
        onChange={handleImportBackup} 
      />

      {/* Global Quick Action Modals */}
      <GlobalNewDriveModal 
        isOpen={isGlobalDriveModalOpen} 
        onClose={() => setIsGlobalDriveModalOpen(false)} 
        onSubmit={(newDrive) => {
          handleCreateDrive(newDrive);
          addToast(`Campus drive "${newDrive.title}" scheduled!`, 'success');
        }}
        tpos={tpos}
        colleges={colleges}
      />

      <GlobalNewTpoModal 
        isOpen={isGlobalTpoModalOpen} 
        onClose={() => setIsGlobalTpoModalOpen(false)} 
        onSubmit={(newTpo) => {
          handleAddTpo(newTpo);
          addToast(`TPO lead "${newTpo.name}" added to directory!`, 'success');
        }}
        users={users}
      />

      <GlobalQuickCallModal 
        isOpen={isGlobalQuickCallModalOpen} 
        onClose={() => setIsGlobalQuickCallModalOpen(false)} 
        onStartCall={handleStartCall}
        tpos={tpos}
        students={students}
      />

      <GlobalNewFollowUpModal 
        isOpen={isGlobalFollowUpModalOpen} 
        onClose={() => setIsGlobalFollowUpModalOpen(false)} 
        onSubmit={(newFup) => {
          handleAddFollowUp(newFup);
          addToast(`Follow-up task scheduled for ${newFup.scheduledDate}!`, 'success');
        }}
        users={users}
        tpos={tpos}
        students={students}
      />

      {/* Global Add Single Candidate Modal */}
      <GlobalAddStudentModal 
        isOpen={isGlobalStudentModalOpen}
        onClose={() => setIsGlobalStudentModalOpen(false)}
        onSubmit={(newStudent) => {
          setStudents(prev => [newStudent, ...prev]);
          addToast(`Candidate "${newStudent.name}" added to drive!`, 'success');
        }}
        drives={drives}
      />

      {/* Global Quick Action Sheet Modal */}
      <GlobalActionSheetModal 
        isOpen={isGlobalNewMenuOpen}
        onClose={() => setIsGlobalNewMenuOpen(false)}
        onOpenNewDrive={() => setIsGlobalDriveModalOpen(true)}
        onOpenAddStudent={() => setIsGlobalStudentModalOpen(true)}
        onOpenNewTpo={() => setIsGlobalTpoModalOpen(true)}
        onOpenQuickCall={() => setIsGlobalQuickCallModalOpen(true)}
        onOpenFollowUp={() => setIsGlobalFollowUpModalOpen(true)}
        onGoToIntake={() => setActiveTab('googleFormBlast')}
        onLoadDemoData={handleLoadDemoData}
        onResetData={handleResetCleanData}
        hasData={drives.length > 0 || students.length > 0 || tpos.length > 0}
      />

      {/* Floating or Modal WebRTC Call Session Engine */}
      <CallModal 
        callState={callState}
        onEndCall={handleEndCall}
        onMinimize={() => setIsCallMinimized(true)}
        isMinimized={isCallMinimized}
        onExpand={() => setIsCallMinimized(false)}
        hrPhoneNumber={hrPhoneNumber}
        onOpenPhoneConnectModal={() => setIsPhoneConnectModalOpen(true)}
      />

      {/* Post-Call Disposition & Follow-Up Creation Modal */}
      <CallDispositionModal 
        sessionData={dispositionData}
        isOpen={isDispositionOpen}
        onSave={handleSaveDisposition}
        onCancel={() => {
          setIsDispositionOpen(false);
          setDispositionData(null);
        }}
      />

      {/* HR Personal Phone Connect Modal */}
      <HRPhoneConnectModal 
        isOpen={isPhoneConnectModalOpen}
        onClose={() => setIsPhoneConnectModalOpen(false)}
        currentPhone={hrPhoneNumber}
        onSavePhone={handleSaveHrPhone}
        currentUser={currentUser}
      />

      {/* PWA / Web App Installation Guide Modal */}
      <InstallAppModal 
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onNativeInstall={() => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(({ outcome }) => {
              if (outcome === 'accepted') {
                setDeferredPrompt(null);
                addToast('TalentConnect installed as native app!', 'success');
              }
              setIsInstallModalOpen(false);
            });
          }
        }}
      />
    </div>
  );
}
