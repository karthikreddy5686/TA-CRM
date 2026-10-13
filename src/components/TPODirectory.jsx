import React, { useState } from 'react';
import { 
  Building2, 
  Phone, 
  Video, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Mail, 
  CheckCircle2, 
  UserCheck, 
  FileSpreadsheet,
  Trash2,
  X
} from 'lucide-react';

export default function TPODirectory({ 
  tpos, 
  colleges, 
  users, 
  currentRole, 
  onStartCall, 
  onAddTpo, 
  onDeleteTpo,
  onUpdateTpoStatus,
  onScheduleFollowUp 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [internFilter, setInternFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New TPO form state
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newTier, setNewTier] = useState('Tier 1');
  const [newName, setNewName] = useState('');
  const [newDesignation, setNewDesignation] = useState('Training & Placement Officer');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAssignedIntern, setNewAssignedIntern] = useState(users.find(u => u.role === 'HR_INTERN')?.id || '');
  const [newNotes, setNewNotes] = useState('');

  const interns = users.filter(u => u.role === 'HR_INTERN');

  // Filtered TPOs
  const filteredTpos = tpos.filter(tpo => {
    const matchesSearch = 
      tpo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tpo.collegeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tpo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tpo.phone.includes(searchTerm);

    const matchesStatus = statusFilter === 'ALL' || tpo.status === statusFilter;
    const matchesIntern = internFilter === 'ALL' || tpo.assignedInternId === internFilter;

    return matchesSearch && matchesStatus && matchesIntern;
  });

  const handleCreateTpo = (e) => {
    e.preventDefault();
    const assignedUser = interns.find(i => i.id === newAssignedIntern);
    onAddTpo({
      id: `tpo-${Date.now()}`,
      collegeId: `col-${Date.now()}`,
      collegeName: newCollegeName,
      name: newName,
      designation: newDesignation,
      phone: newPhone,
      email: newEmail,
      status: 'NEW_LEAD',
      assignedInternId: newAssignedIntern,
      assignedInternName: assignedUser ? assignedUser.name : 'Unassigned',
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
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#09090b' }}>
            College TPOs
          </h1>
          <p style={{ color: '#52525b', fontSize: '0.85rem' }}>
            Placement officer contacts and outreach. Click to call or video meet.
          </p>
        </div>

        <button onClick={() => setIsAddModalOpen(true)} className="btn-black btn-black-sm">
          <Plus size={15} /> + Add TPO
        </button>
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
              style={{ minWidth: '140px', fontSize: '0.825rem', padding: '6px 10px' }}
            >
              <option value="ALL">All Status</option>
              <option value="DRIVE_CONFIRMED">Drive Confirmed</option>
              <option value="PITCHED">Pitched</option>
              <option value="CONTACTED">Contacted</option>
              <option value="NEW_LEAD">New Lead</option>
            </select>

            <select 
              className="form-select"
              value={internFilter}
              onChange={(e) => setInternFilter(e.target.value)}
              style={{ minWidth: '140px', fontSize: '0.825rem', padding: '6px 10px' }}
            >
              <option value="ALL">All Interns</option>
              {interns.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
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
                      <div style={{ fontWeight: 700, color: '#09090b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={15} color="#52525b" />
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
                        value={tpo.status}
                        onChange={(e) => onUpdateTpoStatus(tpo.id, e.target.value)}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          border: '1px solid #cbd5e1',
                          background: tpo.status === 'DRIVE_CONFIRMED' ? '#ecfdf5' : '#ffffff',
                          color: tpo.status === 'DRIVE_CONFIRMED' ? '#065f46' : '#09090b',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="NEW_LEAD">New Lead</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="PITCHED">Pitched / Warm</option>
                        <option value="DRIVE_CONFIRMED">Drive Confirmed</option>
                        <option value="NOT_INTERESTED">Not Interested</option>
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
                          className="btn-black btn-black-sm"
                          title="Call TPO from HR Phone"
                        >
                          <Phone size={13} /> Call
                        </button>

                        <button 
                          onClick={() => onStartCall({
                            recipientType: 'TPO',
                            recipientName: `${tpo.name} (${tpo.collegeName})`,
                            recipientDetail: `${tpo.designation} • ${tpo.phone}`,
                            recipientPhone: tpo.phone,
                            type: 'VIDEO',
                            tpoId: tpo.id
                          })}
                          className="btn-secondary btn-black-sm"
                          title="Launch Video Conference on Laptop"
                        >
                          <Video size={13} /> Video
                        </button>

                        <button 
                          onClick={() => onScheduleFollowUp(tpo)}
                          className="btn-icon"
                          style={{ width: '30px', height: '30px' }}
                          title="Schedule Follow-Up Date"
                        >
                          <Calendar size={14} />
                        </button>

                        {onDeleteTpo && (
                          <button 
                            onClick={() => onDeleteTpo(tpo.id)}
                            className="btn-icon"
                            style={{ width: '30px', height: '30px', color: '#ef4444' }}
                            title="Delete TPO contact"
                          >
                            <Trash2 size={14} />
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

        {/* Mobile View: Clean TPO Cards */}
        <div className="mobile-only" style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredTpos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 12px', color: '#71717a', fontSize: '0.8rem' }}>
              No matching placement officers found. Tap "+ Add College TPO" to add one.
            </div>
          ) : (
            filteredTpos.map(tpo => (
              <div key={tpo.id} style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.925rem', color: '#09090b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Building2 size={15} color="#52525b" />
                      {tpo.collegeName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#71717a', marginLeft: '20px' }}>
                      {tpo.city || 'Campus'} • Assigned: {tpo.assignedInternName || 'Team'}
                    </div>
                  </div>
                  <select 
                    value={tpo.status}
                    onChange={(e) => onUpdateTpoStatus(tpo.id, e.target.value)}
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: tpo.status === 'DRIVE_CONFIRMED' ? '#ecfdf5' : '#ffffff',
                      color: tpo.status === 'DRIVE_CONFIRMED' ? '#065f46' : '#09090b'
                    }}
                  >
                    <option value="NEW_LEAD">New Lead</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="PITCHED">Pitched</option>
                    <option value="DRIVE_CONFIRMED">Confirmed</option>
                    <option value="NOT_INTERESTED">Declined</option>
                  </select>
                </div>

                <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#09090b' }}>{tpo.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#71717a' }}>{tpo.designation}</div>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#52525b', marginTop: '2px' }}>
                    {tpo.phone} • {tpo.email}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                  <button 
                    onClick={() => onStartCall({
                      recipientType: 'TPO',
                      recipientName: `${tpo.name} (${tpo.collegeName})`,
                      recipientDetail: `${tpo.designation} • ${tpo.phone}`,
                      recipientPhone: tpo.phone,
                      type: 'AUDIO',
                      tpoId: tpo.id
                    })}
                    className="btn-black btn-black-sm"
                    style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
                    title="Call TPO"
                  >
                    <Phone size={12} /> Call
                  </button>

                  <button 
                    onClick={() => onStartCall({
                      recipientType: 'TPO',
                      recipientName: `${tpo.name} (${tpo.collegeName})`,
                      recipientDetail: `${tpo.designation} • ${tpo.phone}`,
                      recipientPhone: tpo.phone,
                      type: 'VIDEO',
                      tpoId: tpo.id
                    })}
                    className="btn-secondary btn-black-sm"
                    style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                    title="Video Meeting"
                  >
                    <Video size={12} /> Video
                  </button>

                  <button 
                    onClick={() => onScheduleFollowUp(tpo)}
                    className="btn-icon"
                    style={{ width: '28px', height: '28px' }}
                    title="Follow-Up"
                  >
                    <Calendar size={12} />
                  </button>

                  {onDeleteTpo && (
                    <button 
                      onClick={() => onDeleteTpo(tpo.id)}
                      className="btn-icon"
                      style={{ width: '28px', height: '28px', color: '#ef4444' }}
                      title="Delete TPO"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add New TPO Modal */}
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
                    <label className="form-label">Assign to HR Intern</label>
                    <select 
                      className="form-select"
                      value={newAssignedIntern}
                      onChange={(e) => setNewAssignedIntern(e.target.value)}
                    >
                      {interns.map(i => (
                        <option key={i.id} value={i.id}>{i.name} ({i.title})</option>
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
                <button type="submit" className="btn-black">
                  Add TPO Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
