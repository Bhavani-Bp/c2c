"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, DoorOpen, User, LogOut } from "lucide-react";
import RoomCard from "./components/RoomCard";
import NotificationBell from "./components/NotificationBell";
import TubesBackground from "@/components/webgl/TubesBackground";
import WheelPicker from "@/components/WheelPicker";

interface Room {
    roomId: string;
    name: string;
    description?: string;
    hostName: string;
    participantCount: number;
    maxUsers: number;
    currentVideoUrl?: string;
    isPlaying: boolean;
}

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [createRoomData, setCreateRoomData] = useState({
        name: "",
        maxUsers: 10,
        isPublic: true
    });
    const [joinRoomCode, setJoinRoomCode] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/');
            return;
        }

        setUser(JSON.parse(userData));
        loadPublicRooms();
    }, [router]);

    const loadPublicRooms = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/public?page=1&limit=12`);
            const data = await response.json();

            if (data.success) {
                setRooms(data.rooms);
            }
        } catch (err) {
            console.error('Error loading rooms:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create-room`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    creatorName: user.name,
                    creatorEmail: user.email,
                    ...createRoomData
                })
            });

            const data = await response.json();

            if (data.success) {
                router.push(`/room/${data.roomId}`);
            } else {
                setError(data.error || 'Failed to create room');
            }
        } catch (err: any) {
            setError('Network error. Please try again.');
        }
    };

    const handleJoinRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (joinRoomCode.trim()) {
            router.push(`/room/${joinRoomCode.toUpperCase()}`);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <p className="text-[#F8F6F0]">Loading...</p>
            </div>
        );
    }

    return (
        <>
            {/* Animated Background */}
            <TubesBackground />

            <div className="min-h-screen text-[#F8F6F0] relative z-10">
                {/* Header */}
                <header className="border-b border-[#F8F6F0]/10 bg-[#0A0A0A]/20 backdrop-blur-xl sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#F8F6F0] to-[#4169E1] bg-clip-text text-transparent">
                            Connect2Connect
                        </h1>
                        <div className="flex items-center gap-3">
                            <NotificationBell />
                            <button
                                onClick={() => router.push('/dashboard/profile')}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-[#F8F6F0]/10 rounded-lg transition-colors"
                            >
                                <User className="w-5 h-5" />
                                <span className="hidden sm:inline text-sm">{user.name}</span>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-3 py-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline text-sm">Logout</span>
                            </button>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-6 py-8">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold mb-2">Welcome back, {user.name}! 👋</h2>
                        <p className="text-[#F8F6F0]/60">
                            {user.isVerified ? '✅ Email verified' : '⚠️ Please verify your email'}
                        </p>
                    </div>

                    {/* Action Buttons - Smaller Size */}
                    <div className="flex flex-wrap gap-4 mb-12">
                        {/* Create Room Button */}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-3 px-6 py-4 bg-[#4169E1]/10 border-2 border-[#4169E1]/30 rounded-xl hover:border-[#4169E1] hover:bg-[#4169E1]/20 transition-all group backdrop-blur-xl"
                        >
                            <div className="p-2 bg-[#4169E1] rounded-lg group-hover:scale-110 transition-transform">
                                <Plus className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold">Create Room</p>
                                <p className="text-xs text-[#F8F6F0]/60">Host a watch party</p>
                            </div>
                        </button>

                        {/* Join Room Button */}
                        <button
                            onClick={() => setShowJoinModal(true)}
                            className="inline-flex items-center gap-3 px-6 py-4 bg-[#F8F6F0]/5 border-2 border-[#F8F6F0]/20 rounded-xl hover:border-[#F8F6F0]/50 hover:bg-[#F8F6F0]/10 transition-all group backdrop-blur-xl"
                        >
                            <div className="p-2 bg-[#F8F6F0]/20 rounded-lg group-hover:scale-110 transition-transform">
                                <DoorOpen className="w-5 h-5 text-[#4169E1]" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold">Join Room</p>
                                <p className="text-xs text-[#F8F6F0]/60">Enter room code</p>
                            </div>
                        </button>
                    </div>

                    {/* Public Rooms Section */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold">Public Rooms 🌍</h3>
                            <button
                                onClick={loadPublicRooms}
                                className="text-sm text-[#4169E1] hover:underline"
                            >
                                Refresh
                            </button>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-64 bg-[#F8F6F0]/3 backdrop-blur-xl rounded-2xl animate-pulse border border-[#F8F6F0]/10" />
                                ))}
                            </div>
                        ) : rooms.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {rooms.map((room) => (
                                    <RoomCard key={room.roomId} {...room} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-[#F8F6F0]/5 backdrop-blur-md rounded-2xl border border-[#F8F6F0]/10">
                                <p className="text-[#F8F6F0]/60 mb-4">No public rooms available</p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-6 py-3 bg-[#4169E1] hover:bg-[#3557c7] rounded-lg transition-colors"
                                >
                                    Create the First Room
                                </button>
                            </div>
                        )}
                    </div>
                </main>

                {/* Create Room Modal */}
                {showCreateModal && (
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowCreateModal(false)}
                    >
                        {/* Background animation inside modal */}
                        <div className="absolute inset-0 opacity-30 pointer-events-none">
                            <TubesBackground />
                        </div>

                        <div
                            className="bg-[#0A0A0A]/30 backdrop-blur-2xl border-2 border-[#F8F6F0]/20 rounded-2xl p-8 w-full max-w-md relative z-10 shadow-[0_0_50px_rgba(65,105,225,0.3)]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-[#F8F6F0] to-[#4169E1] bg-clip-text text-transparent">Create New Room</h2>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleCreateRoom} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Room Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., Movie Night"
                                        className="w-full px-4 py-3 bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] text-[#F8F6F0] placeholder:text-[#F8F6F0]/40 transition-all"
                                        value={createRoomData.name}
                                        onChange={(e) => setCreateRoomData({ ...createRoomData, name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-center">Max Users</label>
                                    <WheelPicker
                                        options={[5, 10, 20, 50]}
                                        value={createRoomData.maxUsers}
                                        onChange={(value) => setCreateRoomData({ ...createRoomData, maxUsers: value })}
                                    />
                                </div>

                                <div className="flex items-center justify-center gap-2 bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-lg p-3">
                                    <input
                                        type="checkbox"
                                        id="isPublic"
                                        checked={createRoomData.isPublic}
                                        onChange={(e) => setCreateRoomData({ ...createRoomData, isPublic: e.target.checked })}
                                        className="w-4 h-4 accent-[#4169E1]"
                                    />
                                    <label htmlFor="isPublic" className="text-sm cursor-pointer">
                                        🌍 Public room (anyone can join)
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 px-6 py-3 bg-[#F8F6F0]/10 hover:bg-[#F8F6F0]/20 rounded-lg transition-all hover:scale-105"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-[#4169E1] hover:bg-[#3557c7] rounded-lg transition-all font-semibold hover:scale-105 hover:shadow-lg hover:shadow-[#4169E1]/50"
                                    >
                                        Create Room
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Join Room Modal */}
                {showJoinModal && (
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowJoinModal(false)}
                    >
                        {/* Background animation inside modal */}
                        <div className="absolute inset-0 opacity-30 pointer-events-none">
                            <TubesBackground />
                        </div>

                        <div
                            className="bg-[#0A0A0A]/30 backdrop-blur-2xl border-2 border-[#F8F6F0]/20 rounded-2xl p-8 w-full max-w-md relative z-10 shadow-[0_0_50px_rgba(65,105,225,0.3)]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-[#F8F6F0] to-[#4169E1] bg-clip-text text-transparent">Join Room</h2>

                            <form onSubmit={handleJoinRoom} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-center">Room Code</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="ABC123"
                                        className="w-full px-4 py-4 bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] text-[#F8F6F0] font-mono uppercase text-center text-3xl tracking-widest placeholder:text-[#F8F6F0]/40 transition-all"
                                        maxLength={6}
                                        value={joinRoomCode}
                                        onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                                    />
                                    <p className="text-xs text-[#F8F6F0]/60 text-center mt-2">Enter the 6-character room code</p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowJoinModal(false)}
                                        className="flex-1 px-6 py-3 bg-[#F8F6F0]/10 hover:bg-[#F8F6F0]/20 rounded-lg transition-all hover:scale-105"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-[#4169E1] hover:bg-[#3557c7] rounded-lg transition-all font-semibold hover:scale-105 hover:shadow-lg hover:shadow-[#4169E1]/50"
                                    >
                                        Join Room
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
