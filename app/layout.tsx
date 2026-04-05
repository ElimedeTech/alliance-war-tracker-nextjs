import type { Metadata } from 'next'
import { Orbitron } from 'next/font/google'
import './globals.css'

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '600', '700', '900'],
})

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
      <body className={orbitron.variable}>{children}</body>
    </html>
  )
}
