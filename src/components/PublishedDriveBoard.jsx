import React, { useState, useMemo, useEffect } from 'react';
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
  X,
  UserPlus,
  Plus,
  Clock,
  Send,
  Sparkles,
  Mail,
  MessageSquare,
  Play,
  Coffee,
  Utensils,
  AlertTriangle,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Custom Time Input without browser dashed lines (--:-- --), with clean text typing and AM / PM options
function TimeSelectInput({ value, onChange, placeholder = "09:00", isCompact = false, required = false }) {
  // Parse incoming 24h "HH:MM" into display 12h time and AM/PM
  const parseVal = (val) => {
    if (!val || typeof val !== 'string' || !val.includes(':')) {
      return { timeStr: '', ampm: 'AM' };
    }
    const [hStr, mStr] = val.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr ? mStr.slice(0, 2) : '00';
    if (isNaN(h)) return { timeStr: '', ampm: 'AM' };
    const ampm = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    const timeStr = `${String(h12).padStart(2, '0')}:${m}`;
    return { timeStr, ampm };
  };

  const initial = parseVal(value);
  const [typedTime, setTypedTime] = useState(initial.timeStr);
  const [ampm, setAmpm] = useState(initial.ampm);

  useEffect(() => {
    const updated = parseVal(value);
    setTypedTime(updated.timeStr);
    setAmpm(updated.ampm);
  }, [value]);

  const emit24h = (rawTime, currentAmpm) => {
    if (!rawTime || !rawTime.trim()) {
      onChange('');
      return;
    }
    let cleaned = rawTime.trim().toLowerCase();
    
    // Auto-detect AM/PM if typed in input
    let detectedAmpm = currentAmpm;
    if (cleaned.includes('am')) {
      detectedAmpm = 'AM';
      cleaned = cleaned.replace('am', '').trim();
    } else if (cleaned.includes('pm')) {
      detectedAmpm = 'PM';
      cleaned = cleaned.replace('pm', '').trim();
    }
    if (detectedAmpm !== currentAmpm) {
      setAmpm(detectedAmpm);
    }

    let h = 0;
    let m = 0;
    if (cleaned.includes(':')) {
      const parts = cleaned.split(':');
      h = parseInt(parts[0], 10) || 0;
      m = parseInt(parts[1], 10) || 0;
    } else if (cleaned.length === 3) {
      h = parseInt(cleaned[0], 10) || 0;
      m = parseInt(cleaned.slice(1), 10) || 0;
    } else if (cleaned.length === 4) {
      h = parseInt(cleaned.slice(0, 2), 10) || 0;
      m = parseInt(cleaned.slice(2), 10) || 0;
    } else {
      h = parseInt(cleaned, 10) || 0;
      m = 0;
    }

    if (isNaN(h)) {
      onChange('');
      return;
    }
    if (isNaN(m)) m = 0;
    if (m > 59) m = 59;

    let h24 = h;
    if (detectedAmpm === 'PM') {
      if (h < 12) h24 = h + 12;
    } else {
      if (h === 12) h24 = 0;
      else if (h > 12) h24 = h;
    }

    const h24Str = String(h24 % 24).padStart(2, '0');
    const mStr = String(m).padStart(2, '0');
    onChange(`${h24Str}:${mStr}`);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setTypedTime(val);
    emit24h(val, ampm);
  };

  const handleAmpmChange = (e) => {
    const newAmpm = e.target.value;
    setAmpm(newAmpm);
    emit24h(typedTime, newAmpm);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      border: '1px solid #cbd5e1',
      borderRadius: '6px',
      background: '#ffffff',
      overflow: 'hidden',
      transition: 'border-color 150ms ease, box-shadow 150ms ease',
      width: '100%'
    }}>
      <input
        type="text"
        value={typedTime}
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
        style={{
          flex: '1 1 auto',
          border: 'none',
          outline: 'none',
          padding: isCompact ? '4px 8px' : '7px 10px',
          fontSize: isCompact ? '0.78rem' : '0.85rem',
          color: '#0f172a',
          background: 'transparent',
          minWidth: 0,
          fontFamily: 'inherit'
        }}
      />
      <select
        value={ampm}
        onChange={handleAmpmChange}
        title="Time Option (AM / PM)"
        style={{
          border: 'none',
          borderLeft: '1px solid #e2e8f0',
          background: '#f8fafc',
          color: '#154360',
          fontWeight: 800,
          padding: isCompact ? '4px 8px' : '7px 10px',
          fontSize: isCompact ? '0.72rem' : '0.80rem',
          cursor: 'pointer',
          outline: 'none',
          borderRadius: 0
        }}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

export default function PublishedDriveBoard({
  drives,
  students,
  initialDriveId = 'ALL',
  formResponses,
  onStartCall,
  onAddStudentsBatch,
  onDeleteStudent,
  onDeleteDrive,
  onClearAllDrives,
  onClearAllStudents,
  onNavigateToBlast,
  onUpdateCandidateStage,
  onLoadDemoData,
  onNavigateToDrives,
  onOpenNewStudentModal,
  hrPhoneNumber,
  onOpenPhoneConnectModal,
  onBatchUpdateStudents,
  addToast,
  currentUser,
  users = []
}) {
  const [selectedDriveId, setSelectedDriveId] = useState(initialDriveId || 'ALL');
  const [deleteModalConfig, setDeleteModalConfig] = useState(null);

  useEffect(() => {
    if (initialDriveId !== undefined && initialDriveId !== null) {
      setSelectedDriveId(initialDriveId);
    }
  }, [initialDriveId]);

  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentBranch, setNewStudentBranch] = useState('Computer Science');
  const [newStudentCgpa, setNewStudentCgpa] = useState('8.0');
  const [newStudentStage, setNewStudentStage] = useState('ONLINE_ASSESSMENT');
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [expandedStudents, setExpandedStudents] = useState({});
  const toggleStudentExpand = (id) => {
    setExpandedStudents(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
  const [sheetTargetDriveId, setSheetTargetDriveId] = useState(drives[0]?.id || '');

  const activeDrive = (selectedDriveId && selectedDriveId !== 'ALL')
    ? (drives.find(d => d.id === selectedDriveId) || null)
    : null;
  const driveStudents = activeDrive ? students.filter(s => s.driveId === activeDrive.id) : students;
  const branches = Array.from(new Set(driveStudents.map(s => s.branch))).filter(Boolean);

  useEffect(() => {
    if (branchFilter !== 'ALL' && !branches.includes(branchFilter)) {
      setBranchFilter('ALL');
    }
  }, [selectedDriveId, branches, branchFilter]);

  const currentSheetDrive = activeDrive || drives.find(d => d.id === sheetTargetDriveId) || drives[0] || null;

  // ---------------- Schedule Interviews State & Engine ----------------
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDriveId, setScheduleDriveId] = useState(() => (selectedDriveId && selectedDriveId !== 'ALL' ? selectedDriveId : (activeDrive?.id || 'ALL')));
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleStartTime, setScheduleStartTime] = useState('');
  const [scheduleEndTime, setScheduleEndTime] = useState('');
  const [scheduleSlotMinutes, setScheduleSlotMinutes] = useState('');
  const [scheduleBufferMinutes, setScheduleBufferMinutes] = useState(0);

  // 3 Scheduled Breaks (2 Tea Breaks [15m each] + 1 Lunch Break [45m] - manually entered by user)
  const [teaBreak1Start, setTeaBreak1Start] = useState('');
  const [teaBreak1Duration] = useState(15);
  const [lunchBreakStart, setLunchBreakStart] = useState('');
  const [lunchBreakDuration] = useState(45);
  const [teaBreak2Start, setTeaBreak2Start] = useState('');
  const [teaBreak2Duration] = useState(15);

  // Manager Approval State (required if schedule exceeds daily limit)
  const [managerApprovalGranted, setManagerApprovalGranted] = useState(false);
  const [selectedManagerApprover, setSelectedManagerApprover] = useState('');
  const [managerApprovalNote, setManagerApprovalNote] = useState('');

  const [scheduleMeetLink, setScheduleMeetLink] = useState('');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchConfirmationData, setDispatchConfirmationData] = useState(null);
  const [copiedScheduleText, setCopiedScheduleText] = useState(false);

  // Email SMTP state for real Google Meet interview invite dispatch
  const [emailProvider, setEmailProvider] = useState('gmail');
  const [smtpSenderEmail, setSmtpSenderEmail] = useState('admin@geonixa.com');
  const [smtpAppPassword, setSmtpAppPassword] = useState('');
  const [isSendingLiveEmails, setIsSendingLiveEmails] = useState(false);

  useEffect(() => {
    fetch('/api/smtp-config')
      .then(res => res.json())
      .then(data => {
        if (data.senderEmail) setSmtpSenderEmail(data.senderEmail);
        if (data.service) setEmailProvider(data.service);
      })
      .catch(() => {});
  }, []);

  // List of active real HR Employees and Interns for Interviewer dropdown (purging dummy profiles)
  const hrStaffList = useMemo(() => {
    if (!Array.isArray(users)) return [];
    const dummyIds = ['hr-ananya', 'intern-kavya', 'user-main-hr', 'intern-1', 'intern-2'];
    return users.filter(u => u && u.name && !dummyIds.includes(u.id) && !['ananya sharma', 'kavya nair', 'hr manager', 'main hr manager', 'hr intern 1'].includes(u.name.toLowerCase()));
  }, [users]);

  const [schedulePanelist, setSchedulePanelist] = useState('');

  // Format total minutes to 12-hour AM/PM string (e.g. 600 -> "10:00 AM", 730 -> "12:10 PM")
  const formatTime12h = (totalMinutes) => {
    if (totalMinutes === null || totalMinutes === undefined || isNaN(totalMinutes)) return '--:--';
    const normalized = ((totalMinutes % 1440) + 1440) % 1440;
    let hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minuteStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minuteStr} ${ampm}`;
  };

  // Parse "HH:MM" time input into minutes from midnight
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const parts = timeStr.split(':');
    if (parts.length < 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };

  // All candidates belonging to selected drive
  const allDriveCandidates = useMemo(() => {
    return scheduleDriveId === 'ALL'
      ? students
      : students.filter(s => s.driveId === scheduleDriveId);
  }, [students, scheduleDriveId]);

  // Day & Break Calculations (Calculated only when user manually enters timings)
  const startMins = parseTimeToMinutes(scheduleStartTime);
  const endMins = parseTimeToMinutes(scheduleEndTime);
  const hasTimingInputs = Boolean(scheduleStartTime && scheduleEndTime && scheduleSlotMinutes && startMins !== null && endMins !== null && endMins > startMins);
  const totalWindowMinutes = hasTimingInputs ? Math.max(0, endMins - startMins) : 0;

  const tea1StartMins = parseTimeToMinutes(teaBreak1Start);
  const tea1EndMins = tea1StartMins !== null ? tea1StartMins + teaBreak1Duration : null;

  const lunchStartMins = parseTimeToMinutes(lunchBreakStart);
  const lunchEndMins = lunchStartMins !== null ? lunchStartMins + lunchBreakDuration : null;

  const tea2StartMins = parseTimeToMinutes(teaBreak2Start);
  const tea2EndMins = tea2StartMins !== null ? tea2StartMins + teaBreak2Duration : null;

  // Active breaks that user has actually entered start times for
  const activeBreaks = useMemo(() => {
    const list = [];
    if (tea1StartMins !== null) {
      list.push({ name: 'Morning Tea Break', type: 'TEA', startMins: tea1StartMins, endMins: tea1EndMins, duration: teaBreak1Duration });
    }
    if (lunchStartMins !== null) {
      list.push({ name: 'Lunch Break', type: 'LUNCH', startMins: lunchStartMins, endMins: lunchEndMins, duration: lunchBreakDuration });
    }
    if (tea2StartMins !== null) {
      list.push({ name: 'Afternoon Tea Break', type: 'TEA', startMins: tea2StartMins, endMins: tea2EndMins, duration: teaBreak2Duration });
    }
    return list.sort((a, b) => a.startMins - b.startMins);
  }, [tea1StartMins, tea1EndMins, teaBreak1Duration, lunchStartMins, lunchEndMins, lunchBreakDuration, tea2StartMins, tea2EndMins, teaBreak2Duration]);

  const totalBreakMinutes = activeBreaks.reduce((sum, b) => sum + b.duration, 0);
  const netWorkingMinutes = Math.max(0, totalWindowMinutes - totalBreakMinutes);
  const slotDuration = parseInt(scheduleSlotMinutes, 10) || 0;
  const maxDailyCapacity = (slotDuration > 0 && netWorkingMinutes > 0) ? Math.floor(netWorkingMinutes / slotDuration) : 0;

  // Directly calculate and allocate candidates based on daily capacity from timings
  const candidatesEligibleForSchedule = useMemo(() => {
    if (!hasTimingInputs || slotDuration <= 0 || allDriveCandidates.length === 0) return [];
    const limit = maxDailyCapacity > 0 ? maxDailyCapacity : allDriveCandidates.length;
    return allDriveCandidates.slice(0, limit);
  }, [hasTimingInputs, slotDuration, allDriveCandidates, maxDailyCapacity]);

  // Synchronize selected IDs when candidate list changes
  useEffect(() => {
    setSelectedCandidateIds(candidatesEligibleForSchedule.map(s => s.id));
  }, [candidatesEligibleForSchedule]);

  // Automatically calculate individual time slots jumping over breaks
  const calculatedTimeSlots = useMemo(() => {
    if (!hasTimingInputs || slotDuration <= 0 || startMins === null) return [];
    const selectedStudents = candidatesEligibleForSchedule.filter(s => selectedCandidateIds.includes(s.id));
    let currentTime = startMins;
    const slots = [];

    for (let i = 0; i < selectedStudents.length; i++) {
      const student = selectedStudents[i];
      let encounteredBreak = null;

      // Jump over any breaks that collide with this slot
      let collides = true;
      while (collides) {
        collides = false;
        for (const brk of activeBreaks) {
          if (currentTime >= brk.startMins && currentTime < brk.endMins) {
            currentTime = brk.endMins;
            encounteredBreak = brk;
            collides = true;
            break;
          }
          if (currentTime < brk.startMins && (currentTime + slotDuration) > brk.startMins) {
            currentTime = brk.endMins;
            encounteredBreak = brk;
            collides = true;
            break;
          }
        }
      }

      const slotStartMins = currentTime;
      const slotEndMins = slotStartMins + slotDuration;
      currentTime = slotEndMins;

      const startFormatted = formatTime12h(slotStartMins);
      const endFormatted = formatTime12h(slotEndMins);
      const slotString = `${startFormatted} - ${endFormatted}`;

      slots.push({
        student,
        idx: i + 1,
        slotStartMins,
        slotEndMins,
        startFormatted,
        endFormatted,
        slotString,
        breakBefore: encounteredBreak
      });
    }

    return slots;
  }, [hasTimingInputs, slotDuration, startMins, candidatesEligibleForSchedule, selectedCandidateIds, activeBreaks]);

  // Estimated Finish Time and Overtime Check
  const estimatedFinishMins = (hasTimingInputs && calculatedTimeSlots.length > 0)
    ? calculatedTimeSlots[calculatedTimeSlots.length - 1].slotEndMins 
    : (startMins || 0);

  const isExceedingTimeLimit = hasTimingInputs && endMins !== null && estimatedFinishMins > endMins;
  const overtimeMinutes = (hasTimingInputs && endMins !== null) ? Math.max(0, estimatedFinishMins - endMins) : 0;

  // Confirm schedule & dispatch interview invites
  const handleConfirmSchedule = async () => {
    if (!scheduleDate) {
      alert('Please select an Interview Date.');
      return;
    }

    if (!scheduleStartTime || !scheduleEndTime) {
      alert('Please enter both Interview Starts From and Interview Ends At times.');
      return;
    }

    if (!scheduleSlotMinutes) {
      alert('Please select a Duration per candidate.');
      return;
    }

    if (!calculatedTimeSlots.length) {
      alert('Please ensure interview parameters allow at least one candidate slot.');
      return;
    }

    if (!scheduleMeetLink.trim()) {
      alert('Please enter or generate a Google Meet link.');
      return;
    }

    if (!schedulePanelist.trim()) {
      alert('Please select an Interviewer / Panel Member.');
      return;
    }

    if (isExceedingTimeLimit && !managerApprovalGranted) {
      alert(`The schedule exceeds the allocated daily end time of ${formatTime12h(endMins)} by ${overtimeMinutes} minutes. Manager permission is required to proceed.`);
      return;
    }

    setIsDispatching(true);
    const cleanMeet = scheduleMeetLink.trim();
    const scheduledAt = new Date().toISOString();

    const updatedStudents = calculatedTimeSlots.map(item => ({
      ...item.student,
      stage: 'TECH_INTERVIEW', // Moves to "3. Interview"
      interviewDate: scheduleDate,
      interviewTime: item.slotString,
      interviewStartTime: item.startFormatted,
      interviewEndTime: item.endFormatted,
      meetLink: cleanMeet,
      interviewPanel: schedulePanelist,
      interviewStatus: 'SCHEDULED',
      interviewDispatchedAt: scheduledAt
    }));

    // Update in parent state & server storage
    if (onBatchUpdateStudents) {
      onBatchUpdateStudents(updatedStudents);
    }

    const targetDrive = drives.find(d => d.id === scheduleDriveId) || activeDrive;

    // Add entry into broadcast logs for audit trail
    try {
      const existingLogs = JSON.parse(localStorage.getItem('tacrm_blast_logs') || '[]');
      const newLog = {
        id: `sched-blast-${Date.now()}`,
        timestamp: scheduledAt,
        driveTitle: targetDrive?.title || 'Campus Placement Drive',
        collegeName: targetDrive?.collegeName || 'Campus',
        jobRole: targetDrive?.jobRole || 'Engineering Associate',
        totalDispatched: updatedStudents.length,
        interviewDate: scheduleDate,
        timeWindow: `${calculatedTimeSlots[0].startFormatted} - ${calculatedTimeSlots[calculatedTimeSlots.length - 1].endFormatted}`,
        meetLink: cleanMeet,
        type: 'GOOGLE_MEET_INVITE',
        status: 'DELIVERED',
        recipientsSample: updatedStudents.slice(0, 3).map(s => `${s.name} (${s.interviewTime})`).join(', ')
      };
      localStorage.setItem('tacrm_blast_logs', JSON.stringify([newLog, ...existingLogs]));
    } catch (e) {}

    // Dispatch emails to all candidates with Google Meet links
    let emailStatus = null;
    try {
      const emailRes = await fetch('/api/send-interview-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driveTitle: targetDrive?.title || 'Campus Placement Drive',
          collegeName: targetDrive?.collegeName || 'Campus',
          jobRole: targetDrive?.jobRole || 'Engineering Associate',
          interviewDate: scheduleDate,
          meetLink: cleanMeet,
          interviewer: schedulePanelist,
          scheduledList: calculatedTimeSlots
        })
      });
      if (emailRes.ok) {
        emailStatus = await emailRes.json();
      }
    } catch (e) {
      console.warn('Email dispatch error:', e);
    }

    // Close schedule modal and open success dispatch confirmation modal
    setIsScheduleModalOpen(false);
    setDispatchConfirmationData({
      driveTitle: targetDrive?.title || 'Campus Placement Drive',
      collegeName: targetDrive?.collegeName || 'Campus',
      jobRole: targetDrive?.jobRole || 'Engineering Associate',
      scheduledDate: scheduleDate,
      firstSlot: calculatedTimeSlots[0].startFormatted,
      lastSlot: calculatedTimeSlots[calculatedTimeSlots.length - 1].endFormatted,
      totalCount: updatedStudents.length,
      meetLink: cleanMeet,
      scheduledList: calculatedTimeSlots,
      emailStatus
    });

    setIsDispatching(false);
    if (addToast) {
      if (emailStatus?.sentCount > 0) {
        addToast(`🎉 Dispatched interview slots & emailed Google Meet links to ${emailStatus.sentCount} candidate inboxes!`, 'success');
      } else {
        addToast(`🎉 Dispatched interview slots & Google Meet links for ${updatedStudents.length} candidates!`, 'success');
      }
    }
  };

  // Copy formatted schedule to clipboard for College TPO / Placement Head
  const handleCopyScheduleToClipboard = () => {
    if (!dispatchConfirmationData) return;
    const { driveTitle, collegeName, jobRole, scheduledDate, meetLink, scheduledList } = dispatchConfirmationData;
    let text = `CAMPUS INTERVIEW SCHEDULE\n`;
    text += `Drive: ${driveTitle} (${jobRole})\n`;
    text += `College: ${collegeName}\n`;
    text += `Date: ${scheduledDate}\n`;
    text += `Google Meet Link: ${meetLink}\n`;
    text += `---------------------------------------------------------\n`;
    text += `No. | Roll No | Candidate Name | Interview Time Slot | Contact\n`;
    text += `---------------------------------------------------------\n`;
    scheduledList.forEach((item, i) => {
      text += `${i + 1}. ${item.student.rollNumber || 'N/A'} | ${item.student.name} | ${item.slotString} | ${item.student.phone || item.student.email}\n`;
    });
    text += `---------------------------------------------------------\n`;
    text += `Note: Please join Google Meet 5 minutes before your allotted slot.\n`;

    navigator.clipboard.writeText(text);
    setCopiedScheduleText(true);
    setTimeout(() => setCopiedScheduleText(false), 2500);
  };

  // Share schedule to WhatsApp Placement Group
  const handleShareWhatsApp = () => {
    if (!dispatchConfirmationData) return;
    const { driveTitle, collegeName, scheduledDate, meetLink, scheduledList } = dispatchConfirmationData;
    let text = `📢 *INTERVIEW SCHEDULE - ${driveTitle}*\n`;
    text += `🏫 *College:* ${collegeName}\n`;
    text += `📅 *Date:* ${scheduledDate}\n`;
    text += `💻 *Google Meet:* ${meetLink}\n\n`;
    text += `*Allotted Interview Time Slots:*\n`;
    scheduledList.slice(0, 15).forEach((item) => {
      text += `• ${item.slotString}: *${item.student.name}* (${item.student.rollNumber || ''})\n`;
    });
    if (scheduledList.length > 15) {
      text += `...and ${scheduledList.length - 15} more candidates.\n`;
    }
    text += `\nPlease join 5 minutes before your time slot. All the best!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Save SMTP settings and re-dispatch emails live
  const handleSaveSmtpAndResend = async () => {
    if (!smtpAppPassword.trim()) {
      alert('Please enter your 16-character Google App Password.');
      return;
    }
    setIsSendingLiveEmails(true);
    try {
      // 1. Save SMTP settings
      await fetch('/api/smtp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderEmail: smtpSenderEmail.trim() || 'admin@geonixa.com',
          user: smtpSenderEmail.trim() || 'admin@geonixa.com',
          pass: smtpAppPassword.trim(),
          service: emailProvider || (smtpAppPassword.startsWith('re_') ? 'resend' : smtpAppPassword.startsWith('SG.') ? 'sendgrid' : 'gmail')
        })
      });

      // 2. Resend interview invites
      if (dispatchConfirmationData?.scheduledList) {
        const res = await fetch('/api/send-interview-invites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driveTitle: dispatchConfirmationData.driveTitle,
            collegeName: dispatchConfirmationData.collegeName,
            jobRole: dispatchConfirmationData.jobRole,
            interviewDate: dispatchConfirmationData.scheduledDate,
            meetLink: dispatchConfirmationData.meetLink,
            interviewer: schedulePanelist,
            scheduledList: dispatchConfirmationData.scheduledList
          })
        });
        const result = await res.json();
        setDispatchConfirmationData(prev => ({ ...prev, emailStatus: result }));
        if (result.sentCount > 0 && addToast) {
          addToast(`🎉 Successfully emailed interview link to ${result.sentCount} students!`, 'success');
        } else if (result.failedCount > 0 && addToast) {
          addToast(`⚠️ Email send issue: Please verify Google App Password`, 'error');
        }
      }
    } catch (err) {
      console.error('Error saving SMTP & resending:', err);
      if (addToast) addToast('Error dispatching emails: ' + err.message, 'error');
    } finally {
      setIsSendingLiveEmails(false);
    }
  };

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
    const parsed = parseCandidateRows(text, currentSheetDrive);
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
      const parsed = parseCandidateRows(csvText, currentSheetDrive);

      if (parsed.length > 0) {
        if (onAddStudentsBatch) {
          onAddStudentsBatch(parsed);
        }

        setLinkedSheetUrl(targetUrl.trim());
        localStorage.setItem('tacrm_candidates_sheet_url', targetUrl.trim());

        setImportStatusMessage({
          type: 'success',
          text: `Successfully synced & imported ${parsed.length} candidate records for ${currentSheetDrive?.title || 'Drive'}!`
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
      text: `Successfully imported ${parsedCandidates.length} candidates into ${currentSheetDrive?.title || 'Drive'}!`
    });
    setPasteText('');
    setParsedCandidates([]);
    setTimeout(() => {
      setIsLinkSheetsModalOpen(false);
      setImportStatusMessage(null);
    }, 1500);
  };

  const handleQuickAddStudent = (e) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const targetDrive = activeDrive || drives[0];
    const newStudent = {
      id: `stu-${Date.now()}`,
      driveId: targetDrive?.id || `drv-${Date.now()}`,
      driveTitle: targetDrive?.title || 'Campus Drive',
      collegeId: targetDrive?.collegeId || 'col-default',
      collegeName: targetDrive?.collegeName || 'Campus',
      name: newStudentName.trim(),
      rollNumber: newStudentRoll.trim() || `ROLL-${Date.now().toString().slice(-4)}`,
      email: newStudentEmail.trim() || `${newStudentName.trim().toLowerCase().replace(/\s+/g, '.')}@campus.edu`,
      phone: newStudentPhone.trim(),
      branch: newStudentBranch.trim() || 'Computer Science',
      cgpa: parseFloat(newStudentCgpa) || 7.5,
      stage: newStudentStage || 'ONLINE_ASSESSMENT',
      internId: 'staff-recruiter',
      internName: 'Staff Recruiter',
      notes: 'Added via Direct Add',
    };

    if (onAddStudentsBatch) {
      onAddStudentsBatch([newStudent]);
    }
    setIsAddStudentModalOpen(false);
    setNewStudentName('');
    setNewStudentRoll('');
    setNewStudentPhone('');
    setNewStudentEmail('');
    setNewStudentBranch('Computer Science');
    setNewStudentCgpa('8.0');
    setNewStudentStage('ONLINE_ASSESSMENT');
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
          No Drives Created Yet
        </h3>
        <p style={{ color: '#71717a', fontSize: '0.875rem', maxWidth: '460px', margin: '0 auto 20px' }}>
          Create a drive in "Drives" or click "Link Sheets" above to import candidates to this board.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {onNavigateToDrives && (
            <button onClick={onNavigateToDrives} className="btn-navy btn-black-sm">
              <Calendar size={13} color="#FFDB58" /> Go to Drives
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: 'var(--font-sm)', color: '#154360', lineHeight: 'var(--lh-sm)' }}>
                Drive:
              </span>
              <select
                className="form-select"
                value={selectedDriveId || 'ALL'}
                onChange={(e) => setSelectedDriveId(e.target.value)}
                style={{ fontWeight: 700, width: 'auto', padding: '5px 10px', fontSize: 'var(--font-xs)', borderColor: '#154360', color: '#154360' }}
              >
                <option value="ALL">All Drives ({drives.length} drives • {students.length} students)</option>
                {drives.map(d => {
                  const dCount = students.filter(s => s.driveId === d.id).length;
                  return (
                    <option key={d.id} value={d.id}>{d.title} ({d.collegeName}) - {dCount} students</option>
                  );
                })}
              </select>
              {selectedDriveId !== 'ALL' && activeDrive && onDeleteDrive && (currentUser?.role === 'ADMIN') && (
                <button
                  type="button"
                  onClick={() => {
                    setDeleteModalConfig({
                      title: 'Delete Campus Recruitment Drive',
                      subtitle: 'Permanent Drive Deletion',
                      message: `Are you sure you want to delete drive "${activeDrive.title}" (${activeDrive.collegeName})? Associated candidate records will also be removed.`,
                      dangerNote: 'All candidate records linked to this drive will be deleted immediately across all accounts.',
                      confirmLabel: 'Yes, Delete Drive',
                      onConfirm: () => {
                        onDeleteDrive(activeDrive.id);
                        setSelectedDriveId('ALL');
                      }
                    });
                  }}
                  className="btn-icon"
                  style={{
                    width: '28px',
                    height: '28px',
                    color: '#ef4444',
                    border: '1px solid #fca5a5',
                    borderRadius: '6px',
                    background: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title={`Delete drive "${activeDrive.title}"`}
                >
                  <Trash2 size={13} color="#ef4444" />
                </button>
              )}
              {selectedDriveId === 'ALL' && currentUser?.role === 'ADMIN' && (
                <div style={{ display: 'inline-flex', gap: '4px' }}>
                  {drives.length > 0 && onClearAllDrives && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteModalConfig({
                          title: 'Delete All Campus Recruitment Drives',
                          subtitle: 'Bulk Permanent Deletion',
                          message: `Are you sure you want to permanently delete all ${drives.length} campus recruitment drives? All associated student records will also be cleared.`,
                          dangerNote: 'This action cannot be undone. All drives and linked candidates will be removed immediately.',
                          confirmLabel: `Yes, Delete All Drives (${drives.length})`,
                          onConfirm: () => {
                            onClearAllDrives();
                            setSelectedDriveId('ALL');
                          }
                        });
                      }}
                      className="btn-secondary btn-black-sm"
                      style={{ fontSize: '0.7rem', padding: '3px 8px', color: '#ef4444', borderColor: '#fca5a5' }}
                      title="Delete all campus recruitment drives"
                    >
                      <Trash2 size={11} color="#ef4444" /> Delete All Drives
                    </button>
                  )}
                  {students.length > 0 && onClearAllStudents && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteModalConfig({
                          title: 'Delete All Student Candidates',
                          subtitle: 'Bulk Candidate Removal',
                          message: `Are you sure you want to delete all ${students.length} student candidate records across all drives?`,
                          dangerNote: 'All candidate entries will be permanently removed from all rosters.',
                          confirmLabel: `Yes, Delete All Candidates (${students.length})`,
                          onConfirm: () => {
                            onClearAllStudents();
                          }
                        });
                      }}
                      className="btn-secondary btn-black-sm"
                      style={{ fontSize: '0.7rem', padding: '3px 8px', color: '#ef4444', borderColor: '#fca5a5' }}
                      title="Delete all student candidates"
                    >
                      <Trash2 size={11} color="#ef4444" /> Clear All Students
                    </button>
                  )}
                </div>
              )}
            </div>
            {activeDrive ? (
              <div style={{ fontSize: 'var(--font-11)', lineHeight: 'var(--lh-11)', color: '#52525b', marginTop: '4px' }}>
                Role: <strong style={{ color: '#154360' }}>{activeDrive.jobRole}</strong> • CTC: <strong style={{ color: '#154360' }}>{activeDrive.ctc}</strong> • Date: <strong>{activeDrive.driveDate || 'Upcoming'}</strong>
              </div>
            ) : (
              <div style={{ fontSize: 'var(--font-11)', lineHeight: 'var(--lh-11)', color: '#52525b', marginTop: '4px' }}>
                Showing candidates across all <strong style={{ color: '#154360' }}>{drives.length} campus recruitment drives</strong> • <strong style={{ color: '#154360' }}>{students.length} total students</strong>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Add Student Button */}
            <button
              type="button"
              onClick={() => {
                if (onOpenNewStudentModal) {
                  onOpenNewStudentModal();
                } else {
                  setIsAddStudentModalOpen(true);
                }
              }}
              className="btn-mustard btn-black-sm"
              style={{
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '0 12px',
                height: '32px',
                fontSize: 'var(--font-xs)',
              }}
              title="Add a candidate directly to this drive"
            >
              <UserPlus size={14} color="#154360" /> Add Student
            </button>

            {/* Schedule Drive Button Beside Add Student Button */}
            <button
              type="button"
              onClick={() => {
                setScheduleDriveId(selectedDriveId || activeDrive?.id || drives[0]?.id || 'ALL');
                setScheduleDate('');
                setScheduleStartTime('');
                setScheduleEndTime('');
                setScheduleSlotMinutes('');
                setTeaBreak1Start('');
                setLunchBreakStart('');
                setTeaBreak2Start('');
                setScheduleMeetLink('');
                setSchedulePanelist('');
                setManagerApprovalGranted(false);
                setSelectedManagerApprover('');
                setManagerApprovalNote('');
                setDispatchConfirmationData(null);
                setIsScheduleModalOpen(true);
              }}
              className="btn-navy btn-black-sm"
              style={{
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '0 12px',
                height: '32px',
                fontSize: 'var(--font-xs)',
                background: '#154360',
                color: '#FFDB58',
                border: '1.5px solid #FFDB58',
                boxShadow: '0 1px 3px rgba(21, 67, 96, 0.25)'
              }}
              title="Schedule individual interview time slots & auto-dispatch Google Meet links"
            >
              <Calendar size={14} color="#FFDB58" /> Schedule
            </button>

            {/* Mustard Yellow Total Counter Badge */}
            <div style={{ background: '#FFDB58', border: '1px solid #fae27a', borderRadius: 'var(--radius-sm)', padding: '0 10px', height: '32px', display: 'inline-flex', alignItems: 'center', boxShadow: '0 1px 3px rgba(255, 219, 88, 0.3)' }}>
              <span style={{ fontSize: 'var(--font-10)', lineHeight: 'var(--lh-10)', fontWeight: 800, color: '#154360', marginRight: '6px' }}>TOTAL:</span>
              <span style={{ fontSize: 'var(--font-base)', fontWeight: 800, color: '#154360', fontFamily: "'Public Sans', sans-serif" }}>
                {driveStudents.length}
              </span>
            </div>

            {/* Navy Blue In-Interviews Counter Badge */}
            <div style={{ background: '#154360', border: '1px solid #0e2e42', borderRadius: 'var(--radius-sm)', padding: '0 10px', height: '32px', display: 'inline-flex', alignItems: 'center', boxShadow: '0 1px 3px rgba(21, 67, 96, 0.3)' }}>
              <span style={{ fontSize: 'var(--font-10)', lineHeight: 'var(--lh-10)', fontWeight: 700, color: '#ffffff', marginRight: '6px' }}>IN INTERVIEWS:</span>
              <span style={{ fontSize: 'var(--font-base)', fontWeight: 800, color: '#FFDB58', fontFamily: "'Public Sans', sans-serif" }}>
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
                padding: '0 12px',
                height: '32px',
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
              <Users size={16} color="#154360" /> Students ({filteredStudents.length})
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
                    {selectedDriveId === 'ALL'
                      ? 'No students found across campus recruitment drives.'
                      : (
                        <span>
                          No students posted yet for this drive. Click <strong>"Link Sheets"</strong> above to sync or paste candidate records directly.
                        </span>
                      )}
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
                      {selectedDriveId === 'ALL' && (
                        <div style={{ fontSize: '0.68rem', color: '#0369a1', marginTop: '2px', fontWeight: 600 }}>
                          🏢 {drives.find(d => d.id === student.driveId)?.title || student.driveTitle || 'Drive'} ({drives.find(d => d.id === student.driveId)?.collegeName || student.collegeName || 'Campus'})
                        </div>
                      )}
                      {student.interviewTime && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          color: '#1d4ed8',
                          borderRadius: '4px',
                          padding: '1px 6px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          marginTop: '3px',
                          whiteSpace: 'nowrap'
                        }}>
                          <Clock size={10} color="#1d4ed8" style={{ flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap' }}>{student.interviewTime}</span>
                          {student.meetLink && (
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(student.meetLink, '_blank');
                              }}
                              style={{ 
                                cursor: 'pointer', 
                                color: '#059669', 
                                background: '#ecfdf5', 
                                padding: '0 4px', 
                                borderRadius: '3px', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '2px',
                                marginLeft: '2px'
                              }}
                              title="Click to Open Google Meet Room"
                            >
                              <Video size={9} /> Meet
                            </span>
                          )}
                        </div>
                      )}
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
                          onClick={() => {
                            if (student.meetLink) {
                              window.open(student.meetLink, '_blank');
                            } else {
                              onStartCall({
                                recipientType: 'STUDENT',
                                recipientName: student.name,
                                recipientDetail: `${student.branch} • ${student.phone}`,
                                recipientPhone: student.phone,
                                type: 'VIDEO',
                                studentId: student.id,
                                student
                              });
                            }
                          }}
                          className="btn-navy btn-black-sm"
                          style={{ 
                            padding: '3px 8px', 
                            fontSize: 'var(--font-xs)', 
                            gap: '4px',
                            background: student.meetLink ? '#0f766e' : '#154360',
                            borderColor: student.meetLink ? '#2dd4bf' : undefined
                          }}
                          title={student.meetLink ? `Join Scheduled Google Meet (${student.interviewTime || ''})` : "Start Video Interview"}
                        >
                          <Video size={12} color="#FFDB58" /> {student.meetLink ? 'Meet' : 'Video'}
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
                            onClick={() => {
                              setDeleteModalConfig({
                                title: 'Delete Candidate Record',
                                subtitle: 'Candidate Removal',
                                message: `Are you sure you want to delete candidate "${student.name}" (${student.rollNumber || student.email})?`,
                                dangerNote: 'This candidate will be removed from all candidate rosters and hiring pipelines.',
                                confirmLabel: 'Yes, Delete Candidate',
                                onConfirm: () => {
                                  onDeleteStudent(student.id);
                                }
                              });
                            }}
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

        {/* Mobile View: Clean Candidate Cards (Click to expand details) */}
        <div className="mobile-only" style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filteredStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 10px', color: '#71717a', fontSize: 'var(--font-xs)' }}>
              No candidates posted yet for this drive. Click <strong>"Link Sheets"</strong> above to import students.
            </div>
          ) : (
            filteredStudents.map(student => {
              const isExpanded = !!expandedStudents[student.id];
              return (
                <div 
                  key={student.id} 
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isExpanded ? '6px' : '0px',
                    boxShadow: isExpanded ? '0 2px 4px rgba(0,0,0,0.04)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Row 1: Clickable Name, CGPA badge & Expand Chevron */}
                  <div 
                    onClick={() => toggleStudentExpand(student.id)}
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
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 'var(--font-sm)', lineHeight: 'var(--lh-sm)', color: '#154360' }}>
                        {student.name}
                      </div>
                      {selectedDriveId === 'ALL' && (
                        <div style={{ fontSize: '0.68rem', color: '#0369a1', fontWeight: 600, marginTop: '1px' }}>
                          🏢 {drives.find(d => d.id === student.driveId)?.title || student.driveTitle || 'Drive'}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                      {isExpanded ? <ChevronUp size={14} color="#154360" /> : <ChevronDown size={14} color="#64748b" />}
                    </div>
                  </div>

                  {/* Expanded Body: Only shown after clicking on individual name */}
                  {isExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px dashed #e2e8f0', paddingTop: '6px', marginTop: '4px' }}>
                      <div style={{ fontSize: 'var(--font-10)', lineHeight: 'var(--lh-10)', color: '#71717a' }}>
                        {student.rollNumber} • {student.branch}
                      </div>
                      {student.interviewTime && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          color: '#1d4ed8',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          width: 'fit-content'
                        }}>
                          <Clock size={9} color="#1d4ed8" />
                          <span>Slot: {student.interviewTime}</span>
                          {student.meetLink && (
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(student.meetLink, '_blank');
                              }}
                              style={{ color: '#059669', cursor: 'pointer', textDecoration: 'underline', marginLeft: '2px' }}
                            >
                              • Meet 🎥
                            </span>
                          )}
                        </div>
                      )}

                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        gap: '6px', 
                        background: '#ffffff', 
                        padding: '5px 8px', 
                        borderRadius: 'var(--radius-sm)', 
                        border: '1px solid #e2e8f0',
                        flexWrap: 'nowrap',
                        marginTop: '2px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, flexShrink: 1 }}>
                          <span style={{ fontSize: '0.72rem', color: '#154360', fontWeight: 700, flexShrink: 0 }}>Stage:</span>
                          <select
                            className="form-select"
                            value={student.stage || 'ONLINE_ASSESSMENT'}
                            onChange={(e) => onUpdateCandidateStage && onUpdateCandidateStage(student.id, e.target.value)}
                            style={{
                              fontSize: '0.72rem',
                              lineHeight: 1.2,
                              padding: '2px 4px',
                              fontWeight: 700,
                              borderRadius: '4px',
                              minWidth: 0,
                              maxWidth: '120px',
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

                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
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
                            style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '3px', whiteSpace: 'nowrap' }}
                            title="Direct Phone Call"
                          >
                            <Phone size={11} color="#154360" /> Call
                          </button>

                          <button
                            onClick={() => {
                              if (student.meetLink) {
                                window.open(student.meetLink, '_blank');
                              } else {
                                onStartCall({
                                  recipientType: 'STUDENT',
                                  recipientName: student.name,
                                  recipientDetail: `${student.branch} • ${student.phone}`,
                                  recipientPhone: student.phone,
                                  type: 'VIDEO',
                                  studentId: student.id,
                                  student
                                });
                              }
                            }}
                            className="btn-navy btn-black-sm"
                            style={{ 
                              padding: '3px 8px', 
                              fontSize: '0.72rem', 
                              gap: '3px',
                              whiteSpace: 'nowrap',
                              background: student.meetLink ? '#0f766e' : '#154360',
                              borderColor: student.meetLink ? '#2dd4bf' : undefined
                            }}
                            title={student.meetLink ? `Join Google Meet (${student.interviewTime || ''})` : "Video Interview Room"}
                          >
                            <Video size={11} color="#FFDB58" /> {student.meetLink ? 'Meet' : 'Video'}
                          </button>

                          {onDeleteStudent && (
                            <button
                              onClick={() => {
                                setDeleteModalConfig({
                                  title: 'Delete Candidate Record',
                                  subtitle: 'Candidate Removal',
                                  message: `Are you sure you want to delete candidate "${student.name}" (${student.rollNumber || student.email})?`,
                                  dangerNote: 'This candidate will be removed from all candidate rosters and hiring pipelines.',
                                  confirmLabel: 'Yes, Delete Candidate',
                                  onConfirm: () => {
                                    onDeleteStudent(student.id);
                                  }
                                });
                              }}
                              className="btn-icon"
                              style={{ width: '22px', height: '22px', color: '#ef4444', flexShrink: 0 }}
                              title="Delete candidate"
                            >
                              <Trash2 size={11} />
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
                  Connect a Google Sheet link or paste candidate rows for <strong>{currentSheetDrive?.title || 'Active Drive'}</strong> ({currentSheetDrive?.collegeName || 'Campus'})
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
      {/* Quick Add Student Modal */}
      {isAddStudentModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddStudentModalOpen(false)}>
          <div 
            className="modal-container" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: '480px', width: '92%', borderRadius: '12px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} color="#154360" />
                <h3 className="modal-title" style={{ fontSize: '1rem', color: '#154360' }}>
                  Add Student to {activeDrive?.title || 'Drive'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddStudentModalOpen(false)} 
                className="btn-icon"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleQuickAddStudent}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Rahul Sharma"
                    value={newStudentName}
                    onChange={e => setNewStudentName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Roll / Reg Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 2026CS101"
                      value={newStudentRoll}
                      onChange={e => setNewStudentRoll(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="e.g. +91 98765 43210"
                      value={newStudentPhone}
                      onChange={e => setNewStudentPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. rahul.sharma@campus.edu"
                    value={newStudentEmail}
                    onChange={e => setNewStudentEmail(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Branch / Department</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Computer Science"
                      value={newStudentBranch}
                      onChange={e => setNewStudentBranch(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CGPA / Grade</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      className="form-input"
                      placeholder="8.5"
                      value={newStudentCgpa}
                      onChange={e => setNewStudentCgpa(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Hiring Stage</label>
                  <select
                    className="form-select"
                    value={newStudentStage}
                    onChange={e => setNewStudentStage(e.target.value)}
                  >
                    <option value="APPLIED">Applied</option>
                    <option value="ONLINE_ASSESSMENT">Online Assessment</option>
                    <option value="TECH_INTERVIEW">Technical Interview</option>
                    <option value="HR_INTERVIEW">HR Interview</option>
                    <option value="SELECTED">Selected</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setIsAddStudentModalOpen(false)} 
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-mustard"
                  style={{ fontWeight: 800 }}
                  disabled={!newStudentName.trim()}
                >
                  <UserPlus size={14} color="#154360" /> Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCHEDULE DRIVE INTERVIEWS & AUTO-CALCULATE TIME SLOTS MODAL
          ========================================================================= */}
      {isScheduleModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '860px', width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: 0, borderRadius: '14px', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ background: '#154360', color: '#ffffff', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #FFDB58' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FFDB58', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={20} color="#154360" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                    Schedule Drive Interview Slots & Auto-Dispatch
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#e2e8f0', marginTop: '2px' }}>
                    Drive: <strong style={{ color: '#FFDB58' }}>{scheduleDriveId === 'ALL' ? 'All Added Drives' : (drives.find(d => d.id === scheduleDriveId)?.title || activeDrive?.title || 'Campus Placement Drive')}</strong> • {candidatesEligibleForSchedule.length} candidates ready
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsScheduleModalOpen(false)}
                className="btn-icon" 
                style={{ color: '#ffffff', background: 'rgba(255,255,255,0.1)' }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Unified Clean Form Layout */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* 1. Interview Day Window & Duration Parameters */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#154360', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={15} color="#154360" /> 1. Interview Day Window & Duration Parameters
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Interview Date *</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={scheduleDate} 
                      onChange={e => setScheduleDate(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Interview Starts From *</label>
                    <TimeSelectInput 
                      value={scheduleStartTime} 
                      onChange={setScheduleStartTime}
                      placeholder="09:00"
                      required 
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Interview Ends At *</label>
                    <TimeSelectInput 
                      value={scheduleEndTime} 
                      onChange={setScheduleEndTime}
                      placeholder="05:00"
                      required 
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Duration / Student *</label>
                    <select 
                      className="form-select"
                      value={scheduleSlotMinutes}
                      onChange={e => setScheduleSlotMinutes(e.target.value ? parseInt(e.target.value, 10) : '')}
                      required
                    >
                      <option value="">-- Select Duration --</option>
                      <option value="10">10 Minutes per candidate</option>
                      <option value="15">15 Minutes per candidate</option>
                      <option value="20">20 Minutes per candidate</option>
                      <option value="30">30 Minutes per candidate</option>
                      <option value="45">45 Minutes per candidate</option>
                      <option value="60">60 Minutes per candidate</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Filter Candidates by Added Drive *</label>
                    <select 
                      className="form-select"
                      value={scheduleDriveId}
                      onChange={e => setScheduleDriveId(e.target.value)}
                    >
                      {drives.map(d => {
                        const driveCount = students.filter(s => s.driveId === d.id).length;
                        return (
                          <option key={d.id} value={d.id}>
                            {d.title} ({d.collegeName || 'Campus'}) — {driveCount} Candidates
                          </option>
                        );
                      })}
                      {drives.length > 1 && (
                        <option value="ALL">All Added Drives ({students.length} Candidates)</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Scheduled Breaks Parameters (2 Tea Breaks + 1 Lunch Break) */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#154360', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Coffee size={15} color="#154360" /> 2. Scheduled Breaks (2 Tea Breaks + 1 Lunch Break)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {/* Tea Break 1 */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#154360', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Coffee size={12} color="#0284c7" /> Morning Tea Break
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#0369a1', fontWeight: 700, background: '#e0f2fe', padding: '1px 5px', borderRadius: '3px' }}>
                        15 mins
                      </span>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.66rem', color: '#71717a', fontWeight: 600 }}>Start Time</label>
                      <TimeSelectInput 
                        value={teaBreak1Start} 
                        onChange={setTeaBreak1Start} 
                        placeholder="11:00"
                        isCompact
                      />
                    </div>
                    <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '3px' }}>
                      Window: {tea1StartMins !== null ? `${formatTime12h(tea1StartMins)} - ${formatTime12h(tea1EndMins)}` : 'Enter start time'}
                    </div>
                  </div>

                  {/* Lunch Break */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#154360', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Utensils size={12} color="#d97706" /> Lunch Break
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#b45309', fontWeight: 700, background: '#fef3c7', padding: '1px 5px', borderRadius: '3px' }}>
                        45 mins
                      </span>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.66rem', color: '#71717a', fontWeight: 600 }}>Start Time</label>
                      <TimeSelectInput 
                        value={lunchBreakStart} 
                        onChange={setLunchBreakStart} 
                        placeholder="01:00"
                        isCompact
                      />
                    </div>
                    <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '3px' }}>
                      Window: {lunchStartMins !== null ? `${formatTime12h(lunchStartMins)} - ${formatTime12h(lunchEndMins)}` : 'Enter start time'}
                    </div>
                  </div>

                  {/* Tea Break 2 */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#154360', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Coffee size={12} color="#0284c7" /> Afternoon Tea Break
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#0369a1', fontWeight: 700, background: '#e0f2fe', padding: '1px 5px', borderRadius: '3px' }}>
                        15 mins
                      </span>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.66rem', color: '#71717a', fontWeight: 600 }}>Start Time</label>
                      <TimeSelectInput 
                        value={teaBreak2Start} 
                        onChange={setTeaBreak2Start} 
                        placeholder="04:00"
                        isCompact
                      />
                    </div>
                    <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '3px' }}>
                      Window: {tea2StartMins !== null ? `${formatTime12h(tea2StartMins)} - ${formatTime12h(tea2EndMins)}` : 'Enter start time'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Day Capacity Calculation & Direct Autofill based on Timings */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#154360', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={15} color="#154360" /> 3. Day Capacity Calculation & Direct Auto-Allocation
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#154360', fontWeight: 700 }}>
                    Drive Pool: <strong>{allDriveCandidates.length}</strong> available
                  </span>
                </div>

                {!hasTimingInputs || slotDuration <= 0 ? (
                  <div style={{
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    <Clock size={16} color="#0284c7" />
                    <span>
                      Please enter <strong>Interview Starts From</strong>, <strong>Ends At</strong>, and <strong>Duration / Student</strong> above to calculate day capacity and generate interview time slots.
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Calculation breakdown strip */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gap: '8px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      marginBottom: '8px',
                      textAlign: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>Day Window</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#09090b', marginTop: '2px' }}>
                          {Math.floor(totalWindowMinutes / 60)}h {totalWindowMinutes % 60}m
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>Total Breaks</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>
                          -{totalBreakMinutes} mins
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>Net Interview Time</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#154360', marginTop: '2px' }}>
                          {netWorkingMinutes} mins
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>Slot / Student</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#09090b', marginTop: '2px' }}>
                          {slotDuration} mins
                        </div>
                      </div>
                      <div style={{ background: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                        <div style={{ fontSize: '0.65rem', color: '#065f46', textTransform: 'uppercase', fontWeight: 700 }}>Max Day Capacity</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#047857', marginTop: '1px' }}>
                          {maxDailyCapacity} Students
                        </div>
                      </div>
                    </div>

                    {/* Direct Autofill Status Badge */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#154360', fontWeight: 600 }}>
                        <CheckCircle2 size={15} color="#059669" />
                        <span>Autofilled <strong>{calculatedTimeSlots.length}</strong> students directly based on timings and slot duration.</span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        Est. Conclude Time: <strong>{formatTime12h(estimatedFinishMins)}</strong>
                      </span>
                    </div>
                  </>
                )}

                {/* Overtime Alert Warning */}
                {isExceedingTimeLimit && (
                  <div style={{ marginTop: '8px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.78rem', background: '#fef2f2', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '6px' }}>
                    <AlertTriangle size={15} color="#ef4444" />
                    <span>
                      Exceeds given time limit! Last interview will conclude at <strong>{formatTime12h(estimatedFinishMins)}</strong> ({overtimeMinutes} mins past {formatTime12h(endMins)}). Manager permission required below.
                    </span>
                  </div>
                )}
              </div>

              {/* 4. Manager Permission / Approval Card (Shown when time limit exceeded) */}
              {isExceedingTimeLimit && (
                <div style={{
                  background: '#fffbeb',
                  border: '1px solid #f59e0b',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(245, 158, 11, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontWeight: 800, fontSize: '0.84rem' }}>
                    <ShieldCheck size={17} color="#d97706" />
                    <span>Manager Permission Required (Schedule Exceeds Daily Time Limit by {overtimeMinutes} Mins)</span>
                  </div>

                  <div style={{ fontSize: '0.76rem', color: '#78350f', lineHeight: 1.4 }}>
                    Total required time for <strong>{calculatedTimeSlots.length} candidate slots</strong> plus <strong>{totalBreakMinutes} minutes break time</strong> extends the interview day to <strong>{formatTime12h(estimatedFinishMins)}</strong>. 
                    Because this exceeds the allocated limit of <strong>{formatTime12h(endMins)}</strong>, authorization from a TA Manager is mandatory before dispatching.
                  </div>

                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #fde68a',
                    borderRadius: '6px',
                    padding: '8px 10px'
                  }}>
                    {currentUser?.role === 'ADMIN' || currentUser?.role === 'MAIN_HR' ? (
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: '#154360' }}>
                        <input 
                          type="checkbox" 
                          checked={managerApprovalGranted} 
                          onChange={e => setManagerApprovalGranted(e.target.checked)} 
                          style={{ marginTop: '2px', width: '15px', height: '15px', cursor: 'pointer' }} 
                        />
                        <div>
                          <span>
                            I hereby grant Manager Permission as {currentUser?.role === 'ADMIN' ? 'Administrator' : 'HR Manager'} ({currentUser?.name}) to schedule overtime beyond {formatTime12h(endMins)}.
                          </span>
                          <div style={{ fontSize: '0.68rem', color: '#71717a', fontWeight: 500, marginTop: '2px' }}>
                            Authorized panel extension until {formatTime12h(estimatedFinishMins)}.
                          </div>
                        </div>
                      </label>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#154360' }}>
                          Select TA Manager Authorizing Overtime:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <select 
                            className="form-select" 
                            value={selectedManagerApprover} 
                            onChange={e => setSelectedManagerApprover(e.target.value)} 
                            style={{ fontSize: '0.76rem' }} 
                          >
                            <option value="">-- Choose Authorizing Manager --</option>
                            {users.filter(u => u.role === 'ADMIN' || u.role === 'MAIN_HR').map(m => (
                              <option key={m.id} value={`${m.name} (${m.role === 'ADMIN' ? 'Admin' : 'HR Manager'})`}>
                                {m.name} ({m.role === 'ADMIN' ? 'Administrator' : 'HR Manager'})
                              </option>
                            ))}
                          </select>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Manager approval note / authorization code" 
                            value={managerApprovalNote} 
                            onChange={e => setManagerApprovalNote(e.target.value)} 
                            style={{ fontSize: '0.76rem' }} 
                          />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700, color: '#92400e', marginTop: '2px' }}>
                          <input 
                            type="checkbox" 
                            checked={managerApprovalGranted} 
                            onChange={e => {
                              if (!selectedManagerApprover) {
                                alert('Please select an authorizing manager first.');
                                return;
                              }
                              setManagerApprovalGranted(e.target.checked);
                            }} 
                            style={{ width: '15px', height: '15px', cursor: 'pointer' }} 
                          />
                          <span>
                            I confirm verbal / written manager authorization has been received from {selectedManagerApprover || 'a TA Manager'}.
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Google Meet Room & Interviewer */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#154360', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Video size={15} color="#154360" /> 4. Google Meet Room & Interviewer
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Google Meet Link *</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="url" 
                        className="form-input" 
                        placeholder="https://meet.google.com/xxx-yyyy-zzz" 
                        value={scheduleMeetLink} 
                        onChange={e => setScheduleMeetLink(e.target.value)} 
                        required 
                        style={{ paddingLeft: '32px' }} 
                      />
                      <Video size={14} color="#059669" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Interviewer / Panel Member *</label>
                    <select 
                      className="form-select" 
                      value={schedulePanelist} 
                      onChange={e => setSchedulePanelist(e.target.value)} 
                      required 
                    >
                      <option value="">-- Select Interviewer / Panel Member --</option>
                      {hrStaffList.map(u => {
                        const roleLabel = u.role === 'MAIN_HR' 
                          ? 'HR Manager' 
                          : u.role === 'HR_INTERN' 
                            ? 'HR Intern' 
                            : u.role === 'ADMIN' 
                              ? 'Administrator' 
                              : 'HR Staff';
                        const displayVal = `${u.name} (${u.title || roleLabel})`;
                        return (
                          <option key={u.id} value={displayVal}>
                            {u.name} — {u.title || roleLabel}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* 5. Live Allocated Time Slots & Breaks Schedule Table */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ background: '#f1f5f9', padding: '8px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#154360' }}>
                    5. Live Allocated Time Slots & Breaks Schedule ({calculatedTimeSlots.length} candidates)
                  </div>
                  {candidatesEligibleForSchedule.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedCandidateIds(candidatesEligibleForSchedule.map(s => s.id))}
                        style={{ fontSize: '0.7rem', color: '#0369a1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                      >
                        Select All
                      </button>
                      <span style={{ color: '#cbd5e1' }}>|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedCandidateIds([])}
                        style={{ fontSize: '0.7rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                      >
                        Deselect All
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left', width: '30px' }}>✓</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', width: '35px' }}>#</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', minWidth: '150px' }}>Candidate Name</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', minWidth: '140px' }}>Roll No & Branch</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', minWidth: '180px', whiteSpace: 'nowrap' }}>Allocated Time Slot</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', minWidth: '150px', whiteSpace: 'nowrap' }}>Google Meet Room</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidatesEligibleForSchedule.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '24px 12px', textAlign: 'center', color: '#94a3b8' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                              <Clock size={20} color="#cbd5e1" />
                              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                {allDriveCandidates.length === 0 
                                  ? 'No candidates found in this drive pool.' 
                                  : 'Manually enter interview timings and duration above to calculate capacity & generate candidate slots.'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        candidatesEligibleForSchedule.map(student => {
                          const isSelected = selectedCandidateIds.includes(student.id);
                          const slotItem = calculatedTimeSlots.find(c => c.student.id === student.id);
                          return (
                            <React.Fragment key={student.id}>
                              {/* Break Banner row if a break occurred immediately before this slot */}
                              {slotItem?.breakBefore && (
                                <tr style={{ background: '#fffbeb', borderTop: '1px solid #fde68a', borderBottom: '1px solid #fde68a' }}>
                                  <td colSpan={6} style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 700, fontSize: '0.72rem', color: '#92400e' }}>
                                    {slotItem.breakBefore.type === 'TEA' ? '☕' : '🍱'} {slotItem.breakBefore.name} ({slotItem.breakBefore.duration} Mins): {formatTime12h(slotItem.breakBefore.startMins)} – {formatTime12h(slotItem.breakBefore.endMins)}
                                  </td>
                                </tr>
                              )}
                              <tr style={{ borderBottom: '1px solid #f1f5f9', background: isSelected ? '#ffffff' : '#fafafa', opacity: isSelected ? 1 : 0.6 }}>
                                <td style={{ padding: '8px 10px' }}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        setSelectedCandidateIds(prev => [...prev, student.id]);
                                      } else {
                                        setSelectedCandidateIds(prev => prev.filter(id => id !== student.id));
                                      }
                                    }}
                                  />
                                </td>
                                <td style={{ padding: '8px 10px', color: '#64748b', fontWeight: 700 }}>
                                  {slotItem ? slotItem.idx : '-'}
                                </td>
                                <td style={{ padding: '8px 10px', fontWeight: 700, color: '#154360' }}>
                                  {student.name}
                                </td>
                                <td style={{ padding: '8px 10px', color: '#64748b' }}>
                                  {student.rollNumber || 'N/A'} • {student.branch}
                                </td>
                                <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                                  {slotItem ? (
                                    <span style={{
                                      background: '#eff6ff',
                                      color: '#1d4ed8',
                                      border: '1px solid #bfdbfe',
                                      padding: '3px 8px',
                                      borderRadius: '4px',
                                      fontWeight: 800,
                                      fontSize: '0.74rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      ⏰ {slotItem.slotString}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>Unassigned</span>
                                  )}
                                </td>
                                <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                                  {scheduleMeetLink.trim() ? (
                                    <code style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                                      {scheduleMeetLink.replace('https://', '')}
                                    </code>
                                  ) : (
                                    <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Link required above</span>
                                  )}
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>




            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ padding: '14px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button 
                type="button" 
                onClick={() => setIsScheduleModalOpen(false)} 
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleConfirmSchedule}
                disabled={isDispatching || !calculatedTimeSlots.length || (isExceedingTimeLimit && !managerApprovalGranted)}
                className="btn-mustard"
                style={{
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  padding: '8px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: (isExceedingTimeLimit && !managerApprovalGranted) ? 0.6 : 1,
                  cursor: (isExceedingTimeLimit && !managerApprovalGranted) ? 'not-allowed' : 'pointer'
                }}
              >
                {isExceedingTimeLimit && !managerApprovalGranted ? (
                  <>🔒 Manager Approval Required to Dispatch</>
                ) : (
                  <>
                    <Send size={15} color="#154360" />
                    {isDispatching ? 'Dispatching Invites...' : `Confirm & Dispatch Schedule (${calculatedTimeSlots.length} Students)`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          POST-SCHEDULE DISPATCH CONFIRMATION DIALOG
          ========================================================================= */}
      {dispatchConfirmationData && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div style={{
            background: '#ffffff',
            maxWidth: '620px',
            width: '94%',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
            border: '1px solid #cbd5e1',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Form Dialog Header */}
            <div style={{ background: '#154360', color: '#ffffff', padding: '16px 20px', textAlign: 'center', borderBottom: '3px solid #FFDB58' }}>
              <div style={{ width: '42px', height: '42px', background: '#FFDB58', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <CheckCircle2 size={24} color="#154360" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                Interview Drive Scheduled & Dispatched!
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#e2e8f0' }}>
                Interview time slots and Google Meet links have been generated and dispatched to students.
              </p>
            </div>

            {/* Form Body - Seamless with zero external gaps */}
            <div style={{ background: '#ffffff', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Form Row 1: Key Schedule Metrics */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 8px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.5px' }}>TOTAL SCHEDULED</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#154360', marginTop: '1px' }}>
                    {dispatchConfirmationData.totalCount}
                  </div>
                </div>
                <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.5px' }}>INTERVIEW DATE</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#154360', marginTop: '4px' }}>
                    {dispatchConfirmationData.scheduledDate}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.5px' }}>TIME WINDOW</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
                    {dispatchConfirmationData.firstSlot} - {dispatchConfirmationData.lastSlot}
                  </div>
                </div>
              </div>

              {/* Form Row 2: Candidate Email Dispatch Box */}
              <div style={{
                background: dispatchConfirmationData.emailStatus?.sentCount > 0 ? '#f0fdf4' : '#fffbeb',
                border: `1px solid ${dispatchConfirmationData.emailStatus?.sentCount > 0 ? '#bbf7d0' : '#fde68a'}`,
                borderRadius: '8px',
                padding: '10px 14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: dispatchConfirmationData.emailStatus?.sentCount > 0 ? '#166534' : '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={15} color={dispatchConfirmationData.emailStatus?.sentCount > 0 ? '#16a34a' : '#d97706'} />
                    {dispatchConfirmationData.emailStatus?.sentCount > 0 
                      ? `Interview Links Delivered (${dispatchConfirmationData.emailStatus.sentCount} Students Emailed)`
                      : 'Candidate Email Dispatch Status'}
                  </div>
                  {dispatchConfirmationData.emailStatus?.sentCount > 0 ? (
                    <span style={{ fontSize: '0.66rem', background: '#dcfce7', color: '#15803d', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                      DELIVERED LIVE
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.66rem', background: '#fef3c7', color: '#b45309', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                      READY TO DISPATCH
                    </span>
                  )}
                </div>

                {dispatchConfirmationData.emailStatus?.sentCount > 0 ? (
                  <div style={{ fontSize: '0.76rem', color: '#15803d', lineHeight: 1.4 }}>
                    Personalized Google Meet invitation emails with date, allocated slot, and meet link were successfully delivered to candidate inboxes.
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '0.74rem', color: '#78350f', lineHeight: 1.35 }}>
                      Interview invitations generated with Google Meet links for <strong>{dispatchConfirmationData.totalCount} candidates</strong>. Enter your sender email and password below to dispatch live:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr auto', gap: '6px', marginTop: '6px', alignItems: 'center' }}>
                      <select
                        className="form-select"
                        value={emailProvider}
                        onChange={e => setEmailProvider(e.target.value)}
                        style={{ fontSize: '0.72rem', padding: '4px 6px' }}
                      >
                        <option value="gmail">Gmail SMTP</option>
                        <option value="resend">Resend API</option>
                        <option value="sendgrid">SendGrid API</option>
                      </select>
                      <input 
                        type="email"
                        className="form-input"
                        placeholder="Sender Email"
                        value={smtpSenderEmail}
                        onChange={e => setSmtpSenderEmail(e.target.value)}
                        style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                      />
                      <input 
                        type="password"
                        className="form-input"
                        placeholder="Password / App Key"
                        value={smtpAppPassword}
                        onChange={e => setSmtpAppPassword(e.target.value)}
                        style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                      />
                      <button
                        type="button"
                        onClick={handleSaveSmtpAndResend}
                        disabled={isSendingLiveEmails || !smtpAppPassword.trim()}
                        className="btn-mustard"
                        style={{ fontSize: '0.72rem', fontWeight: 800, padding: '5px 12px', whiteSpace: 'nowrap' }}
                      >
                        {isSendingLiveEmails ? 'Sending...' : 'Save & Send'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Row 3: Google Meet Virtual Room */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '9px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.5px' }}>GOOGLE MEET ROOM</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#15803d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                    {dispatchConfirmationData.meetLink}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => window.open(dispatchConfirmationData.meetLink, '_blank')}
                  className="btn-navy btn-black-sm"
                  style={{ fontSize: '0.72rem', padding: '5px 12px', gap: '5px', flexShrink: 0 }}
                >
                  <Video size={13} color="#FFDB58" /> Open Meet Room
                </button>
              </div>

              {/* Form Row 4: Action Buttons in 2-column grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleCopyScheduleToClipboard}
                  className="btn-secondary"
                  style={{ justifyContent: 'center', padding: '8px 10px', fontSize: '0.76rem', fontWeight: 700, background: '#ffffff' }}
                >
                  {copiedScheduleText ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  {copiedScheduleText ? 'Copied Full Schedule Sheet!' : 'Copy Formatted Schedule Sheet for College TPO'}
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="btn-secondary"
                  style={{ justifyContent: 'center', padding: '8px 10px', fontSize: '0.76rem', fontWeight: 700, color: '#047857', borderColor: '#a7f3d0', background: '#ffffff' }}
                >
                  <Share2 size={14} color="#059669" /> Share Schedule to WhatsApp Placement Group
                </button>
              </div>
            </div>

            {/* Form Footer */}
            <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setDispatchConfirmationData(null);
                  setIsScheduleModalOpen(false);
                }}
                className="btn-mustard"
                style={{ fontWeight: 800, padding: '7px 20px', fontSize: '0.85rem' }}
              >
                Done • View Student Board
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIVERSAL IN-APP DELETE MODAL (Zero window.confirm, 100% reliable) */}
      {deleteModalConfig && (
        <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={() => setDeleteModalConfig(null)}>
          <div className="modal-card" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid #fee2e2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Trash2 size={18} color="#ef4444" />
                </div>
                <div>
                  <h3 className="modal-title" style={{ color: '#991b1b', fontSize: '1.05rem' }}>{deleteModalConfig.title}</h3>
                  <p className="modal-subtitle">{deleteModalConfig.subtitle || 'Confirm Permanent Deletion'}</p>
                </div>
              </div>
              <button onClick={() => setDeleteModalConfig(null)} className="modal-close-btn">&times;</button>
            </div>
            <div className="modal-body" style={{ padding: '16px 20px', fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>
              {deleteModalConfig.message}
              {deleteModalConfig.dangerNote && (
                <div style={{ marginTop: '12px', padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.8rem', color: '#991b1b' }}>
                  ⚠️ <strong>Notice:</strong> {deleteModalConfig.dangerNote}
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '12px 20px', borderTop: '1px solid #e2e8f0' }}>
              <button type="button" onClick={() => setDeleteModalConfig(null)} className="btn-secondary">
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => {
                  const action = deleteModalConfig.onConfirm;
                  setDeleteModalConfig(null);
                  if (action) action();
                }} 
                className="btn-danger"
                style={{ background: '#ef4444', color: '#ffffff', fontWeight: 800, padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
              >
                {deleteModalConfig.confirmLabel || 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}