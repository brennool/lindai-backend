import express from 'express'
import { captureLeadController, getLeadStatsController, listLeadsController } from '../controllers/leadController.js'

const router = express.Router()

// POST /api/lead/capture - Capture new lead
router.post('/capture', captureLeadController)

// GET /api/lead/stats - Get lead statistics (for CRM)
router.get('/stats', getLeadStatsController)

// GET /api/lead/list - List all leads (for CRM)
router.get('/list', listLeadsController)

export default router
