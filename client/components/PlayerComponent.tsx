"use client";

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";

interface PlayerComponentProps {
    url: string;
    socket: Socket | null;
    roomId: string;
    isPlaying: boolean;
    onPlay: () => void;
    onPause: () => void;
}

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

export default function PlayerComponent({ url, socket, roomId, isPlaying, onPlay, onPause }: PlayerComponentProps) {
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [isReceivingSync, setIsReceivingSync] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Extract Video ID from URL
    const getVideoId = (url: string) => {
        try {
            if (!url) return null;
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtube.com')) {
                return urlObj.searchParams.get('v');
            } else if (urlObj.hostname.includes('youtu.be')) {
                return urlObj.pathname.slice(1);
            }
            return null;
        } catch (e) {
            return null;
        }
    };

    // Load YouTube API
    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

            window.onYouTubeIframeAPIReady = () => {
                console.log('✅ YouTube API Ready');
                // Trigger re-render or initialization if needed
            };
        }
    }, []);

    // Initialize Player when URL changes
    useEffect(() => {
        const videoId = getVideoId(url);
        if (!videoId) {
            if (url) setError('Invalid YouTube URL');
            return;
        }

        setError(null);

        const initPlayer = () => {
            if (!window.YT || !window.YT.Player) {
                setTimeout(initPlayer, 100);
                return;
            }

            // Destroy existing player if any
            if (playerRef.current) {
                playerRef.current.destroy();
            }

            console.log('🎬 Initializing Native Player for:', videoId);

            playerRef.current = new window.YT.Player(containerRef.current, {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    'playsinline': 1,
                    'controls': 1,
                    'modestbranding': 1,
                    'rel': 0,
                    'origin': typeof window !== 'undefined' ? window.location.origin : undefined
                },
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange,
                    'onError': onPlayerError
                }
            });
        };

        initPlayer();

        return () => {
            if (playerRef.current && playerRef.current.destroy) {
                playerRef.current.destroy();
            }
        };
    }, [url]);

    // Socket Sync Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('receive_video_play', (data) => {
            console.log('Received play sync:', data);
            setIsReceivingSync(true);
            if (playerRef.current && playerRef.current.playVideo) {
                const current = playerRef.current.getCurrentTime();
                if (Math.abs(current - data.currentTime) > 1.0) {
                    playerRef.current.seekTo(data.currentTime, true);
                }
                playerRef.current.playVideo();
            }
            onPlay();
            setTimeout(() => setIsReceivingSync(false), 1000);
        });

        socket.on('receive_video_pause', (data) => {
            console.log('Received pause sync:', data);
            setIsReceivingSync(true);
            if (playerRef.current && playerRef.current.pauseVideo) {
                const current = playerRef.current.getCurrentTime();
                if (Math.abs(current - data.currentTime) > 1.0) {
                    playerRef.current.seekTo(data.currentTime, true);
                }
                playerRef.current.pauseVideo();
            }
            onPause();
            setTimeout(() => setIsReceivingSync(false), 1000);
        });

        socket.on('receive_video_seek', (data) => {
            console.log('Received seek sync:', data);
            setIsReceivingSync(true);
            if (playerRef.current && playerRef.current.seekTo) {
                playerRef.current.seekTo(data.currentTime, true);
            }
            setTimeout(() => setIsReceivingSync(false), 1000);
        });

        return () => {
            socket.off('receive_video_play');
            socket.off('receive_video_pause');
            socket.off('receive_video_seek');
        };
    }, [socket, onPlay, onPause]);

    const onPlayerReady = (event: any) => {
        console.log('✅ Player Ready Event');
        setIsReady(true);
    };

    const onPlayerStateChange = (event: any) => {
        if (isReceivingSync) return;

        // YT.PlayerState.PLAYING = 1
        // YT.PlayerState.PAUSED = 2
        // YT.PlayerState.BUFFERING = 3

        if (event.data === 1) { // PLAYING
            console.log('▶️ Native Play Detected');
            if (socket && playerRef.current) {
                const currentTime = playerRef.current.getCurrentTime();
                socket.emit('video_play', { room: roomId, currentTime });
                onPlay();
            }
        } else if (event.data === 2) { // PAUSED
            console.log('⏸️ Native Pause Detected');
            if (socket && playerRef.current) {
                const currentTime = playerRef.current.getCurrentTime();
                socket.emit('video_pause', { room: roomId, currentTime });
                onPause();
            }
        }
    };

    const onPlayerError = (event: any) => {
        console.error('❌ Native Player Error:', event.data);
        setError('Video playback error. Code: ' + event.data);
    };

    return (
        <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                    <div className="text-red-400 text-sm">{error}</div>
                </div>
            )}

            {/* Container for YouTube IFrame */}
            <div ref={containerRef} className="w-full h-full" />

            {!isReady && !error && url && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 pointer-events-none">
                    <div className="text-zinc-400 text-sm">Loading YouTube Player...</div>
                </div>
            )}
        </div>
    );
}