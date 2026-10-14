import React, { useState } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Phone, 
  Video, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight,
  Trash2,
  X
} from 'lucide-react';

export default function FollowUpTracker({ 
  followUps, 
  users, 
  tpos, 
  students, 
  onStartCall, 
  onAddFollowUp, 
  onToggleCompleteFollowUp,
  onSnoozeFollowUp,
  onDeleteFollowUp
}) {
  const [statusFilter, setStatusFilter] = useState('PENDING'); // 'PENDING' | 'COMPLETED' | 'ALL'
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [internFilter, setInternFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Follow-Up Form
  const [newTitle, setNewTitle] = useState('');
  const [newEntityType, setNewEntityType] = useState('TPO');
  const [newInternId, setNewInternId] = useState(users.find(u => u.role === 'HR_INTERN')?.id || '');
  const [newScheduledDate, setNewScheduledDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newPriority, setNewPriority] = useState('HIGH');
  const [newNotes, setNewNotes] = useState('');

  const interns = users.filter(u => u.role === 'HR_INTERN');

  const filteredFollowUps = followUps.filter(f => {
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && f.priority !== priorityFilter) return false;
    if (internFilter !== 'ALL' && f.internId !== internFilter) return false;
    return true;
  });

  const pendingCount = followUps.filter(f => f.status === 'PENDING').length;
  const completedCount = followUps.filter(f => f.status === 'COMPLETED').length;
  const urgentCount = followUps.filter(f => f.priority === 'URGENT' && f.status === 'PENDING').length;

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const assignedIntern = interns.find(i => i.id === newInternId);
    onAddFollowUp({
      id: `fup-${Date.now()}`,
      internId: newInternId,
      internName: assignedIntern ? assignedIntern.name : 'HR Intern',
      entityType: newEntityType,
      entityId: `ent-${Date.now()}`,
      entityTitle: newTitle,
      scheduledDate: newScheduledDate,
      priority: newPriority,
      status: 'PENDING',
      notes: newNotes,
    });
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewNotes('');
  };

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#09090b' }}>
            Follow-Ups
          </h1>
          <p style={{ color: '#52525b', fontSize: '0.85rem' }}>
            Scheduled calls and reminders with colleges and candidates.
          </p>
        </div>

        <button onClick={() => setIsAddModalOpen(true)} className="btn-black btn-black-sm">
          <Plus size={15} /> + Add Follow-Up
        </button>
      </div>

      {/* Mini KPI banner - Compact */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginBottom: '12px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>
            Pending
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#09090b', marginTop: '1px' }}>
            {pendingCount}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>
            Urgent
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: urgentCount > 0 ? '#ef4444' : '#09090b', marginTop: '1px' }}>
            {urgentCount}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>
            Completed
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981', marginTop: '1px' }}>
            {completedCount}
          </div>
        </div>
      </div>

      {/* Filter Bar - Flexible without side scrolling */}
      <div className="content-card" style={{ marginBottom: '14px', padding: '10px 14px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select 
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ flex: '1 1 110px', maxWidth: '200px', fontSize: '0.78rem', padding: '4px 8px' }}
          >
            <option value="PENDING">Pending Only</option>
            <option value="COMPLETED">Completed Only</option>
            <option value="ALL">All Items</option>
          </select>

          <select 
            className="form-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ flex: '1 1 110px', maxWidth: '200px', fontSize: '0.78rem', padding: '4px 8px' }}
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
          </select>

          <select 
            className="form-select"
            value={internFilter}
            onChange={(e) => setInternFilter(e.target.value)}
            style={{ flex: '1 1 110px', maxWidth: '200px', fontSize: '0.78rem', padding: '4px 8px' }}
          >
            <option value="ALL">All Interns</option>
            {interns.map(i => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="content-card">
        <div className="card-header-row" style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: '0.92rem' }}>Follow-Up Schedule ({filteredFollowUps.length})</h2>
            <p className="card-subtitle" style={{ fontSize: '0.72rem' }}>Keep track of outreach promises and scheduled discussion dates</p>
          </div>
        </div>

        <div className="desktop-only" style={{ width: '100%', overflowX: 'hidden' }}>
          <table className="crm-table" style={{ width: '100%', tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th style={{ width: '32px', padding: '6px 6px' }}>Status</th>
                <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Target Contact</th>
                <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Entity</th>
                <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Due Date</th>
                <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Priority</th>
                <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Intern</th>
                <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Notes / Action Item</th>
                <th style={{ fontSize: '0.68rem', padding: '6px 8px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFollowUps.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '28px', color: '#71717a', fontSize: '0.78rem' }}>
                    No follow-ups found for selected filters.
                  </td>
                </tr>
              ) : (
                filteredFollowUps.map(fup => (
                  <tr key={fup.id}>
                    <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                      <input 
                        type="checkbox"
                        checked={fup.status === 'COMPLETED'}
                        onChange={() => onToggleCompleteFollowUp(fup.id)}
                        style={{ width: '14px', height: '14px', accentColor: '#09090b', cursor: 'pointer' }}
                        title="Mark Completed"
                      />
                    </td>

                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ 
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        color: fup.status === 'COMPLETED' ? '#71717a' : '#09090b',
                        textDecoration: fup.status === 'COMPLETED' ? 'line-through' : 'none'
                      }}>
                        {fup.entityTitle}
                      </div>
                    </td>

                    <td style={{ padding: '6px 8px' }}>
                      <span className="badge badge-grey" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                        {fup.entityType}
                      </span>
                    </td>

                    <td style={{ padding: '6px 8px' }}>
                      <span style={{ 
                        fontWeight: 600, 
                        fontSize: '0.75rem',
                        color: '#09090b'
                      }}>
                        {fup.scheduledDate}
                      </span>
                    </td>

                    <td style={{ padding: '6px 8px' }}>
                      <span className={`badge ${
                        fup.priority === 'URGENT' ? 'badge-red' : fup.priority === 'HIGH' ? 'badge-amber' : 'badge-grey'
                      }`} style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                        {fup.priority}
                      </span>
                    </td>

                    <td style={{ padding: '6px 8px' }}>
                      <span style={{ fontSize: '0.75rem' }}>{fup.internName}</span>
                    </td>

                    <td style={{ maxWidth: '220px', fontSize: '0.72rem', color: '#52525b', padding: '6px 8px', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                      {fup.notes}
                    </td>

                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {fup.status === 'PENDING' && (
                          <>
                            <button 
                              onClick={() => onStartCall({
                                recipientType: fup.entityType,
                                recipientName: fup.entityTitle,
                                recipientDetail: fup.notes,
                                type: 'AUDIO',
                                followUpId: fup.id
                              })}
                              className="btn-black btn-black-sm"
                              style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                              title="Call immediately"
                            >
                              <Phone size={11} /> Call
                            </button>

                            <button 
                              onClick={() => onSnoozeFollowUp(fup.id, 1)}
                              className="btn-secondary btn-black-sm"
                              style={{ padding: '2px 5px', fontSize: '0.7rem' }}
                              title="Snooze 1 day"
                            >
                              +1d
                            </button>
                          </>
                        )}
                        {fup.status === 'COMPLETED' && (
                          <span style={{ color: '#10b981', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={12} /> Done
                          </span>
                        )}

                        {onDeleteFollowUp && (
                          <button 
                            onClick={() => onDeleteFollowUp(fup.id)}
                            className="btn-icon"
                            style={{ width: '22px', height: '22px', color: '#ef4444' }}
                            title="Delete follow-up reminder"
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

        {/* Mobile View: Clean Follow-Up Cards */}
        <div className="mobile-only" style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', boxSizing: 'border-box' }}>
          {filteredFollowUps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 10px', color: '#71717a', fontSize: '0.75rem' }}>
              No follow-ups found for selected filters. Tap "+ Add Follow-Up" to create one.
            </div>
          ) : (
            filteredFollowUps.map(fup => (
              <div key={fup.id} style={{
                background: fup.status === 'COMPLETED' ? '#f1f5f9' : '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                width: '100%',
                boxSizing: 'border-box',
                opacity: fup.status === 'COMPLETED' ? 0.75 : 1
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <input 
                      type="checkbox" 
                      checked={fup.status === 'COMPLETED'}
                      onChange={() => onToggleCompleteFollowUp(fup.id)}
                      style={{ width: '14px', height: '14px', accentColor: '#09090b', cursor: 'pointer', marginTop: '2px' }}
                    />
                    <div>
                      <div style={{ 
                        fontWeight: 700, 
                        fontSize: '0.8rem', 
                        color: fup.status === 'COMPLETED' ? '#71717a' : '#09090b',
                        textDecoration: fup.status === 'COMPLETED' ? 'line-through' : 'none'
                      }}>
                        {fup.entityTitle}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#71717a' }}>
                        {fup.entityType} • {fup.internName}
                      </div>
                    </div>
                  </div>

                  <span className={`badge ${
                    fup.priority === 'URGENT' ? 'badge-red' : fup.priority === 'HIGH' ? 'badge-amber' : 'badge-grey'
                  }`} style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                    {fup.priority}
                  </span>
                </div>

                {fup.notes && (
                  <div style={{ fontSize: '0.7rem', color: '#52525b', background: '#ffffff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', wordBreak: 'break-word' }}>
                    {fup.notes}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#09090b' }}>
                    Due: {fup.scheduledDate}
                  </span>

                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {fup.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => onStartCall({
                            recipientType: fup.entityType,
                            recipientName: fup.entityTitle,
                            recipientDetail: fup.notes,
                            type: 'AUDIO',
                            followUpId: fup.id
                          })}
                          className="btn-black btn-black-sm"
                          style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '3px' }}
                        >
                          <Phone size={11} /> Call
                        </button>

                        <button 
                          onClick={() => onSnoozeFollowUp(fup.id, 1)}
                          className="btn-secondary btn-black-sm"
                          style={{ padding: '3px 7px', fontSize: '0.72rem' }}
                        >
                          +1d
                        </button>
                      </>
                    )}

                    {onDeleteFollowUp && (
                      <button 
                        onClick={() => onDeleteFollowUp(fup.id)}
                        className="btn-icon"
                        style={{ width: '26px', height: '26px', color: '#ef4444' }}
                        title="Delete follow-up"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Follow-Up Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3 className="card-title">Schedule Follow-Up Callback</h3>
                <p className="card-subtitle">Set a scheduled touchpoint reminder</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Contact / College Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Dr. K. Ravichandran (NIT Trichy)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Contact Type</label>
                    <select 
                      className="form-select"
                      value={newEntityType}
                      onChange={(e) => setNewEntityType(e.target.value)}
                    >
                      <option value="TPO">TPO / Placement Officer</option>
                      <option value="STUDENT">Student Candidate</option>
                      <option value="OTHER">Other Partner</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select 
                      className="form-select"
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                    >
                      <option value="URGENT">Urgent</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Follow-Up Date *</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={newScheduledDate}
                      onChange={(e) => setNewScheduledDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assigned Intern</label>
                    <select 
                      className="form-select"
                      value={newInternId}
                      onChange={(e) => setNewInternId(e.target.value)}
                    >
                      {interns.map(i => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Action Item Notes *</label>
                  <textarea 
                    className="form-textarea" 
                    rows={3}
                    placeholder="Describe discussion purpose (e.g. finalize slot date, verify student backlogs)..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-black">
                  Create Follow-Up Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
