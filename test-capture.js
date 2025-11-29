import fetch from 'node-fetch'

async function testCapture() {
    try {
        const response = await fetch('http://localhost:3001/api/lead/capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: 'test@example.com',
                whatsapp: '11999999999'
            })
        })

        const data = await response.json()
        console.log('Status:', response.status)
        console.log('Response:', JSON.stringify(data, null, 2))

    } catch (error) {
        console.error('Error:', error)
    }
}

testCapture()
