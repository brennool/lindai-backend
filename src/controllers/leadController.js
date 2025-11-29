import { validateLeadData } from '../utils/validators.js'

// POST /api/lead/capture - Simplified version without database
export async function captureLeadController(req, res) {
    try {
        const { name, email } = req.body

        // Validate input
        const validation = validateLeadData(name, email)

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            })
        }

        const { name: cleanName, email: cleanEmail } = validation.sanitized

        console.log(`📧 Processing lead: ${cleanName} (${cleanEmail})`)

        // CRM Integration: Brevo (Sendinblue)
        try {
            const brevoModule = await import('sib-api-v3-sdk');
            const SibApiV3Sdk = brevoModule.default || brevoModule;

            if (!SibApiV3Sdk || !SibApiV3Sdk.ApiClient) {
                throw new Error("Failed to load Brevo SDK");
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

            await apiInstance.createContact(createContact);
            console.log(`✅ Lead sent to Brevo: ${cleanName} (${cleanEmail})`);

        } catch (brevoError) {
            console.error('⚠️ Brevo error:', brevoError.message);
            // Continue even if Brevo fails
        }

        // Return success
        return res.status(201).json({
            success: true,
            message: 'Lead captured successfully',
            data: {
                name: cleanName,
                email: cleanEmail
            }
        })

    } catch (error) {
        console.error('❌ Lead capture error:', error)
        return res.status(500).json({
            success: false,
            message: 'Failed to capture lead',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        })
    }
}

// GET /api/lead/stats - Simplified (no database)
export async function getLeadStatsController(req, res) {
    return res.status(200).json({
        success: true,
        message: 'Stats not available in serverless mode',
        stats: {
            total: 0,
            today: 0
        }
    })
}

// GET /api/lead/list - Simplified (no database)
export async function listLeadsController(req, res) {
    return res.status(200).json({
        success: true,
        message: 'List not available in serverless mode',
        leads: []
    })
}
