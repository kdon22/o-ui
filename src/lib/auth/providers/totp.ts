import { authenticator } from "otplib"

// Configure TOTP for 6-digit codes
authenticator.options = {
  digits: 6,
  window: 1,
  step: 300, // 5 minutes
}

export const totpProvider = {
  id: "totp",
  name: "TOTP",
  type: "credentials" as const,
  
  credentials: {
    email: { label: "Email", type: "email" },
    code: { label: "6-digit code", type: "text" },
  },
  
  async authorize(credentials: any) {
    if (!credentials?.email || !credentials?.code) {
      return null
    }

    try {
      // Get stored TOTP secret for this email
      const storedSecret = await getTotpSecret(credentials.email)
      if (!storedSecret) {
        return null
      }

      // Verify the 6-digit code
      const isValid = authenticator.verify({
        token: credentials.code,
        secret: storedSecret,
      })

      if (!isValid) {
        return null
      }

      // Find or create user
      const user = await findOrCreateUser(credentials.email)
      return user
    } catch (error) {
      console.error("TOTP verification failed:", error)
      return null
    }
  },
}

// Helper function to generate and send TOTP code
export async function generateAndSendTotpCode(email: string): Promise<boolean> {
  try {
    // Generate a secret for this email session
    const secret = authenticator.generateSecret()
    
    // Generate 6-digit code
    const code = authenticator.generate(secret)
    
    // Store secret temporarily (you might want to use Redis or similar)
    await storeTotpSecret(email, secret)
    
    // Send code via email
    await sendTotpEmail(email, code)
    
    return true
  } catch (error) {
    console.error("Failed to generate/send TOTP code:", error)
    return false
  }
}

// Helper functions (implement based on your data storage)
async function getTotpSecret(email: string): Promise<string | null> {
  // Implement based on your storage solution
  // This could be Redis, database, or in-memory store
  return null
}

async function storeTotpSecret(email: string, secret: string): Promise<void> {
  // Implement based on your storage solution
  // Store with expiration (5-10 minutes)
}

async function findOrCreateUser(email: string) {
  // Implement user lookup/creation logic
  return { id: "user-id", email }
}

async function sendTotpEmail(email: string, code: string): Promise<void> {
  const { createTransport } = await import("nodemailer")
  const transport = createTransport({
    host: process.env.SMTP_HOST || "smtp.mail.me.com",
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
    secure: process.env.SMTP_SECURE === "true",
  })

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your verification code</h2>
      <p>Enter this 6-digit code to sign in:</p>
      <div style="font-size: 32px; font-weight: bold; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 20px 0; letter-spacing: 4px;">
        ${code}
      </div>
      <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes.</p>
    </div>
  `

  const text = `
    Your verification code: ${code}
    
    This code will expire in 5 minutes.
  `

  await transport.sendMail({
    to: email,
    from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
    subject: "Your verification code",
    text,
    html,
  })
} 