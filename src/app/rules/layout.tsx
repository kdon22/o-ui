import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rules Editor',
  description: 'Business rules editor and management',
}

export default function RulesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen overflow-hidden">
      {children}
    </div>
  )
} 