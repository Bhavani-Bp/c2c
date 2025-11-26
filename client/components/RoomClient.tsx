"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Send, MessageSquare, User, Link as LinkIcon } from "lucide-react";
import PlayerComponent from "./PlayerComponent";


interface Message {
    message: string;
    username: string;
    time: string;
}

interface RoomClientProps {
    roomId: string;
    userName: string;
}

export default function RoomClient({ roomId, userName }: RoomClientProps) {
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

    const messagesEndRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        // Initialize Socket Connection with WebSocket transport
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
        const socketInstance = io(socketUrl, {
            transports: ["websocket", "polling"], // Try WebSocket first, fallback to polling
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
        setSocket(socketInstance);

        // Connection status handlers
        socketInstance.on('connect', () => {
            setConnectionStatus('connected');
            setSyncStatus('Connected to room');
            // Join Room after connection is established
            socketInstance.emit("join_room", { room: roomId, name: userName });
        });

        socketInstance.on('disconnect', () => {
            setConnectionStatus('disconnected');
            setSyncStatus('Disconnected from room');
        });

        socketInstance.on('connect_error', () => {
            setConnectionStatus('disconnected');
            setSyncStatus('Connection failed');
        });

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



        // Request current video state for late joiners
        socketInstance.emit("get_video_state", { room: roomId });

        // Cleanup
        return () => {
            socketInstance.disconnect();

        };
    }, [roomId, userName]);

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

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputUrl.trim() && socket) {
            let validUrl = inputUrl.trim();

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
            setSyncStatus('Loading new video...');
            socket.emit("video_url_change", { room: roomId, url: validUrl });

            setTimeout(() => setSyncStatus(''), 2000);
        }
    };

    const handlePlay = () => {
        setIsPlaying(true);
    };

    const handlePause = () => {
        setIsPlaying(false);
    };





    return (
        <div className="flex flex-col lg:flex-row h-screen bg-black text-stone-50 overflow-hidden font-sans">
            {/* Left Side: Video Player Area */}
            <div className="flex-1 flex flex-col bg-black border-r border-stone-800 relative">
                {/* URL Input Bar */}
                <div className="p-4 bg-[#0a0a0a] border-b border-stone-800 flex gap-2 items-center">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <LinkIcon className="h-5 w-5 text-blue-500" />
                    </div>
                    <form onSubmit={handleUrlSubmit} className="flex-1 flex gap-2">
                        <input
                            type="text"
                            placeholder="Try: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            className="flex-1 bg-black border border-stone-800 text-stone-50 text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-stone-600"
                        />
                        <button
                            type="submit"
                            aria-label="Load video"
                            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl transition-colors border border-stone-800 text-sm font-medium"
                        >
                            Load
                        </button>
                    </form>

                </div>

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

            {/* Right Side: Chat UI */}
            <div className="w-full lg:w-96 flex flex-col bg-black border-t lg:border-t-0 lg:border-l border-stone-800 shadow-2xl">
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
