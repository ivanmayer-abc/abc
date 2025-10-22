import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'
import { Toaster } from '@/components/ui/sonner'
import '../globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { BalanceProvider } from '@/contexts/balance-context'
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { NextIntlClientProvider } from 'next-intl'
import Header from './_components/header'
import LowerNav from './_components/lower-nav'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'ALTBET',
    template: '%s | ALTBET'
  },
  description: 'Your Alternative Way of Winning',
  icons: {
    icon: [
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
}

async function SessionWrapper({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  )
}

interface LocaleLayoutProps {
  children: React.ReactNode
  params: {
    locale: string
  }
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: LocaleLayoutProps) {
  let messages;
  
  try {
    if (locale === 'hi') {
      messages = (await import('../../messages/hi.json')).default;
    } else {
      messages = (await import('../../messages/en.json')).default;
    }
  } catch (error) {
    messages = (await import('../../messages/en.json')).default;
  }

  return (
    <html lang={locale} className='touch-manipulation' suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SessionWrapper>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <BalanceProvider>
                <Toaster />
                <Header />
                <main className="md:pt-[66px] pt-[50px]">
                    {children}
                </main>
                <LowerNav />
                <Analytics />
                <SpeedInsights />
              </BalanceProvider>
            </ThemeProvider>
          </SessionWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}