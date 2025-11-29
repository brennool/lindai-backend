// Vercel Serverless Function - Lead Capture
export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { name, email } = req.body;

        // Basic validation
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                errors: ['Nome e email são obrigatórios']
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                errors: ['Email inválido']
            });
        }

        console.log(`📧 Processing lead: ${name} (${email})`);

        // Send to Brevo CRM
        try {
            const brevoModule = await import('sib-api-v3-sdk');
            const SibApiV3Sdk = brevoModule.default || brevoModule;

            const defaultClient = SibApiV3Sdk.ApiClient.instance;
            const apiKey = defaultClient.authentications['api-key'];
            apiKey.apiKey = process.env.BREVO_API_KEY;

            const apiInstance = new SibApiV3Sdk.ContactsApi();
            const createContact = new SibApiV3Sdk.CreateContact();

            createContact.email = email;
            createContact.attributes = {
                "FIRSTNAME": name
            };
            createContact.listIds = [parseInt(process.env.BREVO_LIST_ID || 2)];

            await apiInstance.createContact(createContact);
            console.log(`✅ Lead sent to Brevo: ${name} (${email})`);

        } catch (brevoError) {
            console.error('⚠️ Brevo error:', brevoError.message);
            // Continue even if Brevo fails
        }

        // Return success
        return res.status(201).json({
            success: true,
            message: 'Lead captured successfully',
            data: {
                name,
                email
            }
        });

    } catch (error) {
        console.error('❌ Lead capture error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to capture lead',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
