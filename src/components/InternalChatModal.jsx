import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Users, Shield, User, Clock, CheckCheck } from 'lucide-react';

const INITIAL_CHAT_MESSAGES = [
  {
    id: 'msg-1',
    senderId: 'user-admin',
    senderName: 'Geonixa Admin',
    senderRole: 'ADMIN',
    text: 'Welcome to Flux TA CRM team workspace. All drive updates and candidate notes can be coordinated here.',
    timestamp: 'Today at 09:30 AM',
    avatar: 'AD'
  },
  {
    id: 'msg-2',
    senderId: 'hr-karthik',
    senderName: 'karthik',
    senderRole: 'MAIN_HR',
    text: 'Confirmed 4 new campus recruitment slots for upcoming Autumn drives. Tech panels have been alerted.',
    timestamp: 'Today at 10:15 AM',
    avatar: 'HR'
  },
  {
    id: 'msg-3',
    senderId: 'user-admin',
    senderName: 'Geonixa Admin',
    senderRole: 'ADMIN',
    text: 'Excellent. Please verify TPO contact records and complete follow-up calls scheduled for today.',
    timestamp: 'Today at 11:00 AM',
    avatar: 'AD'
  }
];

export default function InternalChatModal({ isOpen, onClose, currentUser, users = [] }) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('flux_internal_chat_messages');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_CHAT_MESSAGES;
  });

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('flux_internal_chat_messages', JSON.stringify(messages));
    } catch {
      // ignore
    }
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputMessage.trim()) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: currentUser?.id || 'user-current',
      senderName: currentUser?.name || 'You',
      senderRole: currentUser?.role || 'MAIN_HR',
      text: inputMessage.trim(),
      timestamp: `Today at ${timeStr}`,
      avatar: currentUser?.role === 'ADMIN' ? 'AD' : (currentUser?.name?.slice(0, 2).toUpperCase() || 'U')
    };

    setMessages(prev => [...prev, newMsg]);
    setInputMessage('');
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 19, 32, 0.65)',
        backdropFilter: 'blur(3px)',
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
          maxWidth: '440px',
          height: '100%',
          background: '#0B1320',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 25px rgba(0, 0, 0, 0.4)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#0E1726',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MessageSquare size={17} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#ffffff' }}>
                  Internal Team Chat
                </h3>
                <span style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  ACTIVE
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>
                HR Managers & Admin Collaboration Channel
              </p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            style={{
              width: '30px',
              height: '30px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Online Staff Pill Bar */}
        <div style={{
          padding: '8px 20px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.72rem',
          color: '#94a3b8',
          overflowX: 'auto'
        }}>
          <span style={{ fontWeight: 600, color: '#cbd5e1' }}>Team Members:</span>
          {users.map(u => (
            <span 
              key={u.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              {u.name}
            </span>
          ))}
        </div>

        {/* Message Thread */}
        <div style={{
          flex: 1,
          padding: '16px 20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {messages.map(msg => {
            const isMe = msg.senderId === currentUser?.id;
            return (
              <div 
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: '10px',
                  flexDirection: isMe ? 'row-reverse' : 'row',
                  alignItems: 'flex-start'
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isMe ? '#154360' : '#1e293b',
                  color: isMe ? '#FFDB58' : '#e2e8f0',
                  border: isMe ? '1.5px solid #FFDB58' : '1px solid rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  flexShrink: 0
                }}>
                  {msg.avatar || 'U'}
                </div>

                {/* Message Bubble */}
                <div style={{
                  maxWidth: '78%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '3px',
                    fontSize: '0.7rem',
                    color: '#94a3b8'
                  }}>
                    <span style={{ fontWeight: 700, color: isMe ? '#FFDB58' : '#ffffff' }}>
                      {isMe ? 'You' : msg.senderName}
                    </span>
                    <span style={{ opacity: 0.6 }}>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div style={{
                    padding: '10px 14px',
                    borderRadius: isMe ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                    background: isMe ? '#154360' : 'rgba(255, 255, 255, 0.07)',
                    border: isMe ? '1px solid #1b557a' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    lineHeight: 1.45,
                    wordBreak: 'break-word',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                  }}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={handleSendMessage}
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: '#0E1726',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}
        >
          <input 
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type an internal note or update..."
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '8px',
              padding: '9px 14px',
              color: '#ffffff',
              fontSize: '0.84rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <button 
            type="submit"
            disabled={!inputMessage.trim()}
            style={{
              height: '38px',
              padding: '0 16px',
              background: inputMessage.trim() ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
              color: inputMessage.trim() ? '#ffffff' : '#64748b',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: inputMessage.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Send size={14} /> Send
          </button>
        </form>
      </div>
    </div>
  );
}
