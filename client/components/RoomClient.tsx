"use client";

export const unstable_noStore = true;

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Socket } from "socket.io-client";
import { Send, MessageSquare, User, Link as LinkIcon, Search, Play, List, Plus, Trash2, History } from "lucide-react";
import PlayerComponent from "./PlayerComponent";
import { getSocket } from "@/lib/socket";


interface Message {
    message: string;
    username: string;
    time: string;
}

interface RecentVideo {
    videoId: string;
    title: string;
    thumbnail: string;
    playedAt: number;
}

interface RoomClientProps {
    roomId: string;
    userName: string;
}


export default function RoomClient({ roomId, userName }: RoomClientProps) {
    const router = useRouter();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [currentMessage, setCurrentMessage] = useState("");
    const [messageList, setMessageList] = useState<Message[]>([]);
    const [url, setUrl] = useState(""); // Start with empty URL
    const [inputUrl, setInputUrl] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const [roomUsers, setRoomUsers] = useState<Array<{ id: string, name: string }>>([]);
    const [syncStatus, setSyncStatus] = useState<string>('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [playlist, setPlaylist] = useState<any[]>([]);
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [recentVideos, setRecentVideos] = useState<RecentVideo[]>([]);
    const [showRecent, setShowRecent] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(true); // Start as true to prevent flash

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Check authentication on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');

            // Allow guests (with userName) OR authenticated users (with token)
            if (!token && !user && !userName) {
                // Only redirect if no token AND no userName (true unauthorized access)
                setIsAuthorized(false);
                router.push('/dashboard?error=unauthorized');
            }
        }
    }, [router, userName]);

    useEffect(() => {
        // Initialize Socket Connection with global socket instance
        const socketInstance = getSocket();
        setSocket(socketInstance);

        // Connection status handlers
        const onConnect = () => {
            setConnectionStatus('connected');
            setSyncStatus('Connected to room');
            // Join Room after connection is established
            socketInstance.emit("join_room", { room: roomId, name: userName });
        };

        const onDisconnect = () => {
            setConnectionStatus('disconnected');
            setSyncStatus('Disconnected from room');
        };

        const onConnectError = () => {
            setConnectionStatus('disconnected');
            setSyncStatus('Connection failed');
        };

        if (socketInstance.connected) {
            onConnect();
        }

        socketInstance.on('connect', onConnect);
        socketInstance.on('disconnect', onDisconnect);
        socketInstance.on('connect_error', onConnectError);

        // Listen for Messages
        socketInstance.on("receive_message", (data: Message) => {
            setMessageList((list) => [...list, data]);
        });

        // Listen for room users updates
        socketInstance.on('room_users', (users) => {
            setRoomUsers(users);
        });

        // Listen for Video Sync Events
        socketInstance.on("receive_video_url_change", (data) => {
            console.log('Received video URL change:', data.url);
            setUrl(data.url);
            setIsPlaying(false); // Reset playing state when URL changes
            setSyncStatus(`Video changed by another user`);
            setTimeout(() => setSyncStatus(''), 3000);
        });

        socketInstance.on("receive_video_state", (data) => {
            console.log('Received video state:', data);
            if (data.url) {
                setUrl(data.url);
                setIsPlaying(data.isPlaying);
                setCurrentTime(data.currentTime);
                setSyncStatus('Synced with room');
                setTimeout(() => setSyncStatus(''), 2000);
            }
        });



        // Listen for Playlist Updates
        socketInstance.on("receive_playlist", (list) => {
            setPlaylist(list);
        });

        // Request current video state for late joiners
        socketInstance.emit("get_video_state", { room: roomId });

        // Heartbeat
        socketInstance.on("ping", () => socketInstance.emit("pong"));

        // Cleanup
        return () => {
            socketInstance.off('connect', onConnect);
            socketInstance.off('disconnect', onDisconnect);
            socketInstance.off('connect_error', onConnectError);
            socketInstance.off("receive_message");
            socketInstance.off('room_users');
            socketInstance.off("receive_video_url_change");
            socketInstance.off("receive_video_state");
            socketInstance.off("receive_playlist");
            socketInstance.off("ping");
        };
    }, [roomId, userName]);

    // Prevent HMR from breaking socket in development
    // Prevent HMR from breaking socket in development
    if (process.env.NODE_ENV === "development" && typeof module !== "undefined") {
        // @ts-ignore
        module.hot?.decline();
    }

    // Load recently played videos from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('recentVideos');
            if (stored) {
                try {
                    setRecentVideos(JSON.parse(stored));
                } catch (e) {
                    console.error('Failed to parse recent videos:', e);
                }
            }
        }
    }, []);

    // Auto-scroll chat to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messageList]);

    const sendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (currentMessage !== "" && socket) {
            const messageData = {
                room: roomId,
                username: userName,
                message: currentMessage,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            await socket.emit("send_message", messageData);
            setMessageList((list) => [...list, messageData]);
            setCurrentMessage("");
        }
    };

    const handleUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (inputUrl.trim() && socket) {
            let validUrl = inputUrl.trim();

            // Check if it's a URL
            const isUrl = validUrl.startsWith('http') || validUrl.includes('www.') || validUrl.includes('.com');

            if (isUrl) {
                // Handle different URL formats
                if (!validUrl.startsWith('http')) {
                    validUrl = `https://${validUrl}`;
                }

                // Convert YouTube share URLs to watch URLs
                if (validUrl.includes('youtu.be/')) {
                    const videoId = validUrl.split('youtu.be/')[1].split('?')[0];
                    validUrl = `https://www.youtube.com/watch?v=${videoId}`;
                }

                console.log('Setting video URL:', validUrl);
                setUrl(validUrl);
                setInputUrl("");
                setIsPlaying(false);
                setShowResults(false);
                setSyncStatus('Loading new video...');
                socket.emit("video_url_change", { room: roomId, url: validUrl });

                setTimeout(() => setSyncStatus(''), 2000);
            } else {
                // It's a search query
                handleSearch(validUrl);
            }
        }
    };

    const handleSearch = async (query: string) => {
        setIsSearching(true);
        setShowResults(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/search?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            if (data.success) {
                setSearchResults(data.videos);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const playVideo = async (videoId: string, title?: string, thumbnail?: string) => {
        setShowResults(false);
        setIsPlaying(false);

        // Use official YouTube URL only
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        setUrl(videoUrl);
        setInputUrl("");
        socket?.emit("video_url_change", { room: roomId, url: videoUrl });
        setSyncStatus('Loading video...');

        // Save to recently played
        if (typeof window !== 'undefined') {
            const recent = JSON.parse(localStorage.getItem('recentVideos') || '[]');
            const newVideo: RecentVideo = {
                videoId,
                title: title || `Video ${videoId}`,
                thumbnail: thumbnail || `https://img.youtube.com/vi/${videoId}/default.jpg`,
                playedAt: Date.now()
            };

            // Remove duplicates and add to start
            const filtered = recent.filter((v: RecentVideo) => v.videoId !== videoId);
            filtered.unshift(newVideo);

            // Keep only last 20 videos
            const updated = filtered.slice(0, 20);
            localStorage.setItem('recentVideos', JSON.stringify(updated));
            setRecentVideos(updated);
        }

        setTimeout(() => setSyncStatus(''), 3000);
    };

    const handlePlay = () => {
        setIsPlaying(true);
    };

    const handlePause = () => {
        setIsPlaying(false);
    };





    const addToPlaylist = (video: any) => {
        if (socket) {
            socket.emit("add_to_playlist", { room: roomId, video });
            setSyncStatus(`Added to playlist`);
            setTimeout(() => setSyncStatus(''), 2000);
        }
    };

    const removeFromPlaylist = (videoId: string) => {
        if (socket) {
            socket.emit("remove_from_playlist", { room: roomId, videoId });
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-black text-stone-50 overflow-hidden font-sans">
            {/* Left Side: Video Player Area - FIXED HEIGHT ON MOBILE */}
            <div className="flex-none lg:flex-1 h-[45vh] lg:h-screen flex flex-col bg-black lg:border-r border-stone-800 relative">
                {/* URL Input Bar */}
                <div className="p-4 bg-[#0a0a0a] border-b border-stone-800 flex flex-col gap-2 relative z-50">
                    <div className="flex gap-2 items-center">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Search className="h-5 w-5 text-blue-500" />
                        </div>
                        <form onSubmit={handleUrlSubmit} className="flex-1 flex gap-2">
                            <input
                                type="text"
                                placeholder="Search YouTube or paste URL..."
                                value={inputUrl}
                                onChange={(e) => setInputUrl(e.target.value)}
                                className="flex-1 bg-black border border-stone-800 text-stone-50 text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-stone-600"
                            />
                            <button
                                type="submit"
                                aria-label="Search or Load"
                                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl transition-colors border border-stone-800 text-sm font-medium"
                            >
                                {isSearching ? 'Searching...' : 'Go'}
                            </button>
                        </form>
                        <button
                            onClick={() => setShowPlaylist(!showPlaylist)}
                            className={`p-2 rounded-xl transition-colors border border-stone-800 ${showPlaylist ? 'bg-blue-600 border-blue-500 text-white' : 'bg-stone-900 text-stone-400 hover:text-stone-200'}`}
                            title="Toggle Playlist"
                        >
                            <List className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setShowRecent(!showRecent)}
                            className={`p-2 rounded-xl transition-colors border border-stone-800 ${showRecent ? 'bg-blue-600 border-blue-500 text-white' : 'bg-stone-900 text-stone-400 hover:text-stone-200'}`}
                            title="Recently Played"
                        >
                            <History className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Search Results Dropdown */}
                    {showResults && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-[#0a0a0a] border-b border-stone-800 max-h-[60vh] overflow-y-auto shadow-2xl z-50">
                            <div className="p-2 grid grid-cols-1 gap-2">
                                <div className="flex justify-between items-center px-2 py-1">
                                    <span className="text-xs text-stone-500 font-medium">Search Results</span>
                                    <button
                                        onClick={() => setShowResults(false)}
                                        className="text-xs text-stone-500 hover:text-stone-300"
                                    >
                                        Close
                                    </button>
                                </div>
                                {searchResults.map((video) => (
                                    <div
                                        key={video.videoId}
                                        className="flex gap-3 p-2 hover:bg-stone-900 rounded-lg group transition-colors"
                                    >
                                        <div
                                            onClick={() => playVideo(video.videoId, video.title, video.thumbnail)}
                                            className="relative w-32 aspect-video rounded-md overflow-hidden bg-stone-800 flex-shrink-0 cursor-pointer"
                                        >
                                            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" fill="currentColor" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <h4
                                                onClick={() => playVideo(video.videoId, video.title, video.thumbnail)}
                                                className="text-sm font-medium text-stone-200 line-clamp-2 group-hover:text-blue-400 transition-colors cursor-pointer"
                                            >
                                                {video.title}
                                            </h4>
                                            <div className="flex justify-between items-center mt-1">
                                                <p className="text-xs text-stone-500 truncate">
                                                    {video.channel}
                                                </p>
                                                <button
                                                    onClick={() => addToPlaylist(video)}
                                                    className="p-1.5 hover:bg-stone-800 rounded-full text-stone-500 hover:text-blue-400 transition-colors"
                                                    title="Add to Playlist"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Playlist Sidebar Overlay */}
                {showPlaylist && (
                    <div className="absolute top-[73px] right-0 bottom-0 w-80 bg-[#0a0a0a]/95 backdrop-blur-md border-l border-stone-800 z-40 flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-stone-800 flex justify-between items-center">
                            <h3 className="font-semibold text-stone-50 flex items-center gap-2">
                                <List className="w-4 h-4 text-blue-500" />
                                Playlist
                                <span className="text-xs bg-stone-800 text-stone-400 px-2 py-0.5 rounded-full">
                                    {playlist.length}
                                </span>
                            </h3>
                            <button onClick={() => setShowPlaylist(false)} className="text-stone-500 hover:text-stone-300">
                                ×
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {playlist.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-stone-500 text-sm">
                                    <List className="w-8 h-8 mb-2 opacity-20" />
                                    <p>Playlist is empty</p>
                                    <p className="text-xs">Add videos from search</p>
                                </div>
                            ) : (
                                playlist.map((video, idx) => (
                                    <div key={`${video.videoId}-${idx}`} className="flex gap-2 p-2 bg-stone-900/50 hover:bg-stone-900 rounded-lg group">
                                        <div
                                            onClick={() => playVideo(video.videoId, video.title, video.thumbnail)}
                                            className="w-24 aspect-video bg-stone-800 rounded overflow-hidden flex-shrink-0 cursor-pointer relative"
                                        >
                                            <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                                                <Play className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                            <p
                                                onClick={() => playVideo(video.videoId, video.title, video.thumbnail)}
                                                className="text-xs font-medium text-stone-300 line-clamp-2 cursor-pointer hover:text-blue-400"
                                            >
                                                {video.title}
                                            </p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-stone-600">{video.channel}</span>
                                                <button
                                                    onClick={() => removeFromPlaylist(video.videoId)}
                                                    className="text-stone-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Recently Played Sidebar Overlay */}
                {showRecent && (
                    <div className="absolute top-[73px] right-0 bottom-0 w-80 bg-[#0a0a0a]/95 backdrop-blur-md border-l border-stone-800 z-40 flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-stone-800 flex justify-between items-center">
                            <h3 className="font-semibold text-stone-50 flex items-center gap-2">
                                <History className="w-4 h-4 text-blue-500" />
                                Recently Played
                                <span className="text-xs bg-stone-800 text-stone-400 px-2 py-0.5 rounded-full">
                                    {recentVideos.length}
                                </span>
                            </h3>
                            <button onClick={() => setShowRecent(false)} className="text-stone-500 hover:text-stone-300">
                                ×
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {recentVideos.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-stone-500 text-sm">
                                    <History className="w-8 h-8 mb-2 opacity-20" />
                                    <p>No recent videos</p>
                                    <p className="text-xs">Play a video to get started</p>
                                </div>
                            ) : (
                                recentVideos.map((video, idx) => (
                                    <div key={`${video.videoId}-${idx}`} className="flex gap-2 p-2 bg-stone-900/50 hover:bg-stone-900 rounded-lg group">
                                        <div
                                            onClick={() => playVideo(video.videoId, video.title, video.thumbnail)}
                                            className="w-24 aspect-video bg-stone-800 rounded overflow-hidden flex-shrink-0 cursor-pointer relative"
                                        >
                                            <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                                                <Play className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                            <p
                                                onClick={() => playVideo(video.videoId, video.title, video.thumbnail)}
                                                className="text-xs font-medium text-stone-300 line-clamp-2 cursor-pointer hover:text-blue-400"
                                            >
                                                {video.title}
                                            </p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-stone-600">
                                                    {new Date(video.playedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Player Container */}
                <div className="flex-1 p-4 flex items-center justify-center">
                    <div className="w-full h-full max-h-[80vh] aspect-video">
                        {url ? (
                            <div className="relative w-full h-full">
                                <PlayerComponent
                                    url={url}
                                    socket={socket}
                                    roomId={roomId}
                                    isPlaying={isPlaying}
                                    onPlay={handlePlay}
                                    onPause={handlePause}
                                />
                                {/* Debug URL display */}
                                <div className="absolute top-2 right-2 bg-black/70 text-stone-50 text-xs p-2 rounded max-w-xs truncate border border-stone-800">
                                    {url}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full bg-[#0a0a0a] rounded-xl flex items-center justify-center border border-stone-800 shadow-[0_0_40px_rgba(59,130,246,0.05)]">
                                <div className="text-center text-stone-500">
                                    <div className="text-lg mb-2">🎬</div>
                                    <div className="text-sm">No video loaded</div>
                                    <div className="text-xs mt-1">Paste a video URL above to get started</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Enhanced Room Info Overlay */}
                <div className="absolute bottom-4 left-4 space-y-2">
                    <div className="p-2 bg-black/80 backdrop-blur-sm rounded-lg border border-stone-800 text-xs text-stone-400">
                        Room: <span className="text-blue-400 font-mono">{roomId}</span>
                    </div>
                    <div className="p-2 bg-black/80 backdrop-blur-sm rounded-lg border border-stone-800 text-xs flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-blue-500' :
                            connectionStatus === 'connecting' ? 'bg-stone-500 animate-pulse' :
                                'bg-red-500'
                            }`}></div>
                        <span className="text-stone-400">
                            {connectionStatus === 'connected' ? `${roomUsers.length} users` :
                                connectionStatus === 'connecting' ? 'Connecting...' :
                                    'Disconnected'}
                        </span>
                    </div>
                    {syncStatus && (
                        <div className="p-2 bg-blue-900/80 backdrop-blur-sm rounded-lg border border-blue-800 text-xs text-blue-300">
                            {syncStatus}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side: Chat */}
            <div className="flex-1 lg:flex-none lg:w-96 h-[55vh] lg:h-screen flex flex-col bg-black border-t lg:border-t-0 lg:border-l border-stone-800 shadow-2xl">
                {/* Chat Header */}
                <div className="p-4 border-b border-stone-800 bg-[#0a0a0a] backdrop-blur-md flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-stone-50">Live Chat</h3>
                        <p className="text-xs text-stone-500 flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-blue-500 animate-pulse' : 'bg-red-500'
                                }`}></span>
                            {connectionStatus === 'connected' ? `${roomUsers.length} online` : 'Offline'}
                        </p>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent">
                    {messageList.map((msg, index) => {
                        const isSystem = msg.username === "System";
                        const isMe = msg.username === userName;

                        if (isSystem) {
                            return (
                                <div key={index} className="flex justify-center my-4">
                                    <span className="text-xs text-stone-500 bg-stone-900/50 px-3 py-1 rounded-full border border-stone-800/50">
                                        {msg.message}
                                    </span>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={index}
                                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                            >
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className={`text-xs font-medium ${isMe ? "text-blue-400" : "text-stone-400"}`}>
                                        {msg.username}
                                    </span>
                                    <span className="text-[10px] text-stone-600">{msg.time}</span>
                                </div>
                                <div
                                    className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${isMe
                                        ? "bg-blue-600 text-white rounded-tr-none shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                                        : "bg-stone-900 text-stone-200 rounded-tl-none border border-stone-800"
                                        }`}
                                >
                                    <p>{msg.message}</p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-[#0a0a0a] border-t border-stone-800">
                    <form onSubmit={sendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={currentMessage}
                            onChange={(event) => setCurrentMessage(event.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-black border border-stone-800 text-stone-50 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-stone-600"
                        />
                        <button
                            type="submit"
                            disabled={!currentMessage.trim()}
                            aria-label="Send message"
                            className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                        >
                            <Send className="h-5 w-5" />
                        </button>
                    </form>
                </div>
            </div>

        </div>
    );
}
