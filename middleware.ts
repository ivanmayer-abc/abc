import NextAuth from "next-auth"
import createIntlMiddleware from 'next-intl/middleware';
import authConfig from "./auth.config"
import { DEFAULT_LOGIN_REDIRECT, apiAuthPrefix, authRoutes, bookRoute, publicRoutes } from "./routes"

const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'hi'],
  defaultLocale: 'hi',
  localePrefix: 'as-needed'
});

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isApiRoute = nextUrl.pathname.startsWith('/api')
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix)
  const isBookRoute = nextUrl.pathname.startsWith(bookRoute)
  
  const pathnameWithoutLocale = nextUrl.pathname.replace(/^\/(en|hi)/, '') || '/'
  const isPublicRoute = publicRoutes.includes(pathnameWithoutLocale)
  const isAuthRoute = authRoutes.includes(pathnameWithoutLocale)

  if (isApiRoute || isApiAuthRoute || isBookRoute) {
    return null
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl))
    }
    return intlMiddleware(req)
  }

  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname
    if (nextUrl.search) {
      callbackUrl += nextUrl.search
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl)
    const localePrefix = nextUrl.pathname.startsWith('/en') ? '/en' : nextUrl.pathname.startsWith('/hi') ? '/hi' : ''
    const redirectUrl = `${localePrefix}/login?callbackUrl=${encodedCallbackUrl}`

    return Response.redirect(new URL(redirectUrl, nextUrl))
  }

  return intlMiddleware(req)
})

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
    '/',
    '/(en|hi)/:path*'
  ]
}