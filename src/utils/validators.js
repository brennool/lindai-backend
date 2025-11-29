import validator from 'validator'

// Sanitize string input (prevent XSS)
export function sanitizeString(input) {
    if (typeof input !== 'string') return ''

    // Remove HTML tags and trim
    return validator.escape(validator.trim(input))
}

// Email validation
export function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false

    // Use validator.js for robust email validation
    return validator.isEmail(email, {
        allow_display_name: false,
        require_tld: true,
        allow_utf8_local_part: false
    })
}

// WhatsApp validation (Brazilian format: 10-11 digits)
export function isValidWhatsApp(whatsapp) {
    if (!whatsapp || typeof whatsapp !== 'string') return false

    // Remove all non-digit characters
    const cleaned = whatsapp.replace(/\D/g, '')

    // Check if it has 10 or 11 digits (BR format)
    // Also validate it's not all zeros or sequential numbers
    if (cleaned.length < 10 || cleaned.length > 11) return false

    // Reject obviously fake numbers
    const allSame = /^(\d)\1+$/.test(cleaned)
    if (allSame) return false

    return true
}

// Sanitize phone number (keep only digits)
export function sanitizePhone(phone) {
    if (typeof phone !== 'string') return ''
    return phone.replace(/\D/g, '')
}

// Validate name (prevent SQL injection and XSS)
export function isValidName(name) {
    if (!name || typeof name !== 'string') return false

    const trimmed = name.trim()

    // Must be at least 2 characters
    if (trimmed.length < 2) return false

    // Must not exceed reasonable length
    if (trimmed.length > 100) return false

    // Only allow letters, spaces, hyphens, and common accented characters
    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/
    if (!nameRegex.test(trimmed)) return false

    // Reject SQL injection patterns
    const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b|--|;|\/\*|\*\/|xp_|sp_)/i
    if (sqlPatterns.test(trimmed)) return false

    return true
}

// Validate lead data with sanitization
export function validateLeadData(name, email) {
    const errors = []

    // Validate and sanitize name
    if (!name || !isValidName(name)) {
        errors.push('Nome inválido (mínimo 2 caracteres, apenas letras e espaços)')
    }

    // Validate email
    if (!email || !isValidEmail(email)) {
        errors.push('E-mail inválido')
    }

    return {
        isValid: errors.length === 0,
        errors,
        sanitized: {
            name: sanitizeString(name),
            email: email ? validator.normalizeEmail(email.trim().toLowerCase()) : ''
        }
    }
}
