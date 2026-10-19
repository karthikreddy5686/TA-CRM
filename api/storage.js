import fs from 'fs';
import path from 'path';

const TMP_STORAGE_FILE = path.resolve(process.env.TMPDIR || '/tmp', 'crm_storage_persisted.json');

function getDbPath() {
  return path.resolve(process.cwd(), 'src/data/crm_persisted_storage.json');
}

function readDb() {
  // 1. Try reading from writable /tmp location (for Vercel serverless)
  try {
    if (fs.existsSync(TMP_STORAGE_FILE)) {
      return JSON.parse(fs.readFileSync(TMP_STORAGE_FILE, 'utf8'));
    }
  } catch (e) {}

  // 2. Try reading from repository file
  try {
    const dbFile = getDbPath();
    if (fs.existsSync(dbFile)) {
      return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    }
  } catch (e) {}

  return {
    users: [],
    deletedUserIds: [],
    drives: [],
    students: [],
    tpos: [],
    followUps: [],
    callSessions: [],
    chatMessages: []
  };
}

function writeDb(data) {
  const payload = JSON.stringify(data, null, 2);
  // Write to /tmp
  try {
    fs.writeFileSync(TMP_STORAGE_FILE, payload, 'utf8');
  } catch (e) {}

  // Write to project storage if writable
  try {
    const dbFile = getDbPath();
    fs.writeFileSync(dbFile, payload, 'utf8');
  } catch (e) {}
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    const db = readDb();
    return res.status(200).json(db);
  }

  if (req.method === 'POST') {
    try {
      const incoming = req.body || {};
      const current = readDb();

      let deletedIds = Array.isArray(current.deletedUserIds) ? [...current.deletedUserIds] : [];
      if (Array.isArray(incoming.deletedUserIds)) {
        incoming.deletedUserIds.forEach(id => {
          const cleanId = (id || '').trim().toLowerCase();
          if (cleanId && !deletedIds.includes(cleanId)) deletedIds.push(cleanId);
        });
      }

      let mergedUsers = current.users || [];
      if (Array.isArray(incoming.users)) {
        mergedUsers = incoming.users;
      }

      // Always purge deleted users from mergedUsers
      if (deletedIds.length > 0) {
        mergedUsers = mergedUsers.filter(u => {
          const kId = (u.id || '').toLowerCase();
          const kEmail = (u.email || '').toLowerCase();
          const kUser = (u.username || '').toLowerCase();
          return !deletedIds.some(d => {
            const dl = (d || '').toLowerCase();
            return dl === kId || dl === kEmail || dl === kUser;
          });
        });
      }

      const updated = {
        ...current,
        ...incoming,
        users: mergedUsers,
        deletedUserIds: deletedIds,
        updatedAt: new Date().toISOString()
      };

      writeDb(updated);
      return res.status(200).json({ success: true, count: Object.keys(updated).length });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
