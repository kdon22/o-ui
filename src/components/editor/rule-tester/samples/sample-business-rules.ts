// Sample Business Rules for Testing Debug System

export const SAMPLE_BUSINESS_RULES = `// Customer eligibility rules
if customer.age > 18
    eligibleForDiscount = true

// Premium user check
if email.contains("@gmail.com")
    isPremiumUser = true

// VIP service qualification
if booking.total > 1000
    applyVipService = true
    vipLevel = "Gold"

// Discount calculation
if eligibleForDiscount
    discountAmount = booking.total * 0.1

// Final total calculation
finalTotal = booking.total - discountAmount`

export const SAMPLE_VARIABLES = [
  { name: 'customer.age', value: 25, type: 'number', scope: 'local' as const },
  { name: 'email', value: 'john@gmail.com', type: 'string', scope: 'local' as const },
  { name: 'booking.total', value: 1200, type: 'number', scope: 'local' as const }
]

export const SAMPLE_PYTHON_CODE = `# Auto-generated Python code from business rules

# Customer eligibility rules
if customer_age > 18:
    eligibleForDiscount = True

# Premium user check
if "@gmail.com" in email:
    isPremiumUser = True

# VIP service qualification
if booking_total > 1000:
    applyVipService = True
    vipLevel = "Gold"

# Discount calculation
if eligibleForDiscount:
    discountAmount = booking_total * 0.1

# Final total calculation
finalTotal = booking_total - discountAmount` 