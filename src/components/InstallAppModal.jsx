import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Download, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  Copy, 
  Check, 
  Globe, 
  Laptop, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function InstallAppModal({
  isOpen,
  onClose,
  deferredPrompt,
  onNativeInstall
}) {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  // Simple user agent detection
  const ua = navigator.userAgent || '';
  const isIos = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /Android/.test(ua);
  const isDesktop = !isIos && !isAndroid;

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
        style={{ maxWidth: '520px', width: '92vw', borderRadius: '16px' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 20px', background: '#09090b', color: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '34px', 
              height: '34px', 
              borderRadius: '10px', 
              background: '#27272a', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#ffffff' 
            }}>
              <Smartphone size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Install TalentConnect Web App
              </h3>
              <p style={{ fontSize: '0.74rem', color: '#a1a1aa', margin: 0 }}>
                Progressive Web App for Mobile & Desktop
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn-icon" 
            style={{ width: '28px', height: '28px', background: '#27272a', borderColor: '#3f3f46', color: '#e4e4e7' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Install Banner if native prompt is ready */}
          {deferredPrompt && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#166534' }}>
                  ⚡ Quick 1-Tap Installation Available
                </div>
                <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '2px' }}>
                  Install directly onto your home screen or desktop application launcher.
                </div>
              </div>
              <button
                type="button"
                onClick={onNativeInstall}
                className="btn-black btn-black-sm"
                style={{ padding: '8px 14px', whiteSpace: 'nowrap' }}
              >
                <Download size={14} /> Install Now
              </button>
            </div>
          )}

          {/* Device specific guides */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              {isIos ? <Smartphone size={16} color="#0284c7" /> : isAndroid ? <Smartphone size={16} color="#16a34a" /> : <Laptop size={16} color="#09090b" />}
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#09090b' }}>
                {isIos ? 'How to Install on iPhone / iPad (Safari)' : isAndroid ? 'How to Install on Android (Chrome)' : 'How to Install on Desktop / Laptop (Chrome / Edge)'}
              </span>
            </div>

            {isIos && (
              <ol style={{ paddingLeft: '20px', margin: 0, fontSize: '0.8rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  Open this page in <strong>Apple Safari</strong>.
                </li>
                <li>
                  Tap the <strong>Share</strong> button <Share2 size={13} style={{ verticalAlign: 'middle', margin: '0 2px' }} /> in the bottom navigation bar.
                </li>
                <li>
                  Scroll down the options list and select <strong>"Add to Home Screen"</strong> <PlusSquare size={13} style={{ verticalAlign: 'middle', margin: '0 2px' }} />.
                </li>
                <li>
                  Tap <strong>Add</strong> in the top-right corner. The TalentConnect icon will appear on your phone home screen!
                </li>
              </ol>
            )}

            {isAndroid && (
              <ol style={{ paddingLeft: '20px', margin: 0, fontSize: '0.8rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  Open this page in <strong>Google Chrome</strong>.
                </li>
                <li>
                  Tap the <strong>Menu (three dots ⋮)</strong> in the top-right corner.
                </li>
                <li>
                  Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </li>
                <li>
                  Confirm <strong>Install</strong>. TalentConnect will launch in full screen with push notifications and fast caching!
                </li>
              </ol>
            )}

            {isDesktop && (
              <ol style={{ paddingLeft: '20px', margin: 0, fontSize: '0.8rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  Look at the right side of your browser URL address bar in <strong>Chrome</strong> or <strong>Edge</strong>.
                </li>
                <li>
                  Click the <strong>Install</strong> icon <Download size={13} style={{ verticalAlign: 'middle', margin: '0 2px' }} /> (or click <strong>Settings ⋮ &gt; Cast, save, and share &gt; Install TalentConnect</strong>).
                </li>
                <li>
                  Click <strong>Install</strong>. TalentConnect opens in a dedicated, distraction-free desktop window with keyboard shortcuts!
                </li>
              </ol>
            )}
          </div>

          {/* Web App Benefits */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Native Web App Capabilities
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#334155' }}>
                <CheckCircle2 size={14} color="#10b981" />
                <span>Offline local caching</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#334155' }}>
                <CheckCircle2 size={14} color="#10b981" />
                <span>Mobile SIM & QR dialer</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#334155' }}>
                <CheckCircle2 size={14} color="#10b981" />
                <span>Laptop webcam interviews</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#334155' }}>
                <CheckCircle2 size={14} color="#10b981" />
                <span>Full screen experience</span>
              </div>
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
            className="btn-black btn-black-sm"
            style={{ padding: '8px 18px' }}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
