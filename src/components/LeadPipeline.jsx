import React, { useState, useMemo } from 'react';
import { 
  GitFork, 
  Search, 
  Calendar, 
  GraduationCap, 
  BookOpen, 
  Layers, 
  Phone, 
  MessageSquare, 
  Mail, 
  Plus, 
  User, 
  Clock, 
  Building2, 
  CheckCircle2, 
  ExternalLink, 
  ChevronRight,
  ChevronDown,
  Filter,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const PIPELINE_STAGES = [
  { id: 'NEW', label: 'New', dotColor: '#94a3b8', bgLight: '#f1f5f9', textColor: '#475569' },
  { id: 'NOT_ANSWERED', label: 'Not answered', dotColor: '#64748b', bgLight: '#f1f5f9', textColor: '#334155' },
  { id: 'CALLBACK_LATER', label: 'Callback later', dotColor: '#0284c7', bgLight: '#e0f2fe', textColor: '#0369a1' },
  { id: 'INTERESTED', label: 'Interested', dotColor: '#10b981', bgLight: '#dcfce7', textColor: '#15803d' },
  { id: 'DETAILS_SENT', label: 'Details sent', dotColor: '#8b5cf6', bgLight: '#f3e8ff', textColor: '#7e22ce' },
  { id: 'PROPOSAL_SENT', label: 'Proposal sent', dotColor: '#f59e0b', bgLight: '#fef3c7', textColor: '#b45309' },
  { id: 'DRIVE_CONFIRMED', label: 'Drive confirmed', dotColor: '#0d9488', bgLight: '#ccfbf1', textColor: '#0f766e' },
  { id: 'NOT_INTERESTED', label: 'Not interested', dotColor: '#ef4444', bgLight: '#fee2e2', textColor: '#b91c1c' },
];

export const normalizeStage = (status) => {
  if (!status) return 'NEW';
  const s = status.toUpperCase();
  if (s === 'DRIVE_CONFIRMED') return 'DRIVE_CONFIRMED';
  if (s === 'PROPOSAL_SENT' || s === 'SLOTS_REQUESTED' || s === 'PAYMENT_LINK_SENT') return 'PROPOSAL_SENT';
  if (s === 'DETAILS_SENT') return 'DETAILS_SENT';
  if (s === 'INTERESTED' || s === 'PITCHED') return 'INTERESTED';
  if (s === 'CALLBACK_LATER' || s === 'FOLLOW_UP_NEEDED' || s === 'CALL_AGAIN' || s === 'CONTACTED') return 'CALLBACK_LATER';
  if (s === 'NOT_ANSWERED') return 'NOT_ANSWERED';
  if (s === 'NOT_INTERESTED') return 'NOT_INTERESTED';
  return 'NEW';
};

export default function LeadPipeline({
  tpos = [],
  colleges = [],
  users = [],
  currentRole = 'ADMIN',
  onStartCall,
  onUpdateTpoStatus,
  onScheduleFollowUp,
  onAddTpo
}) {
  const [activeStageId, setActiveStageId] = useState('NEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('ALL');
  const [collegeFilter, setCollegeFilter] = useState('ALL');
  const [recruiterFilter, setRecruiterFilter] = useState('ALL');
  
  // Quick Add Lead Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newStage, setNewStage] = useState('NEW');
  const [newNotes, setNewNotes] = useState('');

  // Extract unique colleges
  const uniqueColleges = useMemo(() => {
    const list = Array.from(new Set(tpos.map(t => t.collegeName))).filter(Boolean);
    return list.sort();
  }, [tpos]);

  // Extract unique recruiters
  const uniqueRecruiters = useMemo(() => {
    const list = Array.from(new Set(tpos.map(t => t.assignedInternName || t.assignedInternId))).filter(Boolean);
    return list.sort();
  }, [tpos]);

  // Filter leads based on search and filters
  const filteredTpos = useMemo(() => {
    return tpos.filter(t => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = t.name && t.name.toLowerCase().includes(q);
        const matchesCollege = t.collegeName && t.collegeName.toLowerCase().includes(q);
        const matchesEmail = t.email && t.email.toLowerCase().includes(q);
        const matchesPhone = t.phone && t.phone.toLowerCase().includes(q);
        if (!matchesName && !matchesCollege && !matchesEmail && !matchesPhone) {
          return false;
        }
      }

      // College filter
      if (collegeFilter !== 'ALL' && t.collegeName !== collegeFilter) {
        return false;
      }

      // Recruiter filter
      if (recruiterFilter !== 'ALL') {
        const recruiter = t.assignedInternName || t.assignedInternId;
        if (recruiter !== recruiterFilter) return false;
      }

      // Time filter
      if (timeFilter !== 'ALL' && t.lastContacted) {
        const contactDate = new Date(t.lastContacted);
        const now = new Date();
        const diffDays = Math.floor((now - contactDate) / (1000 * 60 * 60 * 24));
        if (timeFilter === 'TODAY' && diffDays > 0) return false;
        if (timeFilter === 'WEEK' && diffDays > 7) return false;
        if (timeFilter === 'MONTH' && diffDays > 30) return false;
      }

      return true;
    });
  }, [tpos, searchQuery, collegeFilter, recruiterFilter, timeFilter]);

  // Calculate counts per stage
  const stageCounts = useMemo(() => {
    const counts = {};
    PIPELINE_STAGES.forEach(s => {
      counts[s.id] = 0;
    });

    filteredTpos.forEach(t => {
      const stage = normalizeStage(t.status);
      counts[stage] = (counts[stage] || 0) + 1;
    });

    return counts;
  }, [filteredTpos]);

  // Current active stage object
  const activeStage = useMemo(() => {
    return PIPELINE_STAGES.find(s => s.id === activeStageId) || PIPELINE_STAGES[0];
  }, [activeStageId]);

  // Leads in the active stage
  const activeStageLeads = useMemo(() => {
    return filteredTpos.filter(t => normalizeStage(t.status) === activeStageId);
  }, [filteredTpos, activeStageId]);

  // Clean phone for WhatsApp/Calling
  const formatPhoneForWa = (phone) => {
    if (!phone) return '';
    return phone.replace(/[^\d]/g, '');
  };

  const handleCreateLead = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newCollegeName.trim() || !newPhone.trim()) return;

    const leadPayload = {
      id: `tpo-${Date.now()}`,
      collegeId: `col-${Date.now()}`,
      collegeName: newCollegeName.trim(),
      name: newName.trim(),
      designation: newDesignation.trim() || 'Placement Officer',
      phone: newPhone.trim(),
      email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, '.')}@college.edu`,
      status: newStage,
      assignedInternId: users[0]?.id || 'hr-karthik',
      assignedInternName: users[0]?.name || 'karthik',
      notes: newNotes.trim() || 'Direct outreach pipeline lead created.',
      lastContacted: new Date().toISOString().split('T')[0],
      city: 'Metro',
      tier: 'Tier 1'
    };

    if (onAddTpo) {
      onAddTpo(leadPayload);
    }

    setIsAddModalOpen(false);
    setNewName('');
    setNewCollegeName('');
    setNewDesignation('');
    setNewPhone('');
    setNewEmail('');
    setNewNotes('');
    setNewStage('NEW');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* 1. Main Pipeline Card Container */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '20px 22px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Top Header Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Left Brand & Flow Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#154360',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(21, 67, 96, 0.25)',
              flexShrink: 0
            }}>
              <GitFork size={20} />
            </div>

            <div>
              <h1 style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#09090b',
                lineHeight: 1.2,
                margin: 0
              }}>
                Lead Pipeline
              </h1>
              <div style={{
                fontSize: '0.78rem',
                color: '#71717a',
                marginTop: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexWrap: 'wrap'
              }}>
                <span>Call</span>
                <span style={{ color: '#cbd5e1' }}>→</span>
                <span>Interested</span>
                <span style={{ color: '#cbd5e1' }}>→</span>
                <span>Details</span>
                <span style={{ color: '#cbd5e1' }}>→</span>
                <span>Proposal</span>
                <span style={{ color: '#cbd5e1' }}>→</span>
                <span style={{ color: '#154360', fontWeight: 700 }}>Drive Confirmed</span>
              </div>
            </div>
          </div>

          {/* Right Search Input */}
          <div style={{
            position: 'relative',
            width: '280px',
            maxWidth: '100%'
          }}>
            <Search 
              size={15} 
              color="#94a3b8" 
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}
            />
            <input 
              type="text"
              placeholder="Search name, email, WhatsApp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                fontSize: '0.825rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: '#ffffff',
                color: '#09090b',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 0
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Filters Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          paddingTop: '4px'
        }}>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            color: '#71717a',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginRight: '4px'
          }}>
            FILTERS
          </span>

          {/* Filter 1: Time */}
          <div style={{ position: 'relative' }}>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              style={{
                appearance: 'none',
                padding: '6px 26px 6px 28px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#334155',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Any time</option>
              <option value="TODAY">Today</option>
              <option value="WEEK">This week</option>
              <option value="MONTH">This month</option>
            </select>
            <Calendar 
              size={13} 
              color="#64748b" 
              style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
            />
            <ChevronDown 
              size={13} 
              color="#64748b" 
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
            />
          </div>

          {/* Filter 2: Colleges */}
          <div style={{ position: 'relative' }}>
            <select
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
              style={{
                appearance: 'none',
                padding: '6px 26px 6px 28px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#334155',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                maxWidth: '200px'
              }}
            >
              <option value="ALL">All colleges</option>
              {uniqueColleges.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <GraduationCap 
              size={13} 
              color="#64748b" 
              style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
            />
            <ChevronDown 
              size={13} 
              color="#64748b" 
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
            />
          </div>

          {/* Filter 3: Recruiters */}
          <div style={{ position: 'relative' }}>
            <select
              value={recruiterFilter}
              onChange={(e) => setRecruiterFilter(e.target.value)}
              style={{
                appearance: 'none',
                padding: '6px 26px 6px 28px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#334155',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All recruiters</option>
              {uniqueRecruiters.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <BookOpen 
              size={13} 
              color="#64748b" 
              style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
            />
            <ChevronDown 
              size={13} 
              color="#64748b" 
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
            />
          </div>

          {/* Reset Filters if active */}
          {(searchQuery || timeFilter !== 'ALL' || collegeFilter !== 'ALL' || recruiterFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTimeFilter('ALL');
                setCollegeFilter('ALL');
                setRecruiterFilter('ALL');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 6px'
              }}
            >
              Clear filters
            </button>
          )}

          {/* Quick Add Lead Button on the far right */}
          <div style={{ marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="btn-black-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                borderRadius: '8px'
              }}
            >
              <Plus size={14} /> Add Lead
            </button>
          </div>
        </div>

        {/* Stage Pills Row (Exactly like the user's reference image) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          paddingTop: '6px'
        }}>
          {PIPELINE_STAGES.map(stage => {
            const count = stageCounts[stage.id] || 0;
            const isActive = activeStageId === stage.id;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setActiveStageId(stage.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#09090b' : '#52525b',
                  background: isActive ? '#ffffff' : '#f8fafc',
                  border: isActive ? '1px solid #cbd5e1' : '1px solid transparent',
                  boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
              >
                {/* Stage Colored Dot */}
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: stage.dotColor,
                  flexShrink: 0
                }} />

                <span>{stage.label}</span>

                {/* Count Badge */}
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: isActive ? '#09090b' : '#71717a',
                  marginLeft: '2px'
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2. Active Stage View Container */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
          marginTop: '6px'
        }}>
          {/* Active Stage Card Header */}
          <div style={{
            padding: '12px 18px',
            background: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            {/* Left: Active Stage Name & Count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="#154360" />
              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#09090b' }}>
                {activeStage.label}
              </span>
              <span style={{
                background: '#f1f5f9',
                color: '#154360',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid #e2e8f0'
              }}>
                {activeStageLeads.length}
              </span>
            </div>

            {/* Right: Keyboard Shortcuts & Leads summary */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '0.72rem',
              color: '#64748b'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '3px 10px',
                borderRadius: '6px'
              }}>
                <span>← / → stage</span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span>↑ / ↓ lead</span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span>↵ action</span>
              </div>
              <span style={{ fontWeight: 700, color: '#334155' }}>
                {activeStageLeads.length} {activeStageLeads.length === 1 ? 'lead' : 'leads'}
              </span>
            </div>
          </div>

          {/* Active Stage Content Area */}
          <div style={{ padding: activeStageLeads.length === 0 ? '50px 20px' : '16px' }}>
            {activeStageLeads.length === 0 ? (
              /* Empty State (Visually matching user reference screenshot) */
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '10px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8'
                }}>
                  <User size={32} strokeWidth={1.5} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', marginTop: '4px' }}>
                  No leads in {activeStage.label}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: '380px' }}>
                  Placement officers in this outreach category will appear here. Dial TPOs or change their disposition to advance them through the pipeline.
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn-navy-outline btn-black-sm"
                  style={{
                    marginTop: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    borderRadius: '8px'
                  }}
                >
                  <Plus size={14} /> Add New TPO Lead
                </button>
              </div>
            ) : (
              /* Leads List Cards */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeStageLeads.map(lead => (
                  <div
                    key={lead.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      transition: 'border-color 150ms ease, box-shadow 150ms ease'
                    }}
                  >
                    {/* Top Lead Info Row */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        {/* Avatar */}
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: '#ebf5fb',
                          border: '1px solid #aed6f1',
                          color: '#154360',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {lead.name ? lead.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'TP'}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#09090b' }}>
                              {lead.name}
                            </span>
                            <span style={{
                              fontSize: '0.72rem',
                              color: '#154360',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontWeight: 600
                            }}>
                              {lead.designation || 'TPO Head'}
                            </span>
                          </div>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.8rem',
                            color: '#52525b',
                            marginTop: '2px'
                          }}>
                            <Building2 size={13} color="#154360" />
                            <strong style={{ color: '#09090b' }}>{lead.collegeName}</strong>
                            {lead.city && <span>• {lead.city}</span>}
                            {lead.tier && (
                              <span style={{
                                fontSize: '0.68rem',
                                background: '#FFDB58',
                                color: '#154360',
                                fontWeight: 700,
                                padding: '0 5px',
                                borderRadius: '3px',
                                marginLeft: '4px'
                              }}>
                                {lead.tier}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Recruiter & Last Contact */}
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ fontSize: '0.72rem', color: '#71717a' }}>
                          Assigned: <strong style={{ color: '#154360' }}>{lead.assignedInternName || 'karthik'}</strong>
                        </div>
                        {lead.lastContacted && (
                          <div style={{ fontSize: '0.7rem', color: '#a1a1aa' }}>
                            Last contact: {lead.lastContacted}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: Notes & Remarks */}
                    {lead.notes && (
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '0.78rem',
                        color: '#475569',
                        lineHeight: 1.4
                      }}>
                        {lead.notes}
                      </div>
                    )}

                    {/* Bottom Action Bar */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                      paddingTop: '6px',
                      borderTop: '1px solid #f1f5f9'
                    }}>
                      {/* Left: Communication Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {/* Call Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (onStartCall) {
                              onStartCall({
                                ...lead,
                                type: 'TPO',
                                recipientType: 'TPO'
                              });
                            }
                          }}
                          className="btn-black-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '5px 11px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            borderRadius: '6px'
                          }}
                        >
                          <Phone size={13} /> Call {lead.phone}
                        </button>

                        {/* WhatsApp Button */}
                        {lead.phone && (
                          <a
                            href={`https://wa.me/${formatPhoneForWa(lead.phone)}?text=Hello%20${encodeURIComponent(lead.name)},%20reaching%20out%20from%20TalentConnect%20regarding%20campus%20placement%20drives.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 9px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: '#ecfdf5',
                              color: '#065f46',
                              border: '1px solid #a7f3d0',
                              borderRadius: '6px',
                              textDecoration: 'none'
                            }}
                          >
                            <MessageSquare size={13} /> WhatsApp
                          </a>
                        )}

                        {/* Email Button */}
                        {lead.email && (
                          <a
                            href={`mailto:${lead.email}?subject=Campus%20Recruitment%20Drive%20Collaboration%20-%20TalentConnect&body=Dear%20${encodeURIComponent(lead.name)},%0A%0AWe%20would%20like%20to%20conduct%20a%20campus%20recruitment%20drive%20for%20your%20students.%0A%0ABest%20regards,%0ATalentConnect%20Team`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 9px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: '#eff6ff',
                              color: '#1e40af',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                              textDecoration: 'none'
                            }}
                          >
                            <Mail size={13} /> Email
                          </a>
                        )}

                        {/* Schedule Follow-up */}
                        <button
                          type="button"
                          onClick={() => {
                            if (onScheduleFollowUp) {
                              onScheduleFollowUp(lead);
                            }
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 9px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: '#ffffff',
                            color: '#52525b',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <Clock size={13} /> Follow-up
                        </button>
                      </div>

                      {/* Right: Stage Mover Dropdown */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 600 }}>
                          Move to:
                        </span>
                        <select
                          value={normalizeStage(lead.status)}
                          onChange={(e) => {
                            if (onUpdateTpoStatus) {
                              onUpdateTpoStatus(lead.id, e.target.value);
                            }
                          }}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            color: '#09090b',
                            cursor: 'pointer'
                          }}
                        >
                          {PIPELINE_STAGES.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Add TPO Lead Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-card" style={{ maxWidth: '480px', width: '92%' }}>
            <div className="modal-header">
              <div>
                <span className="badge badge-black" style={{ marginBottom: '6px', fontSize: '0.7rem' }}>
                  NEW PIPELINE LEAD
                </span>
                <h3 className="card-title">Add College TPO Lead</h3>
                <p className="card-subtitle">Register a placement officer into the active outreach pipeline</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="btn-icon">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateLead}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">TPO Name *</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="e.g. Dr. Rajesh Kulkarni"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">College / University Name *</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="e.g. IIT Bombay / BITS Pilani"
                    value={newCollegeName}
                    onChange={(e) => setNewCollegeName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="e.g. Head of Placement"
                      value={newDesignation}
                      onChange={(e) => setNewDesignation(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pipeline Stage *</label>
                    <select
                      className="form-select"
                      value={newStage}
                      onChange={(e) => setNewStage(e.target.value)}
                    >
                      {PIPELINE_STAGES.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input 
                      type="tel"
                      className="form-input"
                      placeholder="+91 98201 44521"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email"
                      className="form-input"
                      placeholder="tpo@college.edu"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Discussion / Outreach Notes</label>
                  <textarea 
                    className="form-textarea"
                    placeholder="e.g. High placement batch size, interested in Autumn placement slot..."
                    rows={2}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-black">
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
