import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  Phone, 
  Video, 
  Clock, 
  UserPlus, 
  X, 
  Users, 
  Sparkles, 
  CheckCircle2,
  FileSpreadsheet,
  Trash2,
  ChevronRight,
  Plus,
  PhoneCall
} from 'lucide-react';

// 1. Global Create Drive Modal
export function GlobalNewDriveModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  tpos, 
  colleges 
}) {
  const [title, setTitle] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [jobRole, setJobRole] = useState('Graduate Software Engineer 2026');
  const [ctc, setCtc] = useState('16.0 LPA');
  const [criteria, setCriteria] = useState('B.Tech/BE with CGPA >= 7.0, zero active backlogs');
  const [driveDate, setDriveDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !collegeName.trim()) return;

    onSubmit({
      id: `drv-${Date.now()}`,
      title: title.trim(),
      collegeId: `col-${Date.now()}`,
      collegeName: collegeName.trim(),
      jobRole: jobRole.trim() || 'Software Engineer',
      ctc: ctc.trim() || 'Competitive',
      criteria: criteria.trim(),
      driveDate: driveDate || new Date().toISOString().split('T')[0],
      status: 'CONFIRMED',
      registeredStudents: 0,
      shortlistedStudents: 0,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="card-title">Schedule New Campus Drive</h3>
            <p className="card-subtitle">Deploy a new recruitment drive accessible across all modules</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={15} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Drive Title *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Graduate Software Engineer 2026"
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">University / College Campus *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. IIT Bombay, BITS Pilani..."
                  value={collegeName} 
                  onChange={e => setCollegeName(e.target.value)} 
                  list="college-suggestions"
                  required 
                />
                <datalist id="college-suggestions">
                  {tpos.map(t => <option key={t.id} value={t.collegeName} />)}
                  {colleges.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Designation / Role</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={jobRole} 
                    onChange={e => setJobRole(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CTC / Package</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={ctc} 
                    onChange={e => setCtc(e.target.value)} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Proposed Drive Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={driveDate} 
                    onChange={e => setDriveDate(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Eligibility Criteria</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={criteria} 
                    onChange={e => setCriteria(e.target.value)} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-mustard" style={{ fontWeight: 800 }}>Create Campus Drive</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 2. Global Create TPO Modal
export function GlobalNewTpoModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  users = [] 
}) {
  const staffMembers = (users || []).filter(u => u.role !== 'ADMIN');
  const [collegeName, setCollegeName] = useState('');
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('Training & Placement Officer');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [tier, setTier] = useState('Tier 1');
  const [assignedInternId, setAssignedInternId] = useState(staffMembers[0]?.id || '');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!collegeName.trim() || !name.trim() || !phone.trim()) return;

    const assignedStaff = staffMembers.find(i => i.id === (assignedInternId || staffMembers[0]?.id)) || staffMembers[0];
    onSubmit({
      id: `tpo-${Date.now()}`,
      collegeId: `col-${Date.now()}`,
      collegeName: collegeName.trim(),
      name: name.trim(),
      designation: designation.trim(),
      phone: phone.trim(),
      email: email.trim(),
      status: 'NEW_LEAD',
      assignedInternId: assignedStaff ? assignedStaff.id : 'unassigned',
      assignedInternName: assignedStaff ? assignedStaff.name : 'Vikram Aditya',
      notes: notes.trim(),
      lastContacted: new Date().toISOString().split('T')[0],
      city: city.trim() || 'Campus City',
      tier: tier,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="card-title">Add College Placement Contact (TPO)</h3>
            <p className="card-subtitle">Register a new campus training & placement official</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={15} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">College / University Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. National Institute of Technology"
                    value={collegeName} 
                    onChange={e => setCollegeName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Campus Tier</label>
                  <select className="form-select" value={tier} onChange={e => setTier(e.target.value)}>
                    <option value="Tier 1">Tier 1</option>
                    <option value="Tier 2">Tier 2</option>
                    <option value="Tier 3">Tier 3</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">TPO Full Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Prof. Arvind Kumar"
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={designation} 
                    onChange={e => setDesignation(e.target.value)} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    placeholder="+91 98000 00000"
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="placement@college.edu"
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Campus City</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Pune, Bangalore..."
                    value={city} 
                    onChange={e => setCity(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Assign to Staff Member</label>
                  <select 
                    className="form-select" 
                    value={assignedInternId || staffMembers[0]?.id || ''} 
                    onChange={e => setAssignedInternId(e.target.value)}
                  >
                    {staffMembers.map(i => <option key={i.id} value={i.id}>{i.name} ({i.role === 'MAIN_HR' ? 'HR Manager' : 'HR Intern'})</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Outreach Notes</label>
                <textarea 
                  className="form-textarea" 
                  rows={2} 
                  placeholder="Hiring slots, expected headcount, preferred roles..."
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-mustard" style={{ fontWeight: 800 }}>Add TPO Lead</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 3. Global Quick Call Modal
export function GlobalQuickCallModal({ 
  isOpen, 
  onClose, 
  onStartCall, 
  tpos, 
  students 
}) {
  const [callType, setCallType] = useState('AUDIO'); // 'AUDIO' | 'VIDEO'
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');

  if (!isOpen) return null;

  const handleDial = (e) => {
    e.preventDefault();
    if (selectedEntityId) {
      // Find either TPO or Student
      const matchedTpo = tpos.find(t => t.id === selectedEntityId);
      if (matchedTpo) {
        onStartCall({
          recipientType: 'TPO',
          recipientName: `${matchedTpo.name} (${matchedTpo.collegeName})`,
          recipientDetail: `${matchedTpo.designation} • ${matchedTpo.phone}`,
          recipientPhone: matchedTpo.phone,
          type: callType,
          tpoId: matchedTpo.id,
        });
        onClose();
        return;
      }

      const matchedStudent = students.find(s => s.id === selectedEntityId);
      if (matchedStudent) {
        onStartCall({
          recipientType: 'STUDENT',
          recipientName: matchedStudent.name,
          recipientDetail: `${matchedStudent.collegeName} • ${matchedStudent.phone}`,
          recipientPhone: matchedStudent.phone,
          type: callType,
          studentId: matchedStudent.id,
          student: matchedStudent
        });
        onClose();
        return;
      }
    }

    if (customName.trim() || customPhone.trim()) {
      onStartCall({
        recipientType: 'CAMPUS_CONTACT',
        recipientName: customName.trim() || 'Campus Official',
        recipientDetail: customPhone.trim() || 'Outreach Call',
        recipientPhone: customPhone.trim(),
        type: callType,
      });
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="card-title">Initiate In-App Phone or Video Call</h3>
            <p className="card-subtitle">Connect instantly with any registered TPO, applicant, or dial custom number</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={15} /></button>
        </div>

        <form onSubmit={handleDial}>
          <div className="modal-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Call Mode Switcher */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setCallType('AUDIO')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: callType === 'AUDIO' ? '#09090b' : '#e2e8f0',
                    background: callType === 'AUDIO' ? '#09090b' : '#ffffff',
                    color: callType === 'AUDIO' ? '#ffffff' : '#09090b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Phone size={15} /> Audio Phone Call
                </button>
                <button
                  type="button"
                  onClick={() => setCallType('VIDEO')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: callType === 'VIDEO' ? '#09090b' : '#e2e8f0',
                    background: callType === 'VIDEO' ? '#09090b' : '#ffffff',
                    color: callType === 'VIDEO' ? '#ffffff' : '#09090b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Video size={15} /> Video Interview
                </button>
              </div>

              {/* Select Existing Contact */}
              <div className="form-group">
                <label className="form-label">Select Registered Contact (TPO or Candidate)</label>
                <select
                  className="form-select"
                  value={selectedEntityId}
                  onChange={e => setSelectedEntityId(e.target.value)}
                >
                  <option value="">-- Choose from Directory --</option>
                  <optgroup label="College TPO Leads">
                    {tpos.map(t => (
                      <option key={t.id} value={t.id}>
                        🏢 {t.name} • {t.collegeName} ({t.phone})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Candidates & Students">
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        🎓 {s.name} • {s.collegeName} ({s.branch})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#a1a1aa', fontWeight: 600 }}>
                — OR ENTER DIRECT CONTACT —
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Contact Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Dean of Placements"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number / Extension</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+91 98000 00000"
                    value={customPhone}
                    onChange={e => setCustomPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button 
              type="submit" 
              className="btn-mustard"
              style={{ fontWeight: 800 }}
              disabled={!selectedEntityId && !customName && !customPhone}
            >
              {callType === 'VIDEO' ? <Video size={14} color="#154360" /> : <Phone size={14} color="#154360" />}
              Start {callType === 'VIDEO' ? 'Video Conference' : 'Audio Call'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 4. Global New Follow-Up Modal
export function GlobalNewFollowUpModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  users = [], 
  tpos, 
  students 
}) {
  const staffMembers = (users || []).filter(u => u.role !== 'ADMIN');
  const [entityTitle, setEntityTitle] = useState(tpos[0] ? `${tpos[0].name} (${tpos[0].collegeName})` : '');
  const [internId, setInternId] = useState(staffMembers[0]?.id || '');
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState('HIGH');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!entityTitle.trim()) return;

    const assignedStaff = staffMembers.find(i => i.id === (internId || staffMembers[0]?.id)) || staffMembers[0];
    onSubmit({
      id: `fup-${Date.now()}`,
      internId: assignedStaff ? assignedStaff.id : 'unassigned',
      internName: assignedStaff ? assignedStaff.name : 'Vikram Aditya',
      entityType: 'TASK',
      entityId: `ent-${Date.now()}`,
      entityTitle: entityTitle.trim(),
      scheduledDate,
      priority,
      status: 'PENDING',
      notes: notes.trim() || 'Follow-up regarding recruitment status.',
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="card-title">Schedule Follow-Up Task</h3>
            <p className="card-subtitle">Set an outreach deadline or reminder for the recruitment team</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={15} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Subject / Entity *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dr. Rajesh Kulkarni (IIT Bombay) or Candidate Verification"
                  value={entityTitle}
                  onChange={e => setEntityTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Scheduled Due Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={priority} onChange={e => setPriority(e.target.value)}>
                    <option value="URGENT">URGENT (Action Today)</option>
                    <option value="HIGH">HIGH Priority</option>
                    <option value="MEDIUM">MEDIUM Priority</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assignee (Staff / Intern) *</label>
                <select className="form-select" value={internId || staffMembers[0]?.id || ''} onChange={e => setInternId(e.target.value)}>
                  {staffMembers.map(i => <option key={i.id} value={i.id}>{i.name} ({i.role === 'MAIN_HR' ? 'HR Manager' : 'HR Intern'})</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Instructions / Notes</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Key talking points, agenda, or materials needed..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-mustard" style={{ fontWeight: 800 }}>Schedule Task</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 5. Global Add Student Modal (Accessible from anywhere)
export function GlobalAddStudentModal({
  isOpen,
  onClose,
  onSubmit,
  drives,
  users = []
}) {
  const staffMembers = (users || []).filter(u => u.role !== 'ADMIN');
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [branch, setBranch] = useState('Computer Science');
  const [cgpa, setCgpa] = useState('8.0');
  const [stage, setStage] = useState('APPLIED');
  const [targetDriveId, setTargetDriveId] = useState(drives[0]?.id || '');
  const [customCollege, setCustomCollege] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState(staffMembers[0]?.id || '');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const matchedDrive = drives.find(d => d.id === targetDriveId) || drives[0];
    const resolvedCollege = matchedDrive ? matchedDrive.collegeName : (customCollege.trim() || 'Engineering College');
    const assignedStaff = staffMembers.find(s => s.id === (assignedStaffId || staffMembers[0]?.id)) || staffMembers[0];

    onSubmit({
      id: `std-${Date.now()}`,
      driveId: matchedDrive ? matchedDrive.id : `drv-${Date.now()}`,
      name: name.trim(),
      rollNumber: rollNumber.trim() || `ROLL-${Date.now().toString().slice(-4)}`,
      email: email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '.')}@campus.edu`,
      phone: phone.trim() || '+91 98765 43210',
      collegeName: resolvedCollege,
      branch: branch.trim() || 'Computer Science',
      cgpa: parseFloat(cgpa) || 7.5,
      stage: stage || 'APPLIED',
      internId: assignedStaff ? assignedStaff.id : 'intern-vikram',
      internName: assignedStaff ? assignedStaff.name : 'Vikram Aditya',
      notes: 'Added manually via Quick Add',
    });

    onClose();
    setName('');
    setRollNumber('');
    setEmail('');
    setPhone('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="card-title">Add Student Candidate</h3>
            <p className="card-subtitle">Add a single candidate to your recruitment pipeline</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={15} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rahul Verma"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Roll Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 21CS045"
                    value={rollNumber}
                    onChange={e => setRollNumber(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    className="form-input"
                    placeholder="8.5"
                    value={cgpa}
                    onChange={e => setCgpa(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+91 98000 00000"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="student@college.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Branch / Department</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Computer Science"
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hiring Stage</label>
                  <select className="form-select" value={stage} onChange={e => setStage(e.target.value)}>
                    <option value="APPLIED">1. Applied</option>
                    <option value="ONLINE_ASSESSMENT">2. Online Test</option>
                    <option value="TECH_INTERVIEW">3. Tech Interview</option>
                    <option value="OFFERED">4. Selected / Offer</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assign to Campus Drive</label>
                {drives.length > 0 ? (
                  <select
                    className="form-select"
                    value={targetDriveId || drives[0]?.id}
                    onChange={e => setTargetDriveId(e.target.value)}
                  >
                    {drives.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.collegeName})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter College Name (e.g. IIT Delhi)"
                    value={customCollege}
                    onChange={e => setCustomCollege(e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-mustard" style={{ fontWeight: 800 }}>Add Candidate</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 6. Global Action Sheet Modal (Fixes clipped header dropdown on both mobile and desktop)
export function GlobalActionSheetModal({
  isOpen,
  onClose,
  onOpenNewDrive,
  onOpenAddStudent,
  onOpenNewTpo,
  onOpenQuickCall,
  onOpenFollowUp,
  onGoToIntake,
  onLoadDemoData,
  onResetData,
  hasData,
}) {
  if (!isOpen) return null;

  const actions = [
    {
      id: 'drive',
      title: 'New Campus Drive',
      desc: 'Schedule a drive for colleges (IIT, NIT, BITS...)',
      icon: <Calendar size={18} color="#154360" />,
      onClick: () => { onClose(); onOpenNewDrive(); },
      badge: 'Recruitment',
    },
    {
      id: 'student',
      title: 'Add Candidate Student',
      desc: 'Add an individual candidate directly to roster',
      icon: <UserPlus size={18} color="#154360" />,
      onClick: () => { onClose(); onOpenAddStudent(); },
      badge: 'Direct Add',
    },
    {
      id: 'intake',
      title: 'Import from Google Sheets',
      desc: 'Paste candidate rows from Sheets or WhatsApp',
      icon: <FileSpreadsheet size={18} color="#154360" />,
      onClick: () => { onClose(); onGoToIntake(); },
      badge: 'Fast Intake',
    },
    {
      id: 'tpo',
      title: 'New College TPO Lead',
      desc: 'Add campus training & placement official contact',
      icon: <Building2 size={18} color="#154360" />,
      onClick: () => { onClose(); onOpenNewTpo(); },
      badge: 'Outreach',
    },
    {
      id: 'call',
      title: 'Quick Dial Call / Video',
      desc: 'Initiate immediate phone call or video interview',
      icon: <PhoneCall size={18} color="#2563eb" />,
      onClick: () => { onClose(); onOpenQuickCall(); },
      badge: 'Telephony',
    },
    {
      id: 'followup',
      title: 'Schedule Follow-Up Task',
      desc: 'Set an outreach deadline or reminder for the team',
      icon: <Clock size={18} color="#d97706" />,
      onClick: () => { onClose(); onOpenFollowUp(); },
      badge: 'Reminder',
    },
    ...(hasData ? [{
      id: 'reset',
      title: 'Reset All Data to 0',
      desc: 'Wipe all database records to clean empty state',
      icon: <Trash2 size={18} color="#ef4444" />,
      onClick: () => { onClose(); onResetData(); },
      badge: 'Clean State',
      danger: true,
    }] : []),
  ];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="modal-card" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '480px', width: '96vw' }}
      >
        <div className="modal-header" style={{ padding: '16px 18px', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <h3 className="card-title" style={{ fontSize: '1.05rem', fontWeight: 800 }}>⚡ Quick Actions</h3>
            <p className="card-subtitle" style={{ fontSize: '0.78rem' }}>Create records, start calls, or load recruitment data</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>

        <div className="modal-body" style={{ padding: '12px 14px', maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {actions.map(action => (
              <button
                key={action.id}
                type="button"
                onClick={action.onClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  background: action.danger ? '#fef2f2' : '#ffffff',
                  border: '1px solid',
                  borderColor: action.danger ? '#fecaca' : '#e2e8f0',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: action.danger ? '#fee2e2' : '#f8fafc',
                  border: '1px solid',
                  borderColor: action.danger ? '#fca5a5' : '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {action.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <span style={{ 
                      fontWeight: 700, 
                      fontSize: '0.875rem', 
                      color: action.danger ? '#991b1b' : '#09090b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {action.title}
                    </span>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      padding: '1px 6px', 
                      borderRadius: '6px',
                      background: action.danger ? '#fee2e2' : '#f1f5f9',
                      color: action.danger ? '#991b1b' : '#52525b',
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      {action.badge}
                    </span>
                  </div>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: action.danger ? '#b91c1c' : '#71717a', 
                    margin: '2px 0 0',
                    lineHeight: 1.3
                  }}>
                    {action.desc}
                  </p>
                </div>

                <ChevronRight size={16} color={action.danger ? '#ef4444' : '#cbd5e1'} style={{ flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
