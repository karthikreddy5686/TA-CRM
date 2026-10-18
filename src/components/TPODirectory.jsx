import React, { useState } from 'react';
import { 
  Building2, 
  Phone, 
  Edit3, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Mail, 
  CheckCircle2, 
  UserCheck, 
  FileSpreadsheet,
  Trash2,
  X,
  ExternalLink,
  Link2,
  Copy,
  Check,
  RefreshCw,
  Upload,
  Sparkles,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const getStatusBadgeStyle = (status) => {
  switch (status) {
    case 'DRIVE_CONFIRMED':
      return { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' };
    case 'DETAILS_SENT':
      return { background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' };
    case 'FOLLOW_UP_NEEDED':
    case 'CALL_AGAIN':
      return { background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' };
    case 'NOT_ANSWERED':
      return { background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' };
    case 'NOT_INTERESTED':
      return { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' };
    default:
      return { background: '#ffffff', color: '#09090b', border: '1px solid #cbd5e1' };
  }
};

export default function TPODirectory({ 
  tpos, 
  colleges, 
  users, 
  currentRole, 
  onStartCall, 
  onAddTpo, 
  onAddTposBatch,
  onUpdateTpo,
  onDeleteTpo,
  onUpdateTpoStatus,
  onScheduleFollowUp
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [internFilter, setInternFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedTpos, setExpandedTpos] = useState({});
  const toggleTpoExpand = (id) => {
    setExpandedTpos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Edit TPO state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTpo, setEditingTpo] = useState(null);
  const [editForm, setEditForm] = useState({
    collegeName: '',
    city: '',
    tier: 'Tier 1',
    name: '',
    designation: '',
    phone: '',
    email: '',
    status: 'NEW_LEAD',
    assignedInternId: '',
    notes: ''
  });

  const handleOpenEditTpo = (tpo) => {
    setEditingTpo(tpo);
    setEditForm({
      collegeName: tpo.collegeName || '',
      city: tpo.city || '',
      tier: tpo.tier || 'Tier 1',
      name: tpo.name || '',
      designation: tpo.designation || 'Training & Placement Officer',
      phone: tpo.phone || '',
      email: tpo.email || '',
      status: tpo.status || 'NEW_LEAD',
      assignedInternId: tpo.assignedInternId || ((users || []).find(u => u.role !== 'ADMIN')?.id || ''),
      notes: tpo.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEditTpo = (e) => {
    e.preventDefault();
    if (!editingTpo) return;

    const assignedStaff = staffMembers.find(u => u.id === editForm.assignedInternId) || (users || []).find(u => u.id === editForm.assignedInternId);

    const updated = {
      ...editingTpo,
      collegeName: editForm.collegeName.trim(),
      city: editForm.city.trim(),
      tier: editForm.tier,
      name: editForm.name.trim(),
      designation: editForm.designation.trim(),
      phone: editForm.phone.trim(),
      email: editForm.email.trim(),
      status: editForm.status,
      assignedInternId: editForm.assignedInternId,
      assignedInternName: assignedStaff ? assignedStaff.name : (editingTpo.assignedInternName || 'Staff Recruiter'),
      notes: editForm.notes
    };

    if (onUpdateTpo) {
      onUpdateTpo(updated);
    }
    setIsEditModalOpen(false);
    setEditingTpo(null);
  };

  // Link Google Sheets state
  const [isLinkSheetsModalOpen, setIsLinkSheetsModalOpen] = useState(false);
  const [linkedSheetUrl, setLinkedSheetUrl] = useState(() => localStorage.getItem('tacrm_tpos_sheet_url') || '');
  const [sheetInputUrl, setSheetInputUrl] = useState('');
  const [activeSheetTab, setActiveSheetTab] = useState('URL'); // 'URL' | 'PASTE'
  const [pasteText, setPasteText] = useState('');
  const [parsedTpos, setParsedTpos] = useState([]);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState(null);
  const [copiedSample, setCopiedSample] = useState(false);

  // New TPO form state
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newTier, setNewTier] = useState('Tier 1');
  const [newName, setNewName] = useState('');
  const [newDesignation, setNewDesignation] = useState('Training & Placement Officer');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAssignedIntern, setNewAssignedIntern] = useState(users.find(u => u.role !== 'ADMIN')?.id || '');
  const [newNotes, setNewNotes] = useState('');

  const staffMembers = (users || []).filter(u => u.role !== 'ADMIN');

  // Parse rows from Google Sheet CSV or pasted clipboard text
  const parseTpoRows = (text) => {
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
      h.includes('name') || h.includes('college') || h.includes('phone') || 
      h.includes('email') || h.includes('tpo') || h.includes('officer')
    );

    let colIndices = {
      name: -1,
      college: -1,
      phone: -1,
      email: -1,
      designation: -1,
      city: -1,
      tier: -1,
      status: -1,
    };

    if (hasHeader) {
      headerTokens.forEach((h, idx) => {
        if (colIndices.college === -1 && (h.includes('college') || h.includes('university') || h.includes('campus') || h.includes('institution'))) {
          colIndices.college = idx;
        } else if (colIndices.name === -1 && (h.includes('name') || h.includes('tpo') || h.includes('officer') || h.includes('contact'))) {
          colIndices.name = idx;
        } else if (colIndices.phone === -1 && (h.includes('phone') || h.includes('mobile') || h.includes('contact') || h.includes('whatsapp') || h.includes('tel'))) {
          colIndices.phone = idx;
        } else if (colIndices.email === -1 && (h.includes('email') || h.includes('mail'))) {
          colIndices.email = idx;
        } else if (colIndices.designation === -1 && (h.includes('designation') || h.includes('role') || h.includes('title'))) {
          colIndices.designation = idx;
        } else if (colIndices.city === -1 && (h.includes('city') || h.includes('location') || h.includes('state'))) {
          colIndices.city = idx;
        } else if (colIndices.tier === -1 && h.includes('tier')) {
          colIndices.tier = idx;
        } else if (colIndices.status === -1 && h.includes('status')) {
          colIndices.status = idx;
        }
      });
    }

    const dataLines = hasHeader ? lines.slice(1) : lines;
    const defaultStaff = staffMembers[0] || { id: 'unassigned', name: 'Staff Recruiter' };

    const parsed = [];
    dataLines.forEach((line, rowIdx) => {
      const cols = parseLine(line);
      if (cols.length === 0 || cols.every(c => !c)) return;

      let name = '';
      let college = '';
      let phone = '';
      let email = '';
      let designation = '';
      let city = '';
      let tier = 'Tier 1';
      let status = 'NEW_LEAD';

      if (hasHeader) {
        name = colIndices.name !== -1 ? cols[colIndices.name] || '' : '';
        college = colIndices.college !== -1 ? cols[colIndices.college] || '' : '';
        phone = colIndices.phone !== -1 ? cols[colIndices.phone] || '' : '';
        email = colIndices.email !== -1 ? cols[colIndices.email] || '' : '';
        designation = colIndices.designation !== -1 ? cols[colIndices.designation] || '' : '';
        city = colIndices.city !== -1 ? cols[colIndices.city] || '' : '';
        tier = colIndices.tier !== -1 ? cols[colIndices.tier] || 'Tier 1' : 'Tier 1';
        status = colIndices.status !== -1 ? cols[colIndices.status] || 'NEW_LEAD' : 'NEW_LEAD';
      } else {
        const phoneIdx = cols.findIndex(c => /^\+?[\d\s-]{8,15}$/.test(c.trim()));
        const emailIdx = cols.findIndex(c => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.trim()));
        if (phoneIdx !== -1) phone = cols[phoneIdx];
        if (emailIdx !== -1) email = cols[emailIdx];

        const remaining = cols.map((c, i) => ({ val: c, idx: i })).filter(item => item.idx !== phoneIdx && item.idx !== emailIdx && item.val);
        if (remaining.length > 0) name = remaining[0].val;
        if (remaining.length > 1) college = remaining[1].val;
        if (remaining.length > 2) designation = remaining[2].val;
        if (remaining.length > 3) city = remaining[3].val;
      }

      if (!name && !college && !phone) return;

      const cleanTier = /tier\s*3/i.test(tier) ? 'Tier 3' : /tier\s*2/i.test(tier) ? 'Tier 2' : 'Tier 1';

      parsed.push({
        id: `tpo-${Date.now()}-${rowIdx}-${Math.random().toString(36).substring(2, 6)}`,
        name: name || 'Placement Official',
        collegeName: college || 'Campus Institution',
        phone: phone || '',
        email: email || `${(name || 'tpo').toLowerCase().replace(/\s+/g, '.')}@${(college || 'campus').toLowerCase().replace(/[^a-z0-9]/g, '')}.edu`,
        designation: designation || 'Training & Placement Officer',
        city: city || 'Campus City',
        tier: cleanTier,
        status: ['NOT_ANSWERED', 'NOT_INTERESTED', 'DRIVE_CONFIRMED', 'DETAILS_SENT', 'FOLLOW_UP_NEEDED', 'CALL_AGAIN', 'PITCHED', 'CONTACTED', 'NEW_LEAD'].includes((status || '').toUpperCase().replace(/\s+/g, '_'))
          ? (status || '').toUpperCase().replace(/\s+/g, '_')
          : 'NEW_LEAD',
        assignedInternId: defaultStaff.id,
        assignedInternName: defaultStaff.name,
        notes: 'Imported via Linked Sheets',
        lastContacted: new Date().toISOString().split('T')[0]
      });
    });

    return parsed;
  };

  const handlePasteChange = (e) => {
    const text = e.target.value;
    setPasteText(text);
    const parsed = parseTpoRows(text);
    setParsedTpos(parsed);
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
      const parsed = parseTpoRows(csvText);

      if (parsed.length > 0) {
        if (onAddTposBatch) {
          onAddTposBatch(parsed);
        } else if (onAddTpo) {
          parsed.forEach(t => onAddTpo(t));
        }

        setLinkedSheetUrl(targetUrl.trim());
        localStorage.setItem('tacrm_tpos_sheet_url', targetUrl.trim());

        setImportStatusMessage({
          type: 'success',
          text: `Successfully synced & imported ${parsed.length} TPO records from Google Sheet!`
        });
        setSheetInputUrl('');
      } else {
        throw new Error('No valid TPO rows found in Google Sheet.');
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

  const handleImportPastedTpos = () => {
    if (parsedTpos.length === 0) return;
    if (onAddTposBatch) {
      onAddTposBatch(parsedTpos);
    } else if (onAddTpo) {
      parsedTpos.forEach(t => onAddTpo(t));
    }
    setImportStatusMessage({
      type: 'success',
      text: `Successfully imported ${parsedTpos.length} TPO records into directory!`
    });
    setPasteText('');
    setParsedTpos([]);
    setTimeout(() => {
      setIsLinkSheetsModalOpen(false);
      setImportStatusMessage(null);
    }, 1500);
  };

  const handleUnlinkSheet = () => {
    setLinkedSheetUrl('');
    localStorage.removeItem('tacrm_tpos_sheet_url');
    setImportStatusMessage({ type: 'info', text: 'Google Sheet unlinked.' });
  };

  const sampleTemplateText = "Name\tCollege\tPhone\tEmail\tDesignation\tCity\tTier\nDr. Ramesh Gupta\tIIT Madras\t+91 98401 23456\tplacement@iitm.ac.in\tHead of Placements\tChennai\tTier 1\nProf. Sunita Rao\tNIT Surathkal\t+91 94481 65432\ttpo@nitk.edu.in\tTraining & Placement Officer\tMangalore\tTier 1";

  const handleCopySample = () => {
    navigator.clipboard.writeText(sampleTemplateText);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
  };

  // TPO Outreach Section Counts
  const countAll = (tpos || []).length;
  const countNotAnswered = (tpos || []).filter(t => t.status === 'NOT_ANSWERED').length;
  const countNotInterested = (tpos || []).filter(t => t.status === 'NOT_INTERESTED').length;
  const countDriveConfirmed = (tpos || []).filter(t => t.status === 'DRIVE_CONFIRMED').length;
  const countDetailsSent = (tpos || []).filter(t => t.status === 'DETAILS_SENT').length;
  const countCallAgain = (tpos || []).filter(t => t.status === 'FOLLOW_UP_NEEDED' || t.status === 'CALL_AGAIN').length;

  // Filtered TPOs
  const filteredTpos = (tpos || []).filter(tpo => {
    const matchesSearch = 
      (tpo.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tpo.collegeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tpo.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tpo.phone || '').includes(searchTerm);

    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'FOLLOW_UP_NEEDED' ? (tpo.status === 'FOLLOW_UP_NEEDED' || tpo.status === 'CALL_AGAIN') : tpo.status === statusFilter);
    const matchesIntern = internFilter === 'ALL' || tpo.assignedInternId === internFilter;

    return matchesSearch && matchesStatus && matchesIntern;
  });

  const handleCreateTpo = (e) => {
    e.preventDefault();
    const assignedUser = staffMembers.find(i => i.id === newAssignedIntern) || staffMembers[0];
    onAddTpo({
      id: `tpo-${Date.now()}`,
      collegeId: `col-${Date.now()}`,
      collegeName: newCollegeName,
      name: newName,
      designation: newDesignation,
      phone: newPhone,
      email: newEmail,
      status: 'NEW_LEAD',
      assignedInternId: assignedUser ? assignedUser.id : 'unassigned',
      assignedInternName: assignedUser ? assignedUser.name : (users.find(u => u.role !== 'ADMIN')?.name || 'Staff Recruiter'),
      notes: newNotes,
      lastContacted: new Date().toISOString().split('T')[0],
      city: newCity,
      tier: newTier,
    });
    setIsAddModalOpen(false);
    // Reset
    setNewCollegeName('');
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewNotes('');
  };

  return (
    <div>
      {/* Top Controls Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#154360' }}>
            College TPOs
          </h1>
          <p style={{ color: '#52525b', fontSize: '0.85rem' }}>
            Placement officer contacts and outreach pipeline. Click call to connect or edit contact details.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
              padding: '6px 12px',
              fontSize: '0.85rem'
            }}
            title="Link Google Sheets or import spreadsheet TPO records"
          >
            <FileSpreadsheet size={15} color="#154360" /> Link Sheets
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

          <button onClick={() => setIsAddModalOpen(true)} className="btn-mustard btn-black-sm" style={{ fontWeight: 800 }}>
            <Plus size={15} color="#154360" /> Add TPO
          </button>
        </div>
      </div>

      {/* TPO Outreach Sections / KPI Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
        gap: '8px', 
        marginBottom: '16px' 
      }}>
        <div 
          onClick={() => setStatusFilter('ALL')}
          style={{ 
            background: statusFilter === 'ALL' ? '#ebf5fb' : '#ffffff', 
            border: statusFilter === 'ALL' ? '2px solid #154360' : '1px solid #e2e8f0', 
            borderRadius: '8px', 
            padding: '8px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#154360', textTransform: 'uppercase' }}>
            All Colleges
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#154360', marginTop: '1px' }}>
            {countAll}
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('NOT_ANSWERED')}
          style={{ 
            background: statusFilter === 'NOT_ANSWERED' ? '#f1f5f9' : '#ffffff', 
            border: statusFilter === 'NOT_ANSWERED' ? '2px solid #475569' : '1px solid #e2e8f0', 
            borderRadius: '8px', 
            padding: '8px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
            1. Not Answered
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#475569', marginTop: '1px' }}>
            {countNotAnswered}
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('NOT_INTERESTED')}
          style={{ 
            background: statusFilter === 'NOT_INTERESTED' ? '#fef2f2' : '#ffffff', 
            border: statusFilter === 'NOT_INTERESTED' ? '2px solid #dc2626' : '1px solid #e2e8f0', 
            borderRadius: '8px', 
            padding: '8px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
            2. Not Interested
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#dc2626', marginTop: '1px' }}>
            {countNotInterested}
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('DRIVE_CONFIRMED')}
          style={{ 
            background: statusFilter === 'DRIVE_CONFIRMED' ? '#ecfdf5' : '#ffffff', 
            border: statusFilter === 'DRIVE_CONFIRMED' ? '2px solid #059669' : '1px solid #e2e8f0', 
            borderRadius: '8px', 
            padding: '8px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
            3. Drive Confirmed
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669', marginTop: '1px' }}>
            {countDriveConfirmed}
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('DETAILS_SENT')}
          style={{ 
            background: statusFilter === 'DETAILS_SENT' ? '#eff6ff' : '#ffffff', 
            border: statusFilter === 'DETAILS_SENT' ? '2px solid #2563eb' : '1px solid #e2e8f0', 
            borderRadius: '8px', 
            padding: '8px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
            4. Details Sent
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2563eb', marginTop: '1px' }}>
            {countDetailsSent}
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('FOLLOW_UP_NEEDED')}
          style={{ 
            background: statusFilter === 'FOLLOW_UP_NEEDED' ? '#fffbeb' : '#ffffff', 
            border: statusFilter === 'FOLLOW_UP_NEEDED' ? '2px solid #d97706' : '1px solid #e2e8f0', 
            borderRadius: '8px', 
            padding: '8px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>
            5. Call Again / Follow Up
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#d97706', marginTop: '1px' }}>
            {countCallAgain}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="content-card" style={{ marginBottom: '16px', padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
            <Search size={15} color="#71717a" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input 
              type="text"
              className="form-input"
              placeholder="Search college, TPO name, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '32px', fontSize: '0.825rem', padding: '6px 12px 6px 32px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <select 
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ minWidth: '150px', fontSize: '0.825rem', padding: '6px 10px', fontWeight: 600 }}
            >
              <option value="ALL">All Status ({countAll})</option>
              <option value="NOT_ANSWERED">1) Not Answered ({countNotAnswered})</option>
              <option value="NOT_INTERESTED">2) Not Interested ({countNotInterested})</option>
              <option value="DRIVE_CONFIRMED">3) Drive Confirmed ({countDriveConfirmed})</option>
              <option value="DETAILS_SENT">4) Details Sent ({countDetailsSent})</option>
              <option value="FOLLOW_UP_NEEDED">5) Call Again / Follow Up Needed ({countCallAgain})</option>
              <option value="NEW_LEAD">New Lead</option>
            </select>

            <select 
              className="form-select"
              value={internFilter}
              onChange={(e) => setInternFilter(e.target.value)}
              style={{ minWidth: '140px', fontSize: '0.825rem', padding: '6px 10px' }}
            >
              <option value="ALL">All Staff & Interns</option>
              {staffMembers.map(i => (
                <option key={i.id} value={i.id}>{i.name} ({i.role === 'MAIN_HR' ? 'HR Manager' : 'HR Intern'})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TPO Table */}
      <div className="content-card">
        <div className="card-header-row" style={{ padding: '14px 20px' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: '0.98rem' }}>TPO List ({filteredTpos.length})</h2>
          </div>
        </div>

        <div className="table-wrapper desktop-only">
          <table className="crm-table">
            <thead>
              <tr>
                <th>College</th>
                <th>TPO Name</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Intern</th>
                <th>Last Call</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTpos.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#71717a' }}>
                    No matching placement officers found for your search criteria.
                  </td>
                </tr>
              ) : (
                filteredTpos.map(tpo => (
                  <tr key={tpo.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#154360', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={15} color="#154360" />
                        {tpo.collegeName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#71717a', marginLeft: '21px' }}>
                        {tpo.city || 'Tier 1 Campus'}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{tpo.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#52525b' }}>
                        {tpo.designation}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem' }}>
                        {tpo.phone}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#52525b' }}>
                        {tpo.email}
                      </div>
                    </td>

                    <td>
                      <select 
                        value={tpo.status || 'NEW_LEAD'}
                        onChange={(e) => onUpdateTpoStatus(tpo.id, e.target.value)}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          ...getStatusBadgeStyle(tpo.status)
                        }}
                      >
                        <option value="NOT_ANSWERED">1) Not Answered</option>
                        <option value="NOT_INTERESTED">2) Not Interested</option>
                        <option value="DRIVE_CONFIRMED">3) Drive Confirmed</option>
                        <option value="DETAILS_SENT">4) Details Sent</option>
                        <option value="FOLLOW_UP_NEEDED">5) Call Again / Follow Up</option>
                        <option value="NEW_LEAD">New Lead</option>
                        {tpo.status === 'CONTACTED' && <option value="CONTACTED">Contacted</option>}
                        {tpo.status === 'PITCHED' && <option value="PITCHED">Pitched</option>}
                      </select>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.825rem', fontWeight: 500 }}>
                        {tpo.assignedInternName}
                      </div>
                    </td>

                    <td style={{ fontSize: '0.8rem', color: '#71717a' }}>
                      {tpo.lastContacted}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button 
                          onClick={() => onStartCall({
                            recipientType: 'TPO',
                            recipientName: `${tpo.name} (${tpo.collegeName})`,
                            recipientDetail: `${tpo.designation} • ${tpo.phone}`,
                            recipientPhone: tpo.phone,
                            type: 'AUDIO',
                            tpoId: tpo.id
                          })}
                          className="btn-mustard"
                          style={{ width: '30px', height: '30px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
                          title="Call TPO"
                          aria-label="Call TPO"
                        >
                          <Phone size={14} color="#154360" />
                        </button>

                        <button 
                          onClick={() => handleOpenEditTpo(tpo)}
                          className="btn-icon"
                          style={{ width: '30px', height: '30px', color: '#154360' }}
                          title="Edit TPO details"
                          aria-label="Edit TPO details"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Clean TPO Cards (Click to expand details) */}
        <div className="mobile-only" style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredTpos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 12px', color: '#71717a', fontSize: '0.8rem' }}>
              No matching placement officers found. Tap "+ Add College TPO" to add one.
            </div>
          ) : (
            filteredTpos.map(tpo => {
              const isExpanded = !!expandedTpos[tpo.id];
              const formatStatusText = (s) => {
                if (!s) return 'New Lead';
                if (s === 'DRIVE_CONFIRMED') return 'Confirmed';
                if (s === 'DETAILS_SENT') return 'Details Sent';
                if (s === 'FOLLOW_UP_NEEDED') return 'Call Again';
                if (s === 'NOT_ANSWERED') return 'Not Answered';
                if (s === 'NOT_INTERESTED') return 'Not Interested';
                return s.replace(/_/g, ' ');
              };

              return (
                <div 
                  key={tpo.id} 
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #154360',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isExpanded ? '8px' : '0px',
                    boxShadow: isExpanded ? '0 2px 4px rgba(0,0,0,0.04)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Row 1: Clickable Name, College & Status Badge + Chevron */}
                  <div 
                    onClick={() => toggleTpoExpand(tpo.id)}
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
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#154360' }}>
                        {tpo.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                        <Building2 size={12} color="#64748b" />
                        <span>{tpo.collegeName}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span 
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '6px',
                          ...getStatusBadgeStyle(tpo.status)
                        }}
                      >
                        {formatStatusText(tpo.status)}
                      </span>
                      {isExpanded ? <ChevronUp size={15} color="#154360" /> : <ChevronDown size={15} color="#64748b" />}
                    </div>
                  </div>

                  {/* Expanded Body: Only shown after clicking on individual name */}
                  {isExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed #e2e8f0', paddingTop: '8px', marginTop: '4px' }}>
                      <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.74rem', color: '#71717a' }}>{tpo.designation || 'Placement Officer'} • {tpo.city || 'Campus'}</div>
                        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#154360', fontWeight: 600, marginTop: '2px' }}>
                          📞 {tpo.phone || 'No phone'}
                        </div>
                        {tpo.email && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                            ✉️ {tpo.email}
                          </div>
                        )}
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                          Assigned: {tpo.assignedInternName || 'Team'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#154360', flexShrink: 0 }}>Status:</span>
                          <select 
                            value={tpo.status || 'NEW_LEAD'}
                            onChange={(e) => onUpdateTpoStatus(tpo.id, e.target.value)}
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '3px 6px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              flex: 1,
                              minWidth: 0,
                              ...getStatusBadgeStyle(tpo.status)
                            }}
                          >
                            <option value="NOT_ANSWERED">1) Not Answered</option>
                            <option value="NOT_INTERESTED">2) Not Interested</option>
                            <option value="DRIVE_CONFIRMED">3) Confirmed</option>
                            <option value="DETAILS_SENT">4) Details Sent</option>
                            <option value="FOLLOW_UP_NEEDED">5) Call Again</option>
                            <option value="NEW_LEAD">New Lead</option>
                            {tpo.status === 'CONTACTED' && <option value="CONTACTED">Contacted</option>}
                            {tpo.status === 'PITCHED' && <option value="PITCHED">Pitched</option>}
                          </select>
                        </div>

                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                          <button 
                            onClick={() => onStartCall({
                              recipientType: 'TPO',
                              recipientName: `${tpo.name} (${tpo.collegeName})`,
                              recipientDetail: `${tpo.designation} • ${tpo.phone}`,
                              recipientPhone: tpo.phone,
                              type: 'AUDIO',
                              tpoId: tpo.id
                            })}
                            className="btn-mustard btn-black-sm"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px', whiteSpace: 'nowrap' }}
                            title="Call TPO"
                          >
                            <Phone size={12} color="#154360" /> Call
                          </button>

                          <button 
                            onClick={() => handleOpenEditTpo(tpo)}
                            className="btn-icon"
                            style={{ width: '28px', height: '28px', color: '#154360' }}
                            title="Edit TPO details"
                            aria-label="Edit TPO details"
                          >
                            <Edit3 size={13} />
                          </button>
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

      {/* Edit TPO Modal */}
      {isEditModalOpen && editingTpo && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <div>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Edit3 size={18} color="#154360" /> Edit Placement Officer & College Details
                </h3>
                <p className="card-subtitle">Update contact information, status, and campus assignment</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditTpo}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">College / University Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. National Institute of Technology, Surathkal"
                      value={editForm.collegeName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, collegeName: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">City & State</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Mangalore, Karnataka"
                      value={editForm.city}
                      onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">College Tier</label>
                    <select 
                      className="form-select"
                      value={editForm.tier}
                      onChange={(e) => setEditForm(prev => ({ ...prev, tier: e.target.value }))}
                    >
                      <option value="Tier 1">Tier 1 (IIT / NIT / BITS / Top Univ)</option>
                      <option value="Tier 2">Tier 2 (State Govt / Reputed Pvt)</option>
                      <option value="Tier 3">Tier 3 (Affiliated Regional)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">TPO / Placement Head Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Prof. Anand Deshpande"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editForm.designation}
                      onChange={(e) => setEditForm(prev => ({ ...prev, designation: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Direct Phone / WhatsApp *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="+91 98..."
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Official Placement Email *</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="placement@college.ac.in"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Outreach Status</label>
                    <select 
                      className="form-select"
                      value={editForm.status}
                      onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                      style={{ fontWeight: 600 }}
                    >
                      <option value="NOT_ANSWERED">1) Not Answered</option>
                      <option value="NOT_INTERESTED">2) Not Interested</option>
                      <option value="DRIVE_CONFIRMED">3) Drive Confirmed</option>
                      <option value="DETAILS_SENT">4) Details Sent</option>
                      <option value="FOLLOW_UP_NEEDED">5) Call Again / Follow Up Needed</option>
                      <option value="NEW_LEAD">New Lead</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="PITCHED">Pitched</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assign to Staff Member</label>
                    <select 
                      className="form-select"
                      value={editForm.assignedInternId}
                      onChange={(e) => setEditForm(prev => ({ ...prev, assignedInternId: e.target.value }))}
                    >
                      {staffMembers.length > 0 ? (
                        staffMembers.map(i => (
                          <option key={i.id} value={i.id}>{i.name} ({i.title || (i.role === 'MAIN_HR' ? 'HR Manager' : 'HR Intern')})</option>
                        ))
                      ) : (
                        (users || []).map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Notes & Remarks</label>
                    <textarea 
                      className="form-textarea"
                      rows={2}
                      placeholder="Outreach notes, discussion summary, follow-up context..."
                      value={editForm.notes}
                      onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-navy" style={{ fontWeight: 800 }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3 className="card-title">Add College & Placement Officer Lead</h3>
                <p className="card-subtitle">Ingest a new campus contact into the outreach pipeline</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTpo}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">College / University Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. National Institute of Technology, Surathkal"
                      value={newCollegeName}
                      onChange={(e) => setNewCollegeName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">City & State</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Mangalore, Karnataka"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">College Tier</label>
                    <select 
                      className="form-select"
                      value={newTier}
                      onChange={(e) => setNewTier(e.target.value)}
                    >
                      <option value="Tier 1">Tier 1 (IIT / NIT / BITS / Top Univ)</option>
                      <option value="Tier 2">Tier 2 (State Govt / Reputed Pvt)</option>
                      <option value="Tier 3">Tier 3 (Affiliated Regional)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">TPO / Placement Head Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Prof. Anand Deshpande"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={newDesignation}
                      onChange={(e) => setNewDesignation(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Direct Phone / WhatsApp *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="+91 98..."
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Official Placement Email *</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="placement@college.ac.in"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Assign to Staff Member</label>
                    <select 
                      className="form-select"
                      value={newAssignedIntern}
                      onChange={(e) => setNewAssignedIntern(e.target.value)}
                    >
                      {staffMembers.map(i => (
                        <option key={i.id} value={i.id}>{i.name} ({i.title || (i.role === 'MAIN_HR' ? 'HR Manager' : 'HR Intern')})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Initial Notes & Context</label>
                    <textarea 
                      className="form-textarea"
                      rows={2}
                      placeholder="Preferred branches, expected package, previous hiring batch records..."
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-mustard" style={{ fontWeight: 800 }}>
                  Add TPO Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          LINK SHEETS / IMPORT TPOS MODAL
          ========================================================================= */}
      {isLinkSheetsModalOpen && (
        <div className="modal-overlay" onClick={() => setIsLinkSheetsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileSpreadsheet size={18} color="#154360" /> Link Google Sheets & Import TPOs
                </h3>
                <p className="card-subtitle">
                  Connect a live Google Sheet link or paste spreadsheet cells to populate your campus directory
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
                      title="Sync latest rows from Google Sheet"
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
                      💡 Make sure the Google Sheet sharing setting is set to <strong>"Anyone with the link can view"</strong> so our CRM can sync the records.
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
                          <RefreshCw size={14} className="spin" /> Fetching & Syncing TPOs...
                        </>
                      ) : (
                        <>
                          <Upload size={14} /> Link & Import TPOs
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
                        Paste Spreadsheet Cells (Tab or Comma Separated) *
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
                      placeholder={`Name\tCollege\tPhone\tEmail\tDesignation\tCity\tTier\nDr. Rajesh Kulkarni\tIIT Bombay\t+91 98200 11223\tplacement@iitb.ac.in\tTPO Officer\tMumbai\tTier 1`}
                      value={pasteText}
                      onChange={handlePasteChange}
                      style={{ fontFamily: 'monospace', fontSize: '0.78rem', whiteSpace: 'pre' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '4px', display: 'block' }}>
                      Tip: In Google Sheets or Excel, select your cells, press <strong>Ctrl+C</strong>, then click here and press <strong>Ctrl+V</strong>.
                    </span>
                  </div>

                  {/* Parsed Preview Table */}
                  {parsedTpos.length > 0 && (
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#154360' }}>
                          ⚡ Detected {parsedTpos.length} Valid TPO Record{parsedTpos.length > 1 ? 's' : ''}:
                        </span>
                        <button
                          type="button"
                          onClick={handleImportPastedTpos}
                          className="btn-mustard btn-black-sm"
                          style={{ fontWeight: 800, padding: '4px 12px' }}
                        >
                          <Check size={13} /> Import {parsedTpos.length} TPOs to Directory
                        </button>
                      </div>

                      <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                        <table className="crm-table" style={{ fontSize: '0.72rem' }}>
                          <thead>
                            <tr>
                              <th style={{ padding: '4px 8px' }}>TPO Name</th>
                              <th style={{ padding: '4px 8px' }}>College</th>
                              <th style={{ padding: '4px 8px' }}>Phone</th>
                              <th style={{ padding: '4px 8px' }}>Email</th>
                              <th style={{ padding: '4px 8px' }}>City</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedTpos.slice(0, 10).map((row, idx) => (
                              <tr key={idx}>
                                <td style={{ padding: '4px 8px', fontWeight: 600 }}>{row.name}</td>
                                <td style={{ padding: '4px 8px' }}>{row.collegeName}</td>
                                <td style={{ padding: '4px 8px', fontFamily: 'monospace' }}>{row.phone}</td>
                                <td style={{ padding: '4px 8px' }}>{row.email}</td>
                                <td style={{ padding: '4px 8px' }}>{row.city}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {parsedTpos.length > 10 && (
                          <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#71717a', paddingTop: '6px' }}>
                            ...and {parsedTpos.length - 10} more records
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
                Columns recognized: Name, College, Phone, Email, Designation, City, Tier
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
