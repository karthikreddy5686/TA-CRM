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
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }

    const cleanUrl = req.url ? req.url.split('?')[0] : ''

    // 1. GET & POST full storage database
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
            const updated = {
              ...current,
              ...incoming,
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

    // 2. GET & POST users specifically (for quick mobile login sync)
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
              current.users = users
              current.updatedAt = new Date().toISOString()
              writeDb(current)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, userCount: users.length }))
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

    // 3. Network connection info for mobile devices
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
  },
  preview: {
    host: true,
    port: 5174,
  },
})
