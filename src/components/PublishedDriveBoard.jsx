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
  Play
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
  onOpenNewStudentModal,
  hrPhoneNumber,
  onOpenPhoneConnectModal,
  onBatchUpdateStudents,
  addToast,
  currentUser,
  users = []
}) {
  const [selectedDriveId, setSelectedDriveId] = useState(drives[0]?.id || '');
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

  // ---------------- Schedule Interviews State & Engine ----------------
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDriveId, setScheduleDriveId] = useState(() => selectedDriveId || activeDrive?.id || drives[0]?.id || 'ALL');
  const [scheduleDate, setScheduleDate] = useState(() => activeDrive?.driveDate || new Date().toISOString().split('T')[0]);
  const [scheduleStartTime, setScheduleStartTime] = useState('10:00');
  const [scheduleSlotMinutes, setScheduleSlotMinutes] = useState(10);
  const [scheduleBufferMinutes, setScheduleBufferMinutes] = useState(0);
  const [scheduleMeetLink, setScheduleMeetLink] = useState(() => `https://meet.google.com/tac-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`);
  const [scheduleLimit, setScheduleLimit] = useState(25);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [autoDispatchInvites, setAutoDispatchInvites] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchConfirmationData, setDispatchConfirmationData] = useState(null);
  const [copiedScheduleText, setCopiedScheduleText] = useState(false);
  const [copiedMeetLink, setCopiedMeetLink] = useState(false);

  // List of active HR Employees and Interns for Interviewer / Panel dropdown
  const hrStaffList = useMemo(() => {
    if (!Array.isArray(users) || users.length === 0) {
      return [{ id: 'hr-default', name: 'Talent Acquisition Team', role: 'MAIN_HR', title: 'HR Panel' }];
    }
    const filtered = users.filter(u => u && (u.role === 'MAIN_HR' || u.role === 'HR_INTERN' || u.role === 'ADMIN'));
    return filtered.length > 0 ? filtered : users;
  }, [users]);

  const [schedulePanelist, setSchedulePanelist] = useState(() => {
    if (currentUser?.name) {
      const roleLabel = currentUser.role === 'MAIN_HR' ? 'HR Manager' : currentUser.role === 'HR_INTERN' ? 'HR Intern' : 'HR Panel';
      return `${currentUser.name} (${currentUser.title || roleLabel})`;
    }
    return 'Combined TA HR Panel';
  });

  // Ensure schedulePanelist has a valid default if users are loaded later
  useEffect(() => {
    if (!schedulePanelist && hrStaffList.length > 0) {
      const first = hrStaffList[0];
      const roleLabel = first.role === 'MAIN_HR' ? 'HR Manager' : first.role === 'HR_INTERN' ? 'HR Intern' : 'HR Staff';
      setSchedulePanelist(`${first.name} (${first.title || roleLabel})`);
    }
  }, [hrStaffList, schedulePanelist]);

  // Keep scheduleDate synced with activeDrive when activeDrive changes
  useEffect(() => {
    if (activeDrive?.driveDate) {
      setScheduleDate(activeDrive.driveDate);
    }
  }, [activeDrive?.id]);

  // Format total minutes to 12-hour AM/PM string (e.g. 600 -> "10:00 AM", 730 -> "12:10 PM")
  const formatTime12h = (totalMinutes) => {
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
    if (!timeStr) return 600; // 10:00 AM
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };

  // Filter candidates eligible for scheduling based on selected drive and batch limit (shows added drives)
  const candidatesEligibleForSchedule = useMemo(() => {
    const list = scheduleDriveId === 'ALL'
      ? students
      : students.filter(s => s.driveId === scheduleDriveId);
    const limit = parseInt(scheduleLimit, 10) || 99999;
    return list.slice(0, limit);
  }, [students, scheduleDriveId, scheduleLimit]);

  // Synchronize selected IDs when candidate list changes
  useEffect(() => {
    setSelectedCandidateIds(candidatesEligibleForSchedule.map(s => s.id));
  }, [candidatesEligibleForSchedule]);

  // Automatically calculate individual time slots for all selected candidates
  const calculatedTimeSlots = useMemo(() => {
    const startMins = parseTimeToMinutes(scheduleStartTime);
    const duration = parseInt(scheduleSlotMinutes, 10) || 10;
    const buffer = parseInt(scheduleBufferMinutes, 10) || 0;
    const step = duration + buffer;

    const selectedStudents = candidatesEligibleForSchedule.filter(s => selectedCandidateIds.includes(s.id));

    return selectedStudents.map((student, idx) => {
      const slotStartMins = startMins + idx * step;
      const slotEndMins = slotStartMins + duration;
      const startFormatted = formatTime12h(slotStartMins);
      const endFormatted = formatTime12h(slotEndMins);
      const slotString = `${startFormatted} - ${endFormatted}`;

      return {
        student,
        idx: idx + 1,
        slotStartMins,
        slotEndMins,
        startFormatted,
        endFormatted,
        slotString,
      };
    });
  }, [candidatesEligibleForSchedule, selectedCandidateIds, scheduleStartTime, scheduleSlotMinutes, scheduleBufferMinutes]);

  // Confirm schedule & dispatch interview invites
  const handleConfirmSchedule = async () => {
    if (!calculatedTimeSlots.length) {
      alert('Please select at least one candidate to schedule.');
      return;
    }

    if (!scheduleMeetLink.trim()) {
      alert('Please enter or generate a Google Meet link.');
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

    // Open success dispatch confirmation modal
    setDispatchConfirmationData({
      driveTitle: targetDrive?.title || 'Campus Placement Drive',
      collegeName: targetDrive?.collegeName || 'Campus',
      jobRole: targetDrive?.jobRole || 'Engineering Associate',
      scheduledDate: scheduleDate,
      firstSlot: calculatedTimeSlots[0].startFormatted,
      lastSlot: calculatedTimeSlots[calculatedTimeSlots.length - 1].endFormatted,
      totalCount: updatedStudents.length,
      meetLink: cleanMeet,
      scheduledList: calculatedTimeSlots
    });

    setIsDispatching(false);
    if (addToast) {
      addToast(`🎉 Dispatched interview slots & Google Meet links to ${updatedStudents.length} candidates!`, 'success');
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: 'var(--font-sm)', color: '#154360', lineHeight: 'var(--lh-sm)' }}>
                Drive:
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
                padding: '5px 12px',
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
                setDispatchConfirmationData(null);
                setIsScheduleModalOpen(true);
              }}
              className="btn-navy btn-black-sm"
              style={{
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
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
                          marginTop: '3px'
                        }}>
                          <Clock size={10} color="#1d4ed8" />
                          <span>{student.interviewTime}</span>
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
                    {student.interviewTime && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        color: '#1d4ed8',
                        borderRadius: '4px',
                        padding: '1px 5px',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        marginTop: '3px'
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
                      title={student.meetLink ? `Join Google Meet (${student.interviewTime || ''})` : "Video Interview Room"}
                    >
                      <Video size={11} color="#FFDB58" /> {student.meetLink ? 'Meet' : 'Video'}
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

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Parameters Grid */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#154360', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={15} color="#154360" /> 1. Interview Date & Time Slot Parameters
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
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
                    <label className="form-label">First Slot Start Time *</label>
                    <input 
                      type="time" 
                      className="form-input" 
                      value={scheduleStartTime} 
                      onChange={e => setScheduleStartTime(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Duration / Student *</label>
                    <select 
                      className="form-select"
                      value={scheduleSlotMinutes}
                      onChange={e => setScheduleSlotMinutes(parseInt(e.target.value, 10))}
                    >
                      <option value="10">10 Minutes per candidate</option>
                      <option value="15">15 Minutes per candidate</option>
                      <option value="20">20 Minutes per candidate</option>
                      <option value="30">30 Minutes per candidate</option>
                      <option value="45">45 Minutes per candidate</option>
                      <option value="60">60 Minutes per candidate</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Buffer Between Slots</label>
                    <select 
                      className="form-select"
                      value={scheduleBufferMinutes}
                      onChange={e => setScheduleBufferMinutes(parseInt(e.target.value, 10))}
                    >
                      <option value="0">0 mins (Back-to-back)</option>
                      <option value="5">5 mins break</option>
                      <option value="10">10 mins break</option>
                      <option value="15">15 mins break</option>
                    </select>
                  </div>
                </div>

                {/* Scope & Batch Limit */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Filter Candidates by Added Drive *</label>
                    <select 
                      className="form-select"
                      value={scheduleDriveId}
                      onChange={e => {
                        const dId = e.target.value;
                        setScheduleDriveId(dId);
                        const chosen = drives.find(d => d.id === dId);
                        if (chosen?.driveDate) {
                          setScheduleDate(chosen.driveDate);
                        }
                      }}
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

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Number of Candidates to Schedule *</label>
                    <select 
                      className="form-select"
                      value={scheduleLimit}
                      onChange={e => setScheduleLimit(parseInt(e.target.value, 10))}
                    >
                      <option value="5">First 5 Candidates</option>
                      <option value="10">First 10 Candidates</option>
                      <option value="25">First 25 Candidates</option>
                      <option value="50">First 50 Candidates</option>
                      <option value="100">First 100 Candidates</option>
                      <option value="99999">All Candidates in Selected Drive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Google Meet & Panelist Section */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#154360', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Video size={15} color="#154360" /> 2. Google Meet Room & Interviewer
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
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
                    >
                      {hrStaffList.map(u => {
                        const roleLabel = u.role === 'MAIN_HR' 
                          ? 'HR Manager' 
                          : u.role === 'HR_INTERN' 
                            ? 'HR Intern' 
                            : u.role === 'ADMIN' 
                              ? 'Admin' 
                              : 'HR Staff';
                        const displayVal = `${u.name} (${u.title || roleLabel})`;
                        return (
                          <option key={u.id} value={displayVal}>
                            {u.name} — {u.title || roleLabel}
                          </option>
                        );
                      })}
                      <option value="Combined TA HR Panel">Combined TA HR Panel</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Real-time Calculation Summary Banner */}
              {calculatedTimeSlots.length > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #154360 0%, #1e5f8a 100%)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  boxShadow: '0 4px 6px -1px rgba(21, 67, 96, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#FFDB58', color: '#154360', width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {calculatedTimeSlots.length}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
                        {calculatedTimeSlots.length} Candidates Scheduled Automatically
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#FFDB58' }}>
                        Time Window: <strong>{calculatedTimeSlots[0].startFormatted}</strong> to <strong>{calculatedTimeSlots[calculatedTimeSlots.length - 1].endFormatted}</strong> ({scheduleSlotMinutes}m per candidate)
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.74rem', background: 'rgba(255,255,255,0.12)', padding: '6px 12px', borderRadius: '6px' }}>
                    📅 {scheduleDate} • 🔗 Google Meet Attached
                  </div>
                </div>
              )}

              {/* Time Slot Live Preview Table */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ background: '#f1f5f9', padding: '8px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#154360' }}>
                    Calculated Time Slots Preview ({calculatedTimeSlots.length} candidates)
                  </div>
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
                </div>

                <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '6px 10px', textAlign: 'left', width: '30px' }}>✓</th>
                        <th style={{ padding: '6px 10px', textAlign: 'left' }}>#</th>
                        <th style={{ padding: '6px 10px', textAlign: 'left' }}>Candidate Name</th>
                        <th style={{ padding: '6px 10px', textAlign: 'left' }}>Roll No & Branch</th>
                        <th style={{ padding: '6px 10px', textAlign: 'left' }}>Allocated Time Slot</th>
                        <th style={{ padding: '6px 10px', textAlign: 'left' }}>Google Meet Room</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidatesEligibleForSchedule.map((student, idx) => {
                        const isSelected = selectedCandidateIds.includes(student.id);
                        const slotItem = calculatedTimeSlots.find(c => c.student.id === student.id);
                        return (
                          <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9', background: isSelected ? '#ffffff' : '#fafafa', opacity: isSelected ? 1 : 0.6 }}>
                            <td style={{ padding: '6px 10px' }}>
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
                            <td style={{ padding: '6px 10px', color: '#64748b', fontWeight: 700 }}>
                              {slotItem ? slotItem.idx : '-'}
                            </td>
                            <td style={{ padding: '6px 10px', fontWeight: 700, color: '#154360' }}>
                              {student.name}
                            </td>
                            <td style={{ padding: '6px 10px', color: '#64748b' }}>
                              {student.rollNumber || 'N/A'} • {student.branch}
                            </td>
                            <td style={{ padding: '6px 10px' }}>
                              {slotItem ? (
                                <span style={{
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  border: '1px solid #bfdbfe',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontWeight: 800,
                                  fontSize: '0.74rem'
                                }}>
                                  ⏰ {slotItem.slotString}
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>Unassigned</span>
                              )}
                            </td>
                            <td style={{ padding: '6px 10px' }}>
                              <code style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                                {scheduleMeetLink.replace('https://', '')}
                              </code>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Automatic Dispatch to Student Notification Preview */}
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800, color: '#065f46' }}>
                    <input 
                      type="checkbox" 
                      checked={autoDispatchInvites}
                      onChange={e => setAutoDispatchInvites(e.target.checked)}
                      style={{ accentColor: '#059669', width: '16px', height: '16px' }}
                    />
                    <span>Automatically Dispatch Interview Timings & Google Meet Link to Students</span>
                  </label>
                  <span style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 700 }}>
                    📧 Email • 💬 WhatsApp Dispatch Ready
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#047857', lineHeight: 1.4, paddingLeft: '24px' }}>
                  Each student will receive their <strong>exact allotted time slot</strong>, date ({scheduleDate}), and direct clickable <strong>Google Meet link</strong> immediately upon confirmation.
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
                disabled={isDispatching || !calculatedTimeSlots.length}
                className="btn-mustard"
                style={{
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  padding: '8px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Send size={15} color="#154360" />
                {isDispatching ? 'Dispatching Invites...' : `Confirm & Dispatch Schedule (${calculatedTimeSlots.length} Students)`}
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
          <div className="modal-content" style={{ maxWidth: '640px', width: '92%', borderRadius: '14px', overflow: 'hidden', padding: 0 }}>
            <div style={{ background: '#154360', color: '#ffffff', padding: '18px 20px', textAlign: 'center', borderBottom: '3px solid #FFDB58' }}>
              <div style={{ width: '48px', height: '48px', background: '#FFDB58', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <CheckCircle2 size={28} color="#154360" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                Interview Drive Scheduled & Dispatched!
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#e2e8f0' }}>
                Interview time slots and Google Meet links have been generated and dispatched to students.
              </p>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>TOTAL SCHEDULED</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#154360' }}>
                    {dispatchConfirmationData.totalCount}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>DATE</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#154360' }}>
                    {dispatchConfirmationData.scheduledDate}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>TIME WINDOW</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0284c7' }}>
                    {dispatchConfirmationData.firstSlot} - {dispatchConfirmationData.lastSlot}
                  </div>
                </div>
              </div>

              {/* Google Meet Info Box */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700 }}>GOOGLE MEET ROOM</div>
                  <code style={{ fontSize: '0.82rem', fontWeight: 800, color: '#15803d' }}>
                    {dispatchConfirmationData.meetLink}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => window.open(dispatchConfirmationData.meetLink, '_blank')}
                  className="btn-navy btn-black-sm"
                  style={{ fontSize: '0.75rem', padding: '4px 10px', gap: '4px' }}
                >
                  <Video size={13} color="#FFDB58" /> Open Meet Room
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleCopyScheduleToClipboard}
                  className="btn-secondary"
                  style={{ justifyContent: 'center', padding: '9px', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  {copiedScheduleText ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                  {copiedScheduleText ? 'Copied Full Schedule Sheet!' : 'Copy Formatted Schedule Sheet for College TPO'}
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="btn-secondary"
                  style={{ justifyContent: 'center', padding: '9px', fontSize: '0.82rem', fontWeight: 700, color: '#047857', borderColor: '#a7f3d0' }}
                >
                  <Share2 size={15} color="#059669" /> Share Schedule to WhatsApp Placement Group
                </button>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
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
    </div>
  );
}