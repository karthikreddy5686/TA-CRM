import React, { useState, useMemo } from 'react';
import { 
  Phone, 
  Mail, 
  Plus, 
  User, 
  Clock, 
  Building2, 
  ChevronDown, 
  ChevronUp, 
  X,
  PhoneCall,
  CheckCircle2
} from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';
import { formatDuration } from '../data/mockData';

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

export const isCallForTpo = (call, tpo) => {
  if (!call || !tpo) return false;
  if (call.relatedEntityId && (call.relatedEntityId === tpo.id || call.relatedEntityId === tpo.collegeId)) return true;
  if (call.tpoId && call.tpoId === tpo.id) return true;
  
  const callPhone = (call.recipientPhone || '').replace(/\D/g, '').slice(-10);
  const tpoPhone = (tpo.phone || '').replace(/\D/g, '').slice(-10);
  if (callPhone && tpoPhone && callPhone === tpoPhone) return true;

  if (call.recipientName && tpo.name) {
    const cName = call.recipientName.toLowerCase();
    const tName = tpo.name.toLowerCase();
    if (cName.includes(tName) || tName.includes(cName)) return true;
  }
  return false;
};

export const isFollowUpForTpo = (fup, tpo) => {
  if (!fup || !tpo) return false;
  if (fup.entityId && (fup.entityId === tpo.id || fup.entityId === tpo.collegeId)) return true;
  
  const fupPhone = (fup.phone || '').replace(/\D/g, '').slice(-10);
  const tpoPhone = (tpo.phone || '').replace(/\D/g, '').slice(-10);
  if (fupPhone && tpoPhone && fupPhone === tpoPhone) return true;

  if (fup.entityTitle && tpo.name) {
    const fTitle = fup.entityTitle.toLowerCase();
    const tName = tpo.name.toLowerCase();
    if (fTitle.includes(tName) || tName.includes(fTitle)) return true;
  }
  return false;
};

export const getEffectiveStage = (tpo, callSessions = [], followUps = [], drives = []) => {
  if (!tpo) return 'NEW';

  // 1. Explicit user manual override
  if (tpo.manuallyMoved && tpo.status) {
    return normalizeStage(tpo.status);
  }

  // 2. Drive confirmed in published drives for this college
  const hasConfirmedDrive = Array.isArray(drives) && drives.some(d => 
    (d.collegeId && tpo.collegeId && d.collegeId === tpo.collegeId) ||
    (d.collegeName && tpo.collegeName && d.collegeName.toLowerCase().trim() === tpo.collegeName.toLowerCase().trim())
  );
  if (hasConfirmedDrive) {
    return 'DRIVE_CONFIRMED';
  }

  // 3. Find all call logs for this TPO
  const leadCalls = (callSessions || []).filter(c => isCallForTpo(c, tpo));

  // 4. Find all follow-ups for this TPO
  const leadFollowUps = (followUps || []).filter(f => isFollowUpForTpo(f, tpo));
  const pendingFollowUp = leadFollowUps.find(f => f.status === 'PENDING');

  // 5. If NO call logs and NO pending follow-ups exist:
  // Lead is completely fresh / uncontacted! It MUST be in NEW.
  if (leadCalls.length === 0 && !pendingFollowUp) {
    return 'NEW';
  }

  // 6. If calls exist, evaluate the most recent call
  if (leadCalls.length > 0) {
    const sorted = [...leadCalls].sort((a, b) => {
      const timeA = new Date(a.endedAt || a.startedAt || 0).getTime();
      const timeB = new Date(b.endedAt || b.startedAt || 0).getTime();
      return timeB - timeA;
    });
    const latest = sorted[0];
    const disp = (latest.disposition || '').toUpperCase();

    if (disp === 'DRIVE_CONFIRMED') return 'DRIVE_CONFIRMED';
    if (disp === 'INTERESTED' || disp === 'PITCHED') return 'INTERESTED';
    if (disp === 'PROPOSAL_SENT' || disp === 'SLOTS_REQUESTED' || disp === 'PAYMENT_LINK_SENT') return 'PROPOSAL_SENT';
    if (disp === 'DETAILS_SENT') return 'DETAILS_SENT';
    if (disp === 'NOT_ANSWERED') return 'NOT_ANSWERED';
    if (disp === 'NOT_INTERESTED') return 'NOT_INTERESTED';
    if (disp === 'FOLLOW_UP_NEEDED' || disp === 'CALL_AGAIN' || disp === 'CONTACTED' || disp === 'CALLBACK_LATER') {
      return 'CALLBACK_LATER';
    }
  }

  // 7. If pending follow-up is scheduled
  if (pendingFollowUp) {
    return 'CALLBACK_LATER';
  }

  return 'NEW';
};

export default function LeadPipeline({
  tpos = [],
  drives = [],
  callSessions = [],
  followUps = [],
  colleges = [],
  users = [],
  currentRole = 'ADMIN',
  onStartCall,
  onUpdateTpoStatus,
  onScheduleFollowUp,
  onAddTpo
}) {
  const [activeStageId, setActiveStageId] = useState('NEW');
  const [expandedLeadIds, setExpandedLeadIds] = useState({});

  const toggleLeadExpand = (id) => {
    setExpandedLeadIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Quick Add Lead Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newStage, setNewStage] = useState('NEW');
  const [newNotes, setNewNotes] = useState('');

  // Calculate counts per stage directly and dynamically from real activity
  const stageCounts = useMemo(() => {
    const counts = {};
    PIPELINE_STAGES.forEach(s => {
      counts[s.id] = 0;
    });

    tpos.forEach(t => {
      const stage = getEffectiveStage(t, callSessions, followUps, drives);
      counts[stage] = (counts[stage] || 0) + 1;
    });

    return counts;
  }, [tpos, callSessions, followUps, drives]);

  // Current active stage object
  const activeStage = useMemo(() => {
    return PIPELINE_STAGES.find(s => s.id === activeStageId) || PIPELINE_STAGES[0];
  }, [activeStageId]);

  // Leads in the active stage
  const activeStageLeads = useMemo(() => {
    return tpos.filter(t => getEffectiveStage(t, callSessions, followUps, drives) === activeStageId);
  }, [tpos, activeStageId, callSessions, followUps, drives]);

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
      manuallyMoved: newStage !== 'NEW',
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
      {/* 1. Header Banner - Clean Lead Pipeline Title + Add Lead Button */}
      <div style={{
        background: 'linear-gradient(135deg, #154360 0%, #0e2e42 100%)',
        color: '#ffffff',
        borderRadius: '10px',
        padding: '14px 20px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h1 style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          color: '#ffffff',
          lineHeight: 1.2,
          margin: 0,
          letterSpacing: '-0.02em'
        }}>
          Lead Pipeline
        </h1>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="btn-mustard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            fontWeight: 800,
            padding: '6px 14px',
            borderRadius: '6px',
            cursor: 'pointer',
            border: 'none',
            color: '#154360'
          }}
        >
          <Plus size={14} color="#154360" /> Add Lead
        </button>
      </div>

      {/* 2. Main Pipeline Card Container */}
      <div className="content-card" style={{
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {/* Stage Pills Grid - 4 Aside and 4 Aside (2 columns: 4 rows) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          width: '100%'
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? '#ffffff' : '#334155',
                  background: isActive ? '#154360' : '#f8fafc',
                  border: isActive ? '1px solid #154360' : '1px solid #e2e8f0',
                  boxShadow: isActive ? '0 2px 6px rgba(21, 67, 96, 0.28)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                {/* Stage Colored Dot & Label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isActive ? '#FFDB58' : stage.dotColor,
                    flexShrink: 0
                  }} />
                  <span style={{ 
                    whiteSpace: 'nowrap', 
                    textOverflow: 'ellipsis', 
                    overflow: 'hidden' 
                  }}>
                    {stage.label}
                  </span>
                </div>

                {/* Count Badge */}
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: isActive ? '#154360' : '#64748b',
                  background: isActive ? '#FFDB58' : '#e2e8f0',
                  padding: '1px 7px',
                  borderRadius: '9999px',
                  flexShrink: 0,
                  marginLeft: '4px'
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 3. Active Stage View Container */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
          marginTop: '4px'
        }}>
          {/* Active Stage Content Area */}
          <div style={{ padding: activeStageLeads.length === 0 ? '50px 20px' : '12px' }}>
            {activeStageLeads.length === 0 ? (
              /* Empty State */
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
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#154360', marginTop: '4px' }}>
                  No leads in {activeStage.label}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: '380px' }}>
                  Placement officers in this outreach category will appear here based on actual call dispositions and scheduled follow-ups.
                </div>
              </div>
            ) : (
              /* Leads List Cards with Accordion: Name & College first, details on click */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeStageLeads.map(lead => {
                  const isExpanded = !!expandedLeadIds[lead.id];
                  const effectiveStage = getEffectiveStage(lead, callSessions, followUps, drives);
                  const leadCalls = (callSessions || []).filter(c => isCallForTpo(c, lead));
                  const leadFollowUps = (followUps || []).filter(f => isFollowUpForTpo(f, lead));
                  const latestCall = leadCalls.length > 0
                    ? [...leadCalls].sort((a, b) => new Date(b.endedAt || b.startedAt || 0) - new Date(a.endedAt || a.startedAt || 0))[0]
                    : null;
                  const pendingFollowUp = leadFollowUps.find(f => f.status === 'PENDING');

                  return (
                    <div
                      key={lead.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        boxShadow: isExpanded ? '0 2px 6px rgba(0,0,0,0.05)' : '0 1px 2px rgba(0,0,0,0.02)',
                        transition: 'all 150ms ease',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Clickable Header: Shows Individual Name & College first */}
                      <div
                        onClick={() => toggleLeadExpand(lead.id)}
                        style={{
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          cursor: 'pointer',
                          background: isExpanded ? '#f8fafc' : '#ffffff',
                          borderBottom: isExpanded ? '1px solid #f1f5f9' : 'none',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          {/* Avatar */}
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: '#154360',
                            color: '#FFDB58',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {lead.name ? lead.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'TP'}
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#154360', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {lead.name}
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '0.78rem',
                              color: '#64748b',
                              marginTop: '1px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              <Building2 size={12} color="#154360" />
                              <span style={{ fontWeight: 600, color: '#334155' }}>{lead.collegeName}</span>
                              {lead.city && <span>• {lead.city}</span>}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          {isExpanded ? <ChevronUp size={16} color="#154360" /> : <ChevronDown size={16} color="#64748b" />}
                        </div>
                      </div>

                      {/* Expanded Details: Real Activity History, Actions & Stage Mover */}
                      {isExpanded && (
                        <div style={{
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}>
                          {/* Recruiter & Last Contact info */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.72rem',
                            color: '#64748b',
                            flexWrap: 'wrap',
                            gap: '4px'
                          }}>
                            <div>
                              Assigned: <strong style={{ color: '#154360' }}>{lead.assignedInternName || 'karthik'}</strong>
                            </div>
                            <div>
                              Last contact: {latestCall ? new Date(latestCall.startedAt || latestCall.endedAt).toLocaleDateString() : (lead.lastContacted || 'None')}
                            </div>
                          </div>

                          {/* Real Activity Panel: Call Log Record & Scheduled Follow-up */}
                          <div style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '8px 10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}>
                            {/* Call Log Record */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.75rem' }}>
                              <PhoneCall size={13} color="#154360" style={{ marginTop: '2px', flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                {latestCall ? (
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                      <strong style={{ color: '#154360' }}>Last Call:</strong>
                                      <span style={{ fontWeight: 700, color: '#0369a1' }}>{formatDuration(latestCall.durationSeconds || 0)}</span>
                                      <span style={{
                                        fontSize: '0.68rem',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        background: '#dcfce7',
                                        color: '#15803d',
                                        fontWeight: 700
                                      }}>
                                        {latestCall.disposition ? latestCall.disposition.replace(/_/g, ' ') : 'COMPLETED'}
                                      </span>
                                      <span style={{ color: '#64748b', fontSize: '0.7rem' }}>
                                        {new Date(latestCall.startedAt || latestCall.endedAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    {latestCall.notes && (
                                      <div style={{ color: '#475569', fontSize: '0.72rem', marginTop: '2px', fontStyle: 'italic' }}>
                                        "{latestCall.notes}"
                                      </div>
                                    )}
                                    {leadCalls.length > 1 && (
                                      <div style={{ color: '#64748b', fontSize: '0.68rem', marginTop: '2px' }}>
                                        ({leadCalls.length} calls logged total)
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ color: '#94a3b8' }}>
                                    No calls logged yet — click the Call button below to log outreach
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Follow-up Record */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.75rem', borderTop: '1px solid #eef2f6', paddingTop: '6px' }}>
                              <Clock size={13} color="#0369a1" style={{ marginTop: '2px', flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                {pendingFollowUp ? (
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                      <strong style={{ color: '#0369a1' }}>Follow-up Scheduled:</strong>
                                      <span style={{ fontWeight: 700, color: '#154360' }}>{pendingFollowUp.scheduledDate}</span>
                                      <span style={{
                                        fontSize: '0.68rem',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        background: pendingFollowUp.priority === 'URGENT' ? '#fee2e2' : '#fef3c7',
                                        color: pendingFollowUp.priority === 'URGENT' ? '#b91c1c' : '#b45309',
                                        fontWeight: 700
                                      }}>
                                        {pendingFollowUp.priority}
                                      </span>
                                    </div>
                                    {pendingFollowUp.notes && (
                                      <div style={{ color: '#475569', fontSize: '0.72rem', marginTop: '2px' }}>
                                        {pendingFollowUp.notes}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ color: '#94a3b8' }}>
                                    No pending follow-up scheduled
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Notes if present */}
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

                          {/* Actions: Call, WhatsApp, Email, Follow-up & Move Stage */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '8px',
                            paddingTop: '6px',
                            borderTop: '1px solid #f1f5f9'
                          }}>
                            {/* Left: Call / WA / Email (icon-only) & Follow-up */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  if (onStartCall) {
                                    onStartCall({
                                      ...lead,
                                      id: lead.id,
                                      tpoId: lead.id,
                                      recipientName: lead.name,
                                      recipientPhone: lead.phone,
                                      recipientType: 'TPO',
                                      type: 'AUDIO'
                                    });
                                  }
                                }}
                                className="btn-mustard btn-black-sm"
                                title={`Call ${lead.phone || lead.name}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Phone size={14} color="#154360" />
                              </button>

                              {lead.phone && (
                                <a
                                  href={`https://wa.me/${formatPhoneForWa(lead.phone)}?text=Hello%20${encodeURIComponent(lead.name)},%20reaching%20out%20from%20Flux%20regarding%20campus%20placement%20drives.`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="WhatsApp"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '6px 10px',
                                    background: '#ecfdf5',
                                    color: '#25D366',
                                    border: '1px solid #a7f3d0',
                                    borderRadius: '6px',
                                    textDecoration: 'none'
                                  }}
                                >
                                  <WhatsAppIcon size={16} color="#25D366" />
                                </a>
                              )}

                              {lead.email && (
                                <a
                                  href={`mailto:${lead.email}?subject=Campus%20Recruitment%20Drive%20Collaboration%20-%20Flux&body=Dear%20${encodeURIComponent(lead.name)},%0A%0AWe%20would%20like%20to%20conduct%20a%20campus%20recruitment%20drive%20for%20your%20students.%0A%0ABest%20regards,%0AFlux%20Team`}
                                  title="Email"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '6px 10px',
                                    background: '#eff6ff',
                                    color: '#1e40af',
                                    border: '1px solid #bfdbfe',
                                    borderRadius: '6px',
                                    textDecoration: 'none'
                                  }}
                                >
                                  <Mail size={14} />
                                </a>
                              )}

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
                                  gap: '5px',
                                  padding: '6px 10px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  background: '#ffffff',
                                  color: '#154360',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Clock size={13} color="#154360" /> Follow-up
                              </button>
                            </div>

                            {/* Right: Stage Mover Dropdown */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.72rem', color: '#154360', fontWeight: 700 }}>
                                Move to:
                              </span>
                              <select
                                value={effectiveStage}
                                onChange={(e) => {
                                  if (onUpdateTpoStatus) {
                                    onUpdateTpoStatus(lead.id, e.target.value);
                                  }
                                }}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: '#ffffff',
                                  border: '1px solid #154360',
                                  borderRadius: '6px',
                                  color: '#154360',
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
                      )}
                    </div>
                  );
                })}
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
                <span className="badge badge-mustard" style={{ background: '#FFDB58', color: '#154360', fontWeight: 800, marginBottom: '6px', fontSize: '0.7rem' }}>
                  NEW PIPELINE LEAD
                </span>
                <h3 className="card-title" style={{ color: '#154360' }}>Add College TPO Lead</h3>
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
                <button type="submit" className="btn-mustard" style={{ fontWeight: 800, color: '#154360' }}>
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
