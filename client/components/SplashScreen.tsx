"use client";

import { useEffect, useState } from "react";

interface SplashScreenProps {
    finishLoading: () => void;
}

export default function SplashScreen({ finishLoading }: SplashScreenProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => setIsMounted(true), 10);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-700 ease-in-out"
        >
            <div className={`flex flex-col items-center transition-all duration-1000 ease-out transform ${isMounted ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"}`}>
                {/* Main Text with Glow Effect */}
                <div className="text-center space-y-3 relative">
                    {/* Glowing background effect */}
                    <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 animate-pulse"></div>

                    {/* Main heading with glow */}
                    <h1 className="relative text-6xl font-bold text-stone-50 tracking-tight animate-[glow_2s_ease-in-out_infinite]">
                        Connect to Connect
                    </h1>

                    <p className="relative text-stone-400 text-sm font-medium tracking-wide uppercase opacity-0 animate-[fadeIn_1s_ease-out_0.5s_forwards]">
                        Sync • Watch • Listen
                    </p>
                </div>

                {/* Loading Indicator */}
                <div className="mt-12 w-48 h-1 bg-stone-900 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 animate-[loading_2s_ease-in-out_infinite] w-1/3 rounded-full"></div>
                </div>
            </div>
        </div>
    );
}
