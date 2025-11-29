import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import leadRoutes from './routes/leadRoutes.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3003

// Middleware - CORS Configuration (Fixed for preflight requests)
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600
}))

// Handle preflight requests explicitly
app.options('*', cors())

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
        uptime: process.uptime(),
        env: process.env.NODE_ENV || 'development'
    })
})

// API Routes
app.use('/api/lead', leadRoutes)

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

// For Vercel serverless functions, export the app
export default app

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`\n✅ Server running on http://localhost:${PORT}`)
        console.log(`📊 Health check: http://localhost:${PORT}/health`)
        console.log(`\n📝 Available endpoints:`)
        console.log(`   POST   /api/lead/capture`)
        console.log(`\n💡 Press Ctrl+C to stop\n`)
    })
}
