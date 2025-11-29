import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initializeDatabase } from './database/db.js'
import { initializeMercadoPago } from './utils/mercadoPagoHelper.js'
import leadRoutes from './routes/leadRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3003

// Middleware - CORS Configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3004',
            'http://localhost:5173',
            'http://localhost:5174',
            'https://lindai-web.vercel.app',
            process.env.FRONTEND_URL
        ];

        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
    next()
})

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    })
})

// API Routes
app.use('/api/lead', leadRoutes)
app.use('/api/payment', paymentRoutes)

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.path
    })
})

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err)
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
})

// Initialize database and start server
async function startServer() {
    try {
        console.log('🚀 Starting LindAI Backend API...')

        // Initialize database
        await initializeDatabase()

        // Initialize Mercado Pago (if configured)
        initializeMercadoPago()

        // Start server
        app.listen(PORT, () => {
            console.log(`\n✅ Server running on http://localhost:${PORT}`)
            console.log(`📊 Health check: http://localhost:${PORT}/health`)
            console.log(`\n📝 Available endpoints:`)
            console.log(`   POST   /api/lead/capture`)
            console.log(`   GET    /api/lead/stats`)
            console.log(`   GET    /api/lead/list`)
            console.log(`   POST   /api/payment/generate`)
            console.log(`   POST   /api/payment/webhook`)
            console.log(`   GET    /api/payment/status/:leadId`)
            console.log(`\n💡 Press Ctrl+C to stop\n`)
        })
    } catch (error) {
        console.error('❌ Failed to start server:', error)
        process.exit(1)
    }
}

// Start the server
startServer()

export default app
