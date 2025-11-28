"use client";

export const unstable_noStore = true;

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import YouTube, { YouTubeProps } from "react-youtube";

interface PlayerComponentProps {
    url: string;
    socket: Socket | null;
    roomId: string;
    isPlaying: boolean;
    onPlay: () => void;
    onPause: () => void;
}

export default function PlayerComponent({ url, socket, roomId, isPlaying, onPlay, onPause }: PlayerComponentProps) {
    const playerRef = useRef<any>(null);
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

    const videoId = getVideoId(url);

    // Socket Sync Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('receive_video_play', (data) => {
            console.log('Received play sync:', data);
            setIsReceivingSync(true);

            if (playerRef.current) {
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

            if (playerRef.current) {
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

            if (playerRef.current) {
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

    const onPlayerReady: YouTubeProps['onReady'] = (event) => {
        console.log('✅ Player Ready Event');
        setIsReady(true);
        playerRef.current = event.target;
    };

    const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
        if (isReceivingSync) return;

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

    const onPlayerError: YouTubeProps['onError'] = (event) => {
        console.error('❌ Player Error:', event.data);
        setError('Video playback error. Code: ' + event.data);
    };

    const opts: YouTubeProps['opts'] = {
        height: '100%',
        width: '100%',
        playerVars: {
            playsinline: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined
        },
    };

    return (
        <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl border border-stone-800">
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                    <div className="text-red-400 text-sm">{error}</div>
                </div>
            )}

            {videoId ? (
                <YouTube
                    videoId={videoId}
                    opts={opts}
                    onReady={onPlayerReady}
                    onStateChange={onPlayerStateChange}
                    onError={onPlayerError}
                    className="w-full h-full"
                    iframeClassName="w-full h-full"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-500">
                    No video loaded
                </div>
            )}
        </div>
    );
}