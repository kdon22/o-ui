# Orchestrator Email System

A beautiful, modern email template system with anti-spam optimization and enterprise-grade design.

## Features

- 🎨 **Beautiful Templates**: Modern, responsive email templates with Orchestrator branding
- 📱 **Mobile-First**: Responsive design that works across all email clients
- 🛡️ **Anti-Spam**: Built-in anti-spam headers and best practices
- 💼 **Enterprise Ready**: Professional design with brand consistency
- 🔒 **Security Focused**: Clear security notices and user verification
- ✅ **Gmail Optimized**: Inline styling for Gmail compatibility

## Quick Start

### Sending a Verification Code

```typescript
import { emailService } from '@/lib/auth/providers/email'

// Send a verification code
await emailService.sendCode('user@example.com', '123456', 'login')
```

### Using Templates Directly

```typescript
import { verificationCodeTemplate } from '@/lib/email'

const template = verificationCodeTemplate({
  code: '123456',
  purpose: 'login',
  expiryMinutes: 5,
  companyName: 'Orchestrator',
  userEmail: 'user@example.com'
})

// Use template.html, template.text, template.subject
```

## Directory Structure

```
src/lib/email/
├── templates/
│   └── auth/
│       └── verification-code.ts    # TOTP verification template
├── utils/
│   ├── anti-spam.ts               # Anti-spam utilities
│   └── template-helpers.ts        # Design system & helpers
├── index.ts                       # Main exports
└── README.md                      # This file
```

## Template Features

### Verification Code Template

The `verificationCodeTemplate` includes:

- **Professional Header**: Orchestrator branding with SVG logo
- **Code Display**: Large, prominent verification code with copy-friendly formatting
- **Clear Instructions**: Step-by-step usage instructions
- **Security Notice**: User email confirmation and security warning
- **Support Section**: Easy access to help and support
- **Professional Footer**: Company information and legal notices

### Anti-Spam Features

- **Proper Headers**: Industry-standard anti-spam headers
- **Text-to-HTML Ratio**: Balanced content to avoid spam filters
- **No Trigger Words**: Avoids common spam trigger phrases
- **Professional Structure**: Clean, legitimate email structure
- **Unsubscribe Headers**: Proper list management headers

## Environment Variables

Required environment variables:

```env
# SMTP Configuration
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
EMAIL_FROM=noreply@orchestrator.com

# Optional
COMPANY_NAME=Orchestrator
SUPPORT_EMAIL=support@orchestrator.com
```

## Design System

The email system uses a consistent design system:

### Colors
- **Primary**: `#c53030` (Orchestrator Red)
- **Secondary**: `#e53e3e` (Lighter Red)
- **Grays**: Tailwind-inspired gray scale
- **Status Colors**: Success (`#38a169`), Warning (`#ed8936`)

### Typography
- **System Font**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto...`
- **Monospace**: `"SF Mono", Monaco, Consolas...` (for codes)

### Spacing
- Consistent spacing scale from `8px` to `50px`
- Mobile-responsive padding and margins

## Testing

Run the template tests:

```bash
npm test src/lib/email/templates/auth/verification-code.test.ts
```

## Adding New Templates

1. Create your template in `templates/[category]/[template-name].ts`
2. Export it from `index.ts`
3. Add tests in `[template-name].test.ts`
4. Update this README

### Template Structure

```typescript
export interface YourTemplateData {
  // Define your data interface
}

export const yourTemplate = (data: YourTemplateData) => {
  const html = `<!-- Your HTML template with inline styles -->`
  const text = `Your plain text version`
  
  return {
    subject: `Your subject line`,
    html: html.trim(),
    text: text.trim()
  }
}
```

## Best Practices

1. **Always use inline styles** for email client compatibility
2. **Provide both HTML and text versions** for accessibility
3. **Include security notices** for auth-related emails
4. **Use consistent branding** with the design system
5. **Test across email clients** before deploying
6. **Follow anti-spam guidelines** from `utils/anti-spam.ts`

## Email Client Support

Tested and optimized for:
- Gmail (Web, Mobile, App)
- Outlook (Web, Desktop, Mobile)
- Apple Mail (macOS, iOS)
- Yahoo Mail
- Thunderbird
- Mobile clients (iOS, Android)

## Security Considerations

- Never include sensitive data beyond verification codes
- Always include security notices for auth emails
- Use proper SPF, DKIM, and DMARC records
- Monitor bounce rates and spam complaints
- Implement proper rate limiting

## Future Enhancements

- [ ] Magic link templates
- [ ] Password reset templates
- [ ] Notification templates
- [ ] Marketing templates
- [ ] Multi-language support
- [ ] Template analytics
- [ ] A/B testing framework 