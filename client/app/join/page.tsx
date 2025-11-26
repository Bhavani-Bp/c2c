"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Mail, ArrowLeft, User } from "lucide-react";
import Link from "next/link";

export default function JoinRoom() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !roomId || !displayName) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/join-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: displayName, email, roomId })
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/room/${data.roomId}?name=${encodeURIComponent(displayName)}&email=${encodeURIComponent(email)}`);
      } else {
        setError(data.error || 'Failed to join room');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-stone-50 p-4">
      <div className="w-full max-w-sm space-y-6 animate-[fadeIn_0.6s_ease-out]">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-stone-50">Join Room</h1>
          <p className="text-stone-400 text-sm">Enter details to join the party</p>
        </div>

        <div className="bg-[#0a0a0a] border border-stone-900 rounded-xl p-6 shadow-[0_0_40px_rgba(59,130,246,0.15)] hover:shadow-[0_0_60px_rgba(59,130,246,0.25)] transition-shadow duration-500">
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-xs font-medium text-stone-400 flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-blue-500" />
                Your Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 bg-black border border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-stone-600 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] text-stone-50"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-medium text-stone-400 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-blue-500" />
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-black border border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-stone-600 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] text-stone-50"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="room" className="text-xs font-medium text-stone-400 flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-blue-500" />
                Room ID
              </label>
              <input
                id="room"
                type="text"
                placeholder="Enter room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 bg-black border border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-stone-600 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] font-mono text-stone-50"
                required
              />
            </div>

            {error && (
              <div className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 animate-[shake_0.3s_ease-in-out]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !displayName || !email || !roomId}
              className="w-full py-2.5 bg-stone-50 hover:bg-blue-500 text-black hover:text-stone-50 font-medium rounded-lg transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2"
            >
              {loading ? (
                'Processing...'
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Join Room
                </>
              )}
            </button>

            <Link
              href="/"
              className="w-full py-2 text-stone-600 hover:text-stone-500 transition-colors flex items-center justify-center gap-2 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Home
            </Link>
          </form>
        </div>
      </div>
    </main>
  );
}