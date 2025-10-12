import Banners from "./_components/banners";
import SlotsMain from "./_components/slots-main";
import UpcomingMatches from "./_components/upcoming-matches";

export default function Home() {
  return (
    <div className="mt-3 pb-[70px] sm:pb-0">
      <Banners />
      <div className="sm:px-8 px-3">
        <UpcomingMatches />
        <SlotsMain />
      </div>
    </div>
  )
}