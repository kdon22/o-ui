import { verificationCodeTemplate, VerificationCodeData } from './verification-code'

describe('verificationCodeTemplate', () => {
  const mockData: VerificationCodeData = {
    code: '123456',
    purpose: 'login',
    expiryMinutes: 5,
    companyName: 'Orchestrator',
    userEmail: 'test@example.com'
  }

  it('should generate HTML and text versions', () => {
    const result = verificationCodeTemplate(mockData)
    
    expect(result.html).toBeDefined()
    expect(result.text).toBeDefined()
    expect(result.subject).toBeDefined()
  })

  it('should include the verification code in both HTML and text', () => {
    const result = verificationCodeTemplate(mockData)
    
    expect(result.html).toContain('123456')
    expect(result.text).toContain('123456')
  })

  it('should include company name in subject and content', () => {
    const result = verificationCodeTemplate(mockData)
    
    expect(result.subject).toContain('Orchestrator')
    expect(result.html).toContain('Orchestrator')
    expect(result.text).toContain('Orchestrator')
  })

  it('should include user email in security notice', () => {
    const result = verificationCodeTemplate(mockData)
    
    expect(result.html).toContain('test@example.com')
    expect(result.text).toContain('test@example.com')
  })

  it('should include expiry time', () => {
    const result = verificationCodeTemplate(mockData)
    
    expect(result.html).toContain('5 minutes')
    expect(result.text).toContain('5 minutes')
  })

  it('should generate proper subject line', () => {
    const result = verificationCodeTemplate(mockData)
    
    expect(result.subject).toBe('Your login verification code for Orchestrator')
  })
}) 