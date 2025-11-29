import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🔍 Testing Brevo Integration...');
console.log('🔑 API Key Present:', !!process.env.BREVO_API_KEY);
console.log('📋 List ID:', process.env.BREVO_LIST_ID);

if (!process.env.BREVO_API_KEY) {
    console.error('❌ Error: BREVO_API_KEY is missing in .env');
    process.exit(1);
}

const testBrevo = async () => {
    try {
        const SibApiV3Sdk = (await import('sib-api-v3-sdk')).default;
        const defaultClient = SibApiV3Sdk.ApiClient.instance;
        const apiKey = defaultClient.authentications['api-key'];
        apiKey.apiKey = process.env.BREVO_API_KEY;

        const apiInstance = new SibApiV3Sdk.ContactsApi();
        const createContact = new SibApiV3Sdk.CreateContact();

        // Use a test email with timestamp to avoid duplicates
        const testEmail = `test.brevo.${Date.now()}@example.com`;

        createContact.email = testEmail;
        createContact.attributes = {
            "NOME": "Test User",
            "WHATSAPP": "11999999999"
        };
        createContact.listIds = [parseInt(process.env.BREVO_LIST_ID || 2)];

        console.log(`📤 Sending test contact: ${testEmail}`);

        const data = await apiInstance.createContact(createContact);
        console.log('✅ Success! Contact created in Brevo.');
        console.log('🆔 Contact ID:', data.id);

    } catch (error) {
        console.error('❌ Brevo API Error:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Body:', error.response.body);
        } else {
            console.error(error);
        }
    }
};

testBrevo();
