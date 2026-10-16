import React, { useState } from 'react';
import { Clock, CheckCircle2, Calendar, AlertCircle, FileText, X, Video, Phone, Sparkles } from 'lucide-react';
import { formatDuration } from '../data/mockData';

export default function CallDispositionModal({ 
  sessionData, 
  isOpen, 
  onSave, 
  onCancel 
}) {
  const [disposition, setDisposition] = useState(() => {
    if (sessionData?.callType === 'VIDEO') return 'SCREENING_PASSED';
    if (sessionData?.recipientType === 'TPO') return 'NOT_ANSWERED';
    return 'FOLLOW_UP_NEEDED';
  });
  const [candidateStage, setCandidateStage] = useState(() => {
    if (sessionData?.callType === 'VIDEO') return 'TECH_INTERVIEW';
    return 'UNCHANGED';
  });
  const [notes, setNotes] = useState(sessionData?.initialNotes || '');
  const [needFollowUp, setNeedFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [followUpPriority, setFollowUpPriority] = useState('HIGH');

  React.useEffect(() => {
    if (sessionData?.initialNotes) {
      setNotes(sessionData.initialNotes);
    }
    if (sessionData?.callType === 'VIDEO') {
      setDisposition('SCREENING_PASSED');
      setCandidateStage('TECH_INTERVIEW');
    } else if (sessionData?.recipientType === 'TPO') {
      setDisposition('NOT_ANSWERED');
    }
  }, [sessionData]);

  if (!isOpen || !sessionData) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      disposition,
      notes,
      needFollowUp,
      followUpDate,
      followUpPriority,
      candidateStage,
      relatedEntityId: sessionData.relatedEntityId,
      recipientType: sessionData.recipientType
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3 className="card-title">
              {sessionData.callType === 'VIDEO' ? '🎥 Interview Concluded & Evaluation Summary' : '📞 Call Concluded & Log Summary'}
            </h3>
            <p className="card-subtitle">
              Verify discussion notes, talk time, and update candidate stage in the CRM
            </p>
          </div>
          <button onClick={onCancel} className="btn-icon" title="Dismiss">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Verified Talk-time Highlight Card */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>
                  Logged Talk Time
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#154360', fontFamily: 'Space Grotesk, sans-serif' }}>
                  {formatDuration(sessionData.duration)}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#52525b', marginTop: '2px' }}>
                  Participant: <strong>{sessionData.recipientName}</strong> ({sessionData.recipientType === 'TPO' ? 'College TPO' : 'Candidate'})
                </div>
              </div>

              <div style={{
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                padding: '6px 12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                fontWeight: 600
              }}>
                <CheckCircle2 size={16} color="#10b981" />
                Verified & Clocked
              </div>
            </div>

            {/* Candidate Pipeline Stage Update (if candidate) */}
            {sessionData.recipientType === 'STUDENT' && (
              <div className="form-group" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#09090b' }}>
                  <Sparkles size={13} color="#eab308" /> Update Candidate Pipeline Stage
                </label>
                <select
                  className="form-select"
                  value={candidateStage}
                  onChange={(e) => setCandidateStage(e.target.value)}
                  style={{ fontWeight: 600 }}
                >
                  <option value="UNCHANGED">Keep Current Stage</option>
                  <option value="ONLINE_ASSESSMENT">1. Online Assessment Round</option>
                  <option value="TECH_INTERVIEW">2. Technical Interview Round</option>
                  <option value="OFFERED">3. Candidate Selected / Offer Extended</option>
                  <option value="REJECTED">4. Candidate Rejected</option>
                </select>
                <span style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '4px' }}>
                  Selecting a stage will automatically update the candidate's status across all drive boards.
                </span>
              </div>
            )}

            {/* Outcome Selection */}
            <div className="form-group">
              <label className="form-label">Call Outcome / Disposition *</label>
              <select 
                className="form-select"
                value={disposition}
                onChange={(e) => {
                  const val = e.target.value;
                  setDisposition(val);
                  if (val === 'FOLLOW_UP_NEEDED') {
                    setNeedFollowUp(true);
                  }
                }}
                required
                style={{ fontWeight: 600 }}
              >
                {sessionData.recipientType === 'TPO' ? (
                  <>
                    <option value="NOT_ANSWERED">1) Not Answered</option>
                    <option value="NOT_INTERESTED">2) Not Interested</option>
                    <option value="DRIVE_CONFIRMED">3) Drive Confirmed</option>
                    <option value="DETAILS_SENT">4) Details Sent</option>
                    <option value="FOLLOW_UP_NEEDED">5) Call Again / Follow Up Needed</option>
                  </>
                ) : (
                  <>
                    <option value="SCREENING_PASSED">Candidate Interview Passed (Recommend Next Step)</option>
                    <option value="SCREENING_FAILED">Candidate Rejected / Not Eligible</option>
                    <option value="DRIVE_CONFIRMED">Drive Confirmed (TPO agreed on date & terms)</option>
                    <option value="DETAILS_SENT">Details Sent</option>
                    <option value="FOLLOW_UP_NEEDED">Follow-up Required (Call again later)</option>
                    <option value="NOT_ANSWERED">Not Answered / Line Busy</option>
                    <option value="NOT_INTERESTED">Not Interested / Declined</option>
                  </>
                )}
              </select>
            </div>

            {/* Discussion Notes */}
            <div className="form-group">
              <label className="form-label">Discussion Highlights & Minutes *</label>
              <textarea 
                className="form-textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key feedback, technical performance, salary discussions, or candidate availability..."
                required
              />
            </div>

            {/* Schedule Follow-up Checkbox */}
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #e4e4e7', 
              borderRadius: '10px', 
              padding: '14px', 
              marginTop: '16px' 
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                <input 
                  type="checkbox" 
                  checked={needFollowUp} 
                  onChange={(e) => setNeedFollowUp(e.target.checked)} 
                  style={{ width: '16px', height: '16px', accentColor: '#09090b' }}
                />
                Schedule Follow-up in CRM Tracker
              </label>

              {needFollowUp && (
                <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Follow-up Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={followUpDate} 
                      onChange={(e) => setFollowUpDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Priority Level</label>
                    <select 
                      className="form-select"
                      value={followUpPriority}
                      onChange={(e) => setFollowUpPriority(e.target.value)}
                    >
                      <option value="URGENT">Urgent</option>
                      <option value="HIGH">High Priority</option>
                      <option value="MEDIUM">Medium Priority</option>
                      <option value="LOW">Low Priority</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Discard Log
            </button>
            <button type="submit" className="btn-mustard" style={{ fontWeight: 800 }}>
              Save Log & Update CRM Roster
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
