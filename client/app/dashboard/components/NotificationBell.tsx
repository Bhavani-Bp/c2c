"use client";

import { Bell } from "lucide-react";
import { useState } from "react";

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 hover:bg-[#F8F6F0]/10 rounded-lg transition-colors"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-[#0A0A0A] border-2 border-[#F8F6F0]/20 rounded-xl shadow-2xl z-50">
                    <div className="p-4 border-b border-[#F8F6F0]/10">
                        <h3 className="font-bold">Notifications</h3>
                    </div>
                    <div className="p-4 text-center text-[#F8F6F0]/60">
                        <p className="text-sm">No new notifications</p>
                    </div>
                </div>
            )}
        </div>
    );
}
