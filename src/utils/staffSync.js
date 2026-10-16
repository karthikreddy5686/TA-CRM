/**
 * Staff Multi-Device Synchronization & 1-Click Mobile Onboarding Utilities
 * 
 * Solves the cross-device persistence challenge for static deployments (Vercel, Netlify, GitHub Pages)
 * by enabling:
 * 1. 1-Click Mobile Access Links (?auth=token) with QR code generation
 * 2. Master Staff Sync Links (?sync=token) for bulk-transferring all employees to new devices
 * 3. LocalStorage persistence across all mobile/desktop devices
 */

import QRCode from 'qrcode';

// Compress & Encode a staff user payload into a URL-safe Base64 token
export function encodeUserToken(user) {
  try {
    const minified = {
      id: user.id,
      name: user.name,
      role: user.role,
      title: user.title,
      email: user.email,
      username: user.username || (user.email ? user.email.split('@')[0] : ''),
      password: user.password,
      avatar: user.avatar || (user.role === 'MAIN_HR' ? 'HR' : 'IN'),
      status: user.status || 'online',
      dailyTargetHours: user.dailyTargetHours || 4,
      dailyTargetLeads: user.dailyTargetLeads || 25,
      ts: Date.now()
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(minified))));
  } catch (e) {
    console.error('Error encoding user token:', e);
    return null;
  }
}

// Decode a staff user payload from a Base64 token
export function decodeUserToken(token) {
  try {
    const jsonStr = decodeURIComponent(escape(atob(token)));
    const parsed = JSON.parse(jsonStr);
    if (parsed && (parsed.email || parsed.username || parsed.name) && parsed.password) {
      return {
        id: parsed.id || `user-${Date.now()}`,
        name: parsed.name,
        role: parsed.role || 'HR_INTERN',
        title: parsed.title || 'Recruitment Associate',
        email: parsed.email || '',
        username: parsed.username || (parsed.email ? parsed.email.split('@')[0] : ''),
        password: parsed.password,
        avatar: parsed.avatar || (parsed.role === 'MAIN_HR' ? 'HR' : 'IN'),
        status: parsed.status || 'online',
        dailyTargetHours: parsed.dailyTargetHours || 4,
        dailyTargetLeads: parsed.dailyTargetLeads || 25
      };
    }
  } catch (e) {
    console.error('Error decoding user token:', e);
  }
  return null;
}

// Encode all current staff accounts into a master sync token
export function encodeBulkStaffToken(users) {
  try {
    const list = Array.isArray(users) ? users : [];
    const minifiedList = list.map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      title: u.title,
      email: u.email,
      username: u.username || (u.email ? u.email.split('@')[0] : ''),
      password: u.password,
      avatar: u.avatar || 'HR',
      status: u.status || 'online'
    }));
    return btoa(unescape(encodeURIComponent(JSON.stringify({ users: minifiedList, ts: Date.now() }))));
  } catch (e) {
    console.error('Error encoding bulk staff token:', e);
    return null;
  }
}

// Decode bulk staff accounts
export function decodeBulkStaffToken(token) {
  try {
    const jsonStr = decodeURIComponent(escape(atob(token)));
    const parsed = JSON.parse(jsonStr);
    if (parsed && Array.isArray(parsed.users)) {
      return parsed.users;
    }
  } catch (e) {
    console.error('Error decoding bulk staff token:', e);
  }
  return null;
}

// Get the public base URL of the currently running CRM
export function getAppBaseUrl() {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}${window.location.pathname}`;
}

// Generate a 1-click mobile login URL for a given staff member
export function generateStaffInviteUrl(user) {
  const token = encodeUserToken(user);
  if (!token) return '';
  const base = getAppBaseUrl();
  return `${base}?auth=${encodeURIComponent(token)}`;
}

// Generate a master sync URL for transferring all staff to mobile
export function generateMasterSyncUrl(users) {
  const token = encodeBulkStaffToken(users);
  if (!token) return '';
  const base = getAppBaseUrl();
  return `${base}?sync=${encodeURIComponent(token)}`;
}

// Generate a pre-filled WhatsApp share link
export function generateWhatsAppShareLink(user) {
  const inviteUrl = generateStaffInviteUrl(user);
  const text = `Hello ${user.name}! 👋\n\nYour Talent Acquisition CRM employee account is ready:\n👤 Username: ${user.username || user.email}\n🔑 Password: ${user.password}\n\n👉 Click here for instant 1-click mobile access:\n${inviteUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

// Generate QR Code data URL (PNG)
export async function generateQrCodeDataUrl(url) {
  try {
    return await QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      color: {
        dark: '#154360',
        light: '#ffffff'
      }
    });
  } catch (e) {
    console.error('QR code generation failed, using fallback:', e);
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
  }
}

// Check current URL parameters for ?auth= or ?sync=
export function parseUrlTokens() {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    
    // 1. Check for single employee auto-login / onboarding (?auth=...)
    const authToken = params.get('auth');
    if (authToken) {
      const user = decodeUserToken(authToken);
      if (user) {
        return { type: 'AUTH_USER', user };
      }
    }

    // 2. Check for bulk staff multi-device sync (?sync=...)
    const syncToken = params.get('sync');
    if (syncToken) {
      const users = decodeBulkStaffToken(syncToken);
      if (Array.isArray(users) && users.length > 0) {
        return { type: 'SYNC_USERS', users };
      }
    }
  } catch (e) {
    console.error('Error parsing URL sync tokens:', e);
  }
  return null;
}

// Clean ?auth= and ?sync= from the browser URL bar without reloading the page
export function cleanUrlTokens() {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('auth');
    url.searchParams.delete('sync');
    window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
  } catch (e) {
    console.warn('Could not clean URL tokens:', e);
  }
}

// Save or merge a user into localStorage('tacrm_users') safely
export function persistUserToDevice(user) {
  if (!user || (!user.email && !user.username)) return;
  try {
    const saved = localStorage.getItem('tacrm_users');
    let list = [];
    if (saved) {
      try { list = JSON.parse(saved); } catch {}
    }
    if (!Array.isArray(list)) list = [];

    // Replace or add
    const idx = list.findIndex(u => 
      u.id === user.id || 
      (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()) ||
      (u.username && user.username && u.username.toLowerCase() === user.username.toLowerCase())
    );

    if (idx !== -1) {
      list[idx] = { ...list[idx], ...user };
    } else {
      list.unshift(user);
    }

    localStorage.setItem('tacrm_users', JSON.stringify(list));
    return list;
  } catch (e) {
    console.error('Failed to persist user to device localStorage:', e);
  }
}

// Bulk merge incoming users into localStorage('tacrm_users')
export function persistBulkUsersToDevice(newUsers) {
  if (!Array.isArray(newUsers) || newUsers.length === 0) return;
  try {
    const saved = localStorage.getItem('tacrm_users');
    let list = [];
    if (saved) {
      try { list = JSON.parse(saved); } catch {}
    }
    if (!Array.isArray(list)) list = [];

    const map = new Map();
    list.forEach(u => {
      const k = u.id || (u.email && u.email.toLowerCase());
      if (k) map.set(k, u);
    });

    newUsers.forEach(u => {
      const k = u.id || (u.email && u.email.toLowerCase());
      if (k) map.set(k, { ...(map.get(k) || {}), ...u });
    });

    const merged = Array.from(map.values());
    localStorage.setItem('tacrm_users', JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.error('Failed to persist bulk users to device localStorage:', e);
  }
}
