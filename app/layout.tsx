import type { Metadata } from 'next'
import './globals.css'
import Providers from './components/providers'
import SiteHeader from './components/ui/SiteHeader'
import SiteFooter from './components/ui/SiteFooter'

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
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Providers>
          <div className="flex min-h-screen flex-col bg-background/40">
            <SiteHeader />
            <main id="main-content" className="flex-1 focus-visible:outline-none">
              {children}
            </main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  )
}
