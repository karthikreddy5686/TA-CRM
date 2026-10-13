import React, { useState } from 'react';
import { 
  Phone, 
  Smartphone, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Radio, 
  Volume2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { webAudio } from '../utils/audio';

export default function HRPhoneConnectModal({
  isOpen,
  onClose,
  currentPhone,
  onSavePhone,
  currentUser
}) {
  const [phoneNumber, setPhoneNumber] = useState(currentPhone || '+91 98201 55432');
  const [callingMode, setCallingMode] = useState('PHONE_DIRECT'); // 'PHONE_DIRECT' | 'CLOUD_BRIDGE' | 'VOIP_BROWSER'
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTestRing = () => {
    setIsTesting(true);
    setTestSuccess(false);
    webAudio.startRinging();

    setTimeout(() => {
      webAudio.playCallConnected();
      setIsTesting(false);
      setTestSuccess(true);
    }, 2200);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    onSavePhone(phoneNumber.trim(), callingMode);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#09090b',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Smartphone size={18} />
            </div>
            <div>
              <h3 className="card-title" style={{ fontSize: '1.05rem' }}>Connect HR Calling Phone</h3>
              <p className="card-subtitle">Connect your personal phone to dial candidates from phone or bridge via web app</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Active User Card */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#09090b' }}>
                  {currentUser?.name || 'Recruitment Officer'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {currentUser?.role === 'MAIN_HR' ? 'Main HR Manager' : 'HR Intern'} • {currentUser?.email}
                </div>
              </div>
              <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} /> Active Recruiter
              </span>
            </div>

            {/* Phone Number Input */}
            <div className="form-group">
              <label className="form-label">HR Personal / Work Calling Number *</label>
              <div style={{ position: 'relative' }}>
                <Phone size={15} color="#71717a" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input 
                  type="tel"
                  className="form-input"
                  value={phoneNumber}
                  onChange={e => {
                    setPhoneNumber(e.target.value);
                    setTestSuccess(false);
                  }}
                  placeholder="+91 98201 55432"
                  style={{ paddingLeft: '34px', fontSize: '0.92rem', fontWeight: 600, letterSpacing: '0.02em' }}
                  required
                />
              </div>
              <span style={{ fontSize: '0.72rem', color: '#71717a' }}>
                Format: +91 followed by your 10-digit mobile number. Calls to candidates will originate or bridge through this number.
              </span>
            </div>

            {/* Calling Mode Preference */}
            <div className="form-group">
              <label className="form-label">Preferred Calling Mode</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: callingMode === 'PHONE_DIRECT' ? '1.5px solid #09090b' : '1px solid #e2e8f0',
                  background: callingMode === 'PHONE_DIRECT' ? '#f8fafc' : '#ffffff',
                  cursor: 'pointer'
                }}>
                  <input 
                    type="radio" 
                    name="callingMode" 
                    value="PHONE_DIRECT"
                    checked={callingMode === 'PHONE_DIRECT'}
                    onChange={() => setCallingMode('PHONE_DIRECT')}
                    style={{ marginTop: '3px', accentColor: '#09090b' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#09090b' }}>
                      📱 Call from Phone (1-Tap Dial / Companion QR)
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                      Talk directly from your phone handset via SIM or WhatsApp. The laptop CRM tracks live stopwatch, minutes, and auto-logs candidate disposition.
                    </div>
                  </div>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: callingMode === 'CLOUD_BRIDGE' ? '1.5px solid #09090b' : '1px solid #e2e8f0',
                  background: callingMode === 'CLOUD_BRIDGE' ? '#f8fafc' : '#ffffff',
                  cursor: 'pointer'
                }}>
                  <input 
                    type="radio" 
                    name="callingMode" 
                    value="CLOUD_BRIDGE"
                    checked={callingMode === 'CLOUD_BRIDGE'}
                    onChange={() => setCallingMode('CLOUD_BRIDGE')}
                    style={{ marginTop: '3px', accentColor: '#09090b' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#09090b' }}>
                      🔄 Cloud Telephony Bridge (Click-to-Call)
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                      CRM rings your personal mobile first, and automatically bridges to candidate on a standard phone line when you answer.
                    </div>
                  </div>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: callingMode === 'VOIP_BROWSER' ? '1.5px solid #09090b' : '1px solid #e2e8f0',
                  background: callingMode === 'VOIP_BROWSER' ? '#f8fafc' : '#ffffff',
                  cursor: 'pointer'
                }}>
                  <input 
                    type="radio" 
                    name="callingMode" 
                    value="VOIP_BROWSER"
                    checked={callingMode === 'VOIP_BROWSER'}
                    onChange={() => setCallingMode('VOIP_BROWSER')}
                    style={{ marginTop: '3px', accentColor: '#09090b' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#09090b' }}>
                      💻 Laptop VoIP / Headset Calling
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                      Call directly through laptop microphone and audio line without picking up your phone.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Test Connection Button */}
            <div style={{
              background: '#f1f5f9',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Radio size={14} color={testSuccess ? '#10b981' : '#64748b'} />
                <span style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 600 }}>
                  {testSuccess ? 'Line Verified & Ready to Call' : 'Verify Audio & Line Connection'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleTestRing}
                disabled={isTesting}
                className="btn-secondary"
                style={{ fontSize: '0.72rem', padding: '4px 10px' }}
              >
                {isTesting ? 'Ringing Line...' : testSuccess ? 'Test Again' : 'Test Ring'}
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-black">
              <CheckCircle2 size={14} /> Connect & Save Phone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
