"use client"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import Link from "next/link"
import { useRef } from "react"
import { useTranslations } from 'next-intl'

const Banners = () => {
  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false })
  )
  const t = useTranslations('Banners')

  const banners = [
    {
      title: t('slotCollection'),
      cta: t('getStarted'),
      href: "/slots",
      bgColor: "bg-gradient-to-r from-purple-600 to-blue-600"
    },
    {
      title: t('betEvents'),
      cta: t('placeBets'),
      href: "/book",
      bgColor: "bg-gradient-to-r from-green-600 to-emerald-600"
    },
    {
      title: t('fastSupport'),
      cta: t('chatNow'),
      href: "/support", 
      bgColor: "bg-gradient-to-r from-orange-600 to-red-600"
    },
    {
      title: t('accountHistory'),
      cta: t('viewNow'),
      href: "/history",
      bgColor: "bg-gradient-to-r from-yellow-600 to-orange-600"
    },
  ];

  return (
    <div className="flex justify-center relative">
        <Carousel
            className="w-full group/carousel"
            opts={{
                align: "start",
                loop: true,
            }}
            plugins={[plugin.current]}
          >
        <CarouselContent className="-ml-1">
            {banners.map((banner, index) => (
            <CarouselItem key={index} className="sm:pl-0 pl-2 basis-4/5 md:basis-1/2 lg:basis-1/3">
                <div className="sm:p-1">
                    <div className={`${banner.bgColor} border border-white/20 rounded-md overflow-hidden`}>
                        <div className="flex items-center justify-center p-6 h-[160px] sm:h-[200px] relative">
                            <div className="absolute top-5 left-5 font-bold uppercase text-lg sm:text-2xl max-w-[70%] text-white drop-shadow-lg">
                                {banner.title}
                            </div>
                            <Link 
                              href={banner.href} 
                              className="absolute bottom-5 left-5 bg-white px-4 py-2 rounded-full text-black font-semibold hover:bg-gray-100 transition-colors"
                              prefetch={false}
                            >
                                {banner.cta}
                            </Link>
                        </div>
                    </div>
                </div>
            </CarouselItem>
            ))}
        </CarouselContent>

        <CarouselPrevious className="absolute left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover/carousel:opacity-100 group-hover/carousel:disabled:opacity-0 transition-opacity duration-200 z-10 bg-background/80 backdrop-blur-sm border-2 disabled:opacity-0" />
        <CarouselNext className="absolute right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover/carousel:opacity-100 group-hover/carousel:disabled:opacity-0 transition-opacity duration-200 z-10 bg-background/80 backdrop-blur-sm border-2 disabled:opacity-0" />
      </Carousel>
    </div>
  )
}

export default Banners;