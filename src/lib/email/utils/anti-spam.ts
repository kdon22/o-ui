/**
 * Anti-spam utilities for email templates
 * These help ensure emails don't get marked as spam
 */

export const antiSpamHeaders = {
  'X-Priority': '3',
  'X-MSMail-Priority': 'Normal',
  'X-Mailer': 'Orchestrator Email Service',
  'X-MimeOLE': 'Produced By Orchestrator',
  'Precedence': 'bulk'
}

export const antiSpamBestPractices = {
  // Ensure good text-to-HTML ratio
  textToHtmlRatio: 0.3,
  
  // Avoid spam trigger words
  avoidWords: [
    'FREE', 'URGENT', 'WINNER', 'CONGRATULATIONS', 
    'CLICK HERE', 'LIMITED TIME', 'ACT NOW'
  ],
  
  // Recommended email structure
  structure: {
    maxWidth: 600,
    minFontSize: 12,
    maxFontSize: 36,
    includeAltText: true,
    includeUnsubscribe: false // Not needed for transactional emails
  }
}

export const validateEmailContent = (html: string, text: string): boolean => {
  // Basic validation to ensure content meets anti-spam criteria
  const htmlLength = html.length
  const textLength = text.length
  
  if (textLength === 0) return false
  if (htmlLength / textLength > 5) return false // HTML shouldn't be 5x longer than text
  
  return true
} 