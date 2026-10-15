import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Key
} from 'lucide-react';

export default function LoginScreen({ onLogin, users = [] }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // { success: boolean, msg: string }
  const [liveUsers, setLiveUsers] = useState(users);
  const [showAccountList, setShowAccountList] = useState(false);

  // Sync latest provisioned employee accounts from central server on mount
  // Crucial for mobile phones & secondary PCs that start with empty localStorage
  const syncServerUsers = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.users) && data.users.length > 0) {
          setLiveUsers(data.users);
          try {
            localStorage.setItem('tacrm_users', JSON.stringify(data.users));
          } catch (e) {}
          setSyncStatus({ success: true, msg: `Synced ${data.users.length} staff account(s) from server!` });
          setTimeout(() => setSyncStatus(null), 3500);
          return;
        }
      }
      setSyncStatus({ success: false, msg: 'Connected to local storage' });
      setTimeout(() => setSyncStatus(null), 3000);
    } catch {
      setSyncStatus({ success: false, msg: 'Offline mode: using cached accounts' });
      setTimeout(() => setSyncStatus(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    syncServerUsers();
  }, []);

  // Update liveUsers when parent prop changes
  useEffect(() => {
    if (Array.isArray(users) && users.length > 0) {
      setLiveUsers(prev => {
        // Merge without losing any dynamically fetched users
        const map = new Map();
        users.forEach(u => map.set(u.id || u.email, u));
        prev.forEach(u => {
          if (!map.has(u.id || u.email)) map.set(u.id || u.email, u);
        });
        return Array.from(map.values());
      });
    }
  }, [users]);

  // Combined accounts list from live server data and defaults
  const activeStaffAccounts = (liveUsers && liveUsers.length > 0 ? liveUsers : users)
    .filter(u => u && u.email && u.password);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const inputEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!inputEmail || !cleanPassword) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    // 1. Explicit check for Master Admin credentials
    if (
      (inputEmail === 'admin@geonixa' || 
       inputEmail === 'admin@geonixa.com' || 
       inputEmail === 'admin' ||
       inputEmail === 'geonixa admin') && 
      cleanPassword === 'geonixa@123'
    ) {
      onLogin({
        id: 'user-admin',
        name: 'Geonixa Admin',
        role: 'ADMIN',
        title: 'Super Administrator',
        email: 'admin@geonixa',
        password: 'geonixa@123',
        avatar: 'AD',
        status: 'online',
      });
      return;
    }

    // 2. Multi-source matching across all provisioned staff (Admin, HR Manager, HR Interns)
    // Matches by:
    // - Full email (e.g. ananya.sharma@talentconnect.io)
    // - Username before '@' (e.g. ananya.sharma)
    // - Full Name (e.g. Ananya Sharma)
    // - Name without spaces (e.g. ananyasharma)
    // - Phone number digits
    const matched = activeStaffAccounts.find(acc => {
      if (!acc) return false;
      const accEmail = (acc.email || '').trim().toLowerCase();
      const accPrefix = accEmail.split('@')[0];
      const accName = (acc.name || '').trim().toLowerCase();
      const accNameNoSpaces = accName.replace(/\s+/g, '');
      const inputNoSpaces = inputEmail.replace(/\s+/g, '');
      const accPassword = (acc.password || '').trim();

      const usernameMatches = 
        accEmail === inputEmail ||
        accPrefix === inputEmail ||
        accName === inputEmail ||
        accNameNoSpaces === inputNoSpaces;

      const passwordMatches = accPassword === cleanPassword;

      return usernameMatches && passwordMatches;
    });

    if (matched) {
      onLogin(matched);
    } else {
      setErrorMessage(
        'Invalid username or password. If you were just added in Admin, tap "Sync Accounts" below to pull latest credentials to this device.'
      );
    }
  };

  const handleSelectAccount = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setErrorMessage('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
      fontFamily: 'Inter, system-ui, sans-serif',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '32px 28px',
        boxShadow: '0 20px 25px -5px rgba(21, 67, 96, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.02)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: '#154360',
            color: '#FFDB58',
            border: '2px solid #FFDB58',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            fontWeight: 800,
            fontSize: '1.25rem',
            fontFamily: 'Space Grotesk, sans-serif',
            boxShadow: '0 4px 6px -1px rgba(21, 67, 96, 0.25)'
          }}>
            TA
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#154360', letterSpacing: '-0.02em', margin: 0 }}>
            TalentConnect CRM
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#71717a', marginTop: '4px' }}>
            Campus Recruitment & Placement System
          </p>
        </div>

        {/* Server Cross-Device Sync Status Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '20px',
          fontSize: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369a1', fontWeight: 600 }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0ea5e9', display: 'inline-block' }}></span>
            <span>{activeStaffAccounts.length} Staff Account(s) Active</span>
          </div>
          <button
            type="button"
            onClick={syncServerUsers}
            disabled={isSyncing}
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.72rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
            title="Fetch newly added employees from central server"
          >
            <RefreshCw size={12} className={isSyncing ? 'spinning' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Accounts'}
          </button>
        </div>

        {syncStatus && (
          <div style={{
            background: syncStatus.success ? '#f0fdf4' : '#fffbeb',
            border: `1px solid ${syncStatus.success ? '#bbf7d0' : '#fde68a'}`,
            color: syncStatus.success ? '#15803d' : '#b45309',
            padding: '7px 12px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 600,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <CheckCircle2 size={13} /> {syncStatus.msg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#154360', marginBottom: '6px' }}>
              Username or Email
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="#71717a" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Username (e.g. admin or employee email)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '36px', fontSize: '0.88rem' }}
                autoCapitalize="none"
                autoCorrect="off"
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#154360', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#71717a" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '36px', fontSize: '0.88rem' }}
                required
              />
            </div>
          </div>

          {errorMessage && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              marginBottom: '16px',
              lineHeight: 1.4,
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMessage}</div>
            </div>
          )}

          <button
            type="submit"
            className="btn-mustard"
            style={{ 
              width: '100%', 
              padding: '12px', 
              justifyContent: 'center', 
              fontSize: '0.9rem', 
              fontWeight: 800, 
              borderRadius: '8px' 
            }}
          >
            Sign In <ArrowRight size={15} color="#154360" />
          </button>
        </form>

        {/* Quick Staff Accounts Dropdown for Instant Mobile Testing */}
        <div style={{ marginTop: '22px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <button
            type="button"
            onClick={() => setShowAccountList(prev => !prev)}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              padding: '4px 0',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Key size={13} color="#154360" /> View Provisioned Staff Logins ({activeStaffAccounts.length})
            </span>
            {showAccountList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showAccountList && (
            <div style={{
              marginTop: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '180px',
              overflowY: 'auto',
              background: '#f8fafc',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}>
              {activeStaffAccounts.map(acc => (
                <div
                  key={acc.id || acc.email}
                  onClick={() => handleSelectAccount(acc)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    transition: 'all 0.15s ease',
                  }}
                  title="Click to fill credentials"
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#154360' }}>
                      {acc.name} <span style={{ color: '#64748b', fontWeight: 500 }}>({acc.role === 'ADMIN' ? 'Admin' : acc.role === 'MAIN_HR' ? 'HR Manager' : 'HR Intern'})</span>
                    </div>
                    <div style={{ color: '#71717a', fontSize: '0.68rem', fontFamily: 'monospace' }}>
                      {acc.email}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: '#0284c7',
                    background: '#e0f2fe',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}>
                    Fill
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Device Tips Footer */}
        <div style={{
          marginTop: '16px',
          textAlign: 'center',
          fontSize: '0.7rem',
          color: '#94a3b8',
          lineHeight: 1.4,
        }}>
          📱 <strong>Multi-Device Access:</strong> Open <code>http://192.168.0.3:5174/</code> on mobile phone while connected to same Wi-Fi.
        </div>
      </div>
    </div>
  );
}
