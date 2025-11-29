import sqlite3 from 'sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Database path
const DB_DIR = join(__dirname, '../../database')
const DB_PATH = process.env.DB_PATH || join(DB_DIR, 'lindai.db')

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true })
}

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Error connecting to database:', err.message)
    } else {
        console.log('✅ Connected to SQLite database:', DB_PATH)
    }
})

// Initialize database schema
export function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Create leads table
            db.run(`
                CREATE TABLE IF NOT EXISTS leads (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    whatsapp TEXT NOT NULL,
                    email TEXT NOT NULL,
                    status TEXT DEFAULT 'PENDENTE',
                    payment_id TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('❌ Error creating leads table:', err.message)
                    reject(err)
                } else {
                    console.log('✅ Leads table ready')
                    resolve()
                }
            })
        })
    })
}

export default db
