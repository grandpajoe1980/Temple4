import type { Metadata } from 'next'
import './globals.css'
import Providers from './components/providers'
import SiteHeader from './components/ui/SiteHeader'

export const metadata: Metadata = {
  title: 'Asembli',
  description: 'Multi-tenant platform for religious organizations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Suppress hydration warnings on the root HTML element. Some browser
    // extensions (or other client-side actors) may inject attributes into
    // the DOM before React hydrates, producing spurious hydration mismatch
    // errors. Using `suppressHydrationWarning` silences these warnings for
    // the subtree so they don't fill the console during development.
    <html lang="en" suppressHydrationWarning>
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
          </div>
        </Providers>
      </body>
    </html>
  )
}
