"use client";

import { Users, Play, Pause } from "lucide-react";
import { useRouter } from "next/navigation";

interface RoomCardProps {
    roomId: string;
    name: string;
    description?: string;
    hostName: string;
    participantCount: number;
    maxUsers: number;
    currentVideoUrl?: string;
    isPlaying: boolean;
}

export default function RoomCard({
    roomId,
    name,
    description,
    hostName,
    participantCount,
    maxUsers,
    currentVideoUrl,
    isPlaying
}: RoomCardProps) {
    const router = useRouter();
    const isFull = participantCount >= maxUsers;

    const handleJoinRoom = () => {
        router.push(`/room/${roomId}`);
    };

    return (
        <div className="bg-[#0A0A0A]/20 backdrop-blur-xl border border-[#F8F6F0]/20 rounded-2xl p-6 hover:border-[#4169E1]/50 transition-all group hover:shadow-[0_0_30px_rgba(65,105,225,0.2)] hover:bg-[#0A0A0A]/30">
            {/* Room Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#F8F6F0] mb-1 group-hover:text-[#4169E1] transition-colors">
                        {name}
                    </h3>
                    <p className="text-sm text-[#F8F6F0]/60">
                        by {hostName}
                    </p>
                </div>
                {currentVideoUrl && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-[#4169E1]/20 backdrop-blur-sm rounded-lg">
                        {isPlaying ? (
                            <Play className="w-3 h-3 text-[#4169E1]" />
                        ) : (
                            <Pause className="w-3 h-3 text-[#F8F6F0]/60" />
                        )}
                        <span className="text-xs text-[#4169E1]">
                            {isPlaying ? 'Playing' : 'Paused'}
                        </span>
                    </div>
                )}
            </div>

            {/* Description */}
            {description && (
                <p className="text-sm text-[#F8F6F0]/70 mb-4 line-clamp-2">
                    {description}
                </p>
            )}

            {/* Participants */}
            <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-[#4169E1]" />
                <span className="text-sm text-[#F8F6F0]/80">
                    {participantCount}/{maxUsers} users
                </span>
                {isFull && (
                    <span className="ml-auto text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded backdrop-blur-sm">
                        Full
                    </span>
                )}
            </div>

            {/* Currently Playing */}
            {currentVideoUrl && (
                <div className="text-xs text-[#F8F6F0]/50 mb-4 truncate">
                    🎥 {currentVideoUrl.includes('youtube.com') ? 'YouTube Video' : 'Video'}
                </div>
            )}

            {/* Join Button */}
            <button
                onClick={handleJoinRoom}
                disabled={isFull}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${isFull
                    ? 'bg-[#F8F6F0]/10 text-[#F8F6F0]/40 cursor-not-allowed backdrop-blur-sm'
                    : 'bg-[#4169E1] hover:bg-[#3557c7] text-[#F8F6F0] shadow-lg hover:shadow-[0_0_20px_rgba(65,105,225,0.4)]'
                    }`}
            >
                {isFull ? 'Room Full' : 'Join Room →'}
            </button>
        </div>
    );
}
