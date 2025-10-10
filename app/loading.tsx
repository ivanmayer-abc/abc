import Image from "next/image";

export default function Loading() {
    return (
        <div className="flex justify-center items-center h-full w-full bg-black fixed z-[999] top-0">
            <Image
                width={300}
                height={200}
                src="/logo.svg"
                alt="Logo"
                className="bg-black animate-pulse"
            />
        </div>
    )
}