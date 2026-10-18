import React from 'react';
import { 
  Search, 
  MessageSquare, 
  LogOut,
  Smartphone,
  Download
} from 'lucide-react';

export default function TopNavbar({
  currentUser,
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenSearch,
  onOpenChat,
  onOpenLogout,
  onInstallApp,
  isAppInstalled = false,
  unreadChatCount = 0
}) {
  const roleLabel = currentUser?.role === 'ADMIN'
    ? 'Super Admin'
    : currentUser?.role === 'MAIN_HR'
      ? 'HR Manager'
      : 'HR Intern';

  return (
    <header className="app-top-navbar">
      {/* Left: Brand Logo */}
      <div className="navbar-left-group">
        <div className="navbar-brand-link">
          <img 
            src="/flux-logo.png" 
            alt="Flux" 
            className="navbar-logo-img"
          />
        </div>
      </div>

      {/* Center: Search Workspace with ⌘K Badge */}
      <div className="navbar-center-group">
        <div 
          className="navbar-search-bar"
          onClick={onOpenSearch}
          role="button"
          tabIndex={0}
          title="Search workspace (Ctrl+K or ⌘K)"
        >
          <Search size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
          <span className="navbar-search-placeholder">Search workspace...</span>
          <kbd className="navbar-search-kbd">⌘K</kbd>
        </div>
      </div>

      {/* Right: Install App, Internal Chat & User Logout */}
      <div className="navbar-right-group">
        {!isAppInstalled && (
          <button 
            type="button" 
            onClick={onInstallApp}
            className="navbar-install-btn"
            title="Install Flux TA CRM on your Mobile or Desktop"
            id="navbar-install-btn"
          >
            <Smartphone size={14} className="navbar-install-icon" />
            <span className="navbar-install-text">Install App</span>
          </button>
        )}

        <button 
          type="button" 
          onClick={() => onOpenChat()}
          className="navbar-chat-btn"
          title="Open Internal Team Chat"
          id="navbar-chat-btn"
          style={{ position: 'relative' }}
        >
          <MessageSquare size={14} />
          <span className="navbar-chat-label">Internal Chat</span>
          {unreadChatCount > 0 && (
            <span className="navbar-chat-badge">
              {unreadChatCount > 99 ? '99+' : unreadChatCount}
            </span>
          )}
        </button>

        <div 
          className="navbar-user-btn"
          onClick={onOpenLogout}
          title={`${currentUser?.name || 'User'} (${roleLabel}) - Click to Sign Out`}
        >
          <div className="navbar-avatar">
            {currentUser?.role === 'ADMIN' ? 'AD' : (currentUser?.name?.slice(0, 2).toUpperCase() || 'U')}
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e2e8f0', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentUser?.name === 'Geonixa Admin' ? 'Admin' : currentUser?.name}
          </span>
          <LogOut size={12} style={{ color: '#94a3b8', marginLeft: '2px' }} />
        </div>
      </div>
    </header>
  );
}
