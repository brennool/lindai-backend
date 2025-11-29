import Lead from '../models/Lead.js'
import { generatePixPayment, verifyMercadoPagoWebhook, parseWebhookPayload } from '../utils/mercadoPagoHelper.js'

// POST /api/payment/generate
export async function generatePaymentController(req, res) {
    try {
        const { leadId } = req.body

        if (!leadId) {
            return res.status(400).json({
                success: false,
                message: 'leadId é obrigatório'
            })
        }

        // Verify lead exists
        const lead = await Lead.findById(leadId)

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead não encontrado'
            })
        }

        // Generate PIX payment with external_reference
        const paymentData = await generatePixPayment(leadId, 47.00)

        console.log(`💳 Payment generated for lead ${leadId}`)
        console.log(`📋 External reference: ${paymentData.external_reference}`)

        res.json({
            success: true,
            message: 'Pagamento gerado com sucesso',
            payment: paymentData
        })

    } catch (error) {
        console.error('❌ Error generating payment:', error)
        res.status(500).json({
            success: false,
            message: 'Erro ao gerar pagamento',
            error: error.message
        })
    }
}

// POST /api/payment/webhook
export async function paymentWebhookController(req, res) {
    try {
        console.log('📨 Webhook received from Mercado Pago')

        // CRITICAL SECURITY: Verify webhook signature
        const verification = verifyMercadoPagoWebhook(req)

        if (!verification.valid) {
            console.error('❌ Webhook verification failed:', verification.reason)
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Invalid webhook signature',
                reason: verification.reason
            })
        }

        if (verification.warning) {
            console.warn('⚠️  Webhook verification warning:', verification.warning)
        }

        const payload = req.body
        console.log('📊 Webhook payload:', JSON.stringify(payload, null, 2))

        // Parse webhook payload
        const webhookData = parseWebhookPayload(payload)
        console.log('📊 Parsed webhook data:', webhookData)

        // Handle payment status update
        if (webhookData.type === 'payment' && webhookData.status === 'approved') {
            // CRITICAL: Extract lead ID from external_reference (format: "lead_{id}_{timestamp}")
            let leadId = null

            if (webhookData.externalReference) {
                const match = webhookData.externalReference.match(/^lead_(\d+)_/)
                if (match) {
                    leadId = parseInt(match[1])
                    console.log(`✅ Extracted leadId from external_reference: ${leadId}`)
                }
            }

            // Fallback: try to get from payload directly
            if (!leadId) {
                leadId = payload.leadId
            }

            if (leadId) {
                // Update lead status to PAGO
                await Lead.updateStatus(leadId, 'PAGO', webhookData.paymentId)
                console.log(`✅ Lead ${leadId} status updated to PAGO`)

                // TODO: Send confirmation email/WhatsApp
                // TODO: Deliver digital product (BeautyPlan PDF)
            } else {
                console.warn('⚠️  No leadId found in webhook payload or external_reference')
            }
        }

        // Always return 200 to Mercado Pago
        res.json({
            received: true,
            message: 'Webhook processed successfully'
        })

    } catch (error) {
        console.error('❌ Error processing webhook:', error)

        // Still return 200 to avoid retries
        res.json({
            received: true,
            error: error.message
        })
    }
}

// GET /api/payment/status/:leadId (bonus - check payment status)
export async function checkPaymentStatusController(req, res) {
    try {
        const { leadId } = req.params

        const lead = await Lead.findById(leadId)

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead não encontrado'
            })
        }

        res.json({
            success: true,
            leadId: lead.id,
            status: lead.status,
            paymentId: lead.payment_id,
            updatedAt: lead.updated_at
        })

    } catch (error) {
        console.error('❌ Error checking payment status:', error)
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar status',
            error: error.message
        })
    }
}
