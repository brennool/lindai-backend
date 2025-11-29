import express from 'express'
import {
    generatePaymentController,
    paymentWebhookController,
    checkPaymentStatusController
} from '../controllers/paymentController.js'

const router = express.Router()

// POST /api/payment/generate - Generate PIX payment
router.post('/generate', generatePaymentController)

// POST /api/payment/webhook - Mercado Pago webhook
router.post('/webhook', paymentWebhookController)

// GET /api/payment/status/:leadId - Check payment status
router.get('/status/:leadId', checkPaymentStatusController)

export default router
