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

export default function CallModal({ 
  callState, 
  onEndCall, 
  onMinimize, 
  isMinimized, 
  onExpand,
  hrPhoneNumber = '+91 98201 55432',
  onOpenPhoneConnectModal
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callState?.type === 'VIDEO');
  const [notesDuringCall, setNotesDuringCall] = useState('');
  
  // Audio Calling Channels: 'PHONE_DIRECT' | 'CLOUD_BRIDGE' | 'VOIP_BROWSER'
  const [audioCallingTab, setAudioCallingTab] = useState('PHONE_DIRECT');
  
  // Cloud Telephony Bridge Simulation States: 'IDLE' | 'RINGING_HR' | 'HR_CONNECTED' | 'BRIDGING_CANDIDATE' | 'CONNECTED'
  const [bridgeStatus, setBridgeStatus] = useState('IDLE');
  
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

  // Parse recipient phone number
  const rawPhone = callState?.recipientPhone || 
    (callState?.recipientDetail && callState.recipientDetail.includes('+91') 
      ? callState.recipientDetail.split('•').pop().trim() 
      : '+91 98765 43210');
  const digitsOnly = rawPhone.replace(/\D/g, '');
  const cleanPhone = digitsOnly.startsWith('91') ? digitsOnly : `91${digitsOnly}`;

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

  // Handle Cloud Phone Bridge Sequence
  const handleInitiateBridge = () => {
    setBridgeStatus('RINGING_HR');
    webAudio.startRinging();

    setTimeout(() => {
      setBridgeStatus('HR_CONNECTED');
      webAudio.playCallConnected();

      setTimeout(() => {
        setBridgeStatus('BRIDGING_CANDIDATE');
        webAudio.startRinging();

        setTimeout(() => {
          setBridgeStatus('CONNECTED');
          webAudio.playCallConnected();
        }, 2200);
      }, 1500);
    }, 2000);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(rawPhone);
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
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
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
              {callState.type === 'VIDEO' ? 'Laptop Video Interview' : `Phone Call • ${hrPhoneNumber}`}
            </div>
          </div>
        </div>

        <div className="call-timer-box">
          <Clock size={14} color="#10b981" />
          <span>{formatTimeDigital(callState.duration)}</span>
        </div>

        <div className="call-wave-container">
          <div className="call-wave-bar"></div>
          <div className="call-wave-bar"></div>
          <div className="call-wave-bar"></div>
          <div className="call-wave-bar"></div>
        </div>

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
      <div className="call-room-modal" style={{ maxWidth: callState.type === 'VIDEO' ? '960px' : '720px' }}>
        
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
              background: '#18181b', 
              color: '#10b981', 
              padding: '4px 10px', 
              borderRadius: '20px', 
              fontSize: '0.72rem', 
              fontWeight: 600,
              border: '1px solid #27272a'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              {callState.type === 'VIDEO' ? 'Laptop Video Interview Room' : 'Live Phone Calling Hub'}
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
            {/* HR Connected Personal Phone indicator */}
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: '#d1d5db'
            }}>
              <Smartphone size={13} color="#10b981" />
              <span>HR Phone: <strong>{hrPhoneNumber}</strong></span>
              {onOpenPhoneConnectModal && (
                <button
                  type="button"
                  onClick={onOpenPhoneConnectModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#60a5fa',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    textDecoration: 'underline',
                    padding: '0 2px'
                  }}
                  title="Configure personal phone number"
                >
                  Change
                </button>
              )}
            </div>

            {/* Stopwatch */}
            <div className="call-timer-box" style={{ background: '#18181b', border: '1px solid #27272a' }}>
              <Clock size={14} color="#10b981" />
              <span style={{ color: '#ffffff', fontSize: '0.88rem' }}>{formatTimeDigital(callState.duration)}</span>
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
            SECTION 1: AUDIO CALLING MODES (CALL FROM PERSONAL PHONE / BRIDGE / VOIP)
            ========================================================================= */}
        {callState.type === 'AUDIO' && (
          <div style={{ padding: '16px 20px', background: '#121215', flex: '1 1 auto', overflowY: 'auto' }}>
            {/* Channel Tabs */}
            <div style={{ 
              display: 'flex', 
              background: '#18181b', 
              padding: '4px', 
              borderRadius: '8px', 
              border: '1px solid #27272a', 
              marginBottom: '16px' 
            }}>
              <button
                type="button"
                onClick={() => setAudioCallingTab('PHONE_DIRECT')}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: audioCallingTab === 'PHONE_DIRECT' ? '#09090b' : 'transparent',
                  color: audioCallingTab === 'PHONE_DIRECT' ? '#ffffff' : '#a1a1aa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Smartphone size={14} /> 1. Call from My Phone (SIM / QR)
              </button>

              <button
                type="button"
                onClick={() => setAudioCallingTab('CLOUD_BRIDGE')}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: audioCallingTab === 'CLOUD_BRIDGE' ? '#09090b' : 'transparent',
                  color: audioCallingTab === 'CLOUD_BRIDGE' ? '#ffffff' : '#a1a1aa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Radio size={14} /> 2. Personal Phone Bridge (Click-to-Call)
              </button>

              <button
                type="button"
                onClick={() => setAudioCallingTab('VOIP_BROWSER')}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: audioCallingTab === 'VOIP_BROWSER' ? '#09090b' : 'transparent',
                  color: audioCallingTab === 'VOIP_BROWSER' ? '#ffffff' : '#a1a1aa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Mic size={14} /> 3. Laptop VoIP Line
              </button>
            </div>

            {/* TAB 1: Call From Phone Directly (SIM / QR Code / WhatsApp) */}
            {audioCallingTab === 'PHONE_DIRECT' && (
              <div style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '20px',
                display: 'grid',
                gridTemplateColumns: '1.2fr 0.8fr',
                gap: '20px',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
                      <CheckCircle2 size={12} /> HR SIM Direct Call
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                      From HR: <strong>{hrPhoneNumber}</strong>
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', color: '#ffffff', fontWeight: 800, marginBottom: '6px' }}>
                    {callState.recipientName}
                  </h3>
                  <div style={{ fontSize: '0.95rem', color: '#10b981', fontFamily: 'monospace', fontWeight: 700, marginBottom: '14px' }}>
                    {rawPhone}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {/* Native tel: dialer button */}
                    <a 
                      href={`tel:${cleanPhone}`}
                      className="btn-black"
                      style={{ 
                        background: '#10b981', 
                        borderColor: '#10b981', 
                        color: '#09090b', 
                        fontSize: '0.8rem', 
                        padding: '8px 14px', 
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <Phone size={14} /> Dial on Mobile ({rawPhone})
                    </a>

                    {/* WhatsApp Voice/Chat */}
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${callState.recipientName}, calling from Talent Acquisition regarding your campus drive application.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{ 
                        background: '#27272a', 
                        borderColor: '#3f3f46', 
                        color: '#22c55e', 
                        fontSize: '0.8rem', 
                        padding: '8px 12px',
                        textDecoration: 'none'
                      }}
                    >
                      <MessageSquare size={14} /> WhatsApp Audio
                    </a>

                    {/* Copy Phone */}
                    <button
                      type="button"
                      onClick={handleCopyPhone}
                      className="btn-secondary"
                      style={{ background: '#27272a', borderColor: '#3f3f46', color: '#ffffff', fontSize: '0.8rem', padding: '8px 12px' }}
                    >
                      {copiedPhone ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      {copiedPhone ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#71717a', lineHeight: 1.4 }}>
                    💡 <strong>How it works:</strong> Dial candidate on your phone handset. The stopwatch on this laptop automatically tracks your verified talk time and logs notes directly into CRM Call Logs when you click End Call.
                  </div>
                </div>

                {/* QR Code Card for Instant Mobile Phone Dialing */}
                <div style={{
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <div style={{
                    background: '#ffffff',
                    padding: '8px',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    width: '130px',
                    height: '130px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {/* SVG Companion QR Generator */}
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=114x114&data=tel:${cleanPhone}`} 
                      alt="Scan to call" 
                      style={{ width: '114px', height: '114px', display: 'block' }}
                      onError={(e) => {
                        // Fallback SVG icon if offline
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff', marginBottom: '3px' }}>
                    Scan with Phone Camera
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#a1a1aa' }}>
                    Point phone camera to dial {callState.recipientName} immediately from your mobile SIM
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Personal Phone Cloud Bridge (Click-to-Call) */}
            {audioCallingTab === 'CLOUD_BRIDGE' && (
              <div style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center'
              }}>
                <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#27272a',
                    border: '2px solid #3f3f46',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px',
                    color: bridgeStatus === 'CONNECTED' ? '#10b981' : '#ffffff'
                  }}>
                    <Radio size={24} />
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
                    Two-Way Telephony Bridge
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#a1a1aa', marginBottom: '18px' }}>
                    The CRM dials your connected mobile (<strong>{hrPhoneNumber}</strong>) first. When you pick up, it patches candidate <strong>{callState.recipientName}</strong> (<strong>{rawPhone}</strong>) into the call.
                  </p>

                  {/* Bridge Status Progress */}
                  <div style={{
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '20px',
                    textAlign: 'left',
                    fontSize: '0.78rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: bridgeStatus !== 'IDLE' ? '#10b981' : '#71717a', marginBottom: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: bridgeStatus !== 'IDLE' ? '#10b981' : '#71717a' }}></span>
                      Step 1: Dial HR Personal Phone ({hrPhoneNumber})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: (bridgeStatus === 'HR_CONNECTED' || bridgeStatus === 'BRIDGING_CANDIDATE' || bridgeStatus === 'CONNECTED') ? '#10b981' : '#71717a', marginBottom: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: (bridgeStatus === 'HR_CONNECTED' || bridgeStatus === 'BRIDGING_CANDIDATE' || bridgeStatus === 'CONNECTED') ? '#10b981' : '#71717a' }}></span>
                      Step 2: HR Answers Call
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: bridgeStatus === 'CONNECTED' ? '#10b981' : '#71717a' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: bridgeStatus === 'CONNECTED' ? '#10b981' : '#71717a' }}></span>
                      Step 3: Candidate Line Bridged & Live ({rawPhone})
                    </div>
                  </div>

                  {bridgeStatus === 'IDLE' ? (
                    <button
                      type="button"
                      onClick={handleInitiateBridge}
                      className="btn-black"
                      style={{ background: '#10b981', borderColor: '#10b981', color: '#09090b', padding: '10px 20px', fontWeight: 700 }}
                    >
                      <Radio size={16} /> Initiate Bridge to My Phone
                    </button>
                  ) : bridgeStatus === 'CONNECTED' ? (
                    <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <CheckCircle2 size={16} /> Both Lines Connected & Talking via Phone
                    </div>
                  ) : (
                    <div style={{ color: '#eab308', fontWeight: 600, fontSize: '0.82rem' }}>
                      ⚡ {bridgeStatus === 'RINGING_HR' ? 'Ringing your phone...' : bridgeStatus === 'HR_CONNECTED' ? 'HR connected, dialing candidate...' : 'Connecting lines...'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: In-Browser Laptop VoIP */}
            {audioCallingTab === 'VOIP_BROWSER' && (
              <div style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '30px',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: '#27272a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                  border: '2px solid #3f3f46'
                }}>
                  {callState.recipientType === 'TPO' ? <Building size={32} color="#ffffff" /> : <GraduationCap size={32} color="#ffffff" />}
                </div>

                <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '4px' }}>
                  {callState.recipientName}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '16px' }}>
                  Laptop Audio Line • Mic {isMuted ? 'Muted' : 'Transmitting'}
                </p>

                <div className="call-wave-container" style={{ height: '36px', gap: '5px', justifyContent: 'center' }}>
                  <div className="call-wave-bar" style={{ width: '4px' }}></div>
                  <div className="call-wave-bar" style={{ width: '4px' }}></div>
                  <div className="call-wave-bar" style={{ width: '4px' }}></div>
                  <div className="call-wave-bar" style={{ width: '4px' }}></div>
                  <div className="call-wave-bar" style={{ width: '4px' }}></div>
                  <div className="call-wave-bar" style={{ width: '4px' }}></div>
                </div>
              </div>
            )}
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

        {/* Live Call / Interview Scratchpad Note */}
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
            placeholder={callState.type === 'VIDEO' ? 'Enter interview feedback (e.g. solved array problem, strong in React, expected CTC 16 LPA)...' : 'Enter call discussion points (e.g. confirmed drive slot, candidate available for interview)...'}
            style={{ 
              background: '#09090b', 
              borderColor: '#3f3f46', 
              color: '#ffffff',
              fontSize: '0.85rem',
              padding: '8px 12px'
            }}
          />
        </div>

        {/* Bottom Controls Bar */}
        <div className="call-controls-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Microphone Toggle */}
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

            {/* Camera Toggle (Video Mode) */}
            {callState.type === 'VIDEO' && (
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
            )}

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

      </div>
    </div>
  );
}
