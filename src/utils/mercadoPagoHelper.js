import crypto from 'crypto'

// Mercado Pago SDK initialization (placeholder)
export function initializeMercadoPago() {
    const accessToken = process.env.MP_ACCESS_TOKEN

    if (!accessToken || accessToken === 'SEU_TOKEN_MP_AQUI') {
        console.warn('⚠️  Mercado Pago token not configured. Using placeholder mode.')
        return null
    }

    // TODO: Initialize real Mercado Pago SDK when token is available
    // import { MercadoPagoConfig, Payment } from 'mercadopago'
    // const client = new MercadoPagoConfig({ accessToken })

    return null
}

// Generate PIX payment (PLACEHOLDER)
export async function generatePixPayment(leadId, amount = 47.00) {
    console.log(`📱 Generating PIX payment for lead ${leadId}, amount: R$ ${amount}`)

    // CRITICAL: external_reference is used by webhook to identify the lead
    const externalReference = `lead_${leadId}_${Date.now()}`

    // PLACEHOLDER: Return simulated PIX data
    // In production, this would call Mercado Pago API with:
    // {
    //   transaction_amount: amount,
    //   description: "LindAI - Diagnóstico Completo + Bônus",
    //   payment_method_id: "pix",
    //   external_reference: externalReference,  // CRITICAL for webhook
    //   payer: { email: lead.email }
    // }

    const pixCode = `00020126580014br.gov.bcb.pix0136${crypto.randomUUID()}520400005303986540${amount.toFixed(2)}5802BR5913LindAI6009SAO PAULO62070503***6304XXXX`

    return {
        success: true,
        pix_code: pixCode,
        qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`,
        amount: amount,
        lead_id: leadId,
        external_reference: externalReference, // CRITICAL: Webhook will use this to find the lead
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        message: 'PLACEHOLDER: Este é um QR Code simulado. Configure MP_ACCESS_TOKEN para usar pagamentos reais.'
    }
}

// Verify Mercado Pago webhook signature (CRITICAL SECURITY)
export function verifyMercadoPagoWebhook(req) {
    try {
        // Mercado Pago sends these headers for webhook validation
        const xSignature = req.headers['x-signature']
        const xRequestId = req.headers['x-request-id']

        if (!xSignature || !xRequestId) {
            console.warn('⚠️  Missing webhook signature headers')
            return { valid: false, reason: 'Missing signature headers' }
        }

        // Parse x-signature header (format: "ts=timestamp,v1=hash")
        const signatureParts = {}
        xSignature.split(',').forEach(part => {
            const [key, value] = part.split('=')
            signatureParts[key] = value
        })

        const timestamp = signatureParts.ts
        const receivedHash = signatureParts.v1

        if (!timestamp || !receivedHash) {
            console.warn('⚠️  Invalid signature format')
            return { valid: false, reason: 'Invalid signature format' }
        }

        // Get webhook secret from environment
        const secret = process.env.WEBHOOK_SECRET

        if (!secret || secret === 'seu_secret_aleatorio_aqui_12345' || secret === 'lindai_webhook_secret_2025_xyz789') {
            console.warn('⚠️  CRITICAL: Webhook secret not properly configured!')
            console.warn('⚠️  Set a strong WEBHOOK_SECRET in .env for production!')

            // In development, allow but warn
            if (process.env.NODE_ENV === 'production') {
                return { valid: false, reason: 'Webhook secret not configured' }
            }
            console.warn('⚠️  Allowing webhook in development mode (UNSAFE for production)')
            return { valid: true, warning: 'Development mode - signature not verified' }
        }

        // Construct the manifest (data to be signed)
        // Mercado Pago signs: id;request-id;ts
        const dataId = req.query.id || req.body.data?.id || req.body.id
        const manifest = `id:${dataId};request-id:${xRequestId};ts:${timestamp};`

        // Calculate expected signature using HMAC-SHA256
        const expectedHash = crypto
            .createHmac('sha256', secret)
            .update(manifest)
            .digest('hex')

        // Compare signatures (timing-safe comparison)
        const isValid = crypto.timingSafeEqual(
            Buffer.from(receivedHash, 'hex'),
            Buffer.from(expectedHash, 'hex')
        )

        if (!isValid) {
            console.error('❌ Invalid webhook signature!')
            console.error('Expected:', expectedHash)
            console.error('Received:', receivedHash)
            return { valid: false, reason: 'Signature mismatch' }
        }

        // Check timestamp to prevent replay attacks (max 5 minutes old)
        const now = Math.floor(Date.now() / 1000)
        const age = now - parseInt(timestamp)

        if (age > 300) { // 5 minutes
            console.warn('⚠️  Webhook timestamp too old (possible replay attack)')
            return { valid: false, reason: 'Timestamp too old' }
        }

        console.log('✅ Webhook signature verified successfully')
        return { valid: true }

    } catch (error) {
        console.error('❌ Error verifying webhook signature:', error)
        return { valid: false, reason: error.message }
    }
}

// Parse Mercado Pago webhook payload
export function parseWebhookPayload(body) {
    // Mercado Pago sends different types of notifications
    // We're interested in payment notifications

    return {
        type: body.type || 'payment',
        action: body.action || 'payment.updated',
        paymentId: body.data?.id || body.id,
        status: body.data?.status || 'pending',
        externalReference: body.data?.external_reference || null
    }
}
