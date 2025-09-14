// Email-based TOTP Service for Enterprise Authentication
// 
// SIMPLE DEVICE TRACKING APPROACH:
// - Stores device info as simple strings (no complex foreign keys)
// - Detects new devices/locations for enhanced security messaging
// - Follows banking industry patterns for risk assessment
// - No complex device management or UserDevice relationships
//
import { prisma } from "@/lib/prisma"

export enum TotpDeliveryMethod {
  EMAIL = "EMAIL",
  SMS = "SMS",
  AUTHENTICATOR_APP = "AUTHENTICATOR_APP",
}

export interface TotpGenerationResult {
  success: boolean
  code?: string
  expiresAt?: Date
  message?: string
  userId?: string
  riskInfo?: {
    isNewDevice: boolean
    isNewLocation: boolean
    lastSeenDaysAgo: number | null
  }
}

export interface TotpVerificationResult {
  success: boolean
  user?: {
    id: string
    email: string
    name?: string
  }
  error?: string
  remainingAttempts?: number
}

export class TotpService {
  /**
   * Check if this is a new device/location for the user
   * Used for risk assessment and additional security measures
   */
  static async isNewDeviceOrLocation(
    userId: string, 
    deviceInfo?: {
      ipAddress?: string
      userAgent?: string  
      deviceFingerprint?: string
    }
  ): Promise<{
    isNewDevice: boolean
    isNewLocation: boolean
    lastSeenDaysAgo: number | null
  }> {
    if (!deviceInfo) {
      return { isNewDevice: true, isNewLocation: true, lastSeenDaysAgo: null }
    }

    // Look for recent TOTP codes from this user with similar device info
    const recentCode = await prisma.totpCode.findFirst({
      where: {
        userId,
        createdAt: { gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        OR: [
          { deviceId: deviceInfo.deviceFingerprint },
          { ipAddress: deviceInfo.ipAddress },
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    const isNewDevice = !recentCode || recentCode.deviceId !== deviceInfo.deviceFingerprint
    const isNewLocation = !recentCode || recentCode.ipAddress !== deviceInfo.ipAddress
    const lastSeenDaysAgo = recentCode 
      ? Math.floor((Date.now() - recentCode.createdAt.getTime()) / (24 * 60 * 60 * 1000))
      : null

    return { isNewDevice, isNewLocation, lastSeenDaysAgo }
  }

  /**
   * Generate and send a 6-digit TOTP code via email
   * This is what many enterprise sites use instead of authenticator apps
   */
  static async generateAndSendCode(
    email: string,
    purpose: string = "login",
    deviceInfo?: {
      ipAddress?: string
      userAgent?: string
      deviceFingerprint?: string
    }
  ): Promise<TotpGenerationResult> {
    try {
      // Look up user by email
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true }
      })
      
      if (!existingUser) {
        return {
          success: false,
          message: "User not found",
        }
      }
      
      // Check if this is a new device/location for enhanced security messaging
      const riskInfo = await this.isNewDeviceOrLocation(existingUser.id, deviceInfo)
      
      // Generate 6-digit code
      const code = this.generateSixDigitCode()
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      
      // Store in database  
      const totpRecord = await prisma.totpCode.create({
        data: {
          userId: existingUser.id,
          code,
          email,
          deliveryMethod: TotpDeliveryMethod.EMAIL,
          expiresAt,
          purpose,
          // Simple device tracking - no foreign keys
          ipAddress: deviceInfo?.ipAddress,
          userAgent: deviceInfo?.userAgent,
          deviceId: deviceInfo?.deviceFingerprint, // Store as simple string
        },
      })
      
      // Send email using dynamic import to prevent client-side bundling
      const { emailService } = await import("@/lib/auth/providers/email")
      const emailSent = await emailService.sendCode(email, code, purpose)
      
      if (!emailSent) {
        return {
          success: false,
          message: "Failed to send verification code",
        }
      }
      
      return {
        success: true,
        expiresAt,
        message: "Verification code sent to your email",
        userId: existingUser.id,
        riskInfo,
      }
    } catch (error) {
      console.error("TOTP generation error:", error)
      return {
        success: false,
        message: "Failed to generate verification code",
      }
    }
  }
  
  /**
   * Verify a 6-digit TOTP code
   */
  static async verifyCode(
    email: string,
    code: string,
    purpose: string = "login"
  ): Promise<TotpVerificationResult> {
    try {
      // Find the most recent unused code for this email
      const totpCode = await prisma.totpCode.findFirst({
        where: {
          email,
          code,
          purpose,
          isUsed: false,
          isBlocked: false,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      
      if (!totpCode) {
        return {
          success: false,
          error: "Invalid or expired verification code",
        }
      }
      
      // Check if too many attempts
      if (totpCode.attemptCount >= totpCode.maxAttempts) {
        await prisma.totpCode.update({
          where: { id: totpCode.id },
          data: { isBlocked: true },
        })
        
        return {
          success: false,
          error: "Too many verification attempts. Please request a new code.",
        }
      }
      
      // Mark as used
      await prisma.totpCode.update({
        where: { id: totpCode.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      })
      
      return {
        success: true,
        user: {
          id: totpCode.user.id,
          email: totpCode.user.email,
          name: totpCode.user.name || undefined,
        },
      }
    } catch (error) {
      console.error("TOTP verification error:", error)
      return {
        success: false,
        error: "Verification failed. Please try again.",
      }
    }
  }
  
  /**
   * Increment attempt count for invalid codes
   */
  static async incrementAttemptCount(email: string, code: string): Promise<number> {
    const totpCode = await prisma.totpCode.findFirst({
      where: {
        email,
        code,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    if (totpCode) {
      const updated = await prisma.totpCode.update({
        where: { id: totpCode.id },
        data: {
          attemptCount: { increment: 1 },
        },
      })
      
      return updated.maxAttempts - updated.attemptCount
    }
    
    return 0
  }
  
  /**
   * Clean up expired codes (run as background job)
   */
  static async cleanupExpiredCodes(): Promise<number> {
    const result = await prisma.totpCode.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    })
    
    return result.count
  }
  
  /**
   * Generate a secure 6-digit code
   */
  private static generateSixDigitCode(): string {
    // Use crypto for secure random generation
    const crypto = require('crypto')
    const buffer = crypto.randomBytes(4)
    const number = buffer.readUInt32BE(0)
    
    // Ensure it's always 6 digits
    const code = (number % 1000000).toString().padStart(6, '0')
    return code
  }
  
    // Note: Email sending now handled by emailService.sendCode() for DRY approach
  
  /**
   * Check if user has 2FA enabled
   */
  static async is2FAEnabled(userId: string): Promise<boolean> {
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId },
    })
    
    return twoFactorAuth?.isEnabled ?? false
  }
  
  /**
   * Enable 2FA for user
   */
  static async enable2FA(userId: string): Promise<boolean> {
    try {
      await prisma.twoFactorAuth.upsert({
        where: { userId },
        update: {
          isEnabled: true,
          enableEmailTotp: true,
          emailDelivery: TotpDeliveryMethod.EMAIL,
        },
        create: {
          userId,
          secret: "", // Not needed for email-based TOTP
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          isEnabled: true,
          enableEmailTotp: true,
          emailDelivery: TotpDeliveryMethod.EMAIL,
        },
      })
      
      return true
    } catch (error) {
      console.error("Error enabling 2FA:", error)
      return false
    }
  }
  
  /**
   * Disable 2FA for user
   */
  static async disable2FA(userId: string): Promise<boolean> {
    try {
      await prisma.twoFactorAuth.update({
        where: { userId },
        data: {
          isEnabled: false,
          enableEmailTotp: false,
        },
      })
      
      return true
    } catch (error) {
      console.error("Error disabling 2FA:", error)
      return false
    }
  }
} 