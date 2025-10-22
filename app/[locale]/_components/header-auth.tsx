import { auth } from "@/auth";
import { UserButton } from "@/components/auth/user-button";
import Balance from "@/components/balance";
import { CirclePlus } from "lucide-react";
import Link from "next/link";

const HeaderAuth = async () => {
    const session = await auth();
    const isBlocked = session?.user?.isBlocked;

    return (
        <div>
            {!session ? (
                <div className="flex gap-3 items-center sm:text-xl text-sm">
                    <Link href="login" className="border-2 border-white hover:border-gray-300 hover:text-gray-300 rounded-full sm:px-5 px-4 py-1 transition duration-300 ease-in-out">Log in</Link>
                    <Link href="register" className="bg-white text-black border-2 border-white hover:bg-gray-300 hover:border-gray-300 rounded-full sm:px-5 px-4 py-1 transition duration-300 ease-in-out">Sign up</Link>
                </div>
            ) : (
                <div className="flex items-center gap-4 font-bold">
                    {isBlocked ? (
                        <></>
                        ) : (
                        <Link href="/transactions/new/deposit" className="flex items-center font-medium bg-white text-black px-3 py-1 rounded-full text-lg">
                            <CirclePlus className="mr-2" width={18} height={18} />
                            Deposit
                        </Link>
                    )}
                    <Balance />
                    <div className="hidden lg:block">
                        <UserButton />
                    </div>
                </div>
            )}
        </div>
    );
}
 
export default HeaderAuth;