import { NextRequest, NextResponse } from 'next/server'
import { TotpService } from '@/lib/auth/services/totp'
import { AuthAuditService, LoginResult } from '@/lib/auth/services/audit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, purpose = 'login' } = body

    // Validate required fields
    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and code are required' },
        { status: 400 }
      )
    }

    // Extract device info for audit trail
    const deviceInfo = AuthAuditService.extractDeviceInfo(request)
    
    // Verify TOTP code
    const result = await TotpService.verifyCode(email, code, purpose)

    // Log the verification attempt
    if (result.success && result.user) {
      // Successful verification
      await AuthAuditService.logLoginAttempt({
        userId: result.user.id,
        email,
        result: LoginResult.SUCCESS,
        ipAddress: deviceInfo.ipAddress,
        userAgent: request.headers.get('user-agent') || undefined,
        deviceFingerprint: deviceInfo.deviceId,
      })

      await AuthAuditService.logSecurityEvent({
        userId: result.user.id,
        eventType: 'TOTP_VERIFIED' as any, // Will be added to enum
        description: `TOTP code verified successfully for ${purpose}`,
        ipAddress: deviceInfo.ipAddress,
        deviceId: deviceInfo.deviceId,
        metadata: { purpose, email },
      })
    } else {
      // Failed verification - increment attempt count
      const remainingAttempts = await TotpService.incrementAttemptCount(email, code)
      
      await AuthAuditService.logSecurityEvent({
        eventType: 'TOTP_FAILED' as any, // Will be added to enum
        description: `TOTP code verification failed for ${email}`,
        ipAddress: deviceInfo.ipAddress,
        deviceId: deviceInfo.deviceId,
        metadata: { purpose, email, remainingAttempts },
      })

      return NextResponse.json({
        success: false,
        error: result.error,
        remainingAttempts,
      })
    }

    return NextResponse.json(result)
    
  } catch (error) {
    console.error('TOTP verify API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 