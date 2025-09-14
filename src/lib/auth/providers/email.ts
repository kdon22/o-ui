import { createTransport, Transporter } from "nodemailer"
import { verificationCodeTemplate, VerificationCodeData, antiSpamHeaders } from "../../email"

interface EmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

class EmailService {
  private transporter!: Transporter
  private isConfigured: boolean = false

  constructor() {
    this.validateConfiguration()
    this.createTransporter()
  }

  private validateConfiguration(): void {
    const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM']
    const missing = requiredVars.filter(varName => !process.env[varName])
    
    if (missing.length > 0) {
      console.warn(`⚠️ Missing SMTP environment variables: ${missing.join(', ')}`)
      console.warn('📧 Email service will not function until configured')
      this.isConfigured = false
      return
    }

    this.isConfigured = true
  }

  private createTransporter(): void {
    if (!this.isConfigured) {
      // Create a mock transporter that logs instead of sending
      this.transporter = createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      })
      return
    }

    // Gmail-optimized configuration
    const config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // false for 587 (TLS)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Gmail-specific optimizations
      tls: {
        rejectUnauthorized: false
      },
      pool: true, // Use connection pooling
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 14 // Gmail has rate limits
    }

    this.transporter = createTransport(config)
  }

  async send(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.isConfigured) {
        console.log('📧 [DEV MODE] Email would be sent:')
        console.log(`   To: ${options.to}`)
        console.log(`   Subject: ${options.subject}`)
        console.log(`   Body: ${options.text.substring(0, 100)}...`)
        return true // Return success in dev mode
      }

      const mailOptions = {
        from: {
          name: 'Orchestrator',
          address: process.env.EMAIL_FROM!
        },
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text,
        headers: {
          ...antiSpamHeaders,
          'List-Unsubscribe': '<mailto:unsubscribe@orchestrator.com>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply'
        },
        // Gmail-specific settings
        messageId: `<${Date.now()}-${Math.random().toString(36)}@orchestrator.com>`,
        date: new Date()
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log(`✅ Email sent successfully to ${options.to} (ID: ${result.messageId})`)
      return !!result.messageId
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`❌ Email send failed: ${errorMessage}`)
      
      // Log specific Gmail errors for troubleshooting
      if (errorMessage.includes('Invalid login')) {
        console.error('🔑 Gmail authentication failed. Check SMTP_USER and SMTP_PASS (use App Password, not regular password)')
      } else if (errorMessage.includes('ECONNREFUSED')) {
        console.error('🌐 Connection refused. Check SMTP_HOST and SMTP_PORT')
      } else if (errorMessage.includes('rate limit')) {
        console.error('⏱️ Gmail rate limit exceeded. Wait before retrying')
      }
      
      return false
    }
  }

  // Simple helper for TOTP codes with enhanced template data
  async sendCode(email: string, code: string, purpose: string = 'login'): Promise<boolean> {
    const templateData: VerificationCodeData = {
      code,
      purpose,
      expiryMinutes: 5,
      companyName: 'Orchestrator',
      userEmail: email
    }
    
    const template = verificationCodeTemplate(templateData)
    
    return this.send({
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html
    })
  }

  // Enhanced magic link with better security
  async sendMagicLink(email: string, url: string): Promise<boolean> {
    const text = `Sign in to Orchestrator

Click this secure link to access your account:

${url}

⏱️ This link expires in 24 hours for security
🔒 If you didn't request this, please ignore this email

Questions? Contact support@orchestrator.com

© 2024 Orchestrator. This is an automated security message.`
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Sign in to Orchestrator</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #c53030;">Orchestrator</h1>
        <h2 style="color: #333;">Sign in to your account</h2>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
        <p style="margin-bottom: 25px; color: #555;">Click the button below to securely access your account:</p>
        
        <a href="${url}" style="display: inline-block; background: #c53030; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Sign In to Orchestrator
        </a>
        
        <p style="margin-top: 25px; font-size: 14px; color: #666;">
            ⏱️ This link expires in 24 hours<br>
            🔒 If you didn't request this, please ignore this email
        </p>
    </div>
    
    <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">
        Questions? Contact <a href="mailto:support@orchestrator.com">support@orchestrator.com</a><br>
        © 2024 Orchestrator. This is an automated security message.
    </div>
</body>
</html>`
    
    return this.send({
      to: email,
      subject: 'Sign in to Orchestrator',
      text,
      html
    })
  }

  // Health check method
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('📧 Email service not configured - cannot test connection')
      return false
    }

    try {
      await this.transporter.verify()
      console.log('✅ SMTP connection verified successfully')
      return true
    } catch (error) {
      console.error('❌ SMTP connection failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const emailService = new EmailService()

// Export for backwards compatibility and testing
export const emailProvider = {
  server: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  from: process.env.EMAIL_FROM,
}