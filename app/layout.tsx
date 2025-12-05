import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Alliance War Tracker',
  description: 'Marvel Contest of Champions Alliance War Season Tracker with Real-time Collaboration',
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
