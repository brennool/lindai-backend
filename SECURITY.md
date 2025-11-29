# 🔐 Security Implementation - LindAI Backend

## ✅ Implemented Security Features

### 1. Webhook Signature Validation (CRITICAL)

**File:** `server/src/utils/mercadoPagoHelper.js`

**Function:** `verifyMercadoPagoWebhook(req)`

**Security Measures:**
- ✅ **HMAC-SHA256 Signature Verification**: Validates that webhooks actually come from Mercado Pago
- ✅ **Timing-Safe Comparison**: Uses `crypto.timingSafeEqual()` to prevent timing attacks
- ✅ **Replay Attack Prevention**: Rejects webhooks older than 5 minutes
- ✅ **Header Validation**: Requires `x-signature` and `x-request-id` headers
- ✅ **Production Mode Enforcement**: Blocks unsigned webhooks in production

**How it Works:**
```javascript
// Mercado Pago sends: x-signature: "ts=1234567890,v1=hash"
// We verify by:
// 1. Parsing timestamp and hash
// 2. Constructing manifest: "id:123;request-id:abc;ts:1234567890;"
// 3. Calculating HMAC-SHA256(manifest, WEBHOOK_SECRET)
// 4. Comparing with received hash (timing-safe)
// 5. Checking timestamp age (max 5 minutes)
```

**Configuration Required:**
```env
WEBHOOK_SECRET=your_strong_random_secret_here
NODE_ENV=production
```

---

### 2. Input Sanitization & Validation

**File:** `server/src/utils/validators.js`

**Security Measures:**

#### A. SQL Injection Prevention
- ✅ **Pattern Matching**: Rejects SQL keywords (SELECT, INSERT, UPDATE, DELETE, DROP, etc.)
- ✅ **Special Character Blocking**: Blocks `--`, `;`, `/*`, `*/`, `xp_`, `sp_`
- ✅ **Type Validation**: Ensures all inputs are strings before processing

**SQL Injection Patterns Blocked:**
```javascript
const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b|--|;|\/\*|\*\/|xp_|sp_)/i
```

#### B. XSS (Cross-Site Scripting) Prevention
- ✅ **HTML Escaping**: Uses `validator.escape()` to convert `<`, `>`, `&`, `"`, `'` to HTML entities
- ✅ **Tag Stripping**: Removes all HTML tags from input
- ✅ **Whitespace Trimming**: Removes leading/trailing whitespace

**Example:**
```javascript
Input:  "<script>alert('XSS')</script>Maria"
Output: "&lt;script&gt;alert(&#x27;XSS&#x27;)&lt;/script&gt;Maria"
```

#### C. Name Validation
- ✅ **Character Whitelist**: Only allows letters (a-z, A-Z, À-ÿ), spaces, hyphens, apostrophes
- ✅ **Length Limits**: Minimum 2 characters, maximum 100 characters
- ✅ **No Numbers or Special Characters**: Prevents injection attempts

#### D. Email Validation
- ✅ **RFC Compliant**: Uses `validator.isEmail()` with strict options
- ✅ **TLD Required**: Must have valid top-level domain (.com, .br, etc.)
- ✅ **Normalization**: Converts to lowercase and normalizes format

#### E. WhatsApp Validation
- ✅ **Brazilian Format**: Validates 10-11 digit phone numbers
- ✅ **Fake Number Detection**: Rejects numbers with all same digits (11111111111)
- ✅ **Digit-Only**: Strips all non-numeric characters

---

### 3. Environment Variable Security

**File:** `server/.env.example`

**Security Measures:**
- ✅ **No Secrets in Code**: All sensitive data in `.env` file
- ✅ **Gitignored**: `.env` file is in `.gitignore` (never committed)
- ✅ **Example Template**: `.env.example` provided without real credentials
- ✅ **Production Checks**: Code validates that default/placeholder values are not used in production

**Required Environment Variables:**
```env
# CRITICAL: Change these in production!
MP_ACCESS_TOKEN=your_mercado_pago_token
WEBHOOK_SECRET=your_strong_random_secret
NODE_ENV=production
```

---

### 4. Controller Security Updates

**File:** `server/src/controllers/leadController.js`

**Changes:**
```javascript
// BEFORE (INSECURE):
const lead = await Lead.create(
    name.trim(),
    whatsapp,
    email.trim()
)

// AFTER (SECURE):
const validation = validateLeadData(name, whatsapp, email)
if (!validation.isValid) {
    return res.status(400).json({ errors: validation.errors })
}
const { name: cleanName, whatsapp: cleanWhatsApp, email: cleanEmail } = validation.sanitized
const lead = await Lead.create(cleanName, cleanWhatsApp, cleanEmail)
```

**File:** `server/src/controllers/paymentController.js`

**Changes:**
```javascript
// BEFORE (INSECURE):
if (!verifyWebhookSignature(payload, signature)) {
    return res.status(401).json({ message: 'Invalid signature' })
}

// AFTER (SECURE):
const verification = verifyMercadoPagoWebhook(req)
if (!verification.valid) {
    console.error('❌ Webhook verification failed:', verification.reason)
    return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid webhook signature',
        reason: verification.reason
    })
}
```

---

## 🚨 Security Checklist for Production

### Before Going Live:

- [ ] **Generate Strong WEBHOOK_SECRET**
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- [ ] **Set NODE_ENV=production**
  ```env
  NODE_ENV=production
  ```

- [ ] **Add Real Mercado Pago Token**
  - Get from: https://www.mercadopago.com.br/developers/panel/credentials
  - Use **Production** credentials (not Test)

- [ ] **Configure Mercado Pago Webhook**
  - URL: `https://yourdomain.com/api/payment/webhook`
  - Events: Select "Payments"
  - Copy the webhook secret to `.env`

- [ ] **Enable HTTPS**
  - Mercado Pago requires HTTPS for webhooks
  - Use Let's Encrypt or Cloudflare

- [ ] **Rate Limiting** (TODO)
  - Add `express-rate-limit` to prevent brute force
  - Limit: 10 requests/minute per IP for `/api/lead/capture`

- [ ] **CORS Configuration**
  - Update `FRONTEND_URL` in `.env` to your production domain
  - Never use `*` for CORS origin in production

- [ ] **Database Backups**
  - Set up automated SQLite backups
  - Consider migrating to PostgreSQL for production

---

## 🛡️ Attack Vectors Mitigated

| Attack Type | Mitigation | Status |
|-------------|------------|--------|
| SQL Injection | Pattern matching + parameterized queries | ✅ Implemented |
| XSS (Cross-Site Scripting) | HTML escaping + input sanitization | ✅ Implemented |
| Webhook Forgery | HMAC-SHA256 signature verification | ✅ Implemented |
| Replay Attacks | Timestamp validation (5 min window) | ✅ Implemented |
| Timing Attacks | `crypto.timingSafeEqual()` | ✅ Implemented |
| Fake Payments | Signature verification + lead validation | ✅ Implemented |
| Brute Force | Rate limiting | ⚠️ TODO |
| CSRF | CORS configuration | ✅ Implemented |

---

## 📝 Testing Security

### Test Webhook Signature Validation:

```bash
# Valid webhook (will be accepted in dev mode)
curl -X POST http://localhost:3001/api/payment/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: ts=1234567890,v1=abc123" \
  -H "x-request-id: test-123" \
  -d '{"type":"payment","data":{"id":"123","status":"approved"},"leadId":1}'

# Invalid webhook (will be rejected)
curl -X POST http://localhost:3001/api/payment/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"payment"}'
```

### Test Input Sanitization:

```bash
# SQL Injection attempt (will be rejected)
curl -X POST http://localhost:3001/api/lead/capture \
  -H "Content-Type: application/json" \
  -d '{"name":"Maria; DROP TABLE leads;--","whatsapp":"11987654321","email":"test@test.com"}'

# XSS attempt (will be sanitized)
curl -X POST http://localhost:3001/api/lead/capture \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>Maria","whatsapp":"11987654321","email":"test@test.com"}'
```

---

## 🔍 Monitoring & Logging

All security events are logged:

- ✅ `❌ Invalid webhook signature!` - Potential attack attempt
- ✅ `⚠️ Webhook timestamp too old` - Replay attack attempt
- ✅ `⚠️ CRITICAL: Webhook secret not properly configured!` - Configuration issue
- ✅ `✅ Webhook signature verified successfully` - Valid webhook received

**Recommendation:** Set up log monitoring (e.g., Sentry, LogRocket) to alert on security events.

---

## 📚 References

- [Mercado Pago Webhook Security](https://www.mercadopago.com.br/developers/en/docs/your-integrations/notifications/webhooks)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [validator.js Documentation](https://github.com/validatorjs/validator.js)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
