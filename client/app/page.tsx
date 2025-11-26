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
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="h-16 w-16 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20 mx-auto">
              <Check className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Room Created!</h1>
            <p className="text-zinc-400">Share this Room ID with your friends</p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
            <div className="space-y-4">
              <div className="text-center">
                <label className="text-sm font-medium text-zinc-300 block mb-2">Room ID</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-center font-mono text-lg text-indigo-400">
                    {createdRoomId}
                  </div>
                  <button
                    onClick={copyRoomId}
                    className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors border border-zinc-700"
                    title="Copy Room ID"
                  >
                    {copied ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
                {copied && <p className="text-green-400 text-xs mt-1">Copied to clipboard!</p>}
              </div>

              <button
                onClick={joinCreatedRoom}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20"
              >
                Join Your Room
              </button>

              <button
                onClick={() => setMode('home')}
                className="w-full py-2 text-zinc-400 hover:text-zinc-300 transition-colors"
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
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Play className="h-8 w-8 text-white fill-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Connect to Connect</h1>
            <p className="text-zinc-400">Watch movies and listen to music together, in perfect sync.</p>
          </div>

          {mode === 'home' && (
            <div className="space-y-4">
              <button
                onClick={() => setMode('join')}
                className="w-full py-4 bg-zinc-900/50 hover:bg-zinc-900/70 border border-zinc-800 rounded-2xl transition-all backdrop-blur-sm shadow-xl flex items-center justify-center gap-3"
              >
                <Plus className="h-6 w-6 text-indigo-400" />
                <span className="font-medium">Create New Room</span>
              </button>

              <Link
                href="/join"
                className="w-full py-4 bg-zinc-900/50 hover:bg-zinc-900/70 border border-zinc-800 rounded-2xl transition-all backdrop-blur-sm shadow-xl flex items-center justify-center gap-3"
              >
                <Users className="h-6 w-6 text-green-400" />
                <span className="font-medium">Join Existing Room</span>
              </Link>
            </div>
          )}

          {mode === 'join' && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
              <div className="text-center space-y-2 mb-6">
                <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mx-auto">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-bold">Create New Room</h2>
                <p className="text-zinc-400 text-sm">Start a new watch party</p>
              </div>

              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-zinc-300">
                    Your Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-zinc-600"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-zinc-300">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-zinc-600"
                    required
                  />
                </div>

                {error && (
                  <div className="text-red-400 text-sm text-center">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading || !displayName || !email}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    'Creating Room...'
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Create Room
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setMode('home')}
                  className="w-full py-2 text-zinc-400 hover:text-zinc-300 transition-colors"
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
