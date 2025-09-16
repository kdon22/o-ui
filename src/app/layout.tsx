import './globals.css'
import { Inter, JetBrains_Mono, Source_Code_Pro, Fira_Code } from 'next/font/google'
import { cn } from '@/lib/utils/generalUtils'
import { ConditionalProviders } from '@/components/providers/conditional-providers'
import { headers } from 'next/headers'

const fontSans = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-jetbrains',
});

const fontSourceCode = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-mono-source',
});

const fontFiraCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-mono-fira',
});

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
        fontSans.variable,
        fontMono.variable,
        fontSourceCode.variable,
        fontFiraCode.variable
      )}>
        <ConditionalProviders>
          {children}
        </ConditionalProviders>
      </body>
    </html>
  )
} 