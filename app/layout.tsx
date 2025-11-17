import type { Metadata } from 'next'
// Temporarily disabled due to network restrictions
// import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './components/providers'

// const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Temple Platform',
  description: 'Multi-tenant platform for religious organizations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
