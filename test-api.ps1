# Test API Endpoints

Write-Host "Testing LindAI Backend API..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get
$response | ConvertTo-Json
Write-Host ""

# Test 2: Capture Lead
Write-Host "2. Testing Lead Capture..." -ForegroundColor Yellow
$leadBody = @{
    name = "Maria Silva"
    whatsapp = "11987654321"
    email = "maria@example.com"
} | ConvertTo-Json

$leadResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/lead/capture" -Method Post -Body $leadBody -ContentType "application/json"
$leadResponse | ConvertTo-Json
$leadId = $leadResponse.leadId
Write-Host ""

# Test 3: Get Lead Stats
Write-Host "3. Testing Lead Stats..." -ForegroundColor Yellow
$statsResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/lead/stats" -Method Get
$statsResponse | ConvertTo-Json
Write-Host ""

# Test 4: Generate Payment
Write-Host "4. Testing Payment Generation..." -ForegroundColor Yellow
$paymentBody = @{
    leadId = $leadId
} | ConvertTo-Json

$paymentResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/payment/generate" -Method Post -Body $paymentBody -ContentType "application/json"
$paymentResponse | ConvertTo-Json -Depth 5
Write-Host ""

# Test 5: Check Payment Status
Write-Host "5. Testing Payment Status..." -ForegroundColor Yellow
$statusResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/payment/status/$leadId" -Method Get
$statusResponse | ConvertTo-Json
Write-Host ""

# Test 6: Simulate Webhook
Write-Host "6. Testing Webhook (Simulated)..." -ForegroundColor Yellow
$webhookBody = @{
    type = "payment"
    action = "payment.updated"
    data = @{
        id = "123456789"
        status = "approved"
    }
    leadId = $leadId
} | ConvertTo-Json

$webhookResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/payment/webhook" -Method Post -Body $webhookBody -ContentType "application/json"
$webhookResponse | ConvertTo-Json
Write-Host ""

# Test 7: Verify Status Changed to PAGO
Write-Host "7. Verifying Status Changed to PAGO..." -ForegroundColor Yellow
$finalStatus = Invoke-RestMethod -Uri "http://localhost:3001/api/payment/status/$leadId" -Method Get
$finalStatus | ConvertTo-Json
Write-Host ""

Write-Host "All tests completed!" -ForegroundColor Green
