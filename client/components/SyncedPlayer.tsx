"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

interface SyncedPlayerProps {
    roomId: string;
    userName: string;
    isHost: boolean;
    socket: Socket | null;
}

export default function SyncedPlayer({ roomId, userName, isHost, socket }: SyncedPlayerProps) {
    // STEP 2: Guard against missing required props
    if (!roomId || !userName) {
        console.warn("❌ SyncedPlayer loaded without roomId/userName");
        return <div className="text-red-500 p-4">Error: Missing room information.</div>;
    }

    const videoRef = useRef<HTMLVideoElement>(null);

    // STEP 2: Safe state initialization
    const [serverOffset, setServerOffset] = useState(0);
    const [ready, setReady] = useState(false);
    const [videoState, setVideoState] = useState<{
        url: string;
        isPlaying: boolean;
        currentTime: number;
        lastUpdated: number;
    }>({
        url: "",
        isPlaying: false,
        currentTime: 0,
        lastUpdated: Date.now()
    });
    const [inputUrl, setInputUrl] = useState('');
    const [peers, setPeers] = useState<number>(0);
    const [syncStatus, setSyncStatus] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    // Time sync: compute offset by pinging server (NTP-lite)
    const syncServerTime = async () => {
        if (!socket) return;

        try {
            const t0 = Date.now();
            socket.emit('get_server_time', (resp: { serverTime: number }) => {
                if (!resp || typeof resp.serverTime !== 'number') {
                    console.warn('Invalid server time response', resp);
                    return;
                }
                const t3 = Date.now();
                const rtt = t3 - t0;
                const serverTime = resp.serverTime;
                const approxLocalAtServer = t0 + rtt / 2;
                const offset = serverTime - approxLocalAtServer;
                setServerOffset(offset);
                console.log(`⏱️ Server time sync: offset=${offset}ms, RTT=${rtt}ms`);
            });
        } catch (e) {
            console.warn('Time sync failed', e);
        }
    };

    // STEP 5: Ready gate - prevent sync until socket is ready
    useEffect(() => {
        if (socket && roomId) {
            console.log("✅ SyncedPlayer is ready.");
            setReady(true);
            syncServerTime();
        }
    }, [socket, roomId]);

    // Periodic server time sync (every 15 seconds)
    useEffect(() => {
        if (!ready) return;

        const id = setInterval(syncServerTime, 15000);
        return () => clearInterval(id);
    }, [ready, socket]);

    // Socket event listeners for synchronized playback
    useEffect(() => {
        if (!socket || !ready) return;

        // STEP 3: Fix socket event handlers with validation
        socket.on('load_video', (payload: any) => {
            console.log(`📹 Received load_video:`, payload);

            // Validate payload
            if (!payload || typeof payload !== 'object') {
                console.warn('Invalid load_video payload:', payload);
                return;
            }

            const { url: videoUrl, startAt } = payload;

            if (!videoUrl || typeof videoUrl !== 'string') {
                console.warn('Invalid video URL in load_video:', videoUrl);
                return;
            }

            setVideoState(prev => ({
                ...prev,
                url: videoUrl,
                currentTime: 0,
                isPlaying: false
            }));
            setIsLoading(true);
            setSyncStatus('Loading video...');

            const v = videoRef.current;
            if (!v) return;

            v.src = videoUrl;
            v.load();

            if (typeof startAt === 'number') {
                const localStart = startAt - serverOffset;
                const now = Date.now();
                const delay = Math.max(0, localStart - now);

                console.log(`⏰ Scheduling start in ${delay}ms`);

                setTimeout(() => {
                    const elapsed = (Date.now() - localStart) / 1000;
                    v.currentTime = Math.max(0, elapsed);
                    v.play().catch((e) => console.error('Play error:', e));
                    setIsLoading(false);
                    setSyncStatus('Synced');
                    setTimeout(() => setSyncStatus(''), 2000);
                }, delay);
            }
        });

        socket.on('play', (payload: any) => {
            if (!payload || typeof payload.at !== 'number') {
                console.warn('Invalid play payload:', payload);
                return;
            }

            const { at } = payload;
            console.log(`▶️ Received play at ${at}`);
            const localAt = at - serverOffset;
            const now = Date.now();
            const delay = Math.max(0, localAt - now);

            setTimeout(() => {
                const v = videoRef.current;
                if (!v) return;
                const elapsed = (Date.now() - localAt) / 1000;
                v.currentTime = Math.max(0, elapsed);
                v.play().catch((e) => console.error('Play error:', e));
                setSyncStatus('Playing');
                setTimeout(() => setSyncStatus(''), 1500);
            }, delay);
        });

        socket.on('pause', (payload: any) => {
            if (!payload || typeof payload.at !== 'number') {
                console.warn('Invalid pause payload:', payload);
                return;
            }

            const { at } = payload;
            console.log(`⏸️ Received pause at ${at}`);
            const localAt = at - serverOffset;
            const now = Date.now();
            const delay = Math.max(0, localAt - now);

            setTimeout(() => {
                const v = videoRef.current;
                if (!v) return;
                v.pause();
                setSyncStatus('Paused');
                setTimeout(() => setSyncStatus(''), 1500);
            }, delay);
        });

        socket.on('seek', (payload: any) => {
            if (!payload || typeof payload.to !== 'number' || typeof payload.at !== 'number') {
                console.warn('Invalid seek payload:', payload);
                return;
            }

            const { to, at } = payload;
            console.log(`⏩ Received seek to ${to}s at ${at}`);
            const localAt = at - serverOffset;
            const now = Date.now();
            const delay = Math.max(0, localAt - now);

            setTimeout(() => {
                const v = videoRef.current;
                if (!v) return;
                v.currentTime = to;
                setSyncStatus(`Seeked to ${to}s`);
                setTimeout(() => setSyncStatus(''), 1500);
            }, delay);
        });

        // STEP 3: Safe user_list handler
        socket.on('room_users', (payload: any) => {
            if (!payload || !Array.isArray(payload.users)) {
                console.warn("Invalid user_list payload:", payload);
                setPeers(0);
                return;
            }
            setPeers(payload.users.length);
        });

        return () => {
            socket.off('load_video');
            socket.off('play');
            socket.off('pause');
            socket.off('seek');
            socket.off('room_users');
        };
    }, [socket, serverOffset, ready]);

    // STEP 6: Safe request_current_state handling
    useEffect(() => {
        if (!socket || !ready) return;

        socket.emit('request_current_state', { roomId }, (state: any) => {
            // Validate state
            if (!state || typeof state !== "object") {
                console.warn("Invalid room state", state);
                return;
            }

            console.log('🔄 Late joiner: received state', state);

            // Safe state extraction
            const safeState = {
                url: typeof state.url === 'string' ? state.url : "",
                isPlaying: !!state.isPlaying,
                currentTime: Number(state.currentTime || 0),
                lastUpdated: Number(state.lastUpdated || Date.now())
            };

            setVideoState(safeState);

            if (!safeState.url) {
                console.log('No URL in room state yet');
                return;
            }

            const v = videoRef.current;
            if (!v) return;

            v.src = safeState.url;
            v.load();

            // Calculate elapsed time since last update
            const elapsed = (Date.now() - safeState.lastUpdated) / 1000;
            const targetTime = safeState.currentTime + (safeState.isPlaying ? elapsed : 0);

            v.currentTime = Math.max(0, targetTime);
            if (safeState.isPlaying) {
                v.play().catch((e) => console.error('Play error:', e));
            }

            setSyncStatus('Synced with room');
            setTimeout(() => setSyncStatus(''), 2000);
        });
    }, [socket, roomId, ready]);

    // Host controls
    const hostLoad = async (videoUrl: string) => {
        if (!socket) return;
        if (!videoUrl || typeof videoUrl !== 'string') {
            console.warn('Invalid video URL');
            return;
        }

        socket.emit('get_server_time', (resp: { serverTime: number }) => {
            if (!resp || typeof resp.serverTime !== 'number') {
                console.warn('Invalid server time response');
                return;
            }
            const startAt = resp.serverTime + 3000; // 3s lead time
            socket.emit('load_video', { roomId, url: videoUrl, startAt });
            setInputUrl('');
        });
    };

    const hostPlay = async () => {
        if (!socket) return;
        socket.emit('get_server_time', (resp: { serverTime: number }) => {
            if (!resp || typeof resp.serverTime !== 'number') return;
            socket.emit('play', { roomId, at: resp.serverTime });
        });
    };

    const hostPause = async () => {
        if (!socket) return;
        socket.emit('get_server_time', (resp: { serverTime: number }) => {
            if (!resp || typeof resp.serverTime !== 'number') return;
            socket.emit('pause', { roomId, at: resp.serverTime });
        });
    };

    const hostSeek = async () => {
        if (!socket) return;
        const seconds = prompt('Seek to (seconds):');
        if (seconds === null) return;

        const seekTo = parseFloat(seconds);
        if (isNaN(seekTo)) return;

        socket.emit('get_server_time', (resp: { serverTime: number }) => {
            if (!resp || typeof resp.serverTime !== 'number') return;
            socket.emit('seek', { roomId, to: seekTo, at: resp.serverTime });
        });
    };

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputUrl.trim()) {
            hostLoad(inputUrl.trim());
        }
    };

    // STEP 5: Don't render until ready
    if (!ready) {
        return <div className="flex items-center justify-center h-full text-zinc-400">Preparing player...</div>;
    }

    // STEP 2: Validate videoState before using
    const safeUrl = videoState?.url ?? "";

    return (
        <div className="flex flex-col h-full">
            {/* Host Controls */}
            {isHost && (
                <div className="p-4 bg-zinc-900/50 border-b border-zinc-800 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="px-2 py-1 bg-indigo-600 text-white text-xs rounded-full font-medium">
                            👑 Host
                        </div>
                        <span className="text-xs text-zinc-400">You control playback</span>
                    </div>

                    <form onSubmit={handleUrlSubmit} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Enter video URL (MP4, WebM, HLS)"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            className="flex-1 bg-zinc-950 border border-zinc-700 text-zinc-100 text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-zinc-600"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors text-sm font-medium"
                        >
                            Load & Sync
                        </button>
                    </form>

                    <div className="flex gap-2">
                        <button
                            onClick={hostPlay}
                            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-colors text-sm font-medium"
                        >
                            ▶️ Play
                        </button>
                        <button
                            onClick={hostPause}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl transition-colors text-sm font-medium"
                        >
                            ⏸️ Pause
                        </button>
                        <button
                            onClick={hostSeek}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors text-sm font-medium"
                        >
                            ⏩ Seek
                        </button>
                    </div>
                </div>
            )}

            {/* Video Player */}
            <div className="flex-1 bg-black flex items-center justify-center relative">
                {safeUrl ? (
                    <>
                        <video
                            ref={videoRef}
                            controls
                            className="w-full h-full"
                            crossOrigin="anonymous"
                        />
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <div className="text-white text-sm">Loading video...</div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center text-zinc-500">
                        <div className="text-4xl mb-4">🎬</div>
                        <div className="text-lg">No video loaded</div>
                        <div className="text-sm mt-2">
                            {isHost ? 'Enter a video URL above to get started' : 'Waiting for host to load a video...'}
                        </div>
                    </div>
                )}

                {/* Sync Status Overlay */}
                {syncStatus && (
                    <div className="absolute top-4 right-4 px-4 py-2 bg-indigo-600/90 text-white text-sm rounded-lg shadow-lg">
                        {syncStatus}
                    </div>
                )}

                {/* Participants Count */}
                <div className="absolute bottom-4 left-4 px-3 py-2 bg-zinc-900/80 backdrop-blur-sm text-zinc-300 text-xs rounded-lg border border-zinc-700">
                    👥 {peers} watching
                </div>
            </div>
        </div>
    );
}
