"use client";

import { useEffect, useState } from "react";
import RoomClient from "@/components/RoomClient";

export default function RoomPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ name?: string }>;
}) {
    const [roomId, setRoomId] = useState<string>("");
    const [userName, setUserName] = useState<string>("Guest");
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        async function initialize() {
            const { id } = await params;
            const { name } = await searchParams;

            setRoomId(id);

            // Priority: URL name (for guests) > localStorage user (for registered) > "Guest"
            if (name) {
                // Guest user from join page
                setUserName(name);
            } else if (typeof window !== 'undefined') {
                // Registered user - get name from localStorage
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    try {
                        const userData = JSON.parse(storedUser);
                        setUserName(userData.name || "Guest");
                    } catch (e) {
                        setUserName("Guest");
                    }
                }
            }

            setIsReady(true);
        }

        initialize();
    }, [params, searchParams]);

    if (!isReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="animate-pulse">Loading room...</div>
            </div>
        );
    }

    return <RoomClient roomId={roomId} userName={userName} />;
}
