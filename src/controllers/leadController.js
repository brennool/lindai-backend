import Lead from '../models/Lead.js'
import { validateLeadData } from '../utils/validators.js'

// POST /api/lead/capture
export async function captureLeadController(req, res) {
    try {
        const { name, email } = req.body

        // Validate input and get sanitized data (SECURITY: prevents SQL injection and XSS)
        const validation = validateLeadData(name, email)

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            })
        }

        // Use sanitized data (SECURITY: prevents SQL injection and XSS)
        const { name: cleanName, email: cleanEmail } = validation.sanitized

        // Save to database with sanitized data (WhatsApp is "N/A" to satisfy DB constraint)
        const lead = await Lead.create(cleanName, "N/A", cleanEmail)

        console.log(`✅ Lead captured: ${lead.id} - ${lead.name} (${lead.email})`)

        // CRM Integration: Brevo (Sendinblue)
        let brevoError = null;
        try {
            // Robust Import for ESM/CommonJS compatibility
            const brevoModule = await import('sib-api-v3-sdk');
            const SibApiV3Sdk = brevoModule.default || brevoModule;

            if (!SibApiV3Sdk || !SibApiV3Sdk.ApiClient) {
                throw new Error("Falha ao carregar SDK do Brevo: ApiClient indefinido");
            }

            const defaultClient = SibApiV3Sdk.ApiClient.instance;
            const apiKey = defaultClient.authentications['api-key'];
            apiKey.apiKey = process.env.BREVO_API_KEY;

            const apiInstance = new SibApiV3Sdk.ContactsApi();
            const createContact = new SibApiV3Sdk.CreateContact();

            createContact.email = cleanEmail;
            createContact.attributes = {
                "FIRSTNAME": cleanName
            };
            createContact.listIds = [parseInt(process.env.BREVO_LIST_ID || 2)];

            console.log("CAMPOS ENVIADOS:", JSON.stringify(createContact));

            const data = await apiInstance.createContact(createContact);
            console.log('✅ Contact saved to Brevo CRM. ID: ' + data.id);

        } catch (error) {
            brevoError = error.response ? error.response.text : error.message;
            console.log("ERRO DETALHADO BREVO:", brevoError);

            // Ignore "Contact already exists" error (400)
            if (error.status === 400) {
                console.log('⚠️ Contact already exists in Brevo.');
            } else {
                console.error('❌ Error saving to Brevo:', error);
            }
        }

        res.status(201).json({
            success: true,
            leadId: lead.id,
            message: 'Lead capturado com sucesso!',
            brevoError: brevoError,
            data: {
                id: lead.id,
                name: lead.name,
                status: lead.status
            }
        })

    } catch (error) {
        console.error('❌ Error capturing lead:', error)
        console.error('Stack:', error.stack)
        console.error('Request Body:', JSON.stringify(req.body, null, 2))

        // Detailed error for debugging
        const errorDetails = error.response ? error.response.text : error.message;

        res.status(500).json({
            success: false,
            message: 'Erro interno ao salvar lead',
            error: error.message,
            details: errorDetails,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        })
    }
}

// GET /api/lead/stats (bonus - for CRM dashboard)
export async function getLeadStatsController(req, res) {
    try {
        const stats = await Lead.countByStatus()

        res.json({
            success: true,
            stats
        })
    } catch (error) {
        console.error('❌ Error getting stats:', error)
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar estatísticas',
            error: error.message
        })
    }
}

// GET /api/lead/list (bonus - for CRM dashboard)
export async function listLeadsController(req, res) {
    try {
        const { status, limit = 50, offset = 0 } = req.query

        let leads
        if (status) {
            leads = await Lead.getByStatus(status)
        } else {
            leads = await Lead.getAll(parseInt(limit), parseInt(offset))
        }

        res.json({
            success: true,
            count: leads.length,
            leads
        })
    } catch (error) {
        console.error('❌ Error listing leads:', error)
        res.status(500).json({
            success: false,
            message: 'Erro ao listar leads',
            error: error.message
        })
    }
}
