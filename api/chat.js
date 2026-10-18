import fs from 'fs';
import path from 'path';

let inMemoryMessages = null;

const TMP_CHAT_FILE = path.resolve(process.env.TMPDIR || '/tmp', 'crm_chat_persisted.json');

function getDbPath() {
  return path.resolve(process.cwd(), 'src/data/crm_persisted_storage.json');
}

function readMessages() {
  if (inMemoryMessages !== null) {
    return inMemoryMessages;
  }
  // 1. Try reading from /tmp writable file
  try {
    if (fs.existsSync(TMP_CHAT_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(TMP_CHAT_FILE, 'utf8'));
      if (Array.isArray(parsed.chatMessages)) {
        inMemoryMessages = parsed.chatMessages;
        return inMemoryMessages;
      }
    }
  } catch (e) {}

  // 2. Try reading from project storage file
  try {
    const dbFile = getDbPath();
    if (fs.existsSync(dbFile)) {
      const parsed = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
      if (Array.isArray(parsed.chatMessages)) {
        inMemoryMessages = parsed.chatMessages;
        return inMemoryMessages;
      }
    }
  } catch (e) {}

  inMemoryMessages = [];
  return inMemoryMessages;
}

function saveMessages(messages) {
  inMemoryMessages = messages;
  const payload = JSON.stringify({ chatMessages: messages, updatedAt: new Date().toISOString() }, null, 2);

  // Write to /tmp (always writable on Vercel)
  try {
    fs.writeFileSync(TMP_CHAT_FILE, payload, 'utf8');
  } catch (e) {}

  // Attempt writing to repo storage (works locally)
  try {
    const dbFile = getDbPath();
    let current = {};
    if (fs.existsSync(dbFile)) {
      current = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    }
    current.chatMessages = messages;
    current.updatedAt = new Date().toISOString();
    fs.writeFileSync(dbFile, JSON.stringify(current, null, 2), 'utf8');
  } catch (e) {}
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    const messages = readMessages();
    return res.status(200).json({ success: true, messages });
  }

  if (req.method === 'POST') {
    try {
      const messages = readMessages();
      const body = req.body || {};

      if (body.messageId && req.query.action === 'delete') {
        const remaining = messages.filter(m => m.id !== body.messageId);
        saveMessages(remaining);
        return res.status(200).json({ success: true, remaining: remaining.length });
      }

      const { message } = body;
      if (message && message.text) {
        const fullMsg = {
          id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          channel: message.channel || 'team',
          recipientId: message.recipientId || null,
          recipientName: message.recipientName || null,
          senderId: message.senderId,
          senderName: message.senderName,
          senderRole: message.senderRole || 'HR_INTERN',
          avatar: message.avatar || 'U',
          text: String(message.text).trim(),
          tag: message.tag || null,
          timestamp: message.timestamp || new Date().toISOString(),
          formattedTime: message.formattedTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        messages.push(fullMsg);
        if (messages.length > 1000) {
          messages.splice(0, messages.length - 1000);
        }
        saveMessages(messages);
        return res.status(200).json({ success: true, message: fullMsg, total: messages.length });
      }

      return res.status(400).json({ error: 'Valid message object required' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
