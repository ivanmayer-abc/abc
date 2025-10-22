"use client"

import React, { useState, useEffect } from "react";
import { DoubleArrowLeftIcon, DoubleArrowRightIcon } from "@radix-ui/react-icons";
import Link from "next/link"
import { usePathname } from "next/navigation";

interface ProtectedLayoutProps {
    children: React.ReactNode;
}

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
    const [isMenuVisible, setMenuVisible] = useState(false);
    const [menuOpacity, setMenuOpacity] = useState(0);
    const [visibleButtons, setVisibleButtons] = useState(0);
    const pathname = usePathname();

    useEffect(() => {
        const savedState = localStorage.getItem("menuState");
        const menuState = savedState ? JSON.parse(savedState) : false;
        setMenuVisible(menuState);
        if (menuState) {
            setMenuOpacity(100);
            setVisibleButtons(7);
        }
    }, []);


    const toggleMenu = () => {
        const newMenuState = !isMenuVisible;
        setMenuVisible(newMenuState);
        localStorage.setItem("menuState", JSON.stringify(newMenuState));

        if (newMenuState) {
            setMenuOpacity(0);
            setVisibleButtons(0);

            setTimeout(() => {
                setMenuOpacity(100);
                let index = 0;
                const interval = setInterval(() => {
                    setVisibleButtons((prev) => {
                        if (prev >= 7) {
                            clearInterval(interval);
                            return prev;
                        }
                        return prev + 1;
                    });
                    index++;
                }, 300);
            }, 1000);
        } else {
            setMenuOpacity(0);
            setVisibleButtons(0);
        }
    };

    useEffect(() => {
        if (isMenuVisible) {
            setMenuOpacity(100);
            setVisibleButtons(7);
        }
    }, [isMenuVisible]);

    const menuItems = [
        { label: "Main", to: "/profile" },
        { label: "My bets", to: "/my-bets" },
        { label: "Promos", to: "/promo" },
        { label: "Transactions", to: "/transactions" },
        { label: "History", to: "/history" },
        { label: "Support", to: "/support" },
        { label: "Settings", to: "/settings" },
    ];

    return (
        <div>
            <div className="flex transition-all">
                {isMenuVisible && (
                    <div
                        className={`fixed bg-black z-10 px-4 pt-10 h-screen w-[200px] transition-opacity duration-1000 border-r-2 border-red-600 hidden lg:block`}
                        style={{ opacity: menuOpacity }}
                    >
                        <ul className="space-y-4">
                            {menuItems.map((button, index) => (
                                <li
                                    key={index}
                                    className={`transform transition-transform duration-500 ${
                                        visibleButtons > index
                                            ? "translate-x-0"
                                            : "translate-x-[-100%]"
                                    }`}
                                    style={{ transitionDelay: `${index * 50}ms` }}
                                >
                                    <Link
                                        href={button.to}
                                        className={`w-full text-left px-2 py-1 ${
                                            pathname === button.to ? "text-red-600" : ""
                                        }`}
                                    >
                                        {button.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <DoubleArrowLeftIcon
                            width={25}
                            height={25}
                            onClick={toggleMenu}
                            className="fixed bottom-2 mb-6 hover:text-gray-400 transition ease-in-out cursor-pointer"
                        />
                    </div>
                )}
                {!isMenuVisible && (
                    <DoubleArrowRightIcon
                        width={25}
                        height={25}
                        onClick={toggleMenu}
                        className="fixed bottom-2 left-5 mb-6 hover:text-gray-400 transition ease-in-out cursor-pointer z-[19] bg-black roudned-full"
                    />
                )}

                <div
                    className={`transition-all duration-300 sm:px-4 py-4 w-full ${
                        isMenuVisible ? "lg:ml-[200px]" : "ml-0"
                    }`}
                >
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ProtectedLayout;