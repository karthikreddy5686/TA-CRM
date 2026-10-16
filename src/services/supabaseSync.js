/**
 * Optional Supabase Cloud Sync Service for TA CRM
 * Enables real-time, automatic cross-device persistence across mobile, PC, and tablets
 * without needing any local servers or link sharing.
 */

export function getSupabaseConfig() {
  if (typeof window === 'undefined') return { url: '', key: '' };
  const url = (localStorage.getItem('tacrm_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '').trim();
  const key = (localStorage.getItem('tacrm_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  return { url: url.replace(/\/+$/, ''), key };
}

export function setSupabaseConfig(url, key) {
  if (typeof window === 'undefined') return;
  if (url && key) {
    localStorage.setItem('tacrm_supabase_url', url.trim().replace(/\/+$/, ''));
    localStorage.setItem('tacrm_supabase_key', key.trim());
  } else {
    localStorage.removeItem('tacrm_supabase_url');
    localStorage.removeItem('tacrm_supabase_key');
  }
}

export function isSupabaseConfigured() {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key && url.startsWith('http'));
}

export async function fetchSupabaseUsers() {
  if (!isSupabaseConfigured()) return null;
  const { url, key } = getSupabaseConfig();

  try {
    const res = await fetch(`${url}/rest/v1/crm_users?select=*`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map(row => ({
          id: row.id,
          name: row.name,
          role: row.role || 'HR_INTERN',
          title: row.title || 'Recruitment Associate',
          email: row.email || '',
          username: row.username || (row.email ? row.email.split('@')[0] : ''),
          password: row.password || '',
          avatar: row.avatar || (row.role === 'MAIN_HR' ? 'HR' : 'IN'),
          status: row.status || 'online',
          dailyTargetHours: row.daily_target_hours || 4,
          dailyTargetLeads: row.daily_target_leads || 25
        }));
      }
    }
  } catch (err) {
    console.warn('Supabase fetch users failed:', err);
  }
  return null;
}

export async function upsertSupabaseUser(user) {
  if (!isSupabaseConfigured() || !user) return false;
  const { url, key } = getSupabaseConfig();

  try {
    const payload = {
      id: user.id,
      name: user.name,
      role: user.role,
      title: user.title,
      email: user.email,
      username: user.username || (user.email ? user.email.split('@')[0] : ''),
      password: user.password,
      avatar: user.avatar || 'HR',
      status: user.status || 'online',
      daily_target_hours: user.dailyTargetHours || 4,
      daily_target_leads: user.dailyTargetLeads || 25,
      updated_at: new Date().toISOString()
    };

    const res = await fetch(`${url}/rest/v1/crm_users`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });

    return res.ok;
  } catch (err) {
    console.warn('Supabase upsert user failed:', err);
    return false;
  }
}

export async function deleteSupabaseUser(userId) {
  if (!isSupabaseConfigured() || !userId) return false;
  const { url, key } = getSupabaseConfig();

  try {
    const res = await fetch(`${url}/rest/v1/crm_users?id=eq.${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });

    return res.ok;
  } catch (err) {
    console.warn('Supabase delete user failed:', err);
    return false;
  }
}

export async function testSupabaseConnection(urlInput, keyInput) {
  const url = (urlInput || '').trim().replace(/\/+$/, '');
  const key = (keyInput || '').trim();
  if (!url || !key) return { success: false, message: 'URL and Anon Key are required' };

  try {
    const res = await fetch(`${url}/rest/v1/crm_users?select=count`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      return { success: true, message: 'Connected successfully to Supabase!' };
    } else {
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.message || `Error ${res.status}: ${res.statusText}` };
    }
  } catch (err) {
    return { success: false, message: err.message || 'Network error connecting to Supabase' };
  }
}
