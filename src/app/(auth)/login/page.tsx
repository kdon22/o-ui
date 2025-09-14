'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Mail, Shield, Smartphone } from 'lucide-react'

type LoginStep = 'email' | 'totp' | 'success'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get('callbackUrl') || '/'
  
  // Form state
  const [step, setStep] = useState<LoginStep>('email')
  const [email, setEmail] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [rememberMe, setRememberMe] = useState(true) // Default to 7 days
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [deviceTrusted, setDeviceTrusted] = useState(false)

  // Check if returning from magic link
  useEffect(() => {
    const token = searchParams?.get('token')
    const email = searchParams?.get('email')
    
    if (token && email) {
      // Coming back from magic link, proceed to TOTP
      setEmail(email)
      setStep('totp')
      generateTotpCode(email)
    }
  }, [searchParams])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Store preferences
      if (rememberMe) {
        localStorage.setItem('auth_remember_me', 'true')
      }

      // Only use the custom TOTP flow (remove NextAuth email provider)
      setStep('totp')
      await generateTotpCode(email)
      
    } catch (error: any) {
      console.error('Email sign-in error:', error)
      setError('Failed to send verification code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const generateTotpCode = async (emailAddress: string) => {
    try {
      const response = await fetch('/api/auth/totp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: emailAddress,
          purpose: 'login'
        })
      })
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('TOTP generation error:', error)
      setError('Failed to send verification code')
    }
  }

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Sign in using NextAuth's TOTP credentials provider
      const result = await signIn('totp', {
        email,
        code: totpCode,
        redirect: false,
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      if (result?.ok) {
        setStep('success')
        setTimeout(() => router.push(callbackUrl), 1500)
      } else {
        throw new Error('Authentication failed')
      }
      
    } catch (error: any) {
      console.error('TOTP verification error:', error)
      setError(error.message || 'Invalid verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    await generateTotpCode(email)
    setError('')
    // Show success message briefly
    const originalError = error
    setError('New code sent!')
    setTimeout(() => setError(originalError), 2000)
  }

  const renderEmailStep = () => (
    <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-gray-600 mt-2">Sign in to your account with enterprise security</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-12"
        />

        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
          />
          <label htmlFor="remember" className="text-sm text-gray-600">
            Remember me for 7 days
          </label>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 text-base"
        >
          {isLoading ? 'Sending...' : 'Continue with Email'}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        <div className="flex items-center justify-center space-x-2">
          <Shield className="w-4 h-4" />
          <span>Protected by enterprise-grade security</span>
        </div>
      </div>
    </Card>
  )

  const renderTotpStep = () => (
    <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Smartphone className="w-6 h-6 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
        <p className="text-gray-600 mt-2">
          We sent a 6-digit code to<br />
          <span className="font-medium">{email}</span>
        </p>
      </div>

      {error && (
        <Alert variant={error.includes('sent') ? 'default' : 'destructive'} className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleTotpSubmit} className="space-y-4">
        <Input
          type="text"
          placeholder="Enter 6-digit code"
          value={totpCode}
          onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="h-12 text-center text-2xl tracking-widest"
          maxLength={6}
          required
        />

        <Button
          type="submit"
          disabled={isLoading || totpCode.length !== 6}
          className="w-full h-12 text-base"
        >
          {isLoading ? 'Verifying...' : 'Verify Code'}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Button
          variant="link"
          onClick={handleResendCode}
          disabled={isLoading}
          className="text-sm"
        >
          Didn't receive the code? Send again
        </Button>
      </div>

      <div className="mt-4 text-center">
        <Button
          variant="link"
          onClick={() => setStep('email')}
          className="text-sm text-gray-500"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to email
        </Button>
      </div>
    </Card>
  )

  const renderSuccessStep = () => (
    <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm text-center">
      <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <Shield className="w-6 h-6 text-green-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h1>
      <p className="text-gray-600">Redirecting to your dashboard...</p>
    </Card>
  )

  return (
    <>
      {step === 'email' && renderEmailStep()}
      {step === 'totp' && renderTotpStep()}
      {step === 'success' && renderSuccessStep()}
    </>
  )
}

// Loading fallback for Suspense boundary
function LoginPageLoading() {
  return (
    <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
        <p className="text-gray-600 mt-2">Please wait</p>
      </div>
    </Card>
  )
}

// Wrap in Suspense boundary to handle useSearchParams
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageLoading />}>
      <LoginPageContent />
    </Suspense>
  )
}