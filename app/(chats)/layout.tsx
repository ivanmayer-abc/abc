import Header from "@/app/(main)/_components/header";

const SupportLayout = ({ children }: {children: React.ReactNode}) => {
    return ( 
        <>
            <Header />
            <main className="pt-[66px] h-full">
                {children}
            </main>
        </>
    );
}
 
export default SupportLayout;