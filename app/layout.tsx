import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GitHub AI Agent',
  description: 'AI-powered GitHub repository manager',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
