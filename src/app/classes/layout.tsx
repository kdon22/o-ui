import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Classes Editor',
  description: 'Global classes library editor and management',
}

export default function ClassesLayout({
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