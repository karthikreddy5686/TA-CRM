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
  ChevronUp,
  Menu,
  ShieldCheck,
  Key,
  GitFork,
  TrendingUp,
  Target
} from 'lucide-react';

import { 
  INITIAL_USERS, 
  WORKING_DEMO_DATA,
  formatDuration 
} from './data/mockData';

import { webAudio } from './utils/audio';

import LoginScreen from './components/LoginScreen';
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const MainHRDashboard = React.lazy(() => import('./components/MainHRDashboard'));
const InternDashboard = React.lazy(() => import('./components/InternDashboard'));
const DashboardOverview = React.lazy(() => import('./components/DashboardOverview'));
const TPODirectory = React.lazy(() => import('./components/TPODirectory'));
const LeadPipeline = React.lazy(() => import('./components/LeadPipeline'));
const DriveManagement = React.lazy(() => import('./components/DriveManagement'));
const FollowUpTracker = React.lazy(() => import('./components/FollowUpTracker'));
import CallModal from './components/CallModal';
import CallDispositionModal from './components/CallDispositionModal';
const PublishedDriveBoard = React.lazy(() => import('./components/PublishedDriveBoard'));
import HRPhoneConnectModal from './components/HRPhoneConnectModal';
import InstallAppModal from './components/InstallAppModal';
import LogoutConfirmModal from './components/LogoutConfirmModal';
import TopNavbar from './components/TopNavbar';
import InternalChatModal from './components/InternalChatModal';
import MobileCallingHub from './components/MobileCallingHub';
import {
  GlobalNewDriveModal,
  GlobalNewTpoModal,
  GlobalQuickCallModal,
  GlobalNewFollowUpModal,
  GlobalAddStudentModal,
  GlobalActionSheetModal
} from './components/GlobalModals';

import { parseUrlTokens, cleanUrlTokens, persistUserToDevice, persistBulkUsersToDevice } from './utils/staffSync';
import { fetchSupabaseUsers, upsertSupabaseUser, deleteSupabaseUser, isSupabaseConfigured } from './services/supabaseSync';

export default function App() {
  // Authentication State - persists login session, supports 1-click mobile invite token
  const [currentUser, setCurrentUser] = useState(() => {
    // 1. Check if URL contains 1-click mobile login token (?auth=...)
    const tokenResult = parseUrlTokens();
    if (tokenResult?.type === 'AUTH_USER' && tokenResult.user) {
      persistUserToDevice(tokenResult.user);
      try { localStorage.setItem('tacrm_auth_user', JSON.stringify(tokenResult.user)); } catch (e) {}
      cleanUrlTokens();
      return tokenResult.user;
    }

    const savedUser = localStorage.getItem('tacrm_auth_user');
    if (!savedUser) return null;
    try {
      let user = JSON.parse(savedUser);
      if (user && (user.name === 'Main HR Manager' || user.name === 'Main HR')) {
        user = { ...user, name: 'HR Manager' };
        localStorage.setItem('tacrm_auth_user', JSON.stringify(user));
      }
      return user;
    } catch (e) {
      return null;
    }
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'liveBoard' | 'drives' | 'tpos' | 'followups' | 'calls'

  // Sanitize helper to purge fake generic dummy accounts and establish realistic staff
  const sanitizeUsers = (list) => {
    const isGenericDummy = (u) => {
      if (!u) return true;
      const name = (u.name || '').trim().toLowerCase();
      const email = (u.email || '').trim().toLowerCase();
      const id = (u.id || '').toLowerCase();
      return (
        name === 'hr manager' ||
        name === 'main hr manager' ||
        name === 'main hr' ||
        name === 'hr intern 1' ||
        name === 'hr intern 2' ||
        name === 'ananya sharma' ||
        email === 'ananya.sharma@talentconnect.io' ||
        id === 'hr-ananya' ||
        name === 'kavya nair' ||
        email === 'kavya.nair@talentconnect.io' ||
        id === 'intern-kavya' ||
        name.includes('vikram') ||
        email.includes('vikram') ||
        id.includes('vikram') ||
        email === 'hr.head@company.com' ||
        email === 'hr@company.com' ||
        email === 'intern1@company.com' ||
        email === 'intern2@company.com' ||
        id === 'user-main-hr' ||
        id === 'intern-1' ||
        id === 'intern-2'
      );
    };

    const realUsers = Array.isArray(list) ? list.filter(u => u && !isGenericDummy(u)) : [];

    // Ensure Master Super Admin exists
    const adminIdx = realUsers.findIndex(u => u.role === 'ADMIN');
    if (adminIdx === -1) {
      realUsers.unshift({
        id: 'user-admin',
        name: 'Geonixa Admin',
        role: 'ADMIN',
        title: 'Super Administrator',
        email: 'admin@geonixa',
        password: 'geonixa@123',
        avatar: 'AD',
        status: 'online',
      });
    }

    // Ensure Primary HR Manager Karthik exists with real credentials
    const karthikIdx = realUsers.findIndex(u => 
      u.email === 'karthikreddy5686@gmail.com' || 
      (u.name && u.name.toLowerCase() === 'karthik') || 
      u.id === 'hr-karthik'
    );
    if (karthikIdx === -1) {
      realUsers.push({
        id: 'hr-karthik',
        name: 'karthik',
        role: 'MAIN_HR',
        title: 'Talent Acquisition Manager',
        email: 'karthikreddy5686@gmail.com',
        username: 'karthikreddy5686',
        password: '123456',
        avatar: 'HR',
        status: 'online',
        dailyTargetHours: 4,
        dailyTargetLeads: 25,
      });
    } else {
      realUsers[karthikIdx] = {
        ...realUsers[karthikIdx],
        name: 'karthik',
        role: 'MAIN_HR',
        title: 'Talent Acquisition Manager',
        email: 'karthikreddy5686@gmail.com',
        username: 'karthikreddy5686',
        password: realUsers[karthikIdx].password || '123456',
      };
    }

    return realUsers;
  };

  // User State with Local Storage persistence & automatic purging of dummy accounts
  const [users, setUsers] = useState(() => {
    // Process bulk sync token if present in URL (?sync=...)
    const tokenResult = parseUrlTokens();
    if (tokenResult?.type === 'SYNC_USERS' && Array.isArray(tokenResult.users)) {
      persistBulkUsersToDevice(tokenResult.users);
      cleanUrlTokens();
    }

    const saved = localStorage.getItem('tacrm_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sanitizeUsers(parsed);
        }
      } catch (e) {
        // ignore
      }
    }
    return INITIAL_USERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('tacrm_users', JSON.stringify(users));
    } catch (e) {
      // ignore
    }
  }, [users]);

  // Pull latest users and database from centralized server storage & cloud on initial app load
  useEffect(() => {
    fetch('/api/storage')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;
        if (Array.isArray(data.users) && data.users.length > 0) {
          const sanitized = sanitizeUsers(data.users);
          
          // Cross-merge with any local users that might be in localStorage from this device
          const localSaved = localStorage.getItem('tacrm_users');
          let merged = [...sanitized];
          if (localSaved) {
            try {
              const localUsers = JSON.parse(localSaved);
              if (Array.isArray(localUsers)) {
                localUsers.forEach(lu => {
                  if (lu && (lu.email || lu.name) && !merged.some(su => su.id === lu.id || (su.email && lu.email && su.email.toLowerCase() === lu.email.toLowerCase()))) {
                    merged.push(lu);
                    // Upload this newly found local user to central server so all other devices see them
                    fetch('/api/users/add', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ user: lu })
                    }).catch(() => {});
                  }
                });
              }
            } catch (e) {}
          }

          setUsers(merged);
          try {
            localStorage.setItem('tacrm_users', JSON.stringify(merged));
          } catch (e) {}
        }
        if (Array.isArray(data.drives) && data.drives.length > 0) {
          setDrives(data.drives);
        }
        if (Array.isArray(data.students) && data.students.length > 0) {
          setStudents(data.students);
        }
        if (Array.isArray(data.tpos) && data.tpos.length > 0) {
          setTpos(data.tpos);
        }
        if (Array.isArray(data.followUps) && data.followUps.length > 0) {
          setFollowUps(data.followUps);
        }
      })
      .catch(() => {});

    // Also pull latest provisioned users from Supabase cloud database if configured
    if (isSupabaseConfigured()) {
      fetchSupabaseUsers().then(cloudUsers => {
        if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
          setUsers(prev => {
            const uMap = new Map();
            prev.forEach(u => {
              const k = u.id || (u.email && u.email.toLowerCase());
              if (k) uMap.set(k, u);
            });
            cloudUsers.forEach(cu => {
              const k = cu.id || (cu.email && cu.email.toLowerCase());
              if (k) uMap.set(k, { ...(uMap.get(k) || {}), ...cu });
            });
            const merged = sanitizeUsers(Array.from(uMap.values()));
            try { localStorage.setItem('tacrm_users', JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }
      }).catch(() => {});
    }
  }, []);

  // Multi-device sync: Gentle sync when returning to the tab or on 60s interval
  useEffect(() => {
    const refreshUsers = () => {
      // 1. Supabase Cloud Sync
      if (isSupabaseConfigured()) {
        fetchSupabaseUsers().then(cloudUsers => {
          if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
            setUsers(prev => {
              const uMap = new Map();
              prev.forEach(u => {
                const k = u.id || (u.email && u.email.toLowerCase());
                if (k) uMap.set(k, u);
              });
              cloudUsers.forEach(cu => {
                const k = cu.id || (cu.email && cu.email.toLowerCase());
                if (k) uMap.set(k, { ...(uMap.get(k) || {}), ...cu });
              });
              const merged = sanitizeUsers(Array.from(uMap.values()));
              try { localStorage.setItem('tacrm_users', JSON.stringify(merged)); } catch (e) {}
              return merged;
            });
          }
        }).catch(() => {});
      }

      // 2. Local Vite Backend (when running dev server)
      fetch('/api/users')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && Array.isArray(data.users) && data.users.length > 0) {
            setUsers(prev => {
              const uMap = new Map();
              data.users.forEach(u => {
                if (u && (u.email || u.id)) {
                  uMap.set(u.id || u.email.toLowerCase(), u);
                }
              });
              prev.forEach(u => {
                const k = u.id || (u.email && u.email.toLowerCase());
                if (k && !uMap.has(k)) {
                  uMap.set(k, u);
                }
              });
              const next = sanitizeUsers(Array.from(uMap.values()));
              try { localStorage.setItem('tacrm_users', JSON.stringify(next)); } catch (e) {}
              return next;
            });
          }
        })
        .catch(() => {});
    };

    window.addEventListener('focus', refreshUsers);
    const interval = setInterval(refreshUsers, 60000);
    return () => {
      window.removeEventListener('focus', refreshUsers);
      clearInterval(interval);
    };
  }, []);

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

  const sanitizeStudents = (list, staffList = users) => {
    if (!Array.isArray(list)) return [];
    const activeStaff = staffList.find(u => u.role === 'HR_INTERN') ||
                        staffList.find(u => u.role !== 'ADMIN') ||
                        { id: 'hr-karthik', name: 'karthik' };

    return list
      .filter(Boolean)
      .map(stu => {
        let internName = stu.internName;
        let internId = stu.internId;
        if (!internName || internName === 'HR Intern 1' || internName === 'HR Intern 2' || internName === 'HR Intern' || internName === 'Vikram Aditya' || internName === 'Priya Sharma' || internId === 'intern-1' || internId === 'intern-2' || internId === 'intern-vikram') {
          internName = activeStaff.name;
          internId = activeStaff.id;
        }
        return { ...stu, internName, internId };
      });
  };

  const sanitizeResponses = (list) => {
    if (!Array.isArray(list)) return [];
    return list.filter(Boolean);
  };

  const sanitizeFollowUps = (list, staffList = users) => {
    if (!Array.isArray(list)) return [];
    const activeStaff = staffList.find(u => u.role === 'HR_INTERN') ||
                        staffList.find(u => u.role !== 'ADMIN') ||
                        { id: 'hr-karthik', name: 'karthik' };

    return list.map(fup => {
      let internName = fup.internName;
      let internId = fup.internId;

      if (!internName || internName === 'HR Intern 1' || internName === 'HR Intern 2' || internName === 'HR Intern' || internName === 'Vikram Aditya' || internName === 'Priya Sharma' || internId === 'intern-1' || internId === 'intern-2' || internId === 'intern-vikram') {
        internName = activeStaff.name;
        internId = activeStaff.id;
      }

      return {
        ...fup,
        internName,
        internId
      };
    });
  };

  const sanitizeTpos = (list, staffList = users) => {
    if (!Array.isArray(list)) return [];
    const activeStaff = staffList.find(u => u.role === 'HR_INTERN') ||
                        staffList.find(u => u.role !== 'ADMIN') ||
                        { id: 'hr-karthik', name: 'karthik' };

    return list.map(tpo => {
      let assignedInternName = tpo.assignedInternName;
      let assignedInternId = tpo.assignedInternId;

      if (!assignedInternName || assignedInternName === 'HR Intern 1' || assignedInternName === 'HR Intern 2' || assignedInternName === 'HR Intern' || assignedInternName === 'Vikram Aditya' || assignedInternId === 'intern-1' || assignedInternId === 'intern-2' || assignedInternId === 'intern-vikram') {
        assignedInternName = activeStaff.name;
        assignedInternId = activeStaff.id;
      }

      return {
        ...tpo,
        assignedInternName,
        assignedInternId
      };
    });
  };

  const sanitizeCalls = (list, staffList = users) => {
    if (!Array.isArray(list)) return [];
    const activeStaff = staffList.find(u => u.role === 'HR_INTERN') ||
                        staffList.find(u => u.role !== 'ADMIN') ||
                        { id: 'hr-karthik', name: 'karthik' };

    return list.map(call => {
      let internName = call.internName;
      let internId = call.internId;

      if (!internName || internName === 'HR Intern 1' || internName === 'HR Intern 2' || internName === 'HR Intern' || internName === 'Vikram Aditya' || internId === 'intern-1' || internId === 'intern-2' || internId === 'intern-vikram') {
        internName = activeStaff.name;
        internId = activeStaff.id;
      }

      return {
        ...call,
        internName,
        internId
      };
    });
  };

  // Data State with Local Storage fallback
  const [colleges, setColleges] = useState(() => {
    const saved = localStorage.getItem('tacrm_colleges');
    if (!saved) return WORKING_DEMO_DATA.colleges || [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : (WORKING_DEMO_DATA.colleges || []);
    } catch {
      return WORKING_DEMO_DATA.colleges || [];
    }
  });

  const [tpos, setTpos] = useState(() => {
    const saved = localStorage.getItem('tacrm_tpos');
    if (!saved) return sanitizeTpos(WORKING_DEMO_DATA.tpos || []);
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? sanitizeTpos(parsed) : sanitizeTpos(WORKING_DEMO_DATA.tpos || []);
    } catch {
      return sanitizeTpos(WORKING_DEMO_DATA.tpos || []);
    }
  });

  const [drives, setDrives] = useState(() => {
    const saved = localStorage.getItem('tacrm_drives');
    if (!saved) return sanitizeDrives(WORKING_DEMO_DATA.drives || []);
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? sanitizeDrives(parsed) : sanitizeDrives(WORKING_DEMO_DATA.drives || []);
    } catch {
      return sanitizeDrives(WORKING_DEMO_DATA.drives || []);
    }
  });

  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('tacrm_students');
    if (saved === null) return sanitizeStudents(WORKING_DEMO_DATA.students);
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? sanitizeStudents(parsed) : sanitizeStudents(WORKING_DEMO_DATA.students);
    } catch {
      return sanitizeStudents(WORKING_DEMO_DATA.students);
    }
  });

  const [followUps, setFollowUps] = useState(() => {
    const saved = localStorage.getItem('tacrm_followups');
    if (!saved) return sanitizeFollowUps(WORKING_DEMO_DATA.followUps || []);
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? sanitizeFollowUps(parsed) : sanitizeFollowUps(WORKING_DEMO_DATA.followUps || []);
    } catch {
      return sanitizeFollowUps(WORKING_DEMO_DATA.followUps || []);
    }
  });

  const [callSessions, setCallSessions] = useState(() => {
    const saved = localStorage.getItem('tacrm_calls');
    if (!saved) return sanitizeCalls(WORKING_DEMO_DATA.callSessions || []);
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? sanitizeCalls(parsed) : sanitizeCalls(WORKING_DEMO_DATA.callSessions || []);
    } catch {
      return sanitizeCalls(WORKING_DEMO_DATA.callSessions || []);
    }
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
    try {
      const saved = localStorage.getItem('tacrm_blast_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [expandedCallIds, setExpandedCallIds] = useState({});
  const toggleCallExpand = (id) => {
    setExpandedCallIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
    setUsers(prev => prev.some(u => u.id === user.id || (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase())) ? prev : [user, ...prev]);
    localStorage.setItem('tacrm_auth_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tacrm_auth_user');
  };

  // In-App Calling State Engine
  const [callState, setCallState] = useState({
    active: false,
    timerRunning: false,
    type: 'AUDIO', // 'AUDIO' | 'VIDEO'
    recipientType: 'TPO',
    recipientName: '',
    recipientDetail: '',
    recipientPhone: '',
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
  const [isFullscreen, setIsFullscreen] = useState(Boolean(typeof document !== 'undefined' && document.fullscreenElement));
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isAppInstalled, setIsAppInstalled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tacrm_app_installed') === 'true';
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      return saved || isStandalone;
    }
    return false;
  });
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isInternalChatOpen, setIsInternalChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [chatInitialTarget, setChatInitialTarget] = useState(null);
  const [incomingChatAlert, setIncomingChatAlert] = useState(null);
  const lastAlertedChatMsgIdRef = useRef(null);

  // Real-time synchronization of chat messages and unread counters across employees
  useEffect(() => {
    if (!currentUser) return;

    const userLastReadKey = `tacrm_chat_last_read_${currentUser.id}`;

    const updateUnreadCount = async () => {
      try {
        const lastRead = localStorage.getItem(userLastReadKey) || '1970-01-01T00:00:00.000Z';
        const res = await fetch('/api/chat', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.messages)) {
            // Cache messages to local storage for instant render when modal opens
            try {
              localStorage.setItem('flux_crm_chat_messages', JSON.stringify(data.messages));
            } catch {}

            // Messages relevant to current user:
            // 1) Team messages (channel === 'team' or !channel)
            // 2) Direct messages where currentUser is recipient or sender
            const relevantMessages = data.messages.filter(m => {
              if (!m.channel || m.channel === 'team') return true;
              if (m.recipientId && m.recipientId === currentUser.id) return true;
              if (m.senderId && m.senderId === currentUser.id) return true;
              if (m.channel?.startsWith('dm_') && m.channel.includes(String(currentUser.id))) return true;
              return false;
            });

            // Calculate unread count for messages sent by others after lastRead
            const unread = relevantMessages.filter(m => 
              m.timestamp > lastRead && 
              m.senderId !== currentUser.id
            ).length;
            setUnreadChatCount(unread);

            // Check if there is a brand new incoming message to trigger toast & chime
            const latestIncoming = [...relevantMessages]
              .reverse()
              .find(m => m.senderId !== currentUser.id && m.timestamp > lastRead);

            if (latestIncoming && latestIncoming.id !== lastAlertedChatMsgIdRef.current) {
              lastAlertedChatMsgIdRef.current = latestIncoming.id;
              // Play chime
              try { webAudio.playNotification(); } catch {}
              // Show floating alert toast if chat is not open
              setIncomingChatAlert({
                id: latestIncoming.id,
                senderId: latestIncoming.senderId,
                senderName: latestIncoming.senderName || 'Staff Member',
                senderRole: latestIncoming.senderRole || 'HR',
                avatar: latestIncoming.avatar || 'U',
                text: latestIncoming.text,
                channel: latestIncoming.channel,
                isDm: Boolean(latestIncoming.channel?.startsWith('dm_') || latestIncoming.recipientId)
              });
            }
          }
        }
      } catch {}
    };

    updateUnreadCount();
    // Fast 2-second polling for real-time responsiveness across devices
    const interval = setInterval(updateUnreadCount, 2000);

    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('flux_crm_chat_bus');
        bc.onmessage = () => updateUnreadCount();
      }
    } catch {}

    return () => {
      clearInterval(interval);
      if (bc) bc.close();
    };
  }, [currentUser]);

  // Auto-dismiss chat alert after 6 seconds
  useEffect(() => {
    if (!incomingChatAlert) return;
    const timer = setTimeout(() => {
      setIncomingChatAlert(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [incomingChatAlert]);

  const handleOpenChat = (target = null) => {
    if (target && target.channel) {
      setChatInitialTarget(target);
    } else {
      setChatInitialTarget({ channel: 'team' });
    }
    setIsInternalChatOpen(true);
    setUnreadChatCount(0);
    setIncomingChatAlert(null);
    try {
      if (currentUser?.id) {
        localStorage.setItem(`tacrm_chat_last_read_${currentUser.id}`, new Date().toISOString());
      }
    } catch {}
  };

  // Global Quick Action Modals & Action Sheet
  const [isGlobalNewMenuOpen, setIsGlobalNewMenuOpen] = useState(false);
  const [isGlobalDriveModalOpen, setIsGlobalDriveModalOpen] = useState(false);
  const [isGlobalStudentModalOpen, setIsGlobalStudentModalOpen] = useState(false);
  const [isGlobalTpoModalOpen, setIsGlobalTpoModalOpen] = useState(false);
  const [isGlobalQuickCallModalOpen, setIsGlobalQuickCallModalOpen] = useState(false);
  const [isGlobalFollowUpModalOpen, setIsGlobalFollowUpModalOpen] = useState(false);
  
  // HR Personal Calling Phone Line
  const [hrPhoneNumber, setHrPhoneNumber] = useState(() => {
    const saved = localStorage.getItem('tacrm_hr_phone');
    if (saved === '+91 98201 55432') {
      localStorage.removeItem('tacrm_hr_phone');
      return '';
    }
    return saved || '';
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
      try { localStorage.setItem('tacrm_app_installed', 'true'); } catch (e) {}
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      addToast('Flux TA CRM installed successfully as native Web App!', 'success');
    });
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(({ outcome }) => {
        if (outcome === 'accepted') {
          try { localStorage.setItem('tacrm_app_installed', 'true'); } catch (e) {}
          setDeferredPrompt(null);
          setIsAppInstalled(true);
          addToast('Flux TA CRM installed successfully as native Web App!', 'success');
        } else {
          setIsInstallModalOpen(true);
        }
      }).catch(() => {
        setIsInstallModalOpen(true);
      });
    } else {
      setIsInstallModalOpen(true);
    }
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
      appName: 'Flux TA CRM',
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
    a.download = `Flux_Backup_${new Date().toISOString().split('T')[0]}.json`;
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

  // Live Timer Effect: only tick when call is active AND timerRunning is true
  useEffect(() => {
    let timer = null;
    if (callState.active && callState.timerRunning) {
      timer = setInterval(() => {
        setCallState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState.active, callState.timerRunning]);

  // Start Call Timer Handler (invoked when user clicks "Dial on Mobile" or clicks the timer)
  const handleStartTimer = () => {
    setCallState(prev => ({ ...prev, timerRunning: true }));
  };

  const handleToggleTimer = () => {
    setCallState(prev => ({ ...prev, timerRunning: !prev.timerRunning }));
  };

  const handleUpdateCallRecipientPhone = (newPhone) => {
    const trimmed = (newPhone || '').trim();
    setCallState(prev => ({ ...prev, recipientPhone: trimmed }));
    if (!trimmed) return;

    // Automatically persist to matching student in CRM roster so user never has to re-enter
    setStudents(prev => prev.map(s => {
      if ((callState.relatedEntityId && s.id === callState.relatedEntityId) ||
          (callState.studentData?.id && s.id === callState.studentData.id)) {
        return { ...s, phone: trimmed };
      }
      const stuName = (s.name || '').trim().toLowerCase();
      const callName = (callState.recipientName || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
      if (stuName && callName && (stuName === callName || callName.includes(stuName) || stuName.includes(callName))) {
        return { ...s, phone: trimmed };
      }
      return s;
    }));

    // Also persist to formResponses
    setFormResponses(prev => prev.map(r => {
      const respName = (r.name || '').trim().toLowerCase();
      const callName = (callState.recipientName || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
      if (respName && callName && (respName === callName || callName.includes(respName) || respName.includes(callName))) {
        return { ...r, phone: trimmed };
      }
      return r;
    }));

    // Also persist to followUps
    setFollowUps(prev => prev.map(f => {
      if (callState.relatedEntityId && f.id === callState.relatedEntityId) {
        return { ...f, phone: trimmed };
      }
      const fupName = (f.entityTitle || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
      const callName = (callState.recipientName || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
      if (fupName && callName && (fupName === callName || callName.includes(fupName) || fupName.includes(callName))) {
        return { ...f, phone: trimmed };
      }
      return f;
    }));
  };

  // Start Call Handler - Multi-source lookup so student phone is ALWAYS auto-filled from posting
  const handleStartCall = ({ recipientType, recipientName, recipientDetail, recipientPhone, type = 'AUDIO', tpoId, studentId, followUpId, student }) => {
    webAudio.startRinging();
    const caller = currentUser || { name: 'HR Agent', id: 'agent-1' };
    
    // Dynamic phone lookup: check all possible stores so user never has to re-enter
    let resolvedPhone = (recipientPhone || '').trim();
    if (!resolvedPhone && student?.phone) {
      resolvedPhone = student.phone.trim();
    }

    const cleanRecipientName = (recipientName || '')
      .replace(/\s*\([^)]*\)/g, '')
      .replace(/\s*-\s*.*$/, '')
      .trim()
      .toLowerCase();

    // 1. Search students roster (by studentId, exact name, or substring match)
    let matchedStudent = student || null;
    if (!resolvedPhone || !matchedStudent) {
      const matchStu = students.find(s => {
        if (studentId && s.id === studentId) return true;
        const stuName = (s.name || '').trim().toLowerCase();
        if (!stuName || !cleanRecipientName) return false;
        return stuName === cleanRecipientName || 
               cleanRecipientName.includes(stuName) || 
               stuName.includes(cleanRecipientName);
      });
      if (matchStu) {
        matchedStudent = matchStu;
        if (!resolvedPhone && matchStu.phone) resolvedPhone = matchStu.phone.trim();
      }
    }

    // 2. Search formResponses (Intake candidate roster)
    if (!resolvedPhone) {
      const matchResp = formResponses.find(r => {
        const respName = (r.name || '').trim().toLowerCase();
        if (!respName || !cleanRecipientName) return false;
        return respName === cleanRecipientName || 
               cleanRecipientName.includes(respName) || 
               respName.includes(cleanRecipientName);
      });
      if (matchResp?.phone) resolvedPhone = matchResp.phone.trim();
    }

    // 3. Search TPOs directory if recipient is a TPO or contact
    if (!resolvedPhone) {
      const matchTpo = tpos.find(t => {
        if (tpoId && t.id === tpoId) return true;
        const tpoName = (t.name || '').trim().toLowerCase();
        if (!tpoName || !cleanRecipientName) return false;
        return tpoName === cleanRecipientName || 
               cleanRecipientName.includes(tpoName) || 
               tpoName.includes(cleanRecipientName);
      });
      if (matchTpo?.phone) resolvedPhone = matchTpo.phone.trim();
    }

    // 4. Search follow-ups if linked or by entityTitle
    if (!resolvedPhone) {
      const matchFup = followUps.find(f => {
        if (followUpId && f.id === followUpId && f.phone) return true;
        const fupName = (f.entityTitle || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
        if (!fupName || !cleanRecipientName) return false;
        return f.phone && (fupName === cleanRecipientName || cleanRecipientName.includes(fupName) || fupName.includes(cleanRecipientName));
      });
      if (matchFup?.phone) resolvedPhone = matchFup.phone.trim();
    }

    // 5. Extract phone from recipientDetail or anywhere in parameters
    if (!resolvedPhone && recipientDetail) {
      const phoneMatch = recipientDetail.match(/(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}|\b[6-9]\d{9}\b/);
      if (phoneMatch) resolvedPhone = phoneMatch[0].trim();
    }

    setCallState({
      active: true,
      timerRunning: false, // DO NOT start timer on call open; starts only after clicking "Dial on Mobile" or clicking timer
      type: type === 'VIDEO' ? 'VIDEO' : 'AUDIO',
      recipientType: recipientType || (matchedStudent ? 'STUDENT' : 'CONTACT'),
      recipientName: recipientName || 'Campus Contact',
      recipientDetail: recipientDetail || '',
      recipientPhone: resolvedPhone || '',
      callerName: caller.name,
      internId: caller.id,
      duration: 0,
      startTime: new Date().toISOString(),
      relatedEntityId: studentId || tpoId || followUpId || matchedStudent?.id || null,
      studentData: matchedStudent
    });
    setIsCallMinimized(false);

    // Update user status to 'on-call'
    setUsers(prev => prev.map(u => u.id === caller.id ? { ...u, status: 'on-call' } : u));
    addToast(`Opened Calling Hub for ${recipientName || 'Contact'}. Click "Dial on Mobile" to connect & begin timer.`, 'info');
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

    // Open Disposition Modal with logged duration and preserved phone
    setDispositionData({
      internId: finalState.internId,
      internName: finalState.callerName,
      recipientType: finalState.recipientType,
      recipientName: finalState.recipientName,
      recipientPhone: finalState.recipientPhone || '',
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

    // 1. Create Call Session Record with recipientPhone
    const newSession = {
      id: `call-${Date.now()}`,
      internId: dispositionData.internId,
      internName: dispositionData.internName,
      recipientType: dispositionData.recipientType,
      recipientName: dispositionData.recipientName,
      recipientPhone: dispositionData.recipientPhone || '',
      callType: dispositionData.callType,
      startedAt: dispositionData.startedAt,
      endedAt: dispositionData.endedAt,
      durationSeconds: dispositionData.duration,
      disposition,
      notes,
    };

    setCallSessions(prev => [newSession, ...prev]);

    // 2. If follow-up requested, append to follow-ups with preserved phone
    if (needFollowUp && followUpDate) {
      const newFup = {
        id: `fup-${Date.now()}`,
        internId: dispositionData.internId,
        internName: dispositionData.internName,
        entityType: dispositionData.recipientType,
        entityId: dispositionData.relatedEntityId || `ent-${Date.now()}`,
        entityTitle: dispositionData.recipientName,
        phone: dispositionData.recipientPhone || '',
        scheduledDate: followUpDate,
        priority: followUpPriority || 'HIGH',
        status: 'PENDING',
        notes: `Follow-up from call: ${notes}`,
      };
      setFollowUps(prev => [newFup, ...prev]);
    }

    // 3. Update TPO status if applicable
    if (dispositionData.recipientType === 'TPO') {
      let nextStatus = disposition;
      if (disposition === 'FOLLOW_UP_NEEDED' || disposition === 'CALL_AGAIN') nextStatus = 'FOLLOW_UP_NEEDED';
      else if (disposition === 'NOT_ANSWERED') nextStatus = 'NOT_ANSWERED';
      else if (disposition === 'NOT_INTERESTED') nextStatus = 'NOT_INTERESTED';
      else if (disposition === 'DRIVE_CONFIRMED') nextStatus = 'DRIVE_CONFIRMED';
      else if (disposition === 'DETAILS_SENT') nextStatus = 'DETAILS_SENT';

      setTpos(prev => prev.map(t => {
        const matchesEntityId = dispositionData.relatedEntityId && t.id === dispositionData.relatedEntityId;
        const matchesName = t.name && (t.name.includes(dispositionData.recipientName) || dispositionData.recipientName.includes(t.name));
        const matchesCollege = t.collegeName && dispositionData.recipientName.includes(t.collegeName);
        if (matchesEntityId || matchesName || matchesCollege) {
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

  // General CRM & Admin Handlers
  const handleAddTpo = (newTpo) => setTpos(prev => [newTpo, ...prev]);
  const handleAddTposBatch = (newTpos) => {
    if (!newTpos || newTpos.length === 0) return;
    setTpos(prev => [...newTpos, ...prev]);
    addToast(`Successfully imported ${newTpos.length} college TPO records!`, 'success');
  };
  const handleUpdateTpo = (updatedTpo) => {
    setTpos(prev => {
      const next = prev.map(t => t.id === updatedTpo.id ? updatedTpo : t);
      try { localStorage.setItem('tacrm_tpos', JSON.stringify(next)); } catch (e) {}
      fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tpos: next })
      }).catch(() => {});
      return next;
    });
    addToast(`Updated details for ${updatedTpo.name} (${updatedTpo.collegeName})`, 'success');
  };
  const handleUpdateTpoStatus = (tpoId, newStatus) => {
    setTpos(prev => {
      const next = prev.map(t => t.id === tpoId ? { ...t, status: newStatus, lastContacted: new Date().toISOString().split('T')[0] } : t);
      try { localStorage.setItem('tacrm_tpos', JSON.stringify(next)); } catch (e) {}
      fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tpos: next })
      }).catch(() => {});
      return next;
    });
    addToast(`Updated lead stage to ${newStatus.replace(/_/g, ' ')}`, 'success');
  };
  const handleCreateDrive = (newDrive) => {
    setDrives(prev => {
      const next = [newDrive, ...prev];
      try { localStorage.setItem('tacrm_drives', JSON.stringify(next)); } catch (e) {}
      fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drives: next })
      }).catch(() => {});
      return next;
    });
    addToast(`Campus drive published: ${newDrive.title} (${newDrive.mode || 'Offline'})`, 'success');
  };
  const handleUpdateDrive = (updatedDrive) => setDrives(prev => prev.map(d => d.id === updatedDrive.id ? updatedDrive : d));
  const handleAddStudentsBatch = (newStudents) => {
    if (!newStudents || !newStudents.length) return;
    setStudents(prev => [...newStudents, ...prev]);
    addToast(`Successfully imported ${newStudents.length} candidate(s) to campus board!`, 'success');
  };
  const handleUpdateStudent = (updatedStudent) => setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
  const handleUpdateCandidateStage = (studentId, nextStage) => setStudents(prev => prev.map(s => s.id === studentId ? { ...s, stage: nextStage } : s));
  const handleBatchUpdateStudents = (updatedStudentsList) => {
    if (!Array.isArray(updatedStudentsList) || !updatedStudentsList.length) return;
    setStudents(prev => {
      const updateMap = new Map(updatedStudentsList.map(s => [s.id, s]));
      const next = prev.map(s => updateMap.has(s.id) ? { ...s, ...updateMap.get(s.id) } : s);
      try { localStorage.setItem('tacrm_students', JSON.stringify(next)); } catch (e) {}
      fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: next })
      }).catch(() => {});
      return next;
    });
  };
  const handleAddFollowUp = (newFup) => setFollowUps(prev => [newFup, ...prev]);
  const handleUpdateFollowUp = (updatedFup) => setFollowUps(prev => prev.map(f => f.id === updatedFup.id ? updatedFup : f));
  
  // Call session handlers
  const handleAddCallSession = (newCall) => setCallSessions(prev => [newCall, ...prev]);
  const handleUpdateCallSession = (updatedCall) => setCallSessions(prev => prev.map(c => c.id === updatedCall.id ? updatedCall : c));

  // Admin User Provisioning Handlers
  const handleAddUser = async (newUser) => {
    setUsers(prev => {
      const next = sanitizeUsers([newUser, ...prev.filter(u => u.id !== newUser.id)]);
      try { localStorage.setItem('tacrm_users', JSON.stringify(next)); } catch (e) {}
      return next;
    });

    // Cloud sync via Supabase if configured
    if (isSupabaseConfigured()) {
      upsertSupabaseUser(newUser).catch(() => {});
    }

    try {
      const res = await fetch('/api/users/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: newUser }),
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  };

  const handleUpdateUser = async (updatedUser) => {
    setUsers(prev => {
      const next = sanitizeUsers(prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      try { localStorage.setItem('tacrm_users', JSON.stringify(next)); } catch (e) {}
      return next;
    });

    // Cloud sync via Supabase if configured
    if (isSupabaseConfigured()) {
      upsertSupabaseUser(updatedUser).catch(() => {});
    }

    try {
      const res = await fetch('/api/users/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: updatedUser }),
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  };

  const handleDeleteUser = async (userId) => {
    setUsers(prev => {
      const next = sanitizeUsers(prev.filter(u => u.id !== userId));
      try { localStorage.setItem('tacrm_users', JSON.stringify(next)); } catch (e) {}
      return next;
    });

    // Cloud sync via Supabase if configured
    if (isSupabaseConfigured()) {
      deleteSupabaseUser(userId).catch(() => {});
    }

    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      return res.ok;
    } catch (err) {
      return false;
    }
  };
  
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
    { id: 'drives', name: 'Drives', category: 'Main', icon: <Calendar size={15} /> },
    { id: 'liveBoard', name: 'Students', category: 'Main', icon: <Users size={15} /> },
    { id: 'tpos', name: 'College TPOs', category: 'Outreach & Calls', icon: <Building2 size={15} /> },
    { id: 'pipeline', name: 'Lead Pipeline', category: 'Outreach & Calls', icon: <GitFork size={15} /> },
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

  // If user is not authenticated, render Login Screen with direct Install capability
  if (!currentUser) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} users={users} onInstallApp={handleInstallApp} isAppInstalled={isAppInstalled} />
        <InstallAppModal 
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
          deferredPrompt={deferredPrompt}
          onNativeInstall={() => {
            if (deferredPrompt) {
              deferredPrompt.prompt();
              deferredPrompt.userChoice.then(({ outcome }) => {
                if (outcome === 'accepted') {
                  try { localStorage.setItem('tacrm_app_installed', 'true'); } catch (e) {}
                  setDeferredPrompt(null);
                  setIsAppInstalled(true);
                  addToast('Flux TA CRM installed as native app!', 'success');
                }
                setIsInstallModalOpen(false);
              });
            }
          }}
        />
      </>
    );
  }

  return (
    <div className="app-container">
      {/* Sleek Top Navbar with Install App Button */}
      <TopNavbar 
        currentUser={currentUser}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => {
          if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(prev => !prev);
          } else {
            setIsSidebarCollapsed(prev => !prev);
          }
        }}
        onOpenSearch={() => setIsCommandPaletteOpen(true)}
        onOpenChat={handleOpenChat}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        onInstallApp={handleInstallApp}
        isAppInstalled={isAppInstalled}
        unreadChatCount={unreadChatCount}
      />


      {/* Main Layout Container */}
      <div className="app-main-layout">
        {/* Mobile Sidebar Backdrop */}
        <div 
          className={`mobile-sidebar-backdrop ${isMobileSidebarOpen ? 'active' : ''}`} 
          onClick={() => setIsMobileSidebarOpen(false)} 
          aria-hidden="true"
        />

        {/* Sidebar Navigation (Desktop and Off-Canvas Mobile Drawer) */}
        <aside className={`sidebar ${isSidebarCollapsed && !isMobileSidebarOpen ? 'collapsed' : ''} ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
          {/* Mobile drawer header & Install Mobile Card (visible only in mobile off-canvas drawer) */}
          {isMobileSidebarOpen && (
            <div>
              <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', background: '#ffffff' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#154360' }}>Navigation Menu</span>
                <button 
                  type="button"
                  className="btn-icon"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  title="Close navigation menu"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Install Mobile Web App Card */}
              {!isAppInstalled && (
                <div className="mobile-drawer-install-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="drawer-install-icon-wrap">
                      <Smartphone size={18} color="#154360" />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#154360' }}>Install Mobile App</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>1-Tap Home Screen & Offline Mode</div>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { setIsMobileSidebarOpen(false); handleInstallApp(); }}
                    className="btn-mustard"
                    style={{ padding: '7px 12px', fontSize: '0.76rem', fontWeight: 800, width: '100%', marginTop: '10px', justifyContent: 'center' }}
                  >
                    <Download size={13} /> Install App
                  </button>
                </div>
              )}
            </div>
          )}

        <nav className="sidebar-nav">
          <div className="nav-section-title">Main</div>

          <button 
            onClick={() => { setActiveTab('dashboard'); setIsMobileSidebarOpen(false); }}
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            title="Dashboard"
          >
            <span className="nav-label">{currentUser.role === 'ADMIN' ? 'Admin Dashboard' : 'Dashboard'}</span>
            {activeTab === 'dashboard' && (
              <span style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#FFDB58' }} />
            )}
          </button>

          <button 
            onClick={() => { setActiveTab('overview'); setIsMobileSidebarOpen(false); }}
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            title="Overview"
          >
            <span className="nav-label">Overview</span>
            {activeTab === 'overview' && (
              <span style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#FFDB58' }} />
            )}
          </button>

          <button 
            onClick={() => { setActiveTab('drives'); setIsMobileSidebarOpen(false); }}
            className={`nav-item ${activeTab === 'drives' ? 'active' : ''}`}
            title="Drives"
          >
            <span className="nav-label">Drives</span>
            {activeTab === 'drives' && (
              <span style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#FFDB58' }} />
            )}
          </button>

          <button 
            onClick={() => { setActiveTab('liveBoard'); setIsMobileSidebarOpen(false); }}
            className={`nav-item ${activeTab === 'liveBoard' ? 'active' : ''}`}
            title="Students"
          >
            <span className="nav-label">Students</span>
            {activeTab === 'liveBoard' && (
              <span style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#FFDB58' }} />
            )}
          </button>

          <div className="nav-section-title">Outreach & Calls</div>

          <button 
            onClick={() => { setActiveTab('tpos'); setIsMobileSidebarOpen(false); }}
            className={`nav-item ${activeTab === 'tpos' ? 'active' : ''}`}
            title="College TPOs"
          >
            <span className="nav-label">College TPOs</span>
            {activeTab === 'tpos' && (
              <span style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#FFDB58' }} />
            )}
          </button>

          <button 
            onClick={() => { setActiveTab('pipeline'); setIsMobileSidebarOpen(false); }}
            className={`nav-item ${activeTab === 'pipeline' ? 'active' : ''}`}
            title="Lead Pipeline"
          >
            <span className="nav-label">Pipeline</span>
            {activeTab === 'pipeline' && (
              <span style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#FFDB58' }} />
            )}
          </button>

          <button 
            onClick={() => { setActiveTab('followups'); setIsMobileSidebarOpen(false); }}
            className={`nav-item ${activeTab === 'followups' ? 'active' : ''}`}
            title="Follow-Ups"
          >
            <span className="nav-label">Follow-Ups</span>
            {activeTab === 'followups' && (
              <span style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#FFDB58' }} />
            )}
          </button>

          <button 
            onClick={() => { setActiveTab('calls'); setIsMobileSidebarOpen(false); }}
            className={`nav-item ${activeTab === 'calls' ? 'active' : ''}`}
            title="Call Logs"
          >
            <span className="nav-label">Call Logs</span>
            {activeTab === 'calls' && (
              <span style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#FFDB58' }} />
            )}
          </button>

          {!isAppInstalled && (
            <>
              <div className="nav-section-title">App Installation</div>

              <button 
                onClick={() => { setIsMobileSidebarOpen(false); handleInstallApp(); }}
                className="nav-item"
                title="Install Flux TA CRM as an App"
              >
                <Smartphone size={15} color="#10b981" />
                <span className="nav-label" style={{ color: '#10b981', fontWeight: 700 }}>Install App</span>
              </button>
            </>
          )}
        </nav>

        {/* Current User Card in Sidebar with Logout */}
        <div className="sidebar-user">
          <div className="user-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden', flex: 1 }}>
              <div className="user-avatar" style={{ flexShrink: 0, ...(currentUser.role === 'ADMIN' ? { background: '#154360', color: '#FFDB58', border: '2px solid #FFDB58' } : {}) }}>
                {currentUser.role === 'ADMIN' ? 'AD' : (currentUser.avatar || 'U')}
                <span className={`status-indicator-dot ${currentUser.status === 'on-call' ? 'on-call' : 'online'}`} />
              </div>
              <div className="user-details user-card-info" style={{ minWidth: 0, overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#09090b', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.role === 'ADMIN' ? 'Geonixa Admin' : (currentUser.name === 'Main HR Manager' || currentUser.name === 'Main HR' ? 'HR Manager' : currentUser.name)}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.role === 'ADMIN' ? 'Super Admin' : currentUser.role === 'MAIN_HR' ? 'HR Manager' : 'HR Intern'}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsLogoutModalOpen(true)} 
              className="btn-icon" 
              style={{ width: '26px', height: '26px', flexShrink: 0 }}
              title="Sign Out"
            >
              <LogOut size={12} color="#71717a" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="main-content">
        {/* Page Body Viewport */}
        <main className="page-body">
          <React.Suspense fallback={
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#154360', fontWeight: 700 }}>
              <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
              Loading view...
            </div>
          }>
          {activeTab === 'dashboard' && (
            isMobile ? (
              <MobileCallingHub 
                currentUser={currentUser}
                students={students}
                tpos={tpos}
                drives={drives}
                followUps={followUps}
                callSessions={callSessions}
                onSelectTab={setActiveTab}
                onStartCall={handleStartCall}
                onOpenQuickCall={() => setIsGlobalQuickCallModalOpen(true)}
                onOpenChat={handleOpenChat}
                onOpenPhoneConnect={() => setIsPhoneConnectModalOpen(true)}
                hrPhoneNumber={hrPhoneNumber}
                unreadChatCount={unreadChatCount}
              />
            ) : currentUser.role === 'ADMIN' ? (
              <AdminDashboard 
                users={users}
                drives={drives}
                students={students}
                tpos={tpos}
                followUps={followUps}
                callSessions={callSessions}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                onAddDrive={handleCreateDrive}
                onUpdateDrive={handleUpdateDrive}
                onDeleteDrive={handleDeleteDrive}
                onClearAllDrives={handleClearAllDrives}
                onAddStudent={handleAddStudentsBatch}
                onUpdateStudent={handleUpdateStudent}
                onDeleteStudent={handleDeleteStudent}
                onAddTpo={handleAddTpo}
                onAddTposBatch={handleAddTposBatch}
                onUpdateTpo={handleUpdateTpo}
                onDeleteTpo={handleDeleteTpo}
                onAddFollowUp={handleAddFollowUp}
                onUpdateFollowUp={handleUpdateFollowUp}
                onDeleteFollowUp={handleDeleteFollowUp}
                onAddCallSession={handleAddCallSession}
                onUpdateCallSession={handleUpdateCallSession}
                onDeleteCallSession={handleDeleteCallSession}
                onStartCall={handleStartCall}
                onSelectTab={setActiveTab}
                onLoadDemoData={handleLoadDemoData}
                defaultTab="staff"
              />
            ) : currentUser.role === 'MAIN_HR' ? (
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
                onUpdateStudent={handleUpdateStudent}
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

          {activeTab === 'overview' && (
            <DashboardOverview 
              tpos={tpos}
              drives={drives}
              students={students}
              users={users}
              onUpdateStudent={handleUpdateStudent}
              onStartCall={handleStartCall}
              onSelectTab={setActiveTab}
              onLoadDemoData={handleLoadDemoData}
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
              onAddTposBatch={handleAddTposBatch}
              onUpdateTpo={handleUpdateTpo}
              onDeleteTpo={handleDeleteTpo}
              onUpdateTpoStatus={handleUpdateTpoStatus}
              onScheduleFollowUp={handleScheduleFollowUpFromTpo}
            />
          )}

          {activeTab === 'pipeline' && (
            <LeadPipeline 
              tpos={tpos}
              colleges={colleges}
              users={users}
              currentRole={currentUser.role}
              onStartCall={handleStartCall}
              onUpdateTpoStatus={handleUpdateTpoStatus}
              onScheduleFollowUp={handleScheduleFollowUpFromTpo}
              onAddTpo={handleAddTpo}
            />
          )}

          {activeTab === 'drives' && (
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
              onDeleteStudent={currentUser?.role === 'ADMIN' ? handleDeleteStudent : null}
              onDeleteDrive={currentUser?.role === 'ADMIN' ? handleDeleteDrive : null}
              onClearAllDrives={currentUser?.role === 'ADMIN' ? handleClearAllDrives : null}
              onLoadDemoData={handleLoadDemoData}
              defaultTab="drives"
              hrPhoneNumber={hrPhoneNumber}
              onOpenPhoneConnectModal={() => setIsPhoneConnectModalOpen(true)}
              onNavigateToLiveBoard={() => setActiveTab('liveBoard')}
            />
          )}

          {activeTab === 'liveBoard' && (
            <PublishedDriveBoard 
              drives={drives}
              students={students}
              formResponses={formResponses}
              onStartCall={handleStartCall}
              onDeleteStudent={handleDeleteStudent}
              onAddStudentsBatch={handleAddStudentsBatch}
              onUpdateCandidateStage={handleUpdateCandidateStage}
              onLoadDemoData={handleLoadDemoData}
              hrPhoneNumber={hrPhoneNumber}
              onOpenPhoneConnectModal={() => setIsPhoneConnectModalOpen(true)}
              onNavigateToDrives={() => setActiveTab('drives')}
              onOpenNewStudentModal={() => setIsGlobalStudentModalOpen(true)}
              onBatchUpdateStudents={handleBatchUpdateStudents}
              addToast={addToast}
              currentUser={currentUser}
              users={users}
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
                  <h2 className="card-title" style={{ fontSize: '0.95rem', color: '#154360', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <PhoneCall size={16} color="#154360" /> All Logged Call Records & Talk Time
                  </h2>
                  <p className="card-subtitle" style={{ fontSize: '0.75rem' }}>
                    Total talk time clocked: <strong style={{ color: '#154360' }}>{formatDuration(callSessions.reduce((s, c) => s + (c.durationSeconds || 0), 0))}</strong> across {callSessions.length} total sessions
                  </p>
                </div>
              </div>

              {/* Desktop Table View - Compact, small font, NO horizontal scroll */}
              <div className="desktop-only" style={{ width: '100%', overflowX: 'hidden' }}>
                <table className="crm-table" style={{ width: '100%', tableLayout: 'auto' }}>
                  <thead>
                    <tr>
                      <th style={{ fontSize: '0.68rem', padding: '6px 8px', background: '#154360', color: '#ffffff' }}>Date & Time</th>
                      <th style={{ fontSize: '0.68rem', padding: '6px 8px', background: '#154360', color: '#ffffff' }}>HR Caller</th>
                      <th style={{ fontSize: '0.68rem', padding: '6px 8px', background: '#154360', color: '#ffffff' }}>Recipient</th>
                      <th style={{ fontSize: '0.68rem', padding: '6px 8px', background: '#154360', color: '#ffffff' }}>Mode</th>
                      <th style={{ fontSize: '0.68rem', padding: '6px 8px', background: '#154360', color: '#ffffff' }}>Duration</th>
                      <th style={{ fontSize: '0.68rem', padding: '6px 8px', background: '#154360', color: '#ffffff' }}>Outcome</th>
                      <th style={{ fontSize: '0.68rem', padding: '6px 8px', background: '#154360', color: '#ffffff' }}>Notes</th>
                      <th style={{ width: '30px', padding: '6px 4px', background: '#154360', color: '#ffffff' }}></th>
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

              {/* Mobile Card View - Clean, compact, expandable accordion */}
              <div className="mobile-only" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', boxSizing: 'border-box' }}>
                {callSessions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 10px', color: '#71717a', fontSize: '0.78rem' }}>
                    No calls recorded yet.
                  </div>
                ) : (
                  callSessions.map(c => {
                    const isExpanded = !!expandedCallIds[c.id];
                    return (
                      <div 
                        key={c.id} 
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: isExpanded ? '4px' : '0px',
                          width: '100%',
                          boxSizing: 'border-box',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Row 1: Clickable Recipient Name, duration badge & chevron */}
                        <div 
                          onClick={() => toggleCallExpand(c.id)}
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#154360', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {c.callType === 'VIDEO' ? <Video size={12} color="#154360" /> : <Phone size={12} color="#154360" />}
                              {c.recipientName}
                            </span>
                            <span className="badge badge-grey" style={{ fontSize: '0.62rem', padding: '1px 4px' }}>
                              {c.recipientType}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              background: '#ebf5fb',
                              color: '#154360',
                              border: '1px solid #aed6f1',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {formatDuration(c.durationSeconds)}
                            </span>
                            {isExpanded ? <ChevronUp size={14} color="#154360" /> : <ChevronDown size={14} color="#64748b" />}
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px dashed #e2e8f0', paddingTop: '6px', marginTop: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: '#71717a' }}>
                              <span>Caller: <strong style={{ color: '#154360' }}>{c.internName}</strong></span>
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
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
          </React.Suspense>
        </main>
      </div>
      </div> {/* closes app-main-layout */}

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

              {!isAppInstalled && (
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
                    <span style={{ fontWeight: 600 }}>Install App</span>
                  </div>
                </button>
              )}

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
          onClick={() => { setActiveTab('drives'); setIsMobileSidebarOpen(false); }} 
          className={`mobile-nav-btn ${activeTab === 'drives' ? 'active' : ''}`}
          style={activeTab === 'drives' ? { color: '#154360' } : {}}
        >
          <Calendar size={18} color={activeTab === 'drives' ? '#154360' : undefined} />
          <span style={activeTab === 'drives' ? { fontWeight: 700 } : {}}>Drives</span>
        </button>
        <button 
          type="button"
          onClick={() => { setActiveTab('liveBoard'); setIsMobileSidebarOpen(false); }} 
          className={`mobile-nav-btn ${activeTab === 'liveBoard' ? 'active' : ''}`}
          style={activeTab === 'liveBoard' ? { color: '#154360' } : {}}
        >
          <Users size={18} color={activeTab === 'liveBoard' ? '#154360' : undefined} />
          <span style={activeTab === 'liveBoard' ? { fontWeight: 700 } : {}}>Students</span>
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
        users={users}
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
        onGoToIntake={() => setActiveTab('liveBoard')}
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
        onStartTimer={handleStartTimer}
        onToggleTimer={handleToggleTimer}
        onUpdateRecipientPhone={handleUpdateCallRecipientPhone}
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
                addToast('Flux TA CRM installed as native app!', 'success');
              }
              setIsInstallModalOpen(false);
            });
          }
        }}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          handleLogout();
        }}
        currentUser={currentUser}
      />

      {/* Real-time Incoming Chat Alert Toast Banner */}
      {incomingChatAlert && (
        <div 
          style={{
            position: 'fixed',
            top: '64px',
            right: '16px',
            zIndex: 99999,
            maxWidth: '380px',
            width: 'calc(100vw - 32px)',
            background: 'linear-gradient(135deg, #0d1f2d 0%, #154360 100%)',
            border: '1.5px solid #FFDB58',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 15px rgba(255, 219, 88, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            color: '#ffffff'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#1b557a',
            color: '#FFDB58',
            fontWeight: 800,
            fontSize: '0.82rem',
            border: '1.5px solid #FFDB58',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {incomingChatAlert.avatar || 'U'}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {incomingChatAlert.senderName}
              </span>
              <span style={{
                fontSize: '0.58rem',
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: '4px',
                background: incomingChatAlert.isDm ? 'rgba(56, 189, 248, 0.2)' : 'rgba(250, 204, 21, 0.2)',
                color: incomingChatAlert.isDm ? '#38bdf8' : '#facc15',
                border: incomingChatAlert.isDm ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(250, 204, 21, 0.4)'
              }}>
                {incomingChatAlert.isDm ? 'Direct Message' : 'Team Hub'}
              </span>
            </div>
            <div style={{
              fontSize: '0.78rem',
              color: '#cbd5e1',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              "{incomingChatAlert.text}"
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => {
                handleOpenChat({
                  channel: incomingChatAlert.isDm ? 'dm' : 'team',
                  senderId: incomingChatAlert.senderId,
                  senderName: incomingChatAlert.senderName
                });
                setIncomingChatAlert(null);
              }}
              style={{
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '0.74rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Reply
            </button>
            <button
              type="button"
              onClick={() => setIncomingChatAlert(null)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '6px',
                padding: '5px',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Internal Team Chat Drawer Modal */}
      <InternalChatModal 
        isOpen={isInternalChatOpen}
        onClose={() => setIsInternalChatOpen(false)}
        currentUser={currentUser}
        users={users}
        initialTarget={chatInitialTarget}
        onClearInitialTarget={() => setChatInitialTarget(null)}
      />
    </div>
  );
}
