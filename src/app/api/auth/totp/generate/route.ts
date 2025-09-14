import { NextRequest, NextResponse } from 'next/server'
import { TotpService } from '@/lib/auth/services/totp'
import { AuthAuditService } from '@/lib/auth/services/audit'
import { SecurityEventType } from "@/lib/auth/services/audit"

export async function POST(request: NextRequest) {
  try {
    // Safely parse JSON with error handling
    let body
    try {
      const text = await request.text()
      
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { success: false, message: 'Request body is required' },
          { status: 400 }
        )
      }
      
      body = JSON.parse(text)
    } catch (jsonError) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { email, purpose = 'login' } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    // Extract device info for audit trail
    const auditInfo = AuthAuditService.extractDeviceInfo(request)
    
    // Prepare simple device info for TOTP
    const deviceInfo = {
      ipAddress: auditInfo.ipAddress,
      userAgent: request.headers.get('user-agent') || undefined,
      deviceFingerprint: auditInfo.deviceId
    }
    
    // Generate and send TOTP code (service will look up user by email)
    const result = await TotpService.generateAndSendCode(
      email,
      purpose,
      deviceInfo
    )

    // Log security event
    if (result.success && result.userId) {
      await AuthAuditService.logSecurityEvent({
        userId: result.userId,
        eventType: SecurityEventType.LOGIN_SUCCESS, // TOTP code generation is a successful step in login
        description: 'TOTP code generated for login',
        ipAddress: auditInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        deviceId: deviceInfo.deviceFingerprint, // Use deviceFingerprint as deviceId
        riskScore: 0, // Default risk score for TOTP generation
        metadata: {
          purpose,
          email: email,
          userAgent: deviceInfo.userAgent,
          deviceFingerprint: deviceInfo.deviceFingerprint,
          isNewDevice: result.riskInfo?.isNewDevice,
          isNewLocation: result.riskInfo?.isNewLocation,
          lastSeenDaysAgo: result.riskInfo?.lastSeenDaysAgo,
        },
      })
    }

    return NextResponse.json(result)
    
  } catch (error) {
    console.error('TOTP generate API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 