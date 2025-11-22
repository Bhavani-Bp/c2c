"use client";

import ReactPlayer from "react-player";
import { useEffect, useState, useRef } from "react";
import { Socket } from "socket.io-client";

interface PlayerComponentProps {
    url: string;
    socket: Socket | null;
    roomId: string;
    isPlaying: boolean;
    onPlay: () => void;
    onPause: () => void;
}

export default function PlayerComponent({ url, socket, roomId, isPlaying, onPlay, onPause }: PlayerComponentProps) {
    const [hasWindow, setHasWindow] = useState(false);
    const playerRef = useRef<ReactPlayer>(null);
    const [isReceivingSync, setIsReceivingSync] = useState(false);
    const [playerError, setPlayerError] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setHasWindow(true);
        }
    }, []);

    useEffect(() => {
        setIsReady(false);
        setPlayerError(null);
    }, [url]);

    useEffect(() => {
        if (!socket) return;

        socket.on('receive_video_play', (data) => {
            setIsReceivingSync(true);
            const videoEl = document.querySelector('video');
            if (videoEl) {
                videoEl.currentTime = data.currentTime;
                videoEl.play();
            }
            // Also sync ReactPlayer if active
            if (playerRef.current) {
                // ReactPlayer might not expose the video element directly in all cases, 
                // but we can try to sync internal state if needed.
                // For now, relying on the seek/play events is usually enough.
            }
            setTimeout(() => setIsReceivingSync(false), 100);
        });

        socket.on('receive_video_pause', (data) => {
            setIsReceivingSync(true);
            const videoEl = document.querySelector('video');
            if (videoEl) {
                videoEl.currentTime = data.currentTime;
                videoEl.pause();
            }
            setTimeout(() => setIsReceivingSync(false), 100);
        });

        socket.on('receive_video_seek', (data) => {
            setIsReceivingSync(true);
            if (playerRef.current) {
                playerRef.current.seekTo(data.currentTime);
            }
            setTimeout(() => setIsReceivingSync(false), 100);
        });

        return () => {
            socket.off('receive_video_play');
            socket.off('receive_video_pause');
            socket.off('receive_video_seek');
        };
    }, [socket]);

    const handlePlay = () => {
        if (!isReceivingSync && socket && playerRef.current && isReady) {
            try {
                const currentTime = playerRef.current.getCurrentTime();
                socket.emit('video_play', { room: roomId, currentTime });
                onPlay();
            } catch (error) {
                console.error('Error handling play:', error);
            }
        }
    };

    const handlePause = () => {
        if (!isReceivingSync && socket && playerRef.current && isReady) {
            try {
                const currentTime = playerRef.current.getCurrentTime();
                socket.emit('video_pause', { room: roomId, currentTime });
                onPause();
            } catch (error) {
                console.error('Error handling pause:', error);
            }
        }
    };

    const handleReady = () => {
        console.log('✅ Player ready with URL:', url);
        setIsReady(true);
        setPlayerError(null);
    };

    const handleError = (error: any) => {
        console.error('❌ ReactPlayer error:', error);
        console.error('❌ Failed URL:', url);
        setPlayerError('Failed to load video. Please check the URL and try again.');
        setIsReady(false);
    };

    const handleSeek = (seconds: number) => {
        if (!isReceivingSync && socket && isReady) {
            console.log('⏩ Seeked to:', seconds);
            socket.emit('video_seek', { room: roomId, currentTime: seconds });
        }
    };

    if (!hasWindow) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-black text-zinc-500">
                <div className="text-center">
                    <div>Loading Player...</div>
                    <div className="text-xs mt-2">URL: {url}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
            {/* Debug overlay removed for production feel, can be re-enabled if needed */}

            {playerError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                    <div className="text-center p-6">
                        <div className="text-red-400 text-sm mb-2">⚠️ Video Error</div>
                        <div className="text-zinc-300 text-xs">{playerError}</div>
                    </div>
                </div>
            )}
            {!isReady && !playerError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <div className="text-center">
                        <div className="text-zinc-400 text-sm mb-2">Loading video...</div>
                        <div className="text-zinc-600 text-xs max-w-md truncate">{url}</div>
                    </div>
                </div>
            )}

            <ReactPlayer
                key={url}
                ref={playerRef}
                url={url}
                width="100%"
                height="100%"
                controls={true}
                playing={isPlaying}
                onPlay={handlePlay}
                onPause={handlePause}
                onSeek={handleSeek}
                onReady={handleReady}
                onError={handleError}
                style={{ position: "absolute", top: 0, left: 0 }}
                config={{
                    youtube: {
                        playerVars: { showinfo: 1 }
                    }
                }}
            />
        </div>
    );
}