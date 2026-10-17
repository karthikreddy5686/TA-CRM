import React from 'react';
import { 
  PanelLeft, 
  Search, 
  MessageSquare, 
  Phone, 
  LogOut,
  ChevronRight,
  Menu
} from 'lucide-react';

const TAB_TITLES = {
  dashboard: 'Admin Dashboard',
  overview: 'Overview',
  drives: 'Campus Drives',
  liveBoard: 'Students',
  tpos: 'College TPOs',
  pipeline: 'Lead Pipeline',
  followups: 'Follow-Ups',
  calls: 'Call Logs'
};

export default function TopNavbar({
  currentUser,
  activeTab,
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenSearch,
  onOpenChat,
  onOpenQuickCall,
  onOpenLogout
}) {
  const currentTabName = currentUser?.role === 'ADMIN' && activeTab === 'dashboard'
    ? 'Admin Dashboard'
    : (TAB_TITLES[activeTab] || 'Workspace');

  const roleLabel = currentUser?.role === 'ADMIN'
    ? 'SUPER ADMIN'
    : currentUser?.role === 'MAIN_HR'
      ? 'HR MANAGER'
      : 'HR INTERN';

  return (
    <header className="app-top-navbar">
      {/* Left: Brand Logo, Role Badge, Separator, Sidebar Toggle, Breadcrumbs */}
      <div className="navbar-left-group">
        <div className="navbar-brand-link">
          <img 
            src="/flux-logo.png" 
            alt="Flux" 
            className="navbar-logo-img"
          />
          <span className="navbar-role-pill">
            {roleLabel}
          </span>
        </div>

        <div className="navbar-v-divider" />

        <button 
          type="button" 
          onClick={onToggleSidebar}
          className="navbar-panel-btn"
          title="Toggle Navigation Sidebar"
        >
          <PanelLeft size={16} />
        </button>

        <div className="navbar-breadcrumb">
          <span className="navbar-breadcrumb-root">Workspace</span>
          <ChevronRight size={12} className="navbar-breadcrumb-sep" />
          <span className="navbar-breadcrumb-current">{currentTabName}</span>
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

      {/* Right: Internal Chat, Quick Call, User Logout */}
      <div className="navbar-right-group">
        <button 
          type="button" 
          onClick={onOpenChat}
          className="navbar-chat-btn"
          title="Open Internal Team Chat"
        >
          <MessageSquare size={14} />
          <span>Internal Chat</span>
        </button>

        <button 
          type="button" 
          onClick={onOpenQuickCall}
          className="navbar-quick-call-btn"
          title="Quick Outbound Call"
        >
          <Phone size={14} />
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
