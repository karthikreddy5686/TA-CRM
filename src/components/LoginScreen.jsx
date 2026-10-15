import React, { useState } from 'react';
import {
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';

export default function LoginScreen({ onLogin, users = [] }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const inputEmail = email.trim();
    const cleanPassword = password.trim();
    const normalizedInput = inputEmail.toLowerCase();

    if (!inputEmail || !cleanPassword) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    // 1. Direct Instant Check for Master Super Admin
    // Guaranteed to work 100% of the time across all devices, static hosting (Vercel/GitHub Pages), and offline
    if (
      (normalizedInput === 'admin@geonixa' || 
       normalizedInput === 'admin@geonixa.com' || 
       normalizedInput === 'admin' || 
       normalizedInput === 'geonixa admin') && 
      (cleanPassword === 'geonixa@123' || cleanPassword === 'admin')
    ) {
      const adminUser = {
        id: 'user-admin',
        name: 'Geonixa Admin',
        role: 'ADMIN',
        title: 'Super Administrator',
        email: 'admin@geonixa',
        password: 'geonixa@123',
        avatar: 'AD',
        status: 'online',
      };
      try {
        localStorage.setItem('tacrm_auth_user', JSON.stringify(adminUser));
      } catch (err) {}
      onLogin(adminUser);
      setIsLoading(false);
      return;
    }

    // 2. Try Central Server Authentication Endpoint (when running connected backend)
    let serverAuthenticated = false;
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: inputEmail, password: cleanPassword })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success && data.user) {
          try {
            localStorage.setItem('tacrm_auth_user', JSON.stringify(data.user));
          } catch (err) {}
          onLogin(data.user);
          serverAuthenticated = true;
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Backend unavailable or static hosting (proceed to client accounts)
    }

    if (serverAuthenticated) {
      setIsLoading(false);
      return;
    }

    // 3. Robust Dynamic Credential Fallback (Fetches latest server users + merges with local accounts)
    let allAccounts = Array.isArray(users) && users.length > 0 ? [...users] : [];
    
    // Attempt dynamic fetch from /api/users to catch accounts created on mobile seconds ago
    try {
      const uRes = await fetch('/api/users');
      if (uRes.ok) {
        const uData = await uRes.json();
        if (Array.isArray(uData.users)) {
          uData.users.forEach(pu => {
            if (pu && !allAccounts.some(u => u.id === pu.id || (u.email && pu.email && u.email.toLowerCase() === pu.email.toLowerCase()))) {
              allAccounts.push(pu);
            }
          });
        }
      }
    } catch {}

    // Merge with any cached accounts in local storage
    try {
      const saved = localStorage.getItem('tacrm_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach(pu => {
            if (pu && !allAccounts.some(u => u.id === pu.id || (u.email && pu.email && u.email.toLowerCase() === pu.email.toLowerCase()))) {
              allAccounts.push(pu);
            }
          });
        }
      }
    } catch (err) {}

    // Match provisioned staff by email, username prefix, full name, name without spaces, or ID
    const inputPrefix = normalizedInput.includes('@') ? normalizedInput.split('@')[0] : normalizedInput;
    const matched = allAccounts.find(acc => {
      if (!acc) return false;
      const accEmail = (acc.email || '').trim().toLowerCase();
      const accPrefix = accEmail.includes('@') ? accEmail.split('@')[0] : accEmail;
      const accUsername = (acc.username || '').trim().toLowerCase();
      const accName = (acc.name || '').trim().toLowerCase();
      const accNameNoSpaces = accName.replace(/\s+/g, '');
      const inputNoSpaces = normalizedInput.replace(/\s+/g, '');
      const accPassword = (acc.password || '').trim();

      const usernameMatches = 
        accEmail === normalizedInput ||
        accPrefix === normalizedInput ||
        accEmail === inputPrefix ||
        accPrefix === inputPrefix ||
        (accUsername && (accUsername === normalizedInput || accUsername === inputPrefix)) ||
        accName === normalizedInput ||
        accNameNoSpaces === inputNoSpaces ||
        (acc.id && acc.id.toLowerCase() === normalizedInput);

      const passwordMatches = 
        accPassword === cleanPassword ||
        accPassword.toLowerCase() === cleanPassword.toLowerCase() ||
        accPassword.replace(/\s+/g, '') === cleanPassword.replace(/\s+/g, '');

      return usernameMatches && passwordMatches;
    });

    if (matched) {
      try {
        localStorage.setItem('tacrm_auth_user', JSON.stringify(matched));
      } catch (err) {}
      onLogin(matched);
    } else {
      setErrorMessage('Invalid username or password. Please verify your credentials.');
    }

    setIsLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '36px 30px',
        boxShadow: '0 20px 25px -5px rgba(21, 67, 96, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.02)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            background: '#154360',
            color: '#FFDB58',
            border: '2px solid #FFDB58',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            fontWeight: 800,
            fontSize: '1.3rem',
            fontFamily: 'Space Grotesk, sans-serif',
            boxShadow: '0 4px 6px -1px rgba(21, 67, 96, 0.25)'
          }}>
            TA
          </div>
          <h1 style={{ 
            fontSize: '1.45rem', 
            fontWeight: 800, 
            color: '#154360', 
            letterSpacing: '-0.02em', 
            margin: 0 
          }}>
            TalentConnect CRM
          </h1>
          <p style={{ 
            fontSize: '0.85rem', 
            color: '#64748b', 
            marginTop: '6px',
            fontWeight: 500
          }}>
            Campus Recruitment & Placement System
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.82rem', 
              fontWeight: 700, 
              color: '#154360', 
              marginBottom: '6px' 
            }}>
              Username or Email
            </label>
            <div style={{ position: 'relative' }}>
              <User 
                size={17} 
                color="#94a3b8" 
                style={{ position: 'absolute', left: '12px', top: '12px', pointerEvents: 'none' }} 
              />
              <input
                type="text"
                className="form-input"
                placeholder="Username or Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ 
                  paddingLeft: '38px', 
                  fontSize: '0.9rem',
                  height: '42px',
                  borderRadius: '8px'
                }}
                autoCapitalize="none"
                autoCorrect="off"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.82rem', 
              fontWeight: 700, 
              color: '#154360', 
              marginBottom: '6px' 
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock 
                size={17} 
                color="#94a3b8" 
                style={{ position: 'absolute', left: '12px', top: '12px', pointerEvents: 'none' }} 
              />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ 
                  paddingLeft: '38px', 
                  paddingRight: '38px',
                  fontSize: '0.9rem',
                  height: '42px',
                  borderRadius: '8px'
                }}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px',
              lineHeight: 1.4,
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <div>{errorMessage}</div>
            </div>
          )}

          <button
            type="submit"
            className="btn-mustard"
            disabled={isLoading}
            style={{ 
              width: '100%', 
              padding: '12px', 
              justifyContent: 'center', 
              fontSize: '0.92rem', 
              fontWeight: 800, 
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.85 : 1
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="spinning" /> Verifying...
              </>
            ) : (
              <>
                Sign In <ArrowRight size={16} color="#154360" />
              </>
            )}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '0.74rem',
          color: '#94a3b8',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '14px'
        }}>
          TalentConnect Recruitment & Placement System
        </div>
      </div>
    </div>
  );
}
