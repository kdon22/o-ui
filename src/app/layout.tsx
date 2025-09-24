import './globals.css'
import { Inter, JetBrains_Mono, Fira_Code } from 'next/font/google'
import { cn } from '@/lib/utils/generalUtils'
import { ConditionalProviders } from '@/components/providers/conditional-providers'
import { headers } from 'next/headers'

// Font configurations
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-jetbrains',
  display: 'swap',
})

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-mono-fira', 
  display: 'swap',
})

export const metadata = {
  title: 'O-UI',
  description: 'O-UI Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Keep as server component; ConditionalProviders handles client-only logic
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased", 
        inter.variable,
        jetbrainsMono.variable,
        firaCode.variable
      )}>
        <ConditionalProviders>
          {children}
        </ConditionalProviders>
      </body>
    </html>
  )
} 