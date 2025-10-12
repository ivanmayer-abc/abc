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

const Banners = () => {
  return (
    <div className="flex justify-center relative">
        <Carousel
            className="w-full group/carousel"
            opts={{
                align: "start",
                loop: true,
            }}
            plugins={[
                Autoplay({
                  delay: 4000,
                }),
            ]}
          >
        <CarouselContent className="-ml-1">
            {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index} className="sm:pl-0 pl-2 basis-4/5 md:basis-1/2 lg:basis-1/3">
                <div className="sm:p-1">
                    <div className="bg-black border border-white rounded-md">
                        <div className="flex items-center justify-center p-6 h-[200px] relative">
                            <div className="absolute top-5 left-5 font-bold uppercase text-2xl max-w-[70%]">New slots collections awaits!</div>
                            <Link href="/slots" className="absolute bottom-5 left-5 bg-white px-4 py-2 rounded-full text-black">Get started!</Link>
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