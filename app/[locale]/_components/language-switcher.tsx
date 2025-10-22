'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/lib/i18n/navigation'
import { useTransition } from 'react'

export default function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()

  const onSelectChange = (nextLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale })
    })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onSelectChange('en')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          locale === 'en' 
            ? 'bg-red-600 text-white' 
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
        disabled={isPending}
      >
        EN
      </button>
      <button
        onClick={() => onSelectChange('hi')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          locale === 'hi' 
            ? 'bg-red-600 text-white' 
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
        disabled={isPending}
      >
        HI
      </button>
    </div>
  )
}