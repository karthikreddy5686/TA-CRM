import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_FILE = path.resolve(__dirname, 'src/data/crm_persisted_storage.json')

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

          // Check against persisted staff users
          const db = readDb()
          const usersList = Array.isArray(db.users) ? db.users : []

          const inputPrefix = cleanUser.includes('@') ? cleanUser.split('@')[0] : cleanUser

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
          current.users = existing.filter(u => u.id !== userId && u.email !== userId)
          current.updatedAt = new Date().toISOString()
          writeDb(current)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, remaining: current.users.length }))
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: err.message }))
        }
      })
      return
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
            
            // Smart merge users to never wipe custom provisioned staff
            let mergedUsers = current.users || []
            if (Array.isArray(incoming.users) && incoming.users.length > 0) {
              const uMap = new Map()
              mergedUsers.forEach(u => {
                const k = u.id || (u.email && u.email.toLowerCase())
                if (k) uMap.set(k, u)
              })
              incoming.users.forEach(u => {
                const k = u.id || (u.email && u.email.toLowerCase())
                if (k) uMap.set(k, { ...(uMap.get(k) || {}), ...u })
              })
              mergedUsers = Array.from(uMap.values())
            }

            const updated = {
              ...current,
              ...incoming,
              users: mergedUsers,
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
              
              current.users = Array.from(uMap.values())
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
