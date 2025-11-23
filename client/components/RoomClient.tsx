"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Send, MessageSquare, User, Link as LinkIcon } from "lucide-react";
import PlayerComponent from "./PlayerComponent";
import SimplePeer from "simple-peer";

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
    const [isSharingAudio, setIsSharingAudio] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const userAudioRef = useRef<HTMLAudioElement>(null);
    const peersRef = useRef<any[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

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

        // WebRTC Signaling for Audio Sharing
        socketInstance.on("callUser", (data) => {
            console.log("Receiving call from:", data.from);
            const peer = new SimplePeer({
                initiator: false,
                trickle: false,
            });

            peer.on("signal", (signal) => {
                socketInstance.emit("answerCall", { signal, to: data.from });
            });

            peer.on("stream", (stream) => {
                console.log("Receiving audio stream");
                if (userAudioRef.current) {
                    userAudioRef.current.srcObject = stream;
                    userAudioRef.current.play().catch(e => console.error("Error playing audio:", e));
                }
            });

            peer.signal(data.signal);
            peersRef.current.push({
                peerID: data.from,
                peer,
            });
        });

        socketInstance.on("callAccepted", (data) => {
            console.log("Call accepted from:", data.from);
            const item = peersRef.current.find(p => p.peerID === data.from);
            if (item) {
                item.peer.signal(data.signal);
            }
        });

        // Better WebRTC Handling with Map
        socketInstance.on("ice-candidate", (candidate) => {
            // Handle ICE candidates if using trickle: true
        });

        // Request current video state for late joiners
        socketInstance.emit("get_video_state", { room: roomId });

        // Cleanup
        return () => {
            socketInstance.disconnect();
            streamRef.current?.getTracks().forEach(track => track.stop());
            peersRef.current.forEach(p => p.peer.destroy());
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

    const handleShareAudio = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true, // Required for getDisplayMedia, but we can ignore the video track
                audio: true
            });

            streamRef.current = stream;
            setIsSharingAudio(true);

            // Notify server to call all users
            // In a real app, we would get a list of users and call each one.
            // For this MVP, we rely on the server to broadcast or we iterate known users.
            // Since we don't have a full peer mesh management here, let's just emit a "startCall" to the room
            // and let the server facilitate.
            // Actually, the server 'callUser' expects a specific target.
            // We need to iterate over `roomUsers` and call each one.

            roomUsers.forEach(user => {
                if (user.id === socket?.id) return;

                const peer = new SimplePeer({
                    initiator: true,
                    trickle: false,
                    stream: stream,
                });

                peer.on("signal", (signal) => {
                    socket?.emit("callUser", {
                        userToCall: user.id,
                        signalData: signal,
                        from: socket.id,
                        name: userName,
                    });
                });

                peersRef.current.push({
                    peerID: user.id,
                    peer,
                });
            });

            // Handle stream stop (user clicks "Stop Sharing" in browser UI)
            stream.getVideoTracks()[0].onended = () => {
                setIsSharingAudio(false);
                stream.getTracks().forEach(track => track.stop());
                peersRef.current.forEach(p => p.peer.destroy());
                peersRef.current = [];
                // Notify others? (Optional for MVP, connection close handles it)
            };

        } catch (error) {
            console.error("Error sharing audio:", error);
        }
    };



    return (
        <div className="flex flex-col lg:flex-row h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
            {/* Left Side: Video Player Area */}
            <div className="flex-1 flex flex-col bg-black border-r border-zinc-800 relative">
                {/* URL Input Bar */}
                <div className="p-4 bg-zinc-900/50 border-b border-zinc-800 flex gap-2 items-center">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <LinkIcon className="h-5 w-5 text-indigo-400" />
                    </div>
                    <form onSubmit={handleUrlSubmit} className="flex-1 flex gap-2">
                        <input
                            type="text"
                            placeholder="Try: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            className="flex-1 bg-zinc-950 border border-zinc-700 text-zinc-100 text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-zinc-600"
                        />
                        <button
                            type="submit"
                            aria-label="Load video"
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors border border-zinc-700 text-sm font-medium"
                        >
                            Load
                        </button>
                    </form>
                    <button
                        onClick={handleShareAudio}
                        disabled={isSharingAudio}
                        className={`px-4 py-2 rounded-xl transition-colors border text-sm font-medium ${isSharingAudio
                            ? 'bg-red-500/10 border-red-500/50 text-red-400'
                            : 'bg-indigo-600 hover:bg-indigo-500 border-transparent text-white'
                            }`}
                    >
                        {isSharingAudio ? 'Sharing Audio...' : 'Share Audio'}
                    </button>
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
                                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs p-2 rounded max-w-xs truncate">
                                    {url}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800">
                                <div className="text-center text-zinc-500">
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
                    <div className="p-2 bg-zinc-900/80 backdrop-blur-sm rounded-lg border border-zinc-800 text-xs text-zinc-400">
                        Room: <span className="text-indigo-400 font-mono">{roomId}</span>
                    </div>
                    <div className="p-2 bg-zinc-900/80 backdrop-blur-sm rounded-lg border border-zinc-800 text-xs flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' :
                            connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                                'bg-red-500'
                            }`}></div>
                        <span className="text-zinc-400">
                            {connectionStatus === 'connected' ? `${roomUsers.length} users` :
                                connectionStatus === 'connecting' ? 'Connecting...' :
                                    'Disconnected'}
                        </span>
                    </div>
                    {syncStatus && (
                        <div className="p-2 bg-indigo-900/80 backdrop-blur-sm rounded-lg border border-indigo-800 text-xs text-indigo-300">
                            {syncStatus}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side: Chat UI */}
            <div className="w-full lg:w-96 flex flex-col bg-zinc-950 border-t lg:border-t-0 lg:border-l border-zinc-800 shadow-2xl">
                {/* Chat Header */}
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 backdrop-blur-md flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-zinc-100">Live Chat</h3>
                        <p className="text-xs text-zinc-500 flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                                }`}></span>
                            {connectionStatus === 'connected' ? `${roomUsers.length} online` : 'Offline'}
                        </p>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    {messageList.map((msg, index) => {
                        const isSystem = msg.username === "System";
                        const isMe = msg.username === userName;

                        if (isSystem) {
                            return (
                                <div key={index} className="flex justify-center my-4">
                                    <span className="text-xs text-zinc-500 bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800/50">
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
                                    <span className={`text-xs font-medium ${isMe ? "text-indigo-400" : "text-zinc-400"}`}>
                                        {msg.username}
                                    </span>
                                    <span className="text-[10px] text-zinc-600">{msg.time}</span>
                                </div>
                                <div
                                    className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${isMe
                                        ? "bg-indigo-600 text-white rounded-tr-none"
                                        : "bg-zinc-800 text-zinc-200 rounded-tl-none"
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
                <div className="p-4 bg-zinc-900/30 border-t border-zinc-800">
                    <form onSubmit={sendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={currentMessage}
                            onChange={(event) => setCurrentMessage(event.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-zinc-600"
                        />
                        <button
                            type="submit"
                            disabled={!currentMessage.trim()}
                            aria-label="Send message"
                            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            <Send className="h-5 w-5" />
                        </button>
                    </form>
                </div>
            </div>
            {/* Hidden Audio Element for WebRTC Stream */}
            <audio ref={userAudioRef} autoPlay hidden />
        </div>
    );
}
