import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Calendar, 
  Award, 
  UserCheck, 
  ShieldCheck, 
  CheckCircle2, 
  Search, 
  PhoneCall, 
  Edit3, 
  X, 
  ChevronRight, 
  Sparkles,
  Check,
  Clock,
  Filter,
  Users
} from 'lucide-react';

// Live calculation of elapsed days between joining date and current date
export function getDaysEmployed(joiningDate) {
  if (!joiningDate) return 0;
  const join = new Date(joiningDate);
  const now = new Date();
  if (isNaN(join.getTime())) return 0;
  const diffTime = now.getTime() - join.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export default function DashboardOverview({
  tpos = [],
  drives = [],
  students = [],
  users = [],
  onUpdateStudent,
  onStartCall,
  onSelectTab
}) {
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL' | 'PAST_30' | 'PAST_90'
  const [overviewTab, setOverviewTab] = useState('all'); // 'all' | 'tpos' | 'selections' | 'retention'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Student Onboarding / Retention Edit Modal
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    onboardingStatus: 'JOINED',
    joiningDate: '',
    employmentStatus: 'IN_PROGRESS_30_DAYS',
    milestoneVerified: false,
    employmentNotes: ''
  });

  const [notification, setNotification] = useState(null);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenEditStudent = (student) => {
    setSelectedStudentForEdit(student);
    const days = getDaysEmployed(student.joiningDate);
    const defaultEmployment = days >= 30 ? 'COMPLETED_30_DAYS' : 'IN_PROGRESS_30_DAYS';
    setEditFormData({
      onboardingStatus: student.onboardingStatus || (student.stage === 'OFFERED' ? 'OFFER_ACCEPTED' : 'JOINED'),
      joiningDate: student.joiningDate || '',
      employmentStatus: student.employmentStatus || defaultEmployment,
      milestoneVerified: !!student.milestoneVerified,
      employmentNotes: student.employmentNotes || ''
    });
  };

  const handleSaveStudentOnboarding = (e) => {
    e.preventDefault();
    if (!selectedStudentForEdit || !onUpdateStudent) return;

    const days = getDaysEmployed(editFormData.joiningDate);
    let finalEmploymentStatus = editFormData.employmentStatus;
    if (editFormData.onboardingStatus === 'JOINED' && days >= 30 && finalEmploymentStatus === 'IN_PROGRESS_30_DAYS') {
      finalEmploymentStatus = 'COMPLETED_30_DAYS';
    }

    const updated = {
      ...selectedStudentForEdit,
      onboardingStatus: editFormData.onboardingStatus,
      joiningDate: editFormData.joiningDate,
      employmentStatus: finalEmploymentStatus,
      daysEmployed: days,
      milestoneVerified: editFormData.milestoneVerified,
      employmentNotes: editFormData.employmentNotes
    };

    onUpdateStudent(updated);
    setSelectedStudentForEdit(null);
    showToast(`Updated onboarding & 30-day employment record for ${selectedStudentForEdit.name}!`);
  };

  const handleQuickVerifyMilestone = (student) => {
    if (!onUpdateStudent) return;
    const days = getDaysEmployed(student.joiningDate);
    const updated = {
      ...student,
      employmentStatus: 'COMPLETED_30_DAYS',
      milestoneVerified: true,
      daysEmployed: Math.max(days, 30),
      employmentNotes: (student.employmentNotes ? student.employmentNotes + ' | ' : '') + `Verified 30+ days milestone on ${new Date().toLocaleDateString()}`
    };
    onUpdateStudent(updated);
    showToast(`Verified 30-day employment milestone for ${student.name}!`);
  };

  // --- REAL COMPUTED RECRUITMENT METRICS (ZERO DUMMY / ZERO HARDCODED) ---

  // 1. TPO Analytics
  const tpoStats = useMemo(() => {
    const totalTpos = tpos.length;
    const contactedTpos = tpos.filter(t => ['CONTACTED', 'PITCHED', 'DRIVE_CONFIRMED', 'FOLLOW_UP'].includes(t.status)).length;
    const confirmedTpos = tpos.filter(t => t.status === 'DRIVE_CONFIRMED').length;
    const conversionRate = totalTpos > 0 ? Math.round((confirmedTpos / totalTpos) * 100) : 0;

    const detailedTpos = tpos.map(t => {
      const colDrives = drives.filter(d => d.collegeId === t.collegeId || (d.collegeName && t.collegeName && d.collegeName.toLowerCase() === t.collegeName.toLowerCase()));
      const colStudents = students.filter(s => s.collegeId === t.collegeId || (s.collegeName && t.collegeName && s.collegeName.toLowerCase() === t.collegeName.toLowerCase()));
      
      const selected = colStudents.filter(s => ['OFFERED', 'SELECTED', 'JOINED'].includes(s.stage) || s.onboardingStatus === 'JOINED' || s.onboardingStatus === 'OFFER_ACCEPTED');
      const onboarded = colStudents.filter(s => s.onboardingStatus === 'JOINED' || s.stage === 'JOINED' || s.employmentStatus === 'COMPLETED_30_DAYS' || s.employmentStatus === 'IN_PROGRESS_30_DAYS');
      const retained30 = onboarded.filter(s => {
        const days = s.daysEmployed ?? getDaysEmployed(s.joiningDate);
        return days >= 30 || s.employmentStatus === 'COMPLETED_30_DAYS' || s.milestoneVerified;
      });

      return {
        ...t,
        drivesCount: colDrives.length,
        selectedCount: selected.length,
        onboardedCount: onboarded.length,
        retained30Count: retained30.length,
        successRate: colStudents.length > 0 ? Math.round((selected.length / colStudents.length) * 100) : 0
      };
    });

    return {
      totalTpos,
      contactedTpos,
      confirmedTpos,
      conversionRate,
      list: detailedTpos
    };
  }, [tpos, drives, students]);

  // 2. Drives & Successful Drives Analytics
  const driveStats = useMemo(() => {
    const totalDrives = drives.length;

    // A drive is considered successful if real offers were issued or confirmed
    const successfulDrivesList = drives.filter(d => {
      const driveStudents = students.filter(s => s.driveId === d.id);
      const hasSelections = driveStudents.some(s => ['OFFERED', 'SELECTED', 'JOINED'].includes(s.stage) || s.onboardingStatus === 'JOINED');
      return hasSelections || (Number(d.shortlistedStudents) > 0 && d.status === 'CONFIRMED');
    });

    const successRate = totalDrives > 0 ? Math.round((successfulDrivesList.length / totalDrives) * 100) : 0;

    const detailedDrives = drives.map(d => {
      const driveStudents = students.filter(s => s.driveId === d.id);
      const selected = driveStudents.filter(s => ['OFFERED', 'SELECTED', 'JOINED'].includes(s.stage) || s.onboardingStatus === 'JOINED' || s.onboardingStatus === 'OFFER_ACCEPTED');
      const onboarded = driveStudents.filter(s => s.onboardingStatus === 'JOINED' || s.stage === 'JOINED' || s.employmentStatus === 'COMPLETED_30_DAYS' || s.employmentStatus === 'IN_PROGRESS_30_DAYS');
      const retained30 = onboarded.filter(s => {
        const days = s.daysEmployed ?? getDaysEmployed(s.joiningDate);
        return days >= 30 || s.employmentStatus === 'COMPLETED_30_DAYS' || s.milestoneVerified;
      });

      return {
        ...d,
        totalCandidates: driveStudents.length || d.registeredStudents || 0,
        selectedCandidates: selected.length,
        onboardedCandidates: onboarded.length,
        retained30Candidates: retained30.length,
        isSuccessful: selected.length > 0 || d.status === 'CONFIRMED'
      };
    });

    return {
      totalDrives,
      successfulDrives: successfulDrivesList.length,
      successRate,
      list: detailedDrives
    };
  }, [drives, students]);

  // 3. Selected Students & Onboarding Funnel Analytics
  const studentStats = useMemo(() => {
    const totalStudents = students.length;

    // Real selected candidates
    const selectedStudents = students.filter(s => 
      ['OFFERED', 'SELECTED', 'JOINED'].includes(s.stage) || 
      ['JOINED', 'OFFER_ACCEPTED', 'DOCS_PENDING'].includes(s.onboardingStatus)
    );

    // Real onboarded candidates (Day 1 Joined)
    const onboardedStudents = students.filter(s => 
      s.onboardingStatus === 'JOINED' || 
      s.stage === 'JOINED' || 
      ['COMPLETED_30_DAYS', 'IN_PROGRESS_30_DAYS'].includes(s.employmentStatus)
    );

    const offerAccepted = students.filter(s => s.onboardingStatus === 'OFFER_ACCEPTED' || (s.stage === 'OFFERED' && !s.onboardingStatus));
    const docsPending = students.filter(s => s.onboardingStatus === 'DOCS_PENDING');
    const droppedOnboarding = students.filter(s => s.onboardingStatus === 'DROPPED');

    // 4. After Onboarding: Minimum 30 Days of Employment (Retention)
    const retained30Days = onboardedStudents.filter(s => {
      const days = s.daysEmployed ?? getDaysEmployed(s.joiningDate);
      return days >= 30 || s.employmentStatus === 'COMPLETED_30_DAYS' || s.milestoneVerified;
    });

    const inProgress30Days = onboardedStudents.filter(s => {
      const days = s.daysEmployed ?? getDaysEmployed(s.joiningDate);
      return days < 30 && s.employmentStatus !== 'DROPPED_EARLY' && !s.milestoneVerified;
    });

    const earlyDropouts = students.filter(s => s.employmentStatus === 'DROPPED_EARLY');

    // Real conversion rates
    const selectionRate = totalStudents > 0 ? Math.round((selectedStudents.length / totalStudents) * 100) : 0;
    const onboardingRate = selectedStudents.length > 0 ? Math.round((onboardedStudents.length / selectedStudents.length) * 100) : 0;
    const retentionRate30 = onboardedStudents.length > 0 ? Math.round((retained30Days.length / onboardedStudents.length) * 100) : 0;

    return {
      totalStudents,
      selectedCount: selectedStudents.length,
      selectionRate,
      onboardedCount: onboardedStudents.length,
      onboardingRate,
      offerAcceptedCount: offerAccepted.length,
      docsPendingCount: docsPending.length,
      droppedOnboardingCount: droppedOnboarding.length,
      retained30Count: retained30Days.length,
      inProgress30Count: inProgress30Days.length,
      earlyDropoutsCount: earlyDropouts.length,
      retentionRate30,
      selectedStudents,
      onboardedStudents,
      retained30Days,
      inProgress30Days
    };
  }, [students]);

  // Filtered Student List for Retention Tracker
  const retentionFilteredStudents = useMemo(() => {
    return studentStats.selectedStudents.filter(student => {
      const days = student.daysEmployed ?? getDaysEmployed(student.joiningDate);
      const isRetained = days >= 30 || student.employmentStatus === 'COMPLETED_30_DAYS' || student.milestoneVerified;
      const isJoined = student.onboardingStatus === 'JOINED' || student.stage === 'JOINED' || student.employmentStatus === 'IN_PROGRESS_30_DAYS';
      const isDropped = student.employmentStatus === 'DROPPED_EARLY' || student.onboardingStatus === 'DROPPED';

      if (statusFilter === 'RETAINED_30' && !isRetained) return false;
      if (statusFilter === 'IN_PROGRESS' && (!isJoined || isRetained || isDropped)) return false;
      if (statusFilter === 'DROPPED' && !isDropped) return false;
      if (statusFilter === 'JOINED' && !isJoined) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = student.name && student.name.toLowerCase().includes(q);
        const matchCollege = student.collegeName && student.collegeName.toLowerCase().includes(q);
        const matchRoll = student.rollNumber && student.rollNumber.toLowerCase().includes(q);
        const matchBranch = student.branch && student.branch.toLowerCase().includes(q);
        if (!matchName && !matchCollege && !matchRoll && !matchBranch) return false;
      }
      return true;
    });
  }, [studentStats, statusFilter, searchQuery]);

  // Real KPI Cards (No Targets, No Hardcoded Numbers)
  const realMetricCards = [
    {
      id: 'tpos',
      title: 'College TPOs',
      value: tpoStats.totalTpos,
      subtext: `${tpoStats.confirmedTpos} Confirmed Drives`,
      badge: `${tpoStats.conversionRate}% Slot Rate`,
      icon: Building2,
      accentColor: '#154360',
      badgeBg: '#ebf5fb',
      badgeBorder: '#aed6f1'
    },
    {
      id: 'drives',
      title: 'Campus Drives',
      value: driveStats.totalDrives,
      subtext: `${driveStats.successfulDrives} Successful Drives`,
      badge: `${driveStats.successRate}% Success Rate`,
      icon: Calendar,
      accentColor: '#0e7490',
      badgeBg: '#ecfeff',
      badgeBorder: '#a5f3fc'
    },
    {
      id: 'selections',
      title: 'Selected Students',
      value: studentStats.selectedCount,
      subtext: 'Campus Job Offers Extended',
      badge: `${studentStats.selectionRate}% Selection Rate`,
      icon: Award,
      accentColor: '#6366f1',
      badgeBg: '#eef2ff',
      badgeBorder: '#c7d2fe'
    },
    {
      id: 'onboardings',
      title: 'Students Onboarded',
      value: studentStats.onboardedCount,
      subtext: 'Day 1 Joined & Verified',
      badge: `${studentStats.onboardingRate}% Join Rate`,
      icon: UserCheck,
      accentColor: '#10b981',
      badgeBg: '#f0fdf4',
      badgeBorder: '#bbf7d0'
    },
    {
      id: 'retention',
      title: 'Min 30 Days Employed',
      value: studentStats.retained30Count,
      subtext: 'Completed ≥ 30 Days Employment',
      badge: `${studentStats.retentionRate30}% Retention Rate`,
      icon: ShieldCheck,
      accentColor: '#b45309',
      badgeBg: '#fffbeb',
      badgeBorder: '#fde68a'
    }
  ];

  return (
    <div className="overview-analytics-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#154360',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 99999,
          fontSize: '0.85rem',
          fontWeight: 600,
          border: '1px solid #FFDB58'
        }}>
          <Sparkles size={16} color="#FFDB58" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner - Only Recruitment & Placement Overview Title */}
      <div style={{
        background: 'linear-gradient(135deg, #154360 0%, #0e2e42 100%)',
        color: '#ffffff',
        borderRadius: '10px',
        padding: '14px 20px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
          Recruitment & Placement Overview
        </h1>
      </div>

      {/* Top 5 Real Metric Cards (Zero Targets, Zero Hardcoding, Clean without accent lines or icons) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        {realMetricCards.map(metric => {
          return (
            <div 
              key={metric.id}
              className="metric-card"
              onClick={() => {
                if (metric.id === 'retention') setOverviewTab('retention');
                else if (metric.id === 'tpos' || metric.id === 'drives') setOverviewTab('tpos');
                else setOverviewTab('selections');
              }}
              style={{ 
                cursor: 'pointer',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.18s ease',
                border: '1px solid #e2e8f0',
                borderRadius: '10px'
              }}
            >
              <div>
                <div style={{ marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                    {metric.title}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '3px' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {metric.value}
                  </span>
                </div>

                <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '8px' }}>
                  {metric.subtext}
                </div>
              </div>

              <div>
                <span style={{ 
                  fontSize: '0.7rem', 
                  padding: '2px 7px', 
                  borderRadius: '5px',
                  background: metric.badgeBg,
                  color: metric.accentColor,
                  fontWeight: 800,
                  border: `1px solid ${metric.badgeBorder}`,
                  display: 'inline-block'
                }}>
                  {metric.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Complete Recruitment Pipeline Funnel Strip */}
      <div className="content-card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#154360' }}>
              Full Funnel Conversion Rate (Outreach → Min 30 Days Retention)
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.73rem', color: '#64748b' }}>
              Stage-by-stage real conversion efficiency from college contact to permanent 30+ day retained employment
            </p>
          </div>
          <span style={{ 
            fontSize: '0.7rem', 
            background: '#fffbeb', 
            color: '#92400e', 
            padding: '3px 8px', 
            borderRadius: '6px', 
            fontWeight: 800,
            border: '1px solid #fde68a'
          }}>
            30-Day Retention Success: {studentStats.retentionRate30}%
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'nowrap',
          width: '100%',
          overflowX: 'auto'
        }}>
          {/* Step 1: TPOs */}
          <div style={{ flex: 1, minWidth: 0, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 5px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>1. TPO Colleges</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#154360', margin: '2px 0' }}>{tpoStats.totalTpos}</div>
            <div style={{ fontSize: '0.62rem', color: '#0284c7', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tpoStats.confirmedTpos} Confirmed</div>
          </div>

          <div style={{ flexShrink: 0, textAlign: 'center', color: '#475569', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', padding: '0 2px' }}>
            → {tpoStats.conversionRate}%
          </div>

          {/* Step 2: Drives */}
          <div style={{ flex: 1, minWidth: 0, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 5px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>2. Campus Drives</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0e7490', margin: '2px 0' }}>{driveStats.totalDrives}</div>
            <div style={{ fontSize: '0.62rem', color: '#10b981', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{driveStats.successfulDrives} Successful ({driveStats.successRate}%)</div>
          </div>

          <div style={{ flexShrink: 0, textAlign: 'center', color: '#475569', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', padding: '0 2px' }}>
            → {studentStats.selectionRate}%
          </div>

          {/* Step 3: Selections */}
          <div style={{ flex: 1, minWidth: 0, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 5px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>3. Selected Students</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#6366f1', margin: '2px 0' }}>{studentStats.selectedCount}</div>
            <div style={{ fontSize: '0.62rem', color: '#6366f1', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Campus Offers</div>
          </div>

          <div style={{ flexShrink: 0, textAlign: 'center', color: '#475569', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', padding: '0 2px' }}>
            → {studentStats.onboardingRate}%
          </div>

          {/* Step 4: Onboarded */}
          <div style={{ flex: 1, minWidth: 0, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 5px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>4. Day 1 Onboarded</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981', margin: '2px 0' }}>{studentStats.onboardedCount}</div>
            <div style={{ fontSize: '0.62rem', color: '#166534', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Joined Workplace</div>
          </div>

          <div style={{ flexShrink: 0, textAlign: 'center', color: '#475569', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', padding: '0 2px' }}>
            → {studentStats.retentionRate30}%
          </div>

          {/* Step 5: 30+ Days Employed */}
          <div style={{ flex: 1, minWidth: 0, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 5px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.62rem', color: '#92400e', fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>5. 30+ Days Retained</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#b45309', margin: '2px 0' }}>{studentStats.retained30Count}</div>
            <div style={{ fontSize: '0.62rem', color: '#92400e', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Milestone Reached</div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation for Drill-Down Views (Clean without background line) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        paddingBottom: '4px'
      }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {[
            { id: 'all', label: 'All Overview' },
            { id: 'tpos', label: `TPOs & Drives (${tpoStats.totalTpos})` },
            { id: 'selections', label: `Selected Students (${studentStats.selectedCount})` },
            { id: 'retention', label: `30-Day Retention (${studentStats.retained30Count})` },
          ].map(tab => {
            const isActive = overviewTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setOverviewTab(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '7px',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 800 : 600,
                  border: '1px solid',
                  borderColor: isActive ? '#154360' : '#e2e8f0',
                  background: isActive ? '#154360' : '#ffffff',
                  color: isActive ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search and Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search candidate, college..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.76rem',
                outline: 'none',
                width: '180px'
              }}
            />
          </div>

          {overviewTab === 'retention' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.76rem',
                fontWeight: 600,
                color: '#334155'
              }}
            >
              <option value="ALL">All Candidates</option>
              <option value="RETAINED_30">Retained (30+ Days)</option>
              <option value="IN_PROGRESS">In 30-Day Window</option>
              <option value="JOINED">Joined Workplace</option>
              <option value="DROPPED">Early Attrition</option>
            </select>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* VIEW 1: ALL OVERVIEW (Executive Real Summary)                  */}
      {/* ============================================================== */}
      {overviewTab === 'all' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* 3 Summary Split Cards - Small and Compact with zero icons & zero inner lines */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '8px'
          }}>
            {/* TPO & Drive Conversion Card */}
            <div className="content-card" style={{ padding: '8px 12px', borderRadius: '7px', border: '1px solid #e2e8f0', marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: '#154360' }}>
                  TPO & Drive Success
                </h4>
                <span className="badge badge-blue" style={{ fontSize: '0.64rem', padding: '1px 5px' }}>
                  {tpoStats.conversionRate}% Conversion
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.72rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                  <span style={{ color: '#64748b' }}>Total College TPOs Contacted:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{tpoStats.contactedTpos} / {tpoStats.totalTpos}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                  <span style={{ color: '#64748b' }}>Drives Confirmed by Colleges:</span>
                  <span style={{ fontWeight: 700, color: '#154360' }}>{tpoStats.confirmedTpos}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                  <span style={{ color: '#64748b' }}>Successful Drives with Offers:</span>
                  <span style={{ fontWeight: 800, color: '#10b981' }}>{driveStats.successfulDrives} ({driveStats.successRate}%)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                  <span style={{ color: '#64748b' }}>Average Selections Per Drive:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    {driveStats.totalDrives > 0 ? (studentStats.selectedCount / driveStats.totalDrives).toFixed(1) : 0} offers/drive
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOverviewTab('tpos')}
                style={{
                  marginTop: '6px',
                  width: '100%',
                  padding: '4px',
                  borderRadius: '5px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#154360',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                View TPO & Drive Details →
              </button>
            </div>

            {/* Candidate Selection & Onboarding Card */}
            <div className="content-card" style={{ padding: '8px 12px', borderRadius: '7px', border: '1px solid #e2e8f0', marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: '#154360' }}>
                  Selections & Onboarding
                </h4>
                <span className="badge badge-green" style={{ fontSize: '0.64rem', padding: '1px 5px' }}>
                  {studentStats.onboardingRate}% Join Rate
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.72rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                  <span style={{ color: '#64748b' }}>Total Selected Candidates:</span>
                  <span style={{ fontWeight: 800, color: '#6366f1' }}>{studentStats.selectedCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                  <span style={{ color: '#64748b' }}>Successfully Onboarded (Joined):</span>
                  <span style={{ fontWeight: 800, color: '#10b981' }}>{studentStats.onboardedCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                  <span style={{ color: '#64748b' }}>Offer Accepted (Awaiting Joining):</span>
                  <span style={{ fontWeight: 700, color: '#0284c7' }}>{studentStats.offerAcceptedCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                  <span style={{ color: '#64748b' }}>Documentation Pending:</span>
                  <span style={{ fontWeight: 700, color: '#f59e0b' }}>{studentStats.docsPendingCount}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOverviewTab('selections')}
                style={{
                  marginTop: '6px',
                  width: '100%',
                  padding: '4px',
                  borderRadius: '5px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#154360',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                View Selected Candidates Roster →
              </button>
            </div>

            {/* Min 30 Days Retention Milestone Card */}
            <div className="content-card" style={{ padding: '8px 12px', borderRadius: '7px', border: '1px solid #e2e8f0', marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: '#92400e' }}>
                  Min 30 Days Retention
                </h4>
                <span className="badge badge-amber" style={{ fontSize: '0.64rem', padding: '1px 5px', background: '#fffbeb', color: '#92400e', borderColor: '#fde68a' }}>
                  {studentStats.retentionRate30}% Milestone
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.72rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                  <span style={{ color: '#64748b' }}>Completed 30+ Days Employed:</span>
                  <span style={{ fontWeight: 800, color: '#166534' }}>{studentStats.retained30Count} Retained</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                  <span style={{ color: '#64748b' }}>In 30-Day Probation Window:</span>
                  <span style={{ fontWeight: 700, color: '#b45309' }}>{studentStats.inProgress30Count} active in window</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                  <span style={{ color: '#64748b' }}>Early Attrition (&lt; 30 Days):</span>
                  <span style={{ fontWeight: 700, color: '#dc2626' }}>{studentStats.earlyDropoutsCount} dropped</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                  <span style={{ color: '#64748b' }}>Total Onboarded Candidates:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{studentStats.onboardedCount} candidates</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOverviewTab('retention')}
                style={{
                  marginTop: '6px',
                  width: '100%',
                  padding: '4px',
                  borderRadius: '5px',
                  border: '1px solid #fde68a',
                  background: '#fffdf0',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#92400e',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                Track 30-Day Employment Roster →
              </button>
            </div>
          </div>

          {/* Real Colleges & TPOs Contributing to Successful Drives - Small & Compact Table Card */}
          <div className="content-card" style={{ borderRadius: '7px', border: '1px solid #e2e8f0', marginTop: '4px' }}>
            <div className="card-header-row" style={{ padding: '8px 12px' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '0.85rem' }}>Top TPO Partnerships & Drive Performance</h3>
                <p className="card-subtitle" style={{ fontSize: '0.7rem', margin: 0 }}>Colleges driving real selections, onboardings, and retained placements</p>
              </div>
              <button 
                type="button" 
                onClick={() => setOverviewTab('tpos')}
                className="btn-secondary btn-black-sm"
                style={{ fontSize: '0.7rem', padding: '3px 8px' }}
              >
                View Full TPO Table
              </button>
            </div>

            <div className="table-wrapper">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>College & TPO</th>
                    <th>Tier</th>
                    <th>Status</th>
                    <th>Drives</th>
                    <th>Selections</th>
                    <th>Onboarded</th>
                    <th>30+ Days Retained</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tpoStats.list.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No college placement officers recorded yet.
                      </td>
                    </tr>
                  ) : (
                    tpoStats.list.slice(0, 5).map(tpo => (
                      <tr key={tpo.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#09090b', fontSize: '0.85rem' }}>{tpo.collegeName || 'College'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{tpo.name} {tpo.designation ? `(${tpo.designation})` : ''}</div>
                        </td>
                        <td>
                          <span className="badge badge-grey" style={{ fontSize: '0.68rem' }}>{tpo.tier || '-'}</span>
                        </td>
                        <td>
                          <span className={`badge ${tpo.status === 'DRIVE_CONFIRMED' ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '0.7rem' }}>
                            {tpo.status ? tpo.status.replace(/_/g, ' ') : 'LEAD'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#154360' }}>{tpo.drivesCount}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 800, color: '#6366f1' }}>{tpo.selectedCount}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 800, color: '#10b981' }}>{tpo.onboardedCount}</span>
                        </td>
                        <td>
                          <span style={{ 
                            fontWeight: 800, 
                            color: '#b45309',
                            background: '#fffdf0',
                            border: '1px solid #fde68a',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem'
                          }}>
                            {tpo.retained30Count} Retained
                          </span>
                        </td>
                        <td>
                          {onStartCall && tpo.phone && (
                            <button
                              type="button"
                              onClick={() => onStartCall({
                                recipientType: 'TPO',
                                recipientName: tpo.name,
                                recipientDetail: `${tpo.collegeName} • ${tpo.phone}`,
                                recipientPhone: tpo.phone,
                                type: 'AUDIO'
                              })}
                              className="btn-mustard btn-black-sm"
                              style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                            >
                              Call
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: TPOS & SUCCESSFUL DRIVES DRILL-DOWN                    */}
      {/* ============================================================== */}
      {overviewTab === 'tpos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Drives Outcome Summary Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Total Campus Drives</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#154360' }}>{driveStats.totalDrives}</div>
              <div style={{ fontSize: '0.7rem', color: '#475569' }}>Registered campus drives</div>
            </div>

            <div style={{ background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#0e7490', fontWeight: 600 }}>Successful Drives</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0e7490' }}>{driveStats.successfulDrives}</div>
              <div style={{ fontSize: '0.7rem', color: '#0e7490' }}>Resulted in student selections</div>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 600 }}>Drive Success Efficiency</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#166534' }}>{driveStats.successRate}%</div>
              <div style={{ fontSize: '0.7rem', color: '#166534' }}>{driveStats.successfulDrives} of {driveStats.totalDrives} drives converted</div>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 600 }}>TPO to Drive Conversion</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#92400e' }}>{tpoStats.conversionRate}%</div>
              <div style={{ fontSize: '0.7rem', color: '#92400e' }}>{tpoStats.confirmedTpos} colleges confirmed</div>
            </div>
          </div>

          {/* Drives Table */}
          <div className="content-card">
            <div className="card-header-row" style={{ padding: '12px 18px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '0.95rem' }}>Campus Recruitment Drives Breakdown</h3>
                <p className="card-subtitle">Tracking selections, onboardings, and retentions per drive</p>
              </div>
              {onSelectTab && (
                <button 
                  type="button" 
                  onClick={() => onSelectTab('drives')}
                  className="btn-secondary btn-black-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  Manage Drives & Candidates
                </button>
              )}
            </div>

            <div className="table-wrapper">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Drive Title & College</th>
                    <th>Role & CTC</th>
                    <th>Status</th>
                    <th>Candidates</th>
                    <th>Selected (Offers)</th>
                    <th>Onboarded</th>
                    <th>30+ Days Retained</th>
                    <th>Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {driveStats.list.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No campus recruitment drives recorded yet.
                      </td>
                    </tr>
                  ) : (
                    driveStats.list.map(drv => (
                      <tr key={drv.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#09090b', fontSize: '0.85rem' }}>{drv.title || 'Campus Drive'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{drv.collegeName || '-'} • {drv.driveDate || 'Date Not Set'}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#154360' }}>{drv.jobRole || '-'}</div>
                          <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>{drv.ctc || '-'}</div>
                        </td>
                        <td>
                          <span className={`badge ${drv.status === 'CONFIRMED' ? 'badge-green' : drv.status === 'IN_PROGRESS' ? 'badge-blue' : 'badge-amber'}`} style={{ fontSize: '0.7rem' }}>
                            {drv.status || 'SCHEDULED'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{drv.totalCandidates}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 800, color: '#6366f1' }}>{drv.selectedCandidates}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 800, color: '#10b981' }}>{drv.onboardedCandidates}</span>
                        </td>
                        <td>
                          <span style={{ 
                            fontWeight: 800, 
                            color: '#b45309',
                            background: '#fffdf0',
                            border: '1px solid #fde68a',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem'
                          }}>
                            {drv.retained30Candidates} Retained
                          </span>
                        </td>
                        <td>
                          {drv.selectedCandidates > 0 ? (
                            <span className="badge badge-green" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                              ✅ Successful Drive
                            </span>
                          ) : drv.status === 'CONFIRMED' ? (
                            <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>
                              Slots Confirmed
                            </span>
                          ) : (
                            <span className="badge badge-grey" style={{ fontSize: '0.68rem' }}>
                              In Pipeline
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Full College TPOs Directory */}
          <div className="content-card">
            <div className="card-header-row" style={{ padding: '12px 18px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '0.95rem' }}>College Placement Officers (TPO) Directory</h3>
                <p className="card-subtitle">Partnerships, contact details, and placement contribution</p>
              </div>
              {onSelectTab && (
                <button 
                  type="button" 
                  onClick={() => onSelectTab('tpos')}
                  className="btn-secondary btn-black-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  View TPO Outreach Board
                </button>
              )}
            </div>

            <div className="table-wrapper">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>College & TPO Head</th>
                    <th>Location & Tier</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Drives</th>
                    <th>Selections</th>
                    <th>Onboarded</th>
                    <th>30-Day Retained</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tpoStats.list.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No college placement officers found.
                      </td>
                    </tr>
                  ) : (
                    tpoStats.list.map(tpo => (
                      <tr key={tpo.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#09090b', fontSize: '0.85rem' }}>{tpo.collegeName || 'College'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{tpo.name} • {tpo.designation || 'Placement Officer'}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem', color: '#334155' }}>{tpo.city || '-'}</div>
                          <span className="badge badge-grey" style={{ fontSize: '0.65rem' }}>{tpo.tier || '-'}</span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.78rem', color: '#154360', fontWeight: 600 }}>{tpo.phone || '-'}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{tpo.email || '-'}</div>
                        </td>
                        <td>
                          <span className={`badge ${tpo.status === 'DRIVE_CONFIRMED' ? 'badge-green' : tpo.status === 'PITCHED' ? 'badge-blue' : 'badge-amber'}`} style={{ fontSize: '0.7rem' }}>
                            {tpo.status ? tpo.status.replace(/_/g, ' ') : 'LEAD'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700 }}>{tpo.drivesCount}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 800, color: '#6366f1' }}>{tpo.selectedCount}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 800, color: '#10b981' }}>{tpo.onboardedCount}</span>
                        </td>
                        <td>
                          <span style={{ 
                            fontWeight: 800, 
                            color: '#b45309',
                            background: '#fffdf0',
                            border: '1px solid #fde68a',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem'
                          }}>
                            {tpo.retained30Count} Retained
                          </span>
                        </td>
                        <td>
                          {onStartCall && tpo.phone && (
                            <button
                              type="button"
                              onClick={() => onStartCall({
                                recipientType: 'TPO',
                                recipientName: tpo.name,
                                recipientDetail: `${tpo.collegeName} • ${tpo.phone}`,
                                recipientPhone: tpo.phone,
                                type: 'AUDIO'
                              })}
                              className="btn-mustard btn-black-sm"
                              style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '4px' }}
                            >
                              <PhoneCall size={11} color="#154360" /> Call
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 3: SELECTED STUDENTS & ONBOARDING FUNNEL                  */}
      {/* ============================================================== */}
      {overviewTab === 'selections' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Onboarding Funnel Progress Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#4338ca', fontWeight: 600 }}>1. Selected Students (Offers)</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#4338ca' }}>{studentStats.selectedCount}</div>
              <div style={{ fontSize: '0.7rem', color: '#4338ca' }}>Total campus offers issued</div>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 600 }}>2. Successfully Onboarded</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#166534' }}>{studentStats.onboardedCount}</div>
              <div style={{ fontSize: '0.7rem', color: '#166534' }}>{studentStats.onboardingRate}% Join Conversion Rate</div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>3. Offer Accepted (Pending Join)</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>{studentStats.offerAcceptedCount}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Awaiting joining date</div>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 600 }}>4. Documentation Pending</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#92400e' }}>{studentStats.docsPendingCount}</div>
              <div style={{ fontSize: '0.7rem', color: '#92400e' }}>Certificates / BG verification</div>
            </div>
          </div>

          {/* Selected Candidates & Onboarding Table */}
          <div className="content-card">
            <div className="card-header-row" style={{ padding: '12px 18px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '0.95rem' }}>Selected Candidates & Onboarding Roster</h3>
                <p className="card-subtitle">Manage Day 1 joining, document clearance, and employment status</p>
              </div>
              <span className="badge badge-grey">{studentStats.selectedCount} Total Selected</span>
            </div>

            <div className="table-wrapper">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Candidate Name & Roll</th>
                    <th>College & Drive</th>
                    <th>Branch & CGPA</th>
                    <th>Onboarding Status</th>
                    <th>Joining Date</th>
                    <th>Days Active</th>
                    <th>30-Day Milestone</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {studentStats.selectedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No candidates have been selected yet.
                      </td>
                    </tr>
                  ) : (
                    studentStats.selectedStudents.map(student => {
                      const days = student.daysEmployed ?? getDaysEmployed(student.joiningDate);
                      const is30Retained = days >= 30 || student.employmentStatus === 'COMPLETED_30_DAYS' || student.milestoneVerified;
                      const isOnboarded = student.onboardingStatus === 'JOINED' || student.stage === 'JOINED' || student.employmentStatus === 'IN_PROGRESS_30_DAYS';

                      return (
                        <tr key={student.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#09090b', fontSize: '0.85rem' }}>{student.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{student.rollNumber || student.email || '-'}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#154360' }}>{student.collegeName || '-'}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{student.driveTitle || '-'}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem', color: '#334155' }}>{student.branch || '-'}</div>
                            {student.cgpa && (
                              <span className="badge badge-grey" style={{ fontSize: '0.65rem' }}>CGPA: {student.cgpa}</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${
                              isOnboarded ? 'badge-green' : 
                              student.onboardingStatus === 'OFFER_ACCEPTED' ? 'badge-blue' :
                              student.onboardingStatus === 'DOCS_PENDING' ? 'badge-amber' :
                              student.onboardingStatus === 'DROPPED' ? 'badge-grey' : 'badge-green'
                            }`} style={{ fontSize: '0.72rem' }}>
                              {student.onboardingStatus ? student.onboardingStatus.replace(/_/g, ' ') : 'JOINED'}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: student.joiningDate ? '#334155' : '#94a3b8' }}>
                              {student.joiningDate || 'Date Not Set'}
                            </div>
                          </td>
                          <td>
                            <span style={{ 
                              fontWeight: 700, 
                              color: is30Retained ? '#166534' : '#154360',
                              fontSize: '0.8rem'
                            }}>
                              {student.joiningDate ? `${days} days` : '-'}
                            </span>
                          </td>
                          <td>
                            {is30Retained ? (
                              <span style={{ 
                                background: '#dcfce7', 
                                color: '#166534', 
                                border: '1px solid #86efac', 
                                padding: '2px 8px', 
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 800
                              }}>
                                🏆 30+ Days Retained
                              </span>
                            ) : isOnboarded ? (
                              <span style={{ 
                                background: '#fef3c7', 
                                color: '#92400e', 
                                border: '1px solid #fde68a', 
                                padding: '2px 8px', 
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700
                              }}>
                                ⏳ Day {days}/30 ({Math.max(0, 30 - days)} days left)
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Pending Joining</span>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleOpenEditStudent(student)}
                              className="btn-secondary btn-black-sm"
                              style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '4px' }}
                            >
                              <Edit3 size={11} /> Update Status
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 4: MIN 30 DAYS OF EMPLOYMENT RETENTION TRACKER            */}
      {/* ============================================================== */}
      {overviewTab === 'retention' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* 30-Day Retention Highlights Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1px solid #fde68a',
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#92400e' }}>
                Post-Onboarding 30-Day Employment Milestone Tracker
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#78350f' }}>
                A candidate placement is considered fully successful and verified after completing a minimum of 30 days of active employment.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 700 }}>RETENTION SUCCESS RATE</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#b45309', lineHeight: 1 }}>{studentStats.retentionRate30}%</div>
              </div>
              <div style={{ background: '#b45309', width: '1px', height: '36px', opacity: 0.2 }} />
              <div>
                <div style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 700 }}>RETAINED & VERIFIED</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#166534', lineHeight: 1 }}>
                  {studentStats.retained30Count} <span style={{ fontSize: '0.85rem', color: '#78350f', fontWeight: 600 }}>/ {studentStats.onboardedCount} joined</span>
                </div>
              </div>
            </div>
          </div>

          {/* 30-Day Status Filter Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
            <div 
              onClick={() => setStatusFilter('ALL')}
              style={{ 
                background: statusFilter === 'ALL' ? '#ebf5fb' : '#ffffff', 
                border: `1px solid ${statusFilter === 'ALL' ? '#154360' : '#e2e8f0'}`, 
                borderRadius: '8px', 
                padding: '12px 14px',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>All Selected Candidates</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>{studentStats.selectedCount}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Click to view all</div>
            </div>

            <div 
              onClick={() => setStatusFilter('RETAINED_30')}
              style={{ 
                background: statusFilter === 'RETAINED_30' ? '#f0fdf4' : '#ffffff', 
                border: `1px solid ${statusFilter === 'RETAINED_30' ? '#166534' : '#bbf7d0'}`, 
                borderRadius: '8px', 
                padding: '12px 14px',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700 }}>30+ Days Retained</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#166534' }}>{studentStats.retained30Count}</div>
              <div style={{ fontSize: '0.7rem', color: '#166534' }}>Milestone achieved</div>
            </div>

            <div 
              onClick={() => setStatusFilter('IN_PROGRESS')}
              style={{ 
                background: statusFilter === 'IN_PROGRESS' ? '#fffbeb' : '#ffffff', 
                border: `1px solid ${statusFilter === 'IN_PROGRESS' ? '#b45309' : '#fde68a'}`, 
                borderRadius: '8px', 
                padding: '12px 14px',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 700 }}>In 30-Day Window</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#b45309' }}>{studentStats.inProgress30Count}</div>
              <div style={{ fontSize: '0.7rem', color: '#92400e' }}>Probation in progress</div>
            </div>

            <div 
              onClick={() => setStatusFilter('DROPPED')}
              style={{ 
                background: statusFilter === 'DROPPED' ? '#fef2f2' : '#ffffff', 
                border: `1px solid ${statusFilter === 'DROPPED' ? '#dc2626' : '#fecaca'}`, 
                borderRadius: '8px', 
                padding: '12px 14px',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700 }}>Early Attrition (&lt; 30 Days)</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626' }}>{studentStats.earlyDropoutsCount}</div>
              <div style={{ fontSize: '0.7rem', color: '#dc2626' }}>Dropped before 30 days</div>
            </div>
          </div>

          {/* Detailed 30-Day Retention Roster Table */}
          <div className="content-card">
            <div className="card-header-row" style={{ padding: '12px 18px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '0.95rem' }}>Candidate 30-Day Employment Progress Tracker</h3>
                <p className="card-subtitle">Showing live day count, 30-day progress bar, verification badge, and retention notes</p>
              </div>
              <span className="badge badge-amber" style={{ background: '#fffbeb', color: '#92400e' }}>
                Showing {retentionFilteredStudents.length} candidates
              </span>
            </div>

            <div className="table-wrapper">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Candidate & College</th>
                    <th>Job Title & CTC</th>
                    <th>Joining Date</th>
                    <th>Days Active</th>
                    <th style={{ minWidth: '160px' }}>30-Day Progress</th>
                    <th>Milestone Status</th>
                    <th>Verification</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {retentionFilteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No candidates match the selected 30-day retention filter.
                      </td>
                    </tr>
                  ) : (
                    retentionFilteredStudents.map(student => {
                      const days = student.daysEmployed ?? getDaysEmployed(student.joiningDate);
                      const is30Retained = days >= 30 || student.employmentStatus === 'COMPLETED_30_DAYS' || student.milestoneVerified;
                      const isDropped = student.employmentStatus === 'DROPPED_EARLY' || student.onboardingStatus === 'DROPPED';
                      const progressPct = Math.min(100, Math.round((days / 30) * 100));

                      return (
                        <tr key={student.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: is30Retained ? '#dcfce7' : '#ebf5fb',
                                color: is30Retained ? '#166534' : '#154360',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.72rem'
                              }}>
                                {student.name ? student.name.charAt(0) : 'U'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: '#09090b', fontSize: '0.85rem' }}>{student.name}</div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{student.collegeName || '-'} • {student.rollNumber || 'ID'}</div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#154360' }}>
                              {student.driveTitle || '-'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>
                              {student.ctc || (student.notes && student.notes.includes('LPA') ? student.notes : '-')}
                            </div>
                          </td>

                          <td>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: student.joiningDate ? '#334155' : '#94a3b8' }}>
                              {student.joiningDate || 'Date Not Set'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              {student.joiningDate ? 'Day 1 Joined' : 'Pending'}
                            </div>
                          </td>

                          <td>
                            <div style={{ 
                              fontFamily: "'Public Sans', sans-serif", 
                              fontWeight: 800, 
                              fontSize: '0.85rem',
                              color: is30Retained ? '#166534' : isDropped ? '#dc2626' : '#154360' 
                            }}>
                              {student.joiningDate ? `${days} Days` : '-'}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                              {!student.joiningDate ? 'Not joined yet' : is30Retained ? 'Milestone met' : isDropped ? 'Left early' : `${Math.max(0, 30 - days)} days left`}
                            </div>
                          </td>

                          <td>
                            {student.joiningDate ? (
                              <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, marginBottom: '3px' }}>
                                  <span style={{ color: is30Retained ? '#166534' : '#b45309' }}>
                                    {days}/30 Days
                                  </span>
                                  <span style={{ color: '#64748b' }}>{progressPct}%</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div 
                                    style={{ 
                                      width: `${progressPct}%`, 
                                      height: '100%', 
                                      background: is30Retained ? '#166534' : isDropped ? '#dc2626' : '#f59e0b',
                                      transition: 'width 0.3s ease'
                                    }} 
                                  />
                                </div>
                              </>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Awaiting Joining Date</span>
                            )}
                          </td>

                          <td>
                            {is30Retained ? (
                              <span style={{ 
                                background: '#dcfce7', 
                                color: '#166534', 
                                border: '1px solid #86efac', 
                                padding: '3px 8px', 
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 800
                              }}>
                                30+ Days Retained
                              </span>
                            ) : isDropped ? (
                              <span style={{ 
                                background: '#fee2e2', 
                                color: '#991b1b', 
                                border: '1px solid #fca5a5', 
                                padding: '3px 8px', 
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700
                              }}>
                                Dropped &lt; 30 Days
                              </span>
                            ) : student.joiningDate ? (
                              <span style={{ 
                                background: '#fef3c7', 
                                color: '#92400e', 
                                border: '1px solid #fde68a', 
                                padding: '3px 8px', 
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700
                              }}>
                                Day {days} of 30 Window
                              </span>
                            ) : (
                              <span style={{ 
                                background: '#f1f5f9', 
                                color: '#475569', 
                                border: '1px solid #cbd5e1', 
                                padding: '3px 8px', 
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 600
                              }}>
                                Pending Joining
                              </span>
                            )}
                          </td>

                          <td>
                            {student.milestoneVerified ? (
                              <span style={{ 
                                fontSize: '0.7rem', 
                                color: '#166534', 
                                fontWeight: 700
                              }}>
                                Verified
                              </span>
                            ) : is30Retained ? (
                              <button
                                type="button"
                                onClick={() => handleQuickVerifyMilestone(student)}
                                className="btn-secondary btn-black-sm"
                                style={{ 
                                  fontSize: '0.7rem', 
                                  padding: '2px 8px',
                                  background: '#dcfce7',
                                  borderColor: '#86efac',
                                  color: '#166534',
                                  fontWeight: 700
                                }}
                                title="Formally verify 30-day employment milestone"
                              >
                                <Check size={11} /> Verify Now
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                Unverified
                              </span>
                            )}
                          </td>

                          <td>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenEditStudent(student)}
                                className="btn-secondary btn-black-sm"
                                style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                title="Edit Joining Date or Employment Status"
                              >
                                <Edit3 size={11} /> Edit
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
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: UPDATE ONBOARDING & 30-DAY EMPLOYMENT STATUS            */}
      {/* ============================================================== */}
      {selectedStudentForEdit && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#154360',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                  Update Onboarding & 30-Day Employment
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#93c5fd' }}>
                  {selectedStudentForEdit.name} • {selectedStudentForEdit.collegeName || 'College'}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedStudentForEdit(null)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStudentOnboarding} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Onboarding Phase
                  </label>
                  <select 
                    value={editFormData.onboardingStatus}
                    onChange={(e) => setEditFormData(p => ({ ...p, onboardingStatus: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="JOINED">Joined Workplace (Day 1 Complete)</option>
                    <option value="OFFER_ACCEPTED">Offer Accepted (Awaiting Joining)</option>
                    <option value="DOCS_PENDING">Documentation / Verification Pending</option>
                    <option value="DEFERRED">Joining Deferred</option>
                    <option value="DROPPED">Offer Revoked / Declined (Dropout)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Joining Date (Day 1 of Employment)
                  </label>
                  <input 
                    type="date"
                    value={editFormData.joiningDate}
                    onChange={(e) => setEditFormData(p => ({ ...p, joiningDate: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                  {editFormData.joiningDate && (
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      Days employed computed live: {getDaysEmployed(editFormData.joiningDate)} days active
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    30-Day Employment Retention Status
                  </label>
                  <select 
                    value={editFormData.employmentStatus}
                    onChange={(e) => setEditFormData(p => ({ ...p, employmentStatus: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="COMPLETED_30_DAYS">Completed 30+ Days (Milestone Achieved) 🏆</option>
                    <option value="IN_PROGRESS_30_DAYS">In 30-Day Probation Period (Active)</option>
                    <option value="DROPPED_EARLY">Early Attrition (Left before 30 days)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <input 
                    type="checkbox"
                    id="milestoneVerified"
                    checked={editFormData.milestoneVerified}
                    onChange={(e) => setEditFormData(p => ({ ...p, milestoneVerified: e.target.checked }))}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <label htmlFor="milestoneVerified" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534', cursor: 'pointer' }}>
                    Verify 30-Day Employment Milestone
                  </label>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Milestone & Performance Notes
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. Cleared 30-day performance review with manager. Retained."
                    value={editFormData.employmentNotes}
                    onChange={(e) => setEditFormData(p => ({ ...p, employmentNotes: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedStudentForEdit(null)}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-mustard"
                  style={{ padding: '8px 18px', fontSize: '0.82rem', fontWeight: 800 }}
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
