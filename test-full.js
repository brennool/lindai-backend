import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initializeDatabase } from './src/database/db.js'

console.log('Imports successful');

dotenv.config()
console.log('Dotenv configured');

const app = express()
console.log('Express app created');

const PORT = 3002;

app.use(cors())
console.log('Cors middleware added');

app.get('/health', (req, res) => {
    res.json({ status: 'OK' })
})
console.log('Health route added');

async function start() {
    try {
        await initializeDatabase();
        console.log('Database initialized');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (e) {
        console.error('Failed to start:', e);
    }
}

start();
