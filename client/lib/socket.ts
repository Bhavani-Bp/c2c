import { io, Socket } from "socket.io-client";

// Use environment variable for Socket URL, with fallback to localhost
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            autoConnect: true,
        });

        socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
        });

        socket.on("disconnect", (reason) => {
            console.warn("Socket disconnected:", reason);
        });
    }

    return socket;
};
