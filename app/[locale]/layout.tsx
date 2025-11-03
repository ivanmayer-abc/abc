import { NextIntlClientProvider } from 'next-intl'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { BalanceProvider } from '@/contexts/balance-context'
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

interface LocaleLayoutProps {
  children: React.ReactNode
  params: {
    locale: string
  }
}

async function SessionWrapper({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  )
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
    messages = (await import('../../messages/hi.json')).default;
  }

  return (
    <div lang={locale}>
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
              {children}
              <Analytics />
              <SpeedInsights />
            </BalanceProvider>
          </ThemeProvider>
        </SessionWrapper>
      </NextIntlClientProvider>
    </div>
  )
}