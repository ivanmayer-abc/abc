'use client'

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import SlotGameCard from "./slots-main-game-card"

const slotGames = [
  {
    name: "Neon Shinjuku",
    image: "/neon-shinjuku/preview.webp",
    href: "/slots/neon-shinjuku",
    demoHref: "/slots/neon-shinjuku/demo"
  },
  {
    name: "Maestro",
    image: "/maestro/preview.webp",
    href: "/slots/maestro",
    demoHref: "/slots/maestro/demo"
  },
  {
    name: "Villager's Dream",
    image: "/villagers-dream/preview.webp",
    href: "/slots/villagers-dream",
    demoHref: "/slots/villagers-dream/demo"
  },
  {
    name: "Rupee Rush",
    image: "/rupee-rush/preview.webp",
    href: "/slots/rupee-rush",
    demoHref: "/slots/rupee-rush/demo"
  },
  {
    name: "Forest Romp",
    image: "/forest-romp/preview.webp",
    href: "/slots/forest-romp",
    demoHref: "/slots/forest-romp/demo"
  },
]

export default function SlotsCarousel() {
  return (
    <main className="w-full flex items-center justify-center mt-4 group/carousel">
      <Carousel
        opts={{
          align: "start",
          loop: true
        }}
        className="w-full h-full"
      >
        <CarouselContent>
          {slotGames.map((game, index) => (
            <CarouselItem key={index} className="basis-4/5 sm:basis-1/2 md:basis-1/4 flex items-center justify-center">
              <SlotGameCard game={game} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover/carousel:opacity-100 group-hover/carousel:disabled:opacity-0 transition-opacity duration-200 z-10 bg-background/80 backdrop-blur-sm border-2 disabled:opacity-0" />
        <CarouselNext className="absolute right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover/carousel:opacity-100 group-hover/carousel:disabled:opacity-0 transition-opacity duration-200 z-10 bg-background/80 backdrop-blur-sm border-2 disabled:opacity-0" />
      </Carousel>
    </main>
  )
}