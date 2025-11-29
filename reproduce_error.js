import fetch from 'node-fetch'

async function test(name, payload) {
    console.log(`\n--- Testing: ${name} ---`)
    try {
        const response = await fetch('http://localhost:3001/api/lead/capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        const data = await response.json()
        console.log(`Status: ${response.status}`)
        console.log(`Response: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
        console.error('Fetch Error:', error.message)
    }
}

async function run() {
    // 1. Valid
    await test('Valid Data', {
        name: 'Valid User',
        email: 'valid@test.com',
        whatsapp: '11999999999'
    })

    // 2. Missing fields (should be 400)
    await test('Missing Whatsapp', {
        name: 'No Phone',
        email: 'nophone@test.com'
    })

    // 3. Null fields (might cause 500 if not handled?)
    await test('Null Name', {
        name: null,
        email: 'nullname@test.com',
        whatsapp: '11999999999'
    })

    // 4. Undefined fields
    await test('Undefined Email', {
        name: 'Undef Email',
        whatsapp: '11999999999'
    })
}

run()
