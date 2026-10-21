import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'
import nodemailer from 'nodemailer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_FILE = path.resolve(__dirname, 'src/data/crm_persisted_storage.json')

// Automatically load .env into process.env for Node.js middlewares
const envFile = path.resolve(__dirname, '.env')
if (fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, 'utf8')
  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const idx = trimmed.indexOf('=')
    if (idx !== -1) {
      const k = trimmed.slice(0, idx).trim()
      const v = trimmed.slice(idx + 1).trim()
      process.env[k] = v
    }
  })
}

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces()
  // Prioritize active Wi-Fi or Ethernet IPv4 address
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.') || iface.address.startsWith('172.')) {
          return iface.address
        }
      }
    }
  }
  return 'localhost'
}

function crmServerStoragePlugin() {
  const readDb = () => {
    try {
      if (fs.existsSync(DB_FILE)) {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
      }
    } catch (e) {
      console.warn('Error reading CRM storage JSON:', e)
    }
    return { users: [], updatedAt: new Date().toISOString() }
  }

  const writeDb = (data) => {
    try {
      const dir = path.dirname(DB_FILE)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8')
      return true
    } catch (e) {
      console.error('Error writing CRM storage JSON:', e)
      return false
    }
  }

  const sseChatClients = new Set();

  const handler = (req, res, next) => {
    // Enable CORS for mobile browsers and external PCs
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control')

    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }

    const cleanUrl = req.url ? req.url.split('?')[0] : ''

    // 1. Direct Central Authentication for all devices (Mobile, PC, Tablet)
    if (cleanUrl === '/api/login' && req.method === 'POST') {
      let body = ''
      req.on('data', chunk => { body += chunk })
      req.on('end', () => {
        try {
          const { username, password } = JSON.parse(body || '{}')
          const cleanUser = (username || '').trim().toLowerCase()
          const cleanPass = (password || '').trim()

          if (!cleanUser || !cleanPass) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Username and password are required' }))
            return
          }

          // Check if user is in deletedUserIds blacklist
          const db = readDb()
          const deletedList = Array.isArray(db.deletedUserIds) ? db.deletedUserIds : []
          const inputPrefix = cleanUser.includes('@') ? cleanUser.split('@')[0] : cleanUser
          if (
            deletedList.some(d => {
              const dl = (d || '').toLowerCase()
              return dl === cleanUser || dl === inputPrefix
            })
          ) {
            console.log(`[AUTH REJECTED] Account is deactivated/deleted: ${cleanUser}`)
            res.statusCode = 403
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'This employee account has been deleted by the Administrator. Access denied.' }))
            return
          }

          // Check Master Super Admin credentials
          if (
            (cleanUser === 'admin@geonixa' || 
             cleanUser === 'admin@geonixa.com' || 
             cleanUser === 'admin' || 
             cleanUser === 'geonixa admin') && 
            (cleanPass === 'geonixa@123' || cleanPass === 'admin')
          ) {
            console.log(`[AUTH] Super Admin logged in: ${cleanUser}`)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: true,
              user: {
                id: 'user-admin',
                name: 'Geonixa Admin',
                role: 'ADMIN',
                title: 'Super Administrator',
                email: 'admin@geonixa',
                password: 'geonixa@123',
                avatar: 'AD',
                status: 'online',
              }
            }))
            return
          }

          // Check Primary HR Manager Karthik
          if (
            (cleanUser === 'karthikreddy5686@gmail.com' ||
             cleanUser === 'karthikreddy5686' ||
             cleanUser === 'karthik') &&
            (cleanPass === '123456' || cleanPass === 'admin')
          ) {
            console.log(`[AUTH] Primary HR Manager logged in: ${cleanUser}`)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: true,
              user: {
                id: 'hr-karthik',
                name: 'karthik',
                role: 'MAIN_HR',
                title: 'Talent Acquisition Manager',
                email: 'karthikreddy5686@gmail.com',
                username: 'karthikreddy5686',
                password: '123456',
                avatar: 'HR',
                status: 'online',
                dailyTargetHours: 4,
                dailyTargetLeads: 25,
              }
            }))
            return
          }

          // Check against persisted staff users
          const usersList = Array.isArray(db.users) ? db.users : []

          const matched = usersList.find(u => {
            if (!u) return false
            const uEmail = (u.email || '').trim().toLowerCase()
            const uPrefix = uEmail.includes('@') ? uEmail.split('@')[0] : uEmail
            const uUsername = (u.username || '').trim().toLowerCase()
            const uName = (u.name || '').trim().toLowerCase()
            const uNameNoSpaces = uName.replace(/\s+/g, '')
            const inputNoSpaces = cleanUser.replace(/\s+/g, '')
            const uPass = (u.password || '').trim()

            const userMatches = 
              uEmail === cleanUser ||
              uPrefix === cleanUser ||
              uEmail === inputPrefix ||
              uPrefix === inputPrefix ||
              (uUsername && (uUsername === cleanUser || uUsername === inputPrefix)) ||
              uName === cleanUser ||
              uNameNoSpaces === inputNoSpaces ||
              (u.id && u.id.toLowerCase() === cleanUser)

            // Match exact, case-insensitive, or whitespace-trimmed
            const passMatches = 
              uPass === cleanPass || 
              uPass.toLowerCase() === cleanPass.toLowerCase() ||
              uPass.replace(/\s+/g, '') === cleanPass.replace(/\s+/g, '')

            return userMatches && passMatches
          })

          if (matched) {
            console.log(`[AUTH] Staff user logged in: ${matched.name} (${matched.email})`)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, user: matched }))
            return
          }

          console.warn(`[AUTH FAIL] Invalid credentials for: '${cleanUser}'`)
          res.statusCode = 401
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: false, error: 'Invalid username or password' }))
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message }))
        }
      })
      return
    }

    // 2. Add or Update a single staff user (Instant server persistence from Admin Dashboard)
    if (cleanUrl === '/api/users/add' && req.method === 'POST') {
      let body = ''
      req.on('data', chunk => { body += chunk })
      req.on('end', () => {
        try {
          const { user } = JSON.parse(body || '{}')
          if (user && (user.email || user.name)) {
            const current = readDb()
            const existingUsers = Array.isArray(current.users) ? current.users : []
            const targetEmail = (user.email || '').trim().toLowerCase()
            const targetUsername = (user.username || (targetEmail.includes('@') ? targetEmail.split('@')[0] : targetEmail)).trim().toLowerCase()
            const cleanName = (user.name || '').trim()
            const cleanPassword = (user.password || '').trim()

            const idx = existingUsers.findIndex(u => 
              (user.id && u.id === user.id) || 
              (targetEmail && u.email && u.email.trim().toLowerCase() === targetEmail) ||
              (targetUsername && u.username && u.username.trim().toLowerCase() === targetUsername)
            )
            const sanitizedUser = {
              ...user,
              name: cleanName,
              email: targetEmail || user.email,
              username: targetUsername,
              password: cleanPassword
            }

            if (Array.isArray(current.deletedUserIds)) {
              current.deletedUserIds = current.deletedUserIds.filter(d => {
                const dl = (d || '').toLowerCase()
                return dl !== (user.id || '').toLowerCase() && dl !== targetEmail && dl !== targetUsername
              })
            }

            if (idx >= 0) {
              existingUsers[idx] = { ...existingUsers[idx], ...sanitizedUser }
            } else {
              existingUsers.unshift(sanitizedUser)
            }
            current.users = existingUsers
            current.updatedAt = new Date().toISOString()
            writeDb(current)
            console.log(`[STORAGE] Provisioned staff account for '${sanitizedUser.name}' (Email/User: ${sanitizedUser.email}). Total: ${existingUsers.length}`)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, user: sanitizedUser, totalUsers: existingUsers.length }))
            return
          }
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Valid user object required' }))
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message }))
        }
      })
      return
    }

    // 3. Delete a staff user
    if ((cleanUrl.startsWith('/api/users/') || cleanUrl === '/api/users/delete') && (req.method === 'DELETE' || req.method === 'POST')) {
      let userId = cleanUrl.replace('/api/users/', '').trim()
      let body = ''
      req.on('data', chunk => { body += chunk })
      req.on('end', () => {
        try {
          if (cleanUrl === '/api/users/delete') {
            const parsed = JSON.parse(body || '{}')
            userId = parsed.userId || userId
          }
          const current = readDb()
          const existing = Array.isArray(current.users) ? current.users : []
          if (!Array.isArray(current.deletedUserIds)) {
            current.deletedUserIds = []
          }
          const target = existing.find(u => u.id === userId || (u.email && u.email.toLowerCase() === userId.toLowerCase()))
          if (userId && !current.deletedUserIds.includes(userId)) {
            current.deletedUserIds.push(userId)
          }
          if (target?.email && !current.deletedUserIds.includes(target.email.toLowerCase())) {
            current.deletedUserIds.push(target.email.toLowerCase())
          }
          if (target?.username && !current.deletedUserIds.includes(target.username.toLowerCase())) {
            current.deletedUserIds.push(target.username.toLowerCase())
          }
          current.users = existing.filter(u => u.id !== userId && (u.email || '').toLowerCase() !== userId.toLowerCase())
          current.updatedAt = new Date().toISOString()
          writeDb(current)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, remaining: current.users.length, deletedUserIds: current.deletedUserIds }))
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: err.message }))
        }
      })
      return
    }

    // 3.4 SSE Stream for Instant Real-Time Internal Chat (0ms latency delivery across mobile & desktop)
    if (cleanUrl === '/api/chat/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Content-Encoding': 'identity',
        'Access-Control-Allow-Origin': '*'
      });
      if (typeof res.flushHeaders === 'function') {
        res.flushHeaders();
      }
      res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);
      sseChatClients.add(res);

      // Heartbeat comment ping every 10s to keep mobile connections alive
      const keepAliveTimer = setInterval(() => {
        try {
          res.write(': ping\n\n');
        } catch {
          clearInterval(keepAliveTimer);
          sseChatClients.delete(res);
        }
      }, 10000);

      req.on('close', () => {
        clearInterval(keepAliveTimer);
        sseChatClients.delete(res);
      });
      return;
    }

    // 3.5 Real-time Employee Internal Chat
    if (cleanUrl === '/api/chat' || cleanUrl.startsWith('/api/chat/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      if (req.method === 'GET') {
        const db = readDb()
        const messages = Array.isArray(db.chatMessages) ? db.chatMessages : []
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ success: true, messages }))
        return
      }

      if (req.method === 'POST') {
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const current = readDb()
            const existingMessages = Array.isArray(current.chatMessages) ? current.chatMessages : []

            if (cleanUrl === '/api/chat/clear') {
              current.chatMessages = []
              current.updatedAt = new Date().toISOString()
              writeDb(current)

              // Broadcast to SSE clients
              const payload = JSON.stringify({ type: 'CLEAR_MESSAGES' });
              for (const client of sseChatClients) {
                try { client.write(`data: ${payload}\n\n`); } catch { sseChatClients.delete(client); }
              }

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, count: 0 }))
              return
            }

            if (cleanUrl === '/api/chat/delete') {
              const { messageId } = JSON.parse(body || '{}')
              current.chatMessages = existingMessages.filter(m => m.id !== messageId)
              current.updatedAt = new Date().toISOString()
              writeDb(current)

              // Broadcast to SSE clients
              const payload = JSON.stringify({ type: 'DELETE_MESSAGE', messageId });
              for (const client of sseChatClients) {
                try { client.write(`data: ${payload}\n\n`); } catch { sseChatClients.delete(client); }
              }

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, remaining: current.chatMessages.length }))
              return
            }

            const { message } = JSON.parse(body || '{}')
            if (message && message.text) {
              const fullMsg = {
                id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                channel: message.channel || 'team', // 'team' or 'dm_<userA>_<userB>'
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
              }

              existingMessages.push(fullMsg)
              if (existingMessages.length > 1000) {
                existingMessages.splice(0, existingMessages.length - 1000)
              }

              current.chatMessages = existingMessages
              current.updatedAt = new Date().toISOString()
              writeDb(current)

              // Broadcast immediately to all connected SSE clients (0ms real-time delivery)
              const payload = JSON.stringify({ type: 'NEW_MESSAGE', message: fullMsg });
              for (const client of sseChatClients) {
                try {
                  client.write(`data: ${payload}\n\n`);
                } catch {
                  sseChatClients.delete(client);
                }
              }

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, message: fullMsg, total: existingMessages.length }))
              return
            }

            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Valid message object required' }))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
        })
        return
      }
    }

    // 4. GET & POST full storage database
    if (cleanUrl === '/api/storage') {
      if (req.method === 'GET') {
        const db = readDb()
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(db))
        return
      }
      if (req.method === 'POST') {
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const incoming = JSON.parse(body || '{}')
            const current = readDb()
            
            let deletedIds = Array.isArray(current.deletedUserIds) ? [...current.deletedUserIds] : []
            if (Array.isArray(incoming.deletedUserIds)) {
              incoming.deletedUserIds.forEach(id => {
                const cleanId = (id || '').trim().toLowerCase()
                if (cleanId && !deletedIds.includes(cleanId)) deletedIds.push(cleanId)
              })
            }

            let mergedUsers = current.users || []
            if (Array.isArray(incoming.users)) {
              mergedUsers = incoming.users
            }

            // Always purge deleted users from mergedUsers
            if (deletedIds.length > 0) {
              mergedUsers = mergedUsers.filter(u => {
                const kId = (u.id || '').toLowerCase()
                const kEmail = (u.email || '').toLowerCase()
                const kUser = (u.username || '').toLowerCase()
                return !deletedIds.some(d => {
                  const dl = (d || '').toLowerCase()
                  return dl === kId || dl === kEmail || dl === kUser
                })
              })
            }

            const updated = {
              ...current,
              ...incoming,
              users: mergedUsers,
              deletedUserIds: deletedIds,
              updatedAt: new Date().toISOString(),
            }
            writeDb(updated)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, count: Object.keys(updated).length }))
          } catch (err) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: err.message }))
          }
        })
        return
      }
    }

    // 5. GET & POST users specifically (Smart merge to preserve newly provisioned staff)
    if (cleanUrl === '/api/users') {
      if (req.method === 'GET') {
        const db = readDb()
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ users: db.users || [] }))
        return
      }
      if (req.method === 'POST') {
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const { users } = JSON.parse(body || '{}')
            if (Array.isArray(users)) {
              const current = readDb()
              const existingUsers = Array.isArray(current.users) ? current.users : []
              
              // Smart merge: preserve all existing custom users
              const uMap = new Map()
              existingUsers.forEach(u => {
                const k = u.id || (u.email && u.email.toLowerCase())
                if (k) uMap.set(k, u)
              })
              users.forEach(u => {
                const k = u.id || (u.email && u.email.toLowerCase())
                if (k) uMap.set(k, { ...(uMap.get(k) || {}), ...u })
              })
              
              const deletedIds = Array.isArray(current.deletedUserIds) ? current.deletedUserIds : []
              current.users = Array.from(uMap.values()).filter(u => {
                const kId = (u.id || '').toLowerCase()
                const kEmail = (u.email || '').toLowerCase()
                const kUser = (u.username || '').toLowerCase()
                return !deletedIds.some(d => {
                  const dl = (d || '').toLowerCase()
                  return dl === kId || dl === kEmail || dl === kUser
                })
              })
              current.updatedAt = new Date().toISOString()
              writeDb(current)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, userCount: current.users.length }))
              return
            }
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Expected users array' }))
          } catch (err) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: err.message }))
          }
        })
        return
      }
    }

    // 6. Network connection info for mobile devices
    if (cleanUrl === '/api/network-info') {
      const ip = getLocalIpAddress()
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        localIp: ip,
        port: 5174,
        networkUrl: `http://${ip}:5174/`,
      }))
      return
    }

    // 7. GET & POST SMTP Email Configuration
    if (cleanUrl === '/api/smtp-config') {
      if (req.method === 'GET') {
        const db = readDb()
        const config = db.smtpSettings || {}
        const activeUser = config.senderEmail || config.user || process.env.SMTP_USER || 'admin@geonixa.com'
        const activeHost = config.host || process.env.SMTP_HOST || ''
        const activePort = config.port || process.env.SMTP_PORT || '465'
        const isConfigured = Boolean((config.pass || process.env.SMTP_PASS) && activeUser)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          senderEmail: activeUser,
          senderName: config.senderName || 'Talent Acquisition Team',
          service: config.service || (activeHost ? 'custom' : 'gmail'),
          host: activeHost,
          port: activePort,
          configured: isConfigured,
        }))
        return
      }
      if (req.method === 'POST') {
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const incoming = JSON.parse(body || '{}')
            const db = readDb()
            const emailUser = (incoming.senderEmail || incoming.user || '').trim()
            const emailPass = (incoming.pass || '').trim()
            db.smtpSettings = {
              senderEmail: emailUser,
              user: emailUser,
              pass: emailPass,
              senderName: (incoming.senderName || 'Talent Acquisition Team').trim(),
              service: incoming.service || 'gmail',
              configured: Boolean(emailUser && emailPass),
              updatedAt: new Date().toISOString()
            }
            writeDb(db)
            console.log(`[SMTP] Updated email credentials for ${emailUser}`)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, message: 'Email settings saved successfully', configured: db.smtpSettings.configured }))
          } catch (e) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message }))
          }
        })
        return
      }
    }

    // 8. Dispatch Google Meet Interview Invites to Students
    if (cleanUrl === '/api/send-interview-invites' && req.method === 'POST') {
      let body = ''
      req.on('data', chunk => { body += chunk })
      req.on('end', async () => {
        try {
          const { 
            driveTitle, 
            collegeName, 
            jobRole, 
            interviewDate, 
            meetLink, 
            interviewer, 
            scheduledList 
          } = JSON.parse(body || '{}')

          if (!Array.isArray(scheduledList) || scheduledList.length === 0) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'No candidates provided in scheduledList' }))
            return
          }

          const db = readDb()
          const smtpConfig = db.smtpSettings || {}
          const user = (smtpConfig.user || smtpConfig.senderEmail || process.env.SMTP_USER || 'admin@geonixa.com').trim()
          const pass = (smtpConfig.pass || process.env.SMTP_PASS || '').trim()
          const cleanPass = (pass || '').replace(/\s+/g, '')
          const isRealEmailReady = Boolean(pass && user)

          let transporter = null
          const isResend = Boolean((pass && pass.startsWith('re_')) || smtpConfig.service === 'resend' || process.env.RESEND_API_KEY)
          const resendKey = (pass && pass.startsWith('re_')) ? pass : (smtpConfig.pass || process.env.RESEND_API_KEY)
          const isSendGrid = Boolean((pass && pass.startsWith('SG.')) || smtpConfig.service === 'sendgrid' || process.env.SENDGRID_API_KEY)
          const sendgridKey = (pass && pass.startsWith('SG.')) ? pass : (smtpConfig.pass || process.env.SENDGRID_API_KEY)

          const host = (smtpConfig.host || process.env.SMTP_HOST || '').trim()
          const port = parseInt(smtpConfig.port || process.env.SMTP_PORT || '465', 10)
          const secure = smtpConfig.secure !== undefined 
            ? Boolean(smtpConfig.secure) 
            : (port === 465 || process.env.SMTP_SECURE === 'true')

          if (!isResend && !isSendGrid && cleanPass && user) {
            if (host) {
              // Custom domain SMTP (Zoho, Microsoft 365, Hostinger, cPanel, Private Domain, etc.)
              transporter = nodemailer.createTransport({
                host: host,
                port: port,
                secure: secure,
                auth: { 
                  user: user, 
                  pass: cleanPass 
                },
                tls: {
                  rejectUnauthorized: false
                }
              })
            } else {
              // Google / Google Workspace domain email
              transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { 
                  user: user, 
                  pass: cleanPass 
                }
              })
            }
          }

          const formatInterviewDate = (dateStr) => {
            if (!dateStr) return 'Scheduled Date'
            try {
              const parts = String(dateStr).split('-')
              if (parts.length === 3) {
                const year = parseInt(parts[0], 10)
                const month = parseInt(parts[1], 10) - 1
                const day = parseInt(parts[2], 10)
                const d = new Date(year, month, day)
                if (!isNaN(d.getTime())) {
                  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                }
              }
              const d = new Date(dateStr)
              if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
              }
            } catch (e) {}
            return dateStr
          }
          const formattedDate = formatInterviewDate(interviewDate)

          const results = []
          for (const item of scheduledList) {
            const student = item.student || {}
            const recipientEmail = student.email
            const recipientName = student.name || 'Candidate'
            const slotString = item.slotString || `${item.startFormatted} - ${item.endFormatted}` || 'Assigned Time Slot'

            if (!recipientEmail || !recipientEmail.includes('@')) {
              results.push({ email: recipientEmail, name: recipientName, status: 'SKIPPED', reason: 'No valid email address' })
              continue
            }

            const htmlContent = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                <!-- Header Banner -->
                <div style="background: #154360; color: #ffffff; padding: 20px 24px; text-align: center; border-bottom: 3px solid #FFDB58;">
                  <div style="font-size: 11px; font-weight: 700; color: #FFDB58; text-transform: uppercase; letter-spacing: 0.8px;">Campus Recruitment</div>
                  <h2 style="margin: 6px 0 0; font-size: 19px; font-weight: 700; color: #ffffff; letter-spacing: -0.2px;">Interview Invitation & Schedule</h2>
                  <div style="font-size: 12.5px; color: #cbd5e1; margin-top: 4px;">${driveTitle || 'Campus Placement Drive'}${collegeName ? ' • ' + collegeName : ''}</div>
                </div>

                <!-- Body Content -->
                <div style="padding: 24px; color: #334155; line-height: 1.6;">
                  <p style="margin: 0 0 12px; font-size: 14.5px; color: #0f172a;">
                    Dear <strong>${recipientName}</strong>${student.rollNumber ? ` (${student.rollNumber})` : ''},
                  </p>
                  <p style="margin: 0 0 16px; font-size: 13.5px; color: #334155; line-height: 1.6;">
                    Following the campus recruitment process, we are pleased to invite you for your Technical Interview for the position of <strong>${jobRole || 'Engineering Associate'}</strong>.
                  </p>

                  <!-- Small, Compact Interview Details & Time Slot Table -->
                  <table style="width: 100%; border-collapse: separate; border-spacing: 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 16px 0; overflow: hidden; font-size: 13px;">
                    <tbody>
                      <tr>
                        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; width: 50%;">
                          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Position</div>
                          <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 2px;">${jobRole || 'Engineering Associate'}</div>
                        </td>
                        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; width: 50%;">
                          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Interview Mode</div>
                          <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 2px;">Google Meet (Video)</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 14px; border-right: 1px solid #e2e8f0; width: 50%; background: #ffffff;">
                          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Interview Date</div>
                          <div style="font-size: 13px; font-weight: 700; color: #154360; margin-top: 2px;">${formattedDate}</div>
                        </td>
                        <td style="padding: 10px 14px; width: 50%; background: #ffffff;">
                          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Allotted Time Slot</div>
                          <div style="font-size: 13.5px; font-weight: 800; color: #0284c7; margin-top: 2px;">${slotString}</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- Call to Action -->
                  <div style="text-align: center; margin: 22px 0 16px;">
                    <a href="${meetLink}" target="_blank" style="display: inline-block; background: #154360; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 13.5px; padding: 11px 28px; border-radius: 6px; letter-spacing: 0.2px;">
                      Join Interview Room
                    </a>
                    <div style="font-size: 11px; color: #64748b; margin-top: 8px;">
                      Direct Link: <a href="${meetLink}" target="_blank" style="color: #0284c7; text-decoration: underline;">${meetLink}</a>
                    </div>
                  </div>

                  <!-- Candidate Protocol & Instructions -->
                  <div style="background: #f8fafc; border-left: 3px solid #154360; border-radius: 0 6px 6px 0; padding: 12px 14px; margin-top: 18px; font-size: 12px; color: #475569;">
                    <div style="font-weight: 700; color: #154360; margin-bottom: 6px; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.4px;">
                      Important Instructions for Candidate:
                    </div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px; line-height: 1.55; color: #334155;">
                      <tbody>
                        <tr>
                          <td style="padding: 3px 0; vertical-align: top; width: 14px; color: #154360; font-weight: bold;">•</td>
                          <td style="padding: 3px 0;"><strong>Panelist:</strong> ${interviewer || 'Talent Acquisition Team'}</td>
                        </tr>
                        <tr>
                          <td style="padding: 3px 0; vertical-align: top; width: 14px; color: #154360; font-weight: bold;">•</td>
                          <td style="padding: 3px 0;"><strong>Reporting:</strong> Please join the meeting room <strong>5 minutes prior</strong> to your scheduled slot.</td>
                        </tr>
                        <tr>
                          <td style="padding: 3px 0; vertical-align: top; width: 14px; color: #154360; font-weight: bold;">•</td>
                          <td style="padding: 3px 0;"><strong>Video & Audio:</strong> Keep your camera turned ON in a quiet, well-lit environment.</td>
                        </tr>
                        <tr>
                          <td style="padding: 3px 0; vertical-align: top; width: 14px; color: #154360; font-weight: bold;">•</td>
                          <td style="padding: 3px 0;"><strong>Documents:</strong> Have a digital copy of your resume and project portfolio ready.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Closing -->
                  <p style="margin: 20px 0 0; font-size: 13px; color: #334155; line-height: 1.6;">
                    We wish you the very best for your interview.<br><br>
                    Warm regards,<br>
                    <strong>Talent Acquisition Operations</strong><br>
                    <span style="font-size: 12px; color: #64748b;">${collegeName ? collegeName + ' Placement Drive' : 'Campus Hiring Division'}</span>
                  </p>
                </div>

                <!-- Footer -->
                <div style="background: #f1f5f9; border-top: 1px solid #e2e8f0; padding: 12px 20px; text-align: center; font-size: 10.5px; color: #64748b; line-height: 1.4;">
                  This is an automated recruitment communication from Talent Acquisition. Please do not reply directly to this email.
                </div>
              </div>
            `

            if (isResend) {
              try {
                const resendFrom = (smtpConfig.senderEmail && smtpConfig.senderEmail.includes('@') && !smtpConfig.senderEmail.endsWith('@gmail.com'))
                  ? `"${smtpConfig.senderName || 'Talent Acquisition Team'}" <${smtpConfig.senderEmail}>`
                  : 'Talent Acquisition <onboarding@resend.dev>'
                const resendRes = await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${resendKey}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    from: resendFrom,
                    to: recipientEmail,
                    subject: `Interview Invitation: ${driveTitle || 'Campus Drive'} - ${recipientName} (${slotString})`,
                    html: htmlContent
                  })
                })
                const resData = await resendRes.json()
                if (resendRes.ok) {
                  console.log(`[RESEND EMAIL] Sent to ${recipientEmail} (ID: ${resData.id})`)
                  results.push({ email: recipientEmail, name: recipientName, status: 'SENT', id: resData.id })
                } else {
                  console.error(`[RESEND ERROR] Failed sending to ${recipientEmail}:`, resData)
                  results.push({ email: recipientEmail, name: recipientName, status: 'FAILED', error: resData.message || 'Resend error' })
                }
              } catch (sendErr) {
                console.error(`[RESEND ERROR] Exception:`, sendErr.message)
                results.push({ email: recipientEmail, name: recipientName, status: 'FAILED', error: sendErr.message })
              }
            } else if (isSendGrid) {
              try {
                const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${sendgridKey}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    personalizations: [{ to: [{ email: recipientEmail, name: recipientName }] }],
                    from: { email: user, name: smtpConfig.senderName || 'Talent Acquisition Team' },
                    subject: `Interview Invitation: ${driveTitle || 'Campus Drive'} - ${recipientName} (${slotString})`,
                    content: [{ type: 'text/html', value: htmlContent }]
                  })
                })
                if (sgRes.ok || sgRes.status === 202) {
                  console.log(`[SENDGRID EMAIL] Sent to ${recipientEmail}`)
                  results.push({ email: recipientEmail, name: recipientName, status: 'SENT' })
                } else {
                  const sgErr = await sgRes.text()
                  console.error(`[SENDGRID ERROR] Failed sending to ${recipientEmail}:`, sgErr)
                  results.push({ email: recipientEmail, name: recipientName, status: 'FAILED', error: sgErr })
                }
              } catch (sendErr) {
                console.error(`[SENDGRID ERROR] Exception:`, sendErr.message)
                results.push({ email: recipientEmail, name: recipientName, status: 'FAILED', error: sendErr.message })
              }
            } else if (transporter) {
              try {
                await transporter.sendMail({
                  from: `"${smtpConfig.senderName || 'Talent Acquisition Team'}" <${user}>`,
                  to: recipientEmail,
                  subject: `Interview Invitation: ${driveTitle || 'Campus Drive'} - ${recipientName} (${slotString})`,
                  html: htmlContent
                })
                console.log(`[EMAIL DISPATCH] Sent interview link to ${recipientEmail}`)
                results.push({ email: recipientEmail, name: recipientName, status: 'SENT' })
              } catch (sendErr) {
                console.error(`[EMAIL ERROR] Failed sending to ${recipientEmail}:`, sendErr.message)
                results.push({ email: recipientEmail, name: recipientName, status: 'FAILED', error: sendErr.message })
              }
            } else {
              // SMTP not configured yet - record as queued
              console.log(`[EMAIL QUEUED] (No API Key or SMTP configured): ${recipientEmail} (${slotString})`)
              results.push({ 
                email: recipientEmail, 
                name: recipientName, 
                status: 'QUEUED_NO_SMTP', 
                message: 'Invite ready; provide Resend/SendGrid API Key or Gmail App Password'
              })
            }
          }

          // Record in DB email logs
          const emailLogs = Array.isArray(db.emailDispatchLogs) ? db.emailDispatchLogs : []
          db.emailDispatchLogs = [
            {
              id: `email-dispatch-${Date.now()}`,
              timestamp: new Date().toISOString(),
              driveTitle,
              interviewDate,
              meetLink,
              totalRecipients: scheduledList.length,
              results
            },
            ...emailLogs
          ].slice(0, 100)
          writeDb(db)

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            success: true,
            isRealEmailReady,
            senderEmail: user,
            total: scheduledList.length,
            sentCount: results.filter(r => r.status === 'SENT').length,
            queuedCount: results.filter(r => r.status === 'QUEUED_NO_SMTP').length,
            failedCount: results.filter(r => r.status === 'FAILED').length,
            results
          }))
        } catch (err) {
          console.error('[API send-interview-invites]', err)
          res.statusCode = 500
          res.end(JSON.stringify({ error: err.message }))
        }
      })
      return
    }

    next()
  }

  return {
    name: 'crm-server-storage',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), crmServerStoragePlugin()],
  server: {
    host: true, // Listen on all IP addresses (0.0.0.0) so mobile and other PCs can connect
    port: 5174,
    watch: {
      ignored: ['**/crm_persisted_storage.json'],
    },
  },
  preview: {
    host: true,
    port: 5174,
  },
})
