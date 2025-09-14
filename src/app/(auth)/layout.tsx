import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Secure login with enterprise-grade authentication',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {children}
      </div>
    </div>
  )
} 