export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { username, password } = req.body || {};
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanUser || !cleanPass) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // 1. Super Admin authentication
    if (
      (cleanUser === 'admin@geonixa' ||
       cleanUser === 'admin@geonixa.com' ||
       cleanUser === 'admin' ||
       cleanUser === 'geonixa admin') &&
      (cleanPass === 'geonixa@123' || cleanPass === 'admin')
    ) {
      return res.status(200).json({
        success: true,
        user: {
          id: 'user-admin',
          name: 'Geonixa Admin',
          role: 'ADMIN',
          title: 'Super Administrator',
          email: 'admin@geonixa.com',
          avatar: 'AD',
          status: 'online'
        }
      });
    }

    // 2. Primary HR Manager Karthik
    if (
      (cleanUser === 'karthikreddy5686@gmail.com' ||
       cleanUser === 'karthikreddy5686' ||
       cleanUser === 'karthik') &&
      (cleanPass === '123456' || cleanPass === 'admin')
    ) {
      return res.status(200).json({
        success: true,
        user: {
          id: 'hr-karthik',
          name: 'karthik',
          role: 'MAIN_HR',
          title: 'Talent Acquisition Manager',
          email: 'karthikreddy5686@gmail.com',
          username: 'karthikreddy5686',
          avatar: 'HR',
          status: 'online',
          dailyTargetHours: 4,
          dailyTargetLeads: 25
        }
      });
    }

    // Fallback: Return 401 so client fallback handles custom local accounts
    return res.status(401).json({ success: false, error: 'Invalid username or password' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
