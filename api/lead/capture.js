// Vercel Serverless Function - Lead Capture (Security Hardened)
export default async function handler(req, res) {
    // CORS Headers (Restricted to production domains for security)
    const allowedOrigins = [
        'https://www.lindai.com.br',
        'https://lindai.com.br',
        'https://lindai-web.vercel.app'
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

        // Input sanitization function
        const sanitizeName = (str) => {
            if (!str) return '';
            return str.trim()
                .replace(/[<>]/g, '')                    // Remove < e > (XSS prevention)
                .replace(/[^\w\s\u00C0-\u017F]/g, '')   // Apenas letras, números, espaços e acentos
                .substring(0, 100);                      // Limita tamanho
        };

        const sanitizedName = sanitizeName(name);
        const sanitizedEmail = email ? email.trim().toLowerCase().substring(0, 255) : '';

        // Enhanced validation
        if (!sanitizedName || !sanitizedEmail) {
            return res.status(400).json({
                success: false,
                errors: ['Nome e email são obrigatórios']
            });
        }

        // Name validation
        if (sanitizedName.length < 2) {
            return res.status(400).json({
                success: false,
                errors: ['Nome deve ter pelo menos 2 caracteres']
            });
        }

        if (sanitizedName.length > 100) {
            return res.status(400).json({
                success: false,
                errors: ['Nome muito longo (máximo 100 caracteres)']
            });
        }

        // Email validation (more robust)
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(sanitizedEmail)) {
            return res.status(400).json({
                success: false,
                errors: ['Email inválido']
            });
        }

        // Send to Brevo CRM
        try {
            const brevoModule = await import('sib-api-v3-sdk');
            const SibApiV3Sdk = brevoModule.default || brevoModule;

            const defaultClient = SibApiV3Sdk.ApiClient.instance;
            const apiKey = defaultClient.authentications['api-key'];
            apiKey.apiKey = process.env.BREVO_API_KEY;

            const apiInstance = new SibApiV3Sdk.ContactsApi();
            const createContact = new SibApiV3Sdk.CreateContact();

            createContact.email = sanitizedEmail;
            createContact.attributes = {
                "FIRSTNAME": sanitizedName
            };
            createContact.listIds = [parseInt(process.env.BREVO_LIST_ID || 2)];

            await apiInstance.createContact(createContact);

            // Only log in development (security: don't expose PII in production logs)
            if (process.env.NODE_ENV !== 'production') {
                console.log(`✅ Lead sent to Brevo: ${sanitizedName} (${sanitizedEmail})`);
            }

        } catch (brevoError) {
            console.error('⚠️ Brevo error:', brevoError.message);
            // Continue even if Brevo fails
        }

        // Return success (without exposing personal data)
        return res.status(201).json({
            success: true,
            message: 'Lead captured successfully'
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
