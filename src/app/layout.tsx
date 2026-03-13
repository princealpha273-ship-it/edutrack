import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EduTrack - Smart School Management System',
  description: 'Track student performance, fees, announcements, and more',
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
