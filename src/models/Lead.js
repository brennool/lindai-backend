import db from '../database/db.js'

class Lead {
    // Create a new lead with status PENDENTE
    static create(name, whatsapp, email) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO leads (name, whatsapp, email, status)
                VALUES (?, ?, ?, 'PENDENTE')
            `

            db.run(query, [name, whatsapp, email], function (err) {
                if (err) {
                    console.error('❌ Database Error in Lead.create:', err)
                    reject(err)
                } else {
                    console.log('✅ Lead inserted into DB. ID:', this.lastID)
                    resolve({
                        id: this.lastID,
                        name,
                        whatsapp,
                        email,
                        status: 'PENDENTE'
                    })
                }
            })
        })
    }

    // Find lead by ID
    static findById(id) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM leads WHERE id = ?'

            db.get(query, [id], (err, row) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(row)
                }
            })
        })
    }

    // Update lead status (PENDENTE -> PAGO)
    static updateStatus(id, status, paymentId = null) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE leads 
                SET status = ?, payment_id = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `

            db.run(query, [status, paymentId, id], function (err) {
                if (err) {
                    reject(err)
                } else {
                    resolve({
                        id,
                        status,
                        changes: this.changes
                    })
                }
            })
        })
    }

    // Get all leads (for CRM dashboard)
    static getAll(limit = 100, offset = 0) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM leads 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            `

            db.all(query, [limit, offset], (err, rows) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(rows)
                }
            })
        })
    }

    // Get leads by status
    static getByStatus(status) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC'

            db.all(query, [status], (err, rows) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(rows)
                }
            })
        })
    }

    // Count leads by status
    static countByStatus() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    status,
                    COUNT(*) as count
                FROM leads
                GROUP BY status
            `

            db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err)
                } else {
                    const stats = {
                        PENDENTE: 0,
                        PAGO: 0,
                        total: 0
                    }

                    rows.forEach(row => {
                        stats[row.status] = row.count
                        stats.total += row.count
                    })

                    resolve(stats)
                }
            })
        })
    }
}

export default Lead
