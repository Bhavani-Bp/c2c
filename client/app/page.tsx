"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Play, Plus, Mail, Copy, Check } from "lucide-react";
import Link from "next/link";
import SplashScreen from "@/components/SplashScreen";

export default function Home() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [createdRoomId, setCreatedRoomId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !email) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorName: displayName, creatorEmail: email })
      });

      const data = await response.json();

      if (data.success) {
        setCreatedRoomId(data.roomId);
        setMode('create');
      } else {
        setError(data.error || 'Failed to create room');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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



  const copyRoomId = () => {
    navigator.clipboard.writeText(createdRoomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const joinCreatedRoom = () => {
    router.push(`/room/${createdRoomId}?name=${encodeURIComponent(displayName)}&email=${encodeURIComponent(email)}`);
  };

  if (mode === 'create') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black text-stone-50 p-4">
        <div className="w-full max-w-sm space-y-8 animate-[fadeIn_0.6s_ease-out]">
          <div className="text-center space-y-2">
            <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto">
              <Check className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-stone-50">Room Created!</h1>
            <p className="text-stone-400">Share this Room ID with your friends</p>
          </div>

          <div className="bg-[#0a0a0a] border border-stone-900 rounded-2xl p-6 shadow-[0_0_40px_rgba(59,130,246,0.15)]">
            <div className="space-y-4">
              <div className="text-center">
                <label className="text-sm font-medium text-stone-300 block mb-2">Room ID</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-black border border-stone-800 rounded-xl text-center font-mono text-lg text-blue-400">
                    {createdRoomId}
                  </div>
                  <button
                    onClick={copyRoomId}
                    className="px-4 py-3 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl transition-colors border border-stone-800 hover:border-blue-500/50"
                    title="Copy Room ID"
                  >
                    {copied ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
                {copied && <p className="text-green-400 text-xs mt-1">Copied to clipboard!</p>}
              </div>

              <button
                onClick={joinCreatedRoom}
                className="w-full py-3.5 bg-stone-50 hover:bg-blue-500 text-black hover:text-stone-50 font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
              >
                Join Your Room
              </button>

              <button
                onClick={() => setMode('home')}
                className="w-full py-2 text-stone-500 hover:text-stone-400 transition-colors text-sm"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      {showSplash && <SplashScreen finishLoading={() => setShowSplash(false)} />}
      <main className="flex min-h-screen flex-col items-center justify-center bg-black text-stone-50 p-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-stone-50">Connect to Connect</h1>
            <p className="text-stone-400">Watch movies and listen to music together, in perfect sync.</p>
          </div>

          {mode === 'home' && (
            <div className="space-y-4">
              <button
                onClick={() => setMode('join')}
                className="w-full py-4 bg-stone-50 hover:bg-blue-500 text-black hover:text-stone-50 border border-stone-800 hover:border-transparent rounded-xl transition-all duration-300 shadow-[0_0_30px_rgba(59,130,246,0.1)] hover:shadow-[0_0_50px_rgba(59,130,246,0.4)] flex items-center justify-center gap-3 group"
              >
                <Plus className="h-6 w-6 text-blue-500 group-hover:text-stone-50 transition-colors" />
                <span className="font-medium">Create New Room</span>
              </button>

              <Link
                href="/join"
                className="w-full py-4 bg-black hover:bg-stone-900 text-stone-50 border border-stone-800 hover:border-stone-700 rounded-xl transition-all duration-300 shadow-[0_0_30px_rgba(59,130,246,0.1)] hover:shadow-[0_0_50px_rgba(59,130,246,0.2)] flex items-center justify-center gap-3 group"
              >
                <Users className="h-6 w-6 text-stone-400 group-hover:text-stone-50 transition-colors" />
                <span className="font-medium">Join Existing Room</span>
              </Link>
            </div>
          )}

          {mode === 'join' && (
            <div className="bg-[#0a0a0a] border border-stone-900 rounded-2xl p-6 shadow-[0_0_40px_rgba(59,130,246,0.15)] animate-[fadeIn_0.6s_ease-out]">
              <div className="text-center space-y-2 mb-6">
                <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-stone-50">Create New Room</h2>
                <p className="text-stone-400 text-sm">Start a new watch party</p>
              </div>

              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-medium text-stone-400">
                    Your Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black border border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-stone-600 hover:border-blue-500/30 text-stone-50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-medium text-stone-400">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black border border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-stone-600 hover:border-blue-500/30 text-stone-50"
                    required
                  />
                </div>

                {error && (
                  <div className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 rounded-lg p-2">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading || !displayName || !email}
                  className="w-full py-2.5 bg-stone-50 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-black hover:text-stone-50 font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    'Creating Room...'
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Room
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setMode('home')}
                  className="w-full py-2 text-stone-500 hover:text-stone-400 transition-colors text-xs"
                >
                  Back to Home
                </button>
              </form>
            </div>
          )}

          <div className="text-center text-sm text-zinc-500">
            <p>Secure rooms with email verification for trusted watch parties.</p>
          </div>
        </div>
      </main>
    </>
  );
}
