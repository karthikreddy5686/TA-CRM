import React, { useState } from 'react';
import {
  Building2,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const PRESET_ACCOUNTS = [
  {
    roleLabel: 'Admin',
    email: 'admin@geonixa',
    password: 'geonixa@123',
    name: 'Geonixa Admin',
    role: 'ADMIN',
    title: 'Super Administrator',
    avatar: 'AD',
  },
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
    email: 'intern1@company.com',
    password: 'intern',
    name: 'HR Intern 1',
    role: 'HR_INTERN',
    title: 'Recruitment Intern',
    avatar: 'I1',
  },
  {
    roleLabel: 'HR Intern 2',
    email: 'intern2@company.com',
    password: 'intern',
    name: 'HR Intern 2',
    role: 'HR_INTERN',
    title: 'Recruitment Intern',
    avatar: 'I2',
  },
];

export default function LoginScreen({ onLogin, users = [] }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Combine static presets with dynamically provisioned HR/Intern users from Admin Dashboard
  const allAccounts = [
    ...PRESET_ACCOUNTS,
    ...(users || [])
      .filter(u => u.email && u.password && !PRESET_ACCOUNTS.some(p => p.email.toLowerCase() === u.email.toLowerCase()))
      .map(u => ({
        roleLabel: u.role === 'ADMIN' ? 'Admin' : u.role === 'MAIN_HR' ? 'HR Manager' : 'HR Intern',
        email: u.email,
        password: u.password,
        name: u.name,
        role: u.role,
        title: u.title || (u.role === 'ADMIN' ? 'Administrator' : u.role === 'MAIN_HR' ? 'HR Manager' : 'HR Intern'),
        avatar: u.avatar || (u.role === 'ADMIN' ? 'AD' : u.role === 'MAIN_HR' ? 'HR' : 'IN'),
      }))
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const inputEmail = email.trim().toLowerCase();

    // 1. Explicit check for admin credentials: admin@geonixa or admin@geonixa.com or admin with geonixa@123
    if ((inputEmail === 'admin@geonixa' || inputEmail === 'admin@geonixa.com' || inputEmail === 'admin') && password === 'geonixa@123') {
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

    // 2. Check all provisioned users and presets
    const matched = allAccounts.find(
      acc => {
        const accEmail = (acc.email || '').toLowerCase();
        const accPrefix = accEmail.split('@')[0];
        const accName = (acc.name || '').toLowerCase();
        return (
          accEmail === inputEmail ||
          accPrefix === inputEmail ||
          accName === inputEmail
        ) && acc.password === password;
      }
    );

    if (matched) {
      onLogin(matched);
    } else {
      setErrorMessage('Invalid username / password');
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
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="#71717a" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Username"
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
      </div>
    </div>
  );
}


