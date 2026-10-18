import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Users, 
  User, 
  Clock, 
  Trash2, 
  Zap, 
  PhoneCall, 
  Building2, 
  ClipboardList, 
  CheckCheck, 
  ArrowLeft, 
  Circle,
  Search,
  Sparkles
} from 'lucide-react';

export default function InternalChatModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  users = [],
  initialTarget = null,
  onClearInitialTarget = null
}) {
  // Navigation: 'team' (Team Workspace) or 'dm' (Direct Message with a selected employee)
  const [activeChannel, setActiveChannel] = useState('team'); // 'team' | 'dm'
  const [selectedColleague, setSelectedColleague] = useState(null); // User object for 1:1 DM
  const [colleagueSearch, setColleagueSearch] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // All messages store
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('flux_crm_chat_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Filter out current user from colleagues list
  const colleagues = users.filter(u => u && u.id !== currentUser?.id);
  const filteredColleagues = colleagues.filter(c => {
    if (!colleagueSearch) return true;
    const q = colleagueSearch.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.role && c.role.toLowerCase().includes(q))
    );
  });

  // Calculate direct message channel ID (deterministic sorted IDs)
  const getDmChannelId = (userAId, userBId) => {
    if (!userAId || !userBId) return null;
    const sorted = [String(userAId), String(userBId)].sort();
    return `dm_${sorted[0]}_${sorted[1]}`;
  };

  const currentChannelId = activeChannel === 'dm' && selectedColleague 
    ? getDmChannelId(currentUser?.id, selectedColleague?.id)
    : 'team';

  // Filter messages for current active view
  const currentMessages = messages.filter(m => {
    if (activeChannel === 'team') {
      return !m.channel || m.channel === 'team';
    }
    return m.channel === currentChannelId;
  });

  // Route to initial target channel/colleague if passed from alert toast
  useEffect(() => {
    if (isOpen && initialTarget) {
      if (initialTarget.channel === 'dm' && initialTarget.senderId) {
        const targetUser = users.find(u => u && u.id === initialTarget.senderId);
        if (targetUser) {
          setSelectedColleague(targetUser);
          setActiveChannel('dm');
          try {
            localStorage.setItem(`tacrm_dm_read_${currentUser?.id}_${targetUser.id}`, new Date().toISOString());
          } catch {}
        }
      } else if (initialTarget.channel === 'team') {
        setActiveChannel('team');
        setSelectedColleague(null);
      }
      onClearInitialTarget?.();
    }
  }, [isOpen, initialTarget, users, currentUser]);

  // Keep read cursor updated in real-time when viewing an active channel
  useEffect(() => {
    if (!isOpen || !currentUser?.id) return;
    const nowIso = new Date().toISOString();
    if (activeChannel === 'team') {
      try {
        localStorage.setItem(`tacrm_chat_last_read_${currentUser.id}`, nowIso);
      } catch {}
    } else if (activeChannel === 'dm' && selectedColleague?.id) {
      try {
        localStorage.setItem(`tacrm_dm_read_${currentUser.id}_${selectedColleague.id}`, nowIso);
        localStorage.setItem(`tacrm_chat_last_read_${currentUser.id}`, nowIso);
      } catch {}
    }
  }, [isOpen, activeChannel, selectedColleague, messages.length, currentUser]);

  // Fetch messages from central server database
  const fetchServerMessages = async () => {
    try {
      const res = await fetch('/api/chat', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setMessages(prev => {
            // Merge unique by ID
            const mSet = new Map();
            prev.forEach(m => mSet.set(m.id, m));
            data.messages.forEach(m => mSet.set(m.id, m));
            const merged = Array.from(mSet.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            try { localStorage.setItem('flux_crm_chat_messages', JSON.stringify(merged)); } catch {}
            return merged;
          });
        }
      }
    } catch (e) {
      // Local development or offline
    }
  };

  // Initial load and live polling
  useEffect(() => {
    fetchServerMessages();

    if (!isOpen) return;

    // Fast 1000ms polling while chat drawer is open for instant real-time conversations
    const interval = setInterval(fetchServerMessages, 1000);

    // Cross-tab instant synchronization via BroadcastChannel
    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('flux_crm_chat_bus');
        bc.onmessage = (event) => {
          if (event.data?.type === 'NEW_MESSAGE' && event.data.message) {
            setMessages(prev => {
              if (prev.some(m => m.id === event.data.message.id)) return prev;
              const next = [...prev, event.data.message];
              try { localStorage.setItem('flux_crm_chat_messages', JSON.stringify(next)); } catch {}
              return next;
            });
          } else if (event.data?.type === 'DELETE_MESSAGE' && event.data.messageId) {
            setMessages(prev => prev.filter(m => m.id !== event.data.messageId));
          }
        };
      }
    } catch {}

    // Focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => {
      clearInterval(interval);
      if (bc) bc.close();
    };
  }, [isOpen]);

  // Scroll to bottom when messages update or channel changes
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, currentChannelId, isOpen]);

  if (!isOpen) return null;

  // Send a new message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const cleanText = inputMessage.trim();
    if (!cleanText || isSending) return;

    setIsSending(true);

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      channel: currentChannelId,
      recipientId: activeChannel === 'dm' ? selectedColleague?.id : null,
      recipientName: activeChannel === 'dm' ? selectedColleague?.name : null,
      senderId: currentUser?.id || 'emp-user',
      senderName: currentUser?.name || 'Recruiter',
      senderRole: currentUser?.role || 'MAIN_HR',
      avatar: currentUser?.role === 'ADMIN' ? 'AD' : (currentUser?.name?.slice(0, 2).toUpperCase() || 'HR'),
      text: cleanText,
      timestamp: now.toISOString(),
      formattedTime: timeFormatted
    };

    // Optimistic local update
    setMessages(prev => {
      const next = [...prev, newMsg];
      try { localStorage.setItem('flux_crm_chat_messages', JSON.stringify(next)); } catch {}
      return next;
    });

    setInputMessage('');
    setIsSending(false);

    // Keep own read cursor updated
    if (activeChannel === 'team') {
      try { localStorage.setItem(`tacrm_chat_last_read_${currentUser?.id}`, now.toISOString()); } catch {}
    } else if (activeChannel === 'dm' && selectedColleague?.id) {
      try { localStorage.setItem(`tacrm_dm_read_${currentUser?.id}_${selectedColleague.id}`, now.toISOString()); } catch {}
    }

    // Broadcast to other tabs immediately
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('flux_crm_chat_bus');
        bc.postMessage({ type: 'NEW_MESSAGE', message: newMsg });
        setTimeout(() => { try { bc.close(); } catch {} }, 500);
      }
    } catch {}

    // Dispatch to central server storage
    try {
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMsg })
      })
      .then(res => res.json())
      .then(data => {
        if (data?.message) {
          fetchServerMessages();
        }
      })
      .catch(() => {});
    } catch {}
  };

  // Delete a message (Allowed for sender or Admin)
  const handleDeleteMessage = async (msgId) => {
    setMessages(prev => {
      const next = prev.filter(m => m.id !== msgId);
      try { localStorage.setItem('flux_crm_chat_messages', JSON.stringify(next)); } catch {}
      return next;
    });

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('flux_crm_chat_bus');
        bc.postMessage({ type: 'DELETE_MESSAGE', messageId: msgId });
        bc.close();
      }
    } catch {}

    try {
      fetch('/api/chat/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msgId })
      }).catch(() => {});
    } catch {}
  };

  // Helper to get role display badge
  const getRoleBadge = (role) => {
    if (role === 'ADMIN') {
      return { text: 'ADMIN', bg: 'rgba(250, 204, 21, 0.15)', color: '#facc15', border: 'rgba(250, 204, 21, 0.3)' };
    }
    if (role === 'MAIN_HR') {
      return { text: 'HR MANAGER', bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
    }
    return { text: 'INTERN', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
  };

  // Count unread direct messages per colleague
  const getColleagueUnreadCount = (colleagueId) => {
    const dmId = getDmChannelId(currentUser?.id, colleagueId);
    const dmLastRead = localStorage.getItem(`tacrm_dm_read_${currentUser?.id}_${colleagueId}`) || '1970-01-01T00:00:00.000Z';
    return messages.filter(m => m.channel === dmId && m.senderId === colleagueId && m.timestamp > dmLastRead).length;
  };

  // Get last message in a direct message channel
  const getColleagueLastMessage = (colleagueId) => {
    const dmId = getDmChannelId(currentUser?.id, colleagueId);
    const dmMessages = messages.filter(m => m.channel === dmId);
    if (!dmMessages.length) return null;
    return dmMessages[dmMessages.length - 1];
  };

  // Total unread DMs across all colleagues
  const totalUnreadDms = colleagues.reduce((sum, c) => sum + getColleagueUnreadCount(c.id), 0);

  // Sort colleagues: unread messages first, then latest message time, then name
  const sortedColleagues = [...filteredColleagues].sort((a, b) => {
    const unreadA = getColleagueUnreadCount(a.id);
    const unreadB = getColleagueUnreadCount(b.id);
    if (unreadA !== unreadB) return unreadB - unreadA;

    const lastA = getColleagueLastMessage(a.id);
    const lastB = getColleagueLastMessage(b.id);
    const timeA = lastA ? new Date(lastA.timestamp).getTime() : 0;
    const timeB = lastB ? new Date(lastB.timestamp).getTime() : 0;
    if (timeA !== timeB) return timeB - timeA;

    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 19, 32, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'stretch'
      }}
    >
      <div 
        className="internal-chat-drawer"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          background: '#0d1f2d',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
          animation: 'slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
      >
        {/* Top Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: '#154360',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            {activeChannel === 'dm' && selectedColleague ? (
              <button
                type="button"
                onClick={() => {
                  setActiveChannel('team');
                  setSelectedColleague(null);
                }}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title="Back to Team Hub"
              >
                <ArrowLeft size={16} />
              </button>
            ) : (
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <MessageSquare size={17} />
              </div>
            )}

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeChannel === 'dm' && selectedColleague ? selectedColleague.name : 'Internal Team Chat'}
                </h3>
                <span style={{
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  flexShrink: 0
                }}>
                  ● LIVE
                </span>
              </div>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Channel Navigation Switcher: [ 📢 Team Workspace ] vs [ 💬 Direct Messages ] */}
        <div style={{
          padding: '8px 14px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          gap: '8px',
          flexShrink: 0
        }}>
          <button
            type="button"
            onClick={() => {
              setActiveChannel('team');
              setSelectedColleague(null);
            }}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '7px',
              border: activeChannel === 'team' ? '1px solid rgba(250, 204, 21, 0.4)' : '1px solid transparent',
              background: activeChannel === 'team' ? 'rgba(250, 204, 21, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: activeChannel === 'team' ? '#facc15' : '#94a3b8',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={13} /> Team Hub
          </button>

          <button
            type="button"
            onClick={() => setActiveChannel('dm')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '7px',
              border: activeChannel === 'dm' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
              background: activeChannel === 'dm' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: activeChannel === 'dm' ? '#38bdf8' : '#94a3b8',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <User size={13} /> Direct Messages ({colleagues.length})
            {totalUnreadDms > 0 && (
              <span style={{
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: '10px',
                lineHeight: 1.2
              }}>
                {totalUnreadDms} new
              </span>
            )}
          </button>
        </div>

        {/* If in DM Tab and no colleague selected: Show Employee Directory to pick a person */}
        {activeChannel === 'dm' && !selectedColleague ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Search Colleagues */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '9px' }} />
                <input
                  type="text"
                  placeholder="Search employee by name, email or role..."
                  value={colleagueSearch}
                  onChange={(e) => setColleagueSearch(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '7px',
                    padding: '8px 10px 8px 30px',
                    color: '#ffffff',
                    fontSize: '0.76rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Colleagues List */}
            <div style={{ flex: 1, padding: '12px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Select an employee to start a private chat:
              </div>

              {sortedColleagues.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b', fontSize: '0.78rem' }}>
                  No other employees found. Add staff members in the Admin Dashboard.
                </div>
              ) : (
                sortedColleagues.map(colleague => {
                  const roleBadge = getRoleBadge(colleague.role);
                  const unreadCount = getColleagueUnreadCount(colleague.id);
                  const lastMsg = getColleagueLastMessage(colleague.id);

                  return (
                    <div
                      key={colleague.id}
                      onClick={() => {
                        setSelectedColleague(colleague);
                        try {
                          localStorage.setItem(`tacrm_dm_read_${currentUser?.id}_${colleague.id}`, new Date().toISOString());
                        } catch {}
                      }}
                      role="button"
                      tabIndex={0}
                      style={{
                        background: unreadCount > 0 ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                        border: unreadCount > 0 ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: '#154360',
                          color: '#FFDB58',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1.5px solid #FFDB58',
                          flexShrink: 0,
                          position: 'relative'
                        }}>
                          {colleague.role === 'ADMIN' ? 'AD' : (colleague.name?.slice(0, 2).toUpperCase() || 'U')}
                          <span style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#10b981',
                            border: '1.5px solid #0d1f2d'
                          }} />
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {colleague.name}
                            </span>
                            <span style={{
                              fontSize: '0.58rem',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: roleBadge.bg,
                              color: roleBadge.color,
                              border: `1px solid ${roleBadge.border}`,
                              flexShrink: 0
                            }}>
                              {roleBadge.text}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: unreadCount > 0 ? '#38bdf8' : '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ fontWeight: unreadCount > 0 ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '210px' }}>
                              {lastMsg ? `${lastMsg.senderId === currentUser?.id ? 'You: ' : ''}${lastMsg.text}` : colleague.email}
                            </span>
                            {lastMsg && (
                              <span style={{ fontSize: '0.62rem', opacity: 0.7, flexShrink: 0 }}>• {lastMsg.formattedTime}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '8px' }}>
                        {unreadCount > 0 && (
                          <span style={{
                            background: '#ef4444',
                            color: '#ffffff',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '10px',
                            boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)'
                          }}>
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Main Message Conversation Area (Team Hub or Specific DM Thread) */
          <>
            {/* Online Staff Pill Bar for Team Hub */}
            {activeChannel === 'team' && (
              <div style={{
                padding: '6px 16px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.68rem',
                color: '#94a3b8',
                overflowX: 'auto',
                flexShrink: 0
              }}>
                <span style={{ fontWeight: 700, color: '#cbd5e1', whiteSpace: 'nowrap' }}>Online Staff:</span>
                {users.map(u => (
                  <span 
                    key={u.id}
                    onClick={() => {
                      if (u.id !== currentUser?.id) {
                        setSelectedColleague(u);
                        setActiveChannel('dm');
                      }
                    }}
                    title={`Click to message ${u.name} directly`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 7px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      whiteSpace: 'nowrap',
                      cursor: u.id !== currentUser?.id ? 'pointer' : 'default',
                      color: u.id === currentUser?.id ? '#facc15' : '#cbd5e1'
                    }}
                  >
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                    {u.name} {u.id === currentUser?.id ? '(You)' : ''}
                  </span>
                ))}
              </div>
            )}

            {/* Message Thread */}
            <div style={{
              flex: 1,
              padding: '16px 18px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {currentMessages.length === 0 ? (
                <div style={{
                  margin: 'auto',
                  textAlign: 'center',
                  maxWidth: '320px',
                  padding: '24px 16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px'
                }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'rgba(250, 204, 21, 0.12)',
                    color: '#facc15',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px'
                  }}>
                    <MessageSquare size={20} />
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f1f5f9' }}>
                    {activeChannel === 'team' ? 'Start Company Team Chat' : `Chat with ${selectedColleague?.name}`}
                  </div>
                </div>
              ) : (
                currentMessages.map(msg => {
                  const isMe = msg.senderId === currentUser?.id;
                  const roleBadge = getRoleBadge(msg.senderRole);

                  return (
                    <div 
                      key={msg.id}
                      style={{
                        display: 'flex',
                        gap: '8px',
                        flexDirection: isMe ? 'row-reverse' : 'row',
                        alignItems: 'flex-start'
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: isMe ? '#154360' : '#1e293b',
                        color: isMe ? '#FFDB58' : '#e2e8f0',
                        border: isMe ? '1.5px solid #FFDB58' : '1px solid rgba(255, 255, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        flexShrink: 0
                      }}>
                        {msg.avatar || 'U'}
                      </div>

                      {/* Bubble Container */}
                      <div style={{
                        maxWidth: '80%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start'
                      }}>
                        {/* Sender info & time */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '3px',
                          fontSize: '0.68rem',
                          color: '#94a3b8'
                        }}>
                          <span style={{ fontWeight: 700, color: isMe ? '#FFDB58' : '#ffffff' }}>
                            {isMe ? 'You' : msg.senderName}
                          </span>
                          <span style={{
                            fontSize: '0.55rem',
                            fontWeight: 800,
                            padding: '1px 4px',
                            borderRadius: '3px',
                            background: roleBadge.bg,
                            color: roleBadge.color,
                            border: `1px solid ${roleBadge.border}`
                          }}>
                            {roleBadge.text}
                          </span>
                          <span style={{ opacity: 0.5 }}>•</span>
                          <span>{msg.formattedTime || 'Just now'}</span>
                        </div>

                        {/* Text Bubble */}
                        <div style={{
                          position: 'relative',
                          padding: '9px 13px',
                          borderRadius: isMe ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                          background: isMe ? '#154360' : 'rgba(255, 255, 255, 0.08)',
                          border: isMe ? '1px solid #1b557a' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#ffffff',
                          fontSize: '0.82rem',
                          lineHeight: 1.45,
                          wordBreak: 'break-word',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}>
                          {msg.text}

                          {/* Delete option for sender or Admin */}
                          {(isMe || currentUser?.role === 'ADMIN') && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg.id)}
                              title="Delete message"
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: isMe ? 'auto' : '-22px',
                                left: isMe ? '-22px' : 'auto',
                                background: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                opacity: 0.5,
                                cursor: 'pointer',
                                padding: '2px'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px', opacity: 0.6 }}>
                          <CheckCheck size={11} color="#10b981" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Bar */}
            <form 
              onSubmit={handleSendMessage}
              style={{
                padding: '12px 16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                background: '#0a1622',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                flexShrink: 0
              }}
            >
              <input 
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={activeChannel === 'dm' ? `Message ${selectedColleague?.name}...` : "Message company team..."}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />

              <button 
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                style={{
                  height: '36px',
                  padding: '0 14px',
                  background: inputMessage.trim() ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                  color: inputMessage.trim() ? '#ffffff' : '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: inputMessage.trim() && !isSending ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
              >
                <Send size={13} /> Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
