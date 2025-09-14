export interface VerificationCodeData {
  code: string
  purpose: string
  expiryMinutes: number
  companyName: string
  userEmail: string
}

export const verificationCodeTemplate = (data: VerificationCodeData) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
    <title>Your ${data.purpose} verification code</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.5; color: #333333;">
    <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #c53030 0%, #e53e3e 100%); padding: 24px 20px; text-align: center;">
            <div style="margin-bottom: 8px;">
                <svg width="80" height="24" viewBox="0 0 300 100" style="display: block; margin: 0 auto;">
                    <circle cx="40" cy="50" r="18" fill="none" stroke="#ffffff" stroke-width="2"/>
                    <circle cx="40" cy="50" r="6" fill="none" stroke="#ffffff" stroke-width="2"/>
                    <line x1="58" y1="50" x2="90" y2="35" stroke="#ffffff" stroke-width="2"/>
                    <line x1="90" y1="35" x2="130" y2="50" stroke="#ffffff" stroke-width="2"/>
                    <line x1="130" y1="50" x2="170" y2="35" stroke="#ffffff" stroke-width="2"/>
                    <line x1="170" y1="35" x2="210" y2="50" stroke="#ffffff" stroke-width="2"/>
                    <circle cx="90" cy="35" r="8" fill="#ffffff"/>
                    <circle cx="130" cy="50" r="7" fill="#ffffff"/>
                    <circle cx="170" cy="35" r="8" fill="#ffffff"/>
                    <circle cx="210" cy="50" r="10" fill="#ffffff"/>
                </svg>
            </div>
            <h1 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0; letter-spacing: -0.3px;">
                ORCHESTRATOR
            </h1>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 24px 20px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #1a202c; font-size: 20px; font-weight: 600; margin: 0 0 8px 0; letter-spacing: -0.2px;">
                    Your ${data.purpose} verification code
                </h2>
                <p style="color: #4a5568; font-size: 14px; margin: 0;">
                    Enter this code to continue with ${data.companyName}
                </p>
            </div>
            
            <!-- Code Display -->
            <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; position: relative;">
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #c53030 0%, #e53e3e 50%, #c53030 100%);"></div>
                <p style="color: #4a5568; font-size: 12px; font-weight: 500; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                    Verification Code
                </p>
                <div style="font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 32px; font-weight: 700; color: #1a202c; letter-spacing: 6px; margin: 0; text-align: center; padding: 8px; background: #ffffff; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    ${data.code}
                </div>
            </div>
            
            <!-- Compact Instructions & Security -->
            <div style="background: #f0fff4; border-left: 3px solid #38a169; padding: 12px; margin: 16px 0; border-radius: 0 6px 6px 0;">
                <p style="color: #2d3748; font-size: 13px; margin: 0 0 8px 0; font-weight: 500;">
                    Copy the code above and paste it into ${data.companyName}. Code expires in ${data.expiryMinutes} minutes.
                </p>
                <p style="color: #4a5568; font-size: 12px; margin: 0;">
                    If you didn't request this code, please ignore this email.
                </p>
            </div>
            
            <!-- Support -->
            <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                <p style="color: #4a5568; font-size: 12px; margin: 0 0 4px 0;">
                    Need help? <a href="mailto:support@orchestrator.com" style="color: #c53030; text-decoration: none; font-weight: 500;">Contact Support</a>
                </p>
                <p style="color: #718096; font-size: 11px; margin: 0;">
                    © 2024 ${data.companyName}. This is an automated security message.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
  `

  const text = `
${data.companyName.toUpperCase()} - Your ${data.purpose} verification code

Your verification code: ${data.code}

Copy this code and paste it into ${data.companyName}. Code expires in ${data.expiryMinutes} minutes.

If you didn't request this code, please ignore this email.

Need help? Contact support@orchestrator.com

© 2024 ${data.companyName}. This is an automated security message.
  `

  return {
    subject: `Your ${data.purpose} verification code for ${data.companyName}`,
    html: html.trim(),
    text: text.trim()
  }
} 