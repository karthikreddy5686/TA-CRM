import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Smartphone, 
  Download, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  Copy, 
  Check, 
  Laptop, 
  Sparkles,
  QrCode,
  ShieldCheck,
  Zap,
  PhoneCall
} from 'lucide-react';

export default function InstallAppModal({
  isOpen,
  onClose,
  deferredPrompt,
  onNativeInstall
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Device detection
  const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
  const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroidDevice = /Android/.test(ua);
  const isMobileDevice = isIosDevice || isAndroidDevice;

  const [activeTab, setActiveTab] = useState(() => {
    if (isIosDevice) return 'ios';
    if (isAndroidDevice) return 'android';
    return 'android'; // default friendly tab for mobile install
  });

  useEffect(() => {
    if (isOpen) {
      if (isIosDevice) setActiveTab('ios');
      else if (isAndroidDevice) setActiveTab('android');
      
      const currentUrl = window.location.origin;
      QRCode.toDataURL(currentUrl, {
        width: 180,
        margin: 1,
        color: {
          dark: '#154360',
          light: '#ffffff'
        }
      })
        .then(url => setQrCodeUrl(url))
        .catch(() => {});
    }
  }, [isOpen, isIosDevice, isAndroidDevice]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '540px', width: '94vw', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '14px 18px', background: '#154360', color: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: 'var(--radius-sm)', 
              background: 'rgba(255, 255, 255, 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#FFDB58',
              flexShrink: 0
            }}>
              <Smartphone size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  Install Flux TA CRM
                </h3>
                <span style={{ 
                  fontSize: '0.65rem', 
                  background: '#FFDB58', 
                  color: '#154360', 
                  fontWeight: 800, 
                  padding: '1px 6px', 
                  borderRadius: '4px' 
                }}>
                  Mobile App
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#cbd5e1', margin: '2px 0 0' }}>
                Progressive Web App with 1-tap launcher & offline capability
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn-icon" 
            style={{ width: '30px', height: '30px', background: 'rgba(255, 255, 255, 0.12)', borderColor: 'rgba(255, 255, 255, 0.25)', color: '#ffffff' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto' }}>
          
          {/* Quick Install Banner if native browser prompt is ready */}
          {deferredPrompt && (
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1.5px solid #86efac',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.12)'
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={15} color="#16a34a" fill="#16a34a" /> 1-Tap Direct Install Ready!
                </div>
                <div style={{ fontSize: '0.76rem', color: '#15803d', marginTop: '3px' }}>
                  Install Flux CRM directly to your home screen or app drawer.
                </div>
              </div>
              <button
                type="button"
                onClick={onNativeInstall}
                className="btn-mustard"
                style={{ 
                  padding: '9px 16px', 
                  whiteSpace: 'nowrap', 
                  fontSize: '0.84rem', 
                  fontWeight: 800,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)' 
                }}
              >
                <Download size={15} /> Install Now
              </button>
            </div>
          )}

          {/* Device Tabs */}
          <div>
            <div style={{ 
              display: 'flex', 
              background: '#f1f5f9', 
              borderRadius: '10px', 
              padding: '3px',
              gap: '4px' 
            }}>
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  border: 'none',
                  borderRadius: '7px',
                  background: activeTab === 'android' ? '#ffffff' : 'transparent',
                  color: activeTab === 'android' ? '#154360' : '#64748b',
                  fontWeight: activeTab === 'android' ? 700 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: activeTab === 'android' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Smartphone size={14} color={activeTab === 'android' ? '#16a34a' : '#64748b'} />
                <span>Android Phone</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  border: 'none',
                  borderRadius: '7px',
                  background: activeTab === 'ios' ? '#ffffff' : 'transparent',
                  color: activeTab === 'ios' ? '#154360' : '#64748b',
                  fontWeight: activeTab === 'ios' ? 700 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: activeTab === 'ios' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Smartphone size={14} color={activeTab === 'ios' ? '#0284c7' : '#64748b'} />
                <span>iPhone / iPad</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('desktop')}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  border: 'none',
                  borderRadius: '7px',
                  background: activeTab === 'desktop' ? '#ffffff' : 'transparent',
                  color: activeTab === 'desktop' ? '#154360' : '#64748b',
                  fontWeight: activeTab === 'desktop' ? 700 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: activeTab === 'desktop' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Laptop size={14} color={activeTab === 'desktop' ? '#154360' : '#64748b'} />
                <span>Desktop / PC</span>
              </button>
            </div>
          </div>

          {/* Guide Card per platform */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px'
          }}>
            {activeTab === 'android' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Smartphone size={14} color="#16a34a" />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#154360' }}>
                    How to Install on Android (Chrome / Brave / Edge)
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#154360', color: '#fff', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</span>
                    <span style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                      Open this URL in <strong>Google Chrome</strong> on your Android phone.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#154360', color: '#fff', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</span>
                    <span style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                      Tap the <strong>Chrome menu (three dots ⋮)</strong> in the top-right corner.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#154360', color: '#fff', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</span>
                    <span style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                      Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#154360', color: '#fff', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>4</span>
                    <span style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                      Confirm <strong>Install</strong>. Flux TA CRM will appear as a native mobile app on your phone's home screen!
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ios' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Smartphone size={14} color="#0284c7" />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#154360' }}>
                    How to Install on iPhone / iPad (Safari)
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#154360', color: '#fff', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</span>
                    <span style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                      Open this URL in <strong>Apple Safari</strong> on your iPhone or iPad.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#154360', color: '#fff', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</span>
                    <span style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                      Tap the <strong>Share</strong> button <Share2 size={14} style={{ verticalAlign: 'middle', margin: '0 2px', color: '#0284c7' }} /> at the bottom of Safari.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#154360', color: '#fff', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</span>
                    <span style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                      Scroll down and tap <strong>"Add to Home Screen"</strong> <PlusSquare size={14} style={{ verticalAlign: 'middle', margin: '0 2px', color: '#154360' }} />.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#154360', color: '#fff', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>4</span>
                    <span style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                      Tap <strong>Add</strong> in the top-right corner. The app will launch in full screen with push notifications!
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'desktop' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Laptop size={14} color="#154360" />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#154360' }}>
                    How to Install on Desktop / Laptop (Chrome & Edge)
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#154360', color: '#fff', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</span>
                    <span style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                      Look at the right side of your Chrome or Edge URL address bar.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#154360', color: '#fff', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</span>
                    <span style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                      Click the <strong>Install</strong> icon <Download size={14} style={{ verticalAlign: 'middle', margin: '0 2px', color: '#154360' }} /> or click <strong>Settings ⋮ &gt; Install Flux TA CRM</strong>.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#154360', color: '#fff', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</span>
                    <span style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                      Click <strong>Install</strong> to open Flux TA CRM in a dedicated, distraction-free desktop window!
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* QR Code Section: Open on Mobile Phone with 1 Scan */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {qrCodeUrl && (
              <div style={{
                background: '#ffffff',
                padding: '6px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <img 
                  src={qrCodeUrl} 
                  alt="Scan to open on mobile" 
                  style={{ width: '90px', height: '90px', display: 'block' }} 
                />
              </div>
            )}
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#154360', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <QrCode size={15} color="#154360" /> Scan to Install on Mobile Phone
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px', lineHeight: 1.4 }}>
                Point your mobile phone camera at this QR code to instantly open and install Flux CRM on your smartphone.
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  marginTop: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'none',
                  border: 'none',
                  color: '#0284c7',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {copiedLink ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                <span>{copiedLink ? 'App link copied to clipboard!' : 'Or copy web app link'}</span>
              </button>
            </div>
          </div>

          {/* Native Web App Benefits Pills */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#475569', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}>
              <CheckCircle2 size={13} color="#10b981" />
              <span>1-Tap Phone Home Screen</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#475569', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}>
              <CheckCircle2 size={13} color="#10b981" />
              <span>Direct In-App Calling</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#475569', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}>
              <CheckCircle2 size={13} color="#10b981" />
              <span>Full Screen Mobile Window</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#475569', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}>
              <CheckCircle2 size={13} color="#10b981" />
              <span>Offline Cache & Fast Load</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <button
            type="button"
            onClick={handleCopyLink}
            className="btn-secondary btn-black-sm"
            style={{ fontSize: '0.78rem', gap: '6px' }}
          >
            {copiedLink ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy App Link'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn-mustard"
            style={{ padding: '8px 20px', fontSize: '0.82rem', fontWeight: 800 }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
