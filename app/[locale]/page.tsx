import { Suspense } from "react";
import Banners from "./_components/banners";
import UpcomingMatches from "./_components/upcoming-matches";
import SlotsMainServer from "./_components/slots-main-server";
import Loading from "../loading";

function HomeContent() {
  return (
    <div className="mt-3 pb-[70px] sm:pb-0">
      <Banners />
      <div className="sm:px-8 px-3">
        <Suspense fallback={
          <div className="mt-5 space-y-2">
            <div className="h-8 w-64 bg-muted/20 rounded animate-pulse mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-muted/20 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        }>
          <UpcomingMatches />
        </Suspense>
        
        {/* <SlotsMainServer /> */}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <HomeContent />
    </Suspense>
  );
}