import Link from "next/link";
import HeaderAuth from "./header-auth";
import HeaderNav from "./header-nav";
import Image from "next/image";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ['latin'] })

const Header = () => {
    return (
        <header className="fixed flex justify-between items-center sm:px-8 px-3 py-2 text-xl border-b-2 border-red-600 w-full bg-black z-[20]">
            <Link href="/" className="flex gap-2 items-center text-3xl font-bold text-red-600">
                <Image
                    src="/logo.svg"
                    alt="logo"
                    // className="w-auto h-auto sm:max-w-[110px] max-w-[80px]"
                    width="35"
                    height="35"
                    rel="preload"
                />
                <div className={montserrat.className}><p className="hidden sm:block">altbet</p></div>
            </Link>
            <HeaderNav />
            <HeaderAuth />
        </header>
    );
}
 
export default Header;