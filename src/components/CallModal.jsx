import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  Minimize2, 
  Maximize2, 
  Clock, 
  FileText, 
  Building, 
  GraduationCap,
  Sparkles,
  Volume2,
  Smartphone,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Star,
  Share2,
  ShieldCheck,
  Radio,
  CheckCircle2,
  Settings
} from 'lucide-react';
import { formatTimeDigital } from '../data/mockData';
import { webAudio } from '../utils/audio';
import { normalizePhoneNumber } from '../utils/phone';

export default function CallModal({ 
  callState, 
  onEndCall, 
  onMinimize, 
  isMinimized, 
  onExpand,
  hrPhoneNumber = '',
  onOpenPhoneConnectModal,
  onStartTimer,
  onToggleTimer,
  onUpdateRecipientPhone
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callState?.type === 'VIDEO');
  const [notesDuringCall, setNotesDuringCall] = useState('');
  
  // Recipient Phone state (dynamic and editable, no hardcoding)
  const [phoneNumber, setPhoneNumber] = useState(callState?.recipientPhone || '');
  const [isEditingPhone, setIsEditingPhone] = useState(!callState?.recipientPhone);

  useEffect(() => {
    setPhoneNumber(callState?.recipientPhone || '');
    if (callState?.recipientPhone) {
      setIsEditingPhone(false);
    }
  }, [callState?.recipientPhone]);

  // Phone normalization & carrier formatting (prevents "number dialed is incorrect" IVR error)
  const phoneInfo = normalizePhoneNumber(phoneNumber);
  const cleanPhone = phoneInfo.waNumber;
  
  // Video Interview Scorecard & Rubric
  const [techRating, setTechRating] = useState(4);
  const [commRating, setCommRating] = useState(4);
  const [problemRating, setProblemRating] = useState(4);
  const [interviewRecommendation, setInterviewRecommendation] = useState('HIRE');
  const [generatedMeetLink, setGeneratedMeetLink] = useState(() => {
    const roomCode = Math.random().toString(36).substring(2, 5) + '-' + 
                     Math.random().toString(36).substring(2, 6) + '-' + 
                     Math.random().toString(36).substring(2, 5);
    return `https://meet.google.com/${roomCode}`;
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const localVideoRef = useRef(null);
  const streamRef = useRef(null);

  // Audio connection sound when call connects
  useEffect(() => {
    if (callState?.active && callState.duration === 1) {
      webAudio.playCallConnected();
    }
  }, [callState?.active, callState?.duration]);

  // Setup camera preview on laptop for video interview
  useEffect(() => {
    if (callState?.active && callState?.type === 'VIDEO' && isVideoEnabled) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(stream => {
            streamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          })
          .catch(err => {
            console.log('Webcam not accessible, using avatar fallback:', err);
          });
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [callState?.active, callState?.type, isVideoEnabled]);

  if (!callState?.active) return null;

  const handleCopyPhone = () => {
    if (!phoneNumber) return;
    navigator.clipboard.writeText(phoneNumber);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyMeetLink = () => {
    if (!generatedMeetLink) return;
    navigator.clipboard.writeText(generatedMeetLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWhatsAppInvite = () => {
    const text = encodeURIComponent(
      `Hello ${callState.recipientName}, here is your interview link for your Campus Recruitment interview: ${generatedMeetLink}. Please join from your laptop with video enabled.`
    );
    window.open(`https://wa.me/${phoneInfo.waNumber}?text=${text}`, '_blank');
  };

  const handleEndCallWithData = () => {
    let combinedNotes = notesDuringCall.trim();
    if (callState.type === 'VIDEO') {
      const rubricSummary = `[Interview Evaluation: Tech: ${techRating}/5 | Comm: ${commRating}/5 | Problem Solving: ${problemRating}/5 | Recommendation: ${interviewRecommendation}]`;
      combinedNotes = combinedNotes ? `${rubricSummary} ${combinedNotes}` : rubricSummary;
    }
    onEndCall(combinedNotes);
  };

  // Minimized Floating Dock
  if (isMinimized) {
    return (
      <div className="floating-call-dock">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            background: '#ffffff', 
            color: '#09090b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '0.8rem'
          }}>
            {callState.type === 'VIDEO' ? <VideoIcon size={16} /> : <Phone size={16} />}
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
              {callState.recipientName}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>
              {callState.type === 'VIDEO' ? 'Laptop Video Interview' : 'Direct Phone Call'}
            </div>
          </div>
        </div>

        <div 
          className="call-timer-box"
          onClick={onToggleTimer || onStartTimer}
          style={{ 
            cursor: 'pointer',
            background: callState.timerRunning ? 'rgba(255, 219, 88, 0.15)' : '#18181b',
            border: callState.timerRunning ? '1px solid #FFDB58' : '1px solid #27272a'
          }}
          title={callState.timerRunning ? 'Timer active (Click to pause)' : 'Timer idle (Click to start)'}
        >
          <Clock size={14} color={callState.timerRunning ? '#FFDB58' : '#71717a'} />
          <span style={{ color: callState.timerRunning ? '#FFDB58' : '#a1a1aa' }}>
            {formatTimeDigital(callState.duration)}
          </span>
        </div>

        {callState.timerRunning && (
          <div className="call-wave-container">
            <div className="call-wave-bar"></div>
            <div className="call-wave-bar"></div>
            <div className="call-wave-bar"></div>
            <div className="call-wave-bar"></div>
          </div>
        )}

        <button 
          onClick={onExpand}
          className="btn-icon"
          title="Expand Call View"
          style={{ background: '#27272a', borderColor: '#3f3f46', color: '#ffffff' }}
        >
          <Maximize2 size={16} />
        </button>

        <button 
          onClick={handleEndCallWithData}
          className="btn-black btn-black-sm"
          style={{ background: '#ef4444', borderColor: '#ef4444' }}
          title="End Call & Log Duration"
        >
          <PhoneOff size={15} /> End
        </button>
      </div>
    );
  }

  // Full Calling / Interview Room Modal
  return (
    <div className="modal-overlay">
      <div className="call-room-modal" style={{ maxWidth: callState.type === 'VIDEO' ? '960px' : '480px', borderRadius: '14px', overflow: 'hidden' }}>
        
        {/* Top Header Bar */}
        <div style={{ 
          padding: '14px 20px', 
          borderBottom: '1px solid #27272a',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: '#09090b',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: '#154360', 
              color: '#FFDB58', 
              padding: '4px 10px', 
              borderRadius: '20px', 
              fontSize: '0.72rem', 
              fontWeight: 700,
              border: '1px solid #1b557a'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFDB58', display: 'inline-block' }}></span>
              {callState.type === 'VIDEO' ? 'Laptop Video Interview Room' : 'Live Phone Calling'}
            </span>

            {/* Recipient Details */}
            <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.92rem' }}>
              {callState.recipientName}
            </div>
            <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>
              ({callState.recipientType === 'TPO' ? 'College TPO' : 'Candidate'})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Stopwatch */}
            <div 
              className="call-timer-box" 
              onClick={onToggleTimer || onStartTimer}
              style={{ 
                background: callState.timerRunning ? 'rgba(255, 219, 88, 0.15)' : '#18181b', 
                border: callState.timerRunning ? '1px solid #FFDB58' : '1px solid #27272a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '8px'
              }}
              title={callState.timerRunning ? 'Timer Active (Click to Pause)' : 'Timer Idle (Click to Start or click Dial on Mobile)'}
            >
              <Clock size={14} color={callState.timerRunning ? '#FFDB58' : '#71717a'} />
              <span style={{ color: callState.timerRunning ? '#FFDB58' : '#ffffff', fontSize: '0.88rem', fontWeight: 700 }}>
                {formatTimeDigital(callState.duration)}
              </span>
              <span style={{ 
                fontSize: '0.65rem', 
                fontWeight: 700, 
                color: callState.timerRunning ? '#154360' : '#eab308',
                background: callState.timerRunning ? '#FFDB58' : 'rgba(234, 179, 8, 0.15)',
                padding: '1px 5px',
                borderRadius: '4px'
              }}>
                {callState.timerRunning ? 'LIVE' : 'IDLE'}
              </span>
            </div>

            <button 
              onClick={onMinimize} 
              className="btn-icon" 
              title="Minimize to Dock (Keep browsing CRM)"
              style={{ background: '#18181b', borderColor: '#27272a', color: '#ffffff' }}
            >
              <Minimize2 size={15} />
            </button>
          </div>
        </div>

        {/* =========================================================================
            DIRECT PHONE CALLING: STUDENT NAME, MOBILE NUMBER, CALL & END CALL BUTTONS
            ========================================================================= */}
        {callState.type !== 'VIDEO' && (
          <div style={{ padding: '36px 24px', background: '#0e1726', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '18px' }}>
            {/* Student Avatar / Initials */}
            <div style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              background: '#154360',
              border: '3px solid #FFDB58',
              color: '#FFDB58',
              fontSize: '1.75rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
            }}>
              {callState.recipientName ? callState.recipientName.slice(0, 2).toUpperCase() : 'ST'}
            </div>

            {/* Student Name */}
            <div>
              <h2 style={{ fontSize: '1.5rem', color: '#ffffff', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
                {callState.recipientName}
              </h2>

              {/* Mobile Number */}
              {isEditingPhone ? (
                <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                  <input 
                    type="tel"
                    className="form-input"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      if (onUpdateRecipientPhone) onUpdateRecipientPhone(e.target.value);
                    }}
                    placeholder="Enter Mobile Number"
                    style={{ 
                      maxWidth: '180px', 
                      fontSize: '0.95rem', 
                      padding: '6px 12px', 
                      background: '#18181b', 
                      borderColor: '#FFDB58', 
                      color: '#FFDB58', 
                      fontWeight: 700,
                      textAlign: 'center'
                    }}
                    autoFocus
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsEditingPhone(false);
                      if (onUpdateRecipientPhone && phoneNumber.trim()) {
                        onUpdateRecipientPhone(phoneNumber.trim());
                      }
                    }}
                    className="btn-mustard"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', fontWeight: 800 }}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '1.25rem', color: '#FFDB58', fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.5px' }}>
                    {phoneNumber || '(No phone number)'}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setIsEditingPhone(true)}
                    style={{ background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', fontSize: '0.78rem', textDecoration: 'underline' }}
                  >
                    {phoneNumber ? 'Change' : '+ Set Number'}
                  </button>
                </div>
              )}
            </div>

            {/* Call Button & End Call Button */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
              {/* Call Button - App Theme Color (#FFDB58 Mustard Yellow) */}
              <a 
                href={phoneInfo.telUrl || '#'}
                onClick={(e) => {
                  if (!phoneInfo.telUrl) {
                    e.preventDefault();
                    setIsEditingPhone(true);
                    return;
                  }
                  if (onStartTimer) onStartTimer();
                }}
                className="btn-mustard"
                style={{ 
                  padding: '12px 28px', 
                  fontSize: '0.98rem', 
                  fontWeight: 800, 
                  borderRadius: '10px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(255, 219, 88, 0.35)',
                  cursor: 'pointer'
                }}
                title="Dial mobile number directly"
              >
                <Phone size={18} color="#154360" /> Call {phoneInfo.local10 || phoneInfo.cleanDigits || ''}
              </a>

              {/* End Call Button */}
              <button 
                type="button"
                onClick={handleEndCallWithData}
                style={{ 
                  background: '#dc2626', 
                  color: '#ffffff',
                  border: '1px solid #b91c1c', 
                  padding: '12px 28px',
                  fontSize: '0.98rem',
                  fontWeight: 800,
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                  cursor: 'pointer'
                }}
                title="End call and log to CRM"
              >
                <PhoneOff size={18} /> End Call
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 2: VIDEO INTERVIEW STUDIO (LAPTOP WEBCAM + RUBRIC & MEET LINK)
            ========================================================================= */}
        {callState.type === 'VIDEO' && (
          <div style={{ flex: '1 1 auto', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            
            {/* Split Video Stage */}
            <div className="video-grid" style={{ minHeight: '260px', maxHeight: '36vh' }}>
              {/* Remote Candidate Feed */}
              <div className="video-feed-box">
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
                  color: '#ffffff',
                  position: 'relative'
                }}>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    background: '#09090b', 
                    border: '2px solid #3f3f46',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    marginBottom: '10px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                  }}>
                    {callState.recipientName ? callState.recipientName.charAt(0) : 'C'}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                    {callState.recipientName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '2px' }}>
                    {callState.recipientDetail || 'Remote Candidate'}
                  </div>

                  <div style={{ 
                    position: 'absolute', 
                    bottom: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    background: 'rgba(0,0,0,0.6)',
                    padding: '4px 12px',
                    borderRadius: '20px'
                  }}>
                    <Volume2 size={13} color="#10b981" />
                    <span style={{ fontSize: '0.72rem', color: '#d1d5db' }}>Candidate Video Active</span>
                  </div>
                </div>
                <div className="video-feed-label">
                  {callState.recipientName} (Candidate)
                </div>
              </div>

              {/* Local HR Interviewer Laptop Webcam Stream */}
              <div className="video-feed-box">
                {isVideoEnabled ? (
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: '#27272a',
                    color: '#ffffff'
                  }}>
                    <div style={{ 
                      width: '68px', 
                      height: '68px', 
                      borderRadius: '50%', 
                      background: '#09090b', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.3rem',
                      border: '2px solid #3f3f46',
                      marginBottom: '10px'
                    }}>
                      {callState.callerName ? callState.callerName.charAt(0) : 'HR'}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {callState.callerName} (You)
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#a1a1aa', marginTop: '2px' }}>
                      Camera Off • Mic {isMuted ? 'Muted' : 'Live'}
                    </div>
                  </div>
                )}
                <div className="video-feed-label">
                  {callState.callerName} (HR Interviewer)
                </div>
              </div>
            </div>

            {/* Laptop Interview Tools: Rubric & Meeting Link */}
            <div style={{ padding: '16px 20px', background: '#121215', borderTop: '1px solid #27272a' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                
                {/* 1-Click Meeting Link Integration */}
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <VideoIcon size={14} color="#3b82f6" /> Google Meet / Zoom Link
                    </span>
                    <button
                      type="button"
                      onClick={() => window.open(generatedMeetLink, '_blank')}
                      className="btn-secondary"
                      style={{ fontSize: '0.7rem', padding: '3px 8px', color: '#60a5fa', borderColor: '#3b82f6' }}
                    >
                      <ExternalLink size={12} /> Open in Browser
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input 
                      type="text" 
                      readOnly 
                      value={generatedMeetLink} 
                      className="form-input"
                      style={{ fontSize: '0.75rem', background: '#09090b', color: '#93c5fd', borderColor: '#27272a', padding: '6px 10px' }}
                    />
                    <button
                      type="button"
                      onClick={handleCopyMeetLink}
                      className="btn-secondary"
                      style={{ fontSize: '0.72rem', padding: '6px 10px', background: '#27272a', color: '#ffffff' }}
                      title="Copy meeting link"
                    >
                      {copiedLink ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleWhatsAppInvite}
                    className="btn-secondary"
                    style={{ 
                      width: '100%', 
                      fontSize: '0.75rem', 
                      padding: '6px 10px', 
                      background: '#14532d', 
                      borderColor: '#166534', 
                      color: '#86efac',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <MessageSquare size={13} /> Send Meet Link via WhatsApp to Candidate
                  </button>
                </div>

                {/* Candidate Interview Evaluation Rubric */}
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} color="#eab308" /> Interview Evaluation Rubric
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#d1d5db' }}>Technical Knowledge:</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setTechRating(star)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px' }}
                          >
                            <Star size={13} fill={star <= techRating ? '#eab308' : 'none'} color={star <= techRating ? '#eab308' : '#71717a'} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#d1d5db' }}>Problem Solving:</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setProblemRating(star)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px' }}
                          >
                            <Star size={13} fill={star <= problemRating ? '#eab308' : 'none'} color={star <= problemRating ? '#eab308' : '#71717a'} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#d1d5db' }}>Communication:</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setCommRating(star)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px' }}
                          >
                            <Star size={13} fill={star <= commRating ? '#eab308' : 'none'} color={star <= commRating ? '#eab308' : '#71717a'} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ color: '#d1d5db', fontWeight: 600 }}>Decision:</span>
                      <select
                        value={interviewRecommendation}
                        onChange={(e) => setInterviewRecommendation(e.target.value)}
                        style={{
                          background: '#09090b',
                          color: interviewRecommendation === 'HIRE' || interviewRecommendation === 'STRONG_HIRE' ? '#10b981' : '#f87171',
                          border: '1px solid #3f3f46',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}
                      >
                        <option value="STRONG_HIRE">🌟 Strong Hire</option>
                        <option value="HIRE">✅ Recommend Hire</option>
                        <option value="HOLD">⏸️ Keep on Hold</option>
                        <option value="REJECT">❌ Reject</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Call / Interview Scratchpad Note - Video Mode Only */}
        {callState.type === 'VIDEO' && (
          <div style={{ padding: '12px 20px', background: '#18181b', borderTop: '1px solid #27272a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <FileText size={14} color="#a1a1aa" />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#d1d5db' }}>
                Live Call Scratchpad (Auto-saves into CRM Call Log & Student Profile)
              </span>
            </div>
            <input 
              type="text"
              className="form-input"
              value={notesDuringCall}
              onChange={(e) => setNotesDuringCall(e.target.value)}
              placeholder="Enter interview feedback (e.g. solved array problem, strong in React, expected CTC 16 LPA)..."
              style={{ 
                background: '#09090b', 
                borderColor: '#3f3f46', 
                color: '#ffffff',
                fontSize: '0.85rem',
                padding: '8px 12px'
              }}
            />
          </div>
        )}

        {/* Bottom Controls Bar - Video Mode Only */}
        {callState.type === 'VIDEO' && (
          <div className="call-controls-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="btn-icon"
                style={{ 
                  background: isMuted ? '#ef4444' : '#27272a', 
                  color: '#ffffff', 
                  borderColor: isMuted ? '#ef4444' : '#3f3f46' 
                }}
                title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMuted ? <MicOff size={17} /> : <Mic size={17} />}
              </button>

              <button 
                type="button"
                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                className="btn-icon"
                style={{ 
                  background: !isVideoEnabled ? '#ef4444' : '#27272a', 
                  color: '#ffffff', 
                  borderColor: !isVideoEnabled ? '#ef4444' : '#3f3f46' 
                }}
                title={isVideoEnabled ? 'Turn Off Webcam' : 'Turn On Webcam'}
              >
                {!isVideoEnabled ? <VideoOff size={17} /> : <VideoIcon size={17} />}
              </button>

              <button 
                type="button"
                onClick={onMinimize}
                className="btn-secondary btn-black-sm"
                style={{ background: '#18181b', color: '#ffffff', borderColor: '#3f3f46' }}
              >
                <Minimize2 size={13} /> Minimize to Dock
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button 
                type="button"
                onClick={handleEndCallWithData}
                className="btn-black"
                style={{ 
                  background: '#dc2626', 
                  borderColor: '#dc2626', 
                  padding: '9px 20px',
                  fontSize: '0.88rem',
                  fontWeight: 700
                }}
              >
                <PhoneOff size={16} /> End Call & Log to CRM
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
