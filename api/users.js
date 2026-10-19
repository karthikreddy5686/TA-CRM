import fs from 'fs';
import path from 'path';

const TMP_STORAGE_FILE = path.resolve(process.env.TMPDIR || '/tmp', 'crm_storage_persisted.json');

function getDbPath() {
  return path.resolve(process.cwd(), 'src/data/crm_persisted_storage.json');
}

function readDb() {
  try {
    if (fs.existsSync(TMP_STORAGE_FILE)) {
      return JSON.parse(fs.readFileSync(TMP_STORAGE_FILE, 'utf8'));
    }
  } catch (e) {}

  try {
    const dbFile = getDbPath();
    if (fs.existsSync(dbFile)) {
      return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    }
  } catch (e) {}

  return { users: [], deletedUserIds: [] };
}

function writeDb(data) {
  const payload = JSON.stringify(data, null, 2);
  try { fs.writeFileSync(TMP_STORAGE_FILE, payload, 'utf8'); } catch (e) {}
  try {
    const dbFile = getDbPath();
    fs.writeFileSync(dbFile, payload, 'utf8');
  } catch (e) {}
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const db = readDb();
  const deletedIds = Array.isArray(db.deletedUserIds) ? db.deletedUserIds : [];

  if (req.method === 'GET') {
    const activeUsers = (db.users || []).filter(u => {
      const kId = (u.id || '').toLowerCase();
      const kEmail = (u.email || '').toLowerCase();
      return !deletedIds.some(d => (d || '').toLowerCase() === kId || (d || '').toLowerCase() === kEmail);
    });
    return res.status(200).json({ users: activeUsers });
  }

  if (req.method === 'POST') {
    try {
      const { users, user } = req.body || {};
      const current = readDb();
      if (user) {
        // Add single user
        const targetEmail = (user.email || '').trim().toLowerCase();
        const targetUsername = (user.username || '').trim().toLowerCase();
        let existing = Array.isArray(current.users) ? current.users : [];
        if (Array.isArray(current.deletedUserIds)) {
          current.deletedUserIds = current.deletedUserIds.filter(d => {
            const dl = (d || '').toLowerCase();
            return dl !== (user.id || '').toLowerCase() && dl !== targetEmail && dl !== targetUsername;
          });
        }
        const idx = existing.findIndex(u => u.id === user.id || (targetEmail && (u.email || '').toLowerCase() === targetEmail));
        if (idx >= 0) {
          existing[idx] = { ...existing[idx], ...user };
        } else {
          existing.unshift(user);
        }
        current.users = existing;
        writeDb(current);
        return res.status(200).json({ success: true, user });
      }

      if (Array.isArray(users)) {
        current.users = users;
        writeDb(current);
        return res.status(200).json({ success: true, count: users.length });
      }

      return res.status(400).json({ error: 'Valid user data required' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
