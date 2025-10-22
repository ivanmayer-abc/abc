import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
    image: "/hindi/preview.webp",
    href: "/slots/rupee-rush",
    demoHref: "/slots/rupee-rush/demo"
  },
  {
    name: "Forest Romp",
    image: "/forest-romp/preview.webp",
    href: "/slots/forest-romp",
    demoHref: "/slots/forest-romp/demo"
  },
];

const SlotsMain = () => {
    return (
        <div className="mt-5 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold tracking-tight">Slot games</h2>
                </div>
                
                <Link href="/slots" className="w-full sm:w-auto">
                <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto justify-center">
                    View all
                    <ArrowRight className="h-4 w-4" />
                </Button>
                </Link>
            </div>

            <main className="w-full flex items-center justify-center mt-4">
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
                        <div className="relative group rounded-xl overflow-hidden">
                        <Image
                            className="rounded-xl transition-opacity group-hover:opacity-75"
                            src={game.image}
                            width={300}
                            height={300}
                            alt={`${game.name} preview`}
                            loading={index < 2 ? "eager" : "lazy"} // Lazy load images beyond first 2
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl border-2 border-red-600">
                            <h3 className="absolute top-4 left-4 text-white text-xl font-bold">
                            {game.name}
                            </h3>
                            <Link
                            href={game.href}
                            className="flex justify-center items-center p-10 bg-red-600 rounded-full hover:bg-red-700 group/play transition-colors relative scale-125"
                            prefetch={false} // Don't prefetch slot game pages
                            >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="36"
                                height="36"
                                viewBox="0 0 36 36"
                                fill="none"
                                className="absolute transition-opacity group-hover/play:opacity-0"
                            >
                                <path d="M27.538 13.625 13.45 5.545a4.987 4.987 0 0 0-7.48 4.376v16.216a4.988 4.988 0 0 0 7.48 4.317l14.088-8.079a4.988 4.988 0 0 0 0-8.633v-.117Z" fill="white" />
                            </svg>
                            </Link>
                            <Link
                            href={game.demoHref}
                            className="text-white rounded-md transition-colors text-center hover:text-red-600 mt-2 absolute bottom-5 text-xl"
                            prefetch={false}
                            >
                            DEMO
                            </Link>
                        </div>
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                </Carousel>
            </main>
        </div>
    );
}
 
export default SlotsMain;