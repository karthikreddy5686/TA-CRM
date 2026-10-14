import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

const PRESET_ACCOUNTS = [
  {
    roleLabel: 'HR Manager',
    email: 'hr@company.com',
    password: 'admin',
    name: 'HR Manager',
    role: 'MAIN_HR',
    title: 'Head of Talent Acquisition',
    avatar: 'HR',
  },
  {
    roleLabel: 'HR Intern 1',
    email: 'aarav@company.com',
    password: 'intern',
    name: 'Aarav Sharma',
    role: 'HR_INTERN',
    title: 'Recruitment Intern - North',
    avatar: 'AS',
  },
  {
    roleLabel: 'HR Intern 2',
    email: 'rhea@company.com',
    password: 'intern',
    name: 'Rhea Sen',
    role: 'HR_INTERN',
    title: 'Recruitment Intern - South',
    avatar: 'RS',
  },
];

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const matched = PRESET_ACCOUNTS.find(
      acc => acc.email.toLowerCase() === email.trim().toLowerCase() && acc.password === password
    );

    if (matched) {
      onLogin(matched);
    } else {
      setErrorMessage('Invalid email or password. Please use one of the specific credentials below.');
    }
  };

  const handleSelectPreset = (acc) => {
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
      padding: '24px',
      fontFamily: 'Inter, system-ui, sans-serif',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '460px',
        width: '100%',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '36px 32px',
        boxShadow: '0 20px 25px -5px rgba(21, 67, 96, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.02)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#154360', letterSpacing: '-0.02em', margin: 0 }}>
            TalentConnect HR
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#71717a', marginTop: '4px' }}>
            Campus Drive Management & TA CRM
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#154360', marginBottom: '6px' }}>
              Work Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#71717a" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input 
                type="email" 
                className="form-input" 
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '36px' }}
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
                style={{ paddingLeft: '36px' }}
                required
              />
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
              marginBottom: '16px'
            }}>
              <AlertCircle size={15} />
              {errorMessage}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-mustard" 
            style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, borderRadius: '8px' }}
          >
            Sign In <ArrowRight size={15} color="#154360" />
          </button>
        </form>

        {/* Specific Login Credentials Box */}
        <div style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#154360', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Specific User Credentials:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {PRESET_ACCOUNTS.map(acc => (
              <div 
                key={acc.email}
                onClick={() => handleSelectPreset(acc)}
                style={{
                  background: email === acc.email ? '#ebf5fb' : '#f8fafc',
                  border: email === acc.email ? '2px solid #154360' : '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#154360' }}>
                    {acc.name} <span style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 500 }}>({acc.roleLabel})</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#52525b', fontFamily: 'monospace', marginTop: '2px' }}>
                    {acc.email} • Pass: {acc.password}
                  </div>
                </div>

                <button 
                  type="button" 
                  className={email === acc.email ? 'btn-mustard btn-black-sm' : 'btn-secondary btn-black-sm'}
                  style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
