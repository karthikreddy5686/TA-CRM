import React, { useEffect } from 'react';
import { LogOut, X, AlertTriangle } from 'lucide-react';

export default function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  currentUser
}) {
  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayName = currentUser?.role === 'ADMIN'
    ? 'Geonixa Admin'
    : (currentUser?.name === 'Main HR Manager' || currentUser?.name === 'Main HR' ? 'HR Manager' : (currentUser?.name || 'User'));

  const roleLabel = currentUser?.role === 'ADMIN'
    ? 'Super Admin'
    : (currentUser?.role === 'MAIN_HR' ? 'HR Manager' : 'HR Intern');

  const avatarText = currentUser?.role === 'ADMIN'
    ? 'AD'
    : (currentUser?.avatar || 'U');

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose} 
      style={{ zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '420px', 
          width: '92vw', 
          borderRadius: 'var(--radius-lg)', 
          overflow: 'hidden',
          boxShadow: 'var(--shadow-floating)',
          animation: 'scaleIn 0.16s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          background: '#154360',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #0e2e42'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#FFDB58',
              color: '#154360',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
            }}>
              <LogOut size={16} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                Confirm Sign Out
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)' }}>
                Flux TA CRM Session
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            style={{ 
              width: '28px', 
              height: '28px', 
              background: 'rgba(255,255,255,0.12)', 
              color: '#ffffff', 
              border: 'none',
              borderRadius: '6px'
            }}
            title="Cancel"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '22px 20px', background: '#ffffff' }}>
          {/* User Account Info Chip */}
          {currentUser && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              background: '#f8fafc',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #e2e8f0',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: currentUser.role === 'ADMIN' ? '#154360' : '#FFDB58',
                color: currentUser.role === 'ADMIN' ? '#FFDB58' : '#154360',
                border: currentUser.role === 'ADMIN' ? '2px solid #FFDB58' : '2px solid #154360',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.9rem',
                flexShrink: 0
              }}>
                {avatarText}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#154360', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                  {roleLabel} {currentUser.email ? `• ${currentUser.email}` : ''}
                </div>
              </div>
            </div>
          )}

          <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
            Are you sure you want to log out of your account? You will need your credentials to sign in again.
          </p>
        </div>

        {/* Modal Footer / Actions */}
        <div style={{
          padding: '14px 20px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ 
              padding: '9px 18px', 
              fontSize: '0.82rem', 
              fontWeight: 700, 
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '9px 20px',
              fontSize: '0.82rem',
              fontWeight: 800,
              borderRadius: '8px',
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.25)',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
          >
            <LogOut size={14} />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
