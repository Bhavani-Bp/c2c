# Connect to Connect (C2C) - Synchronized Media Sharing App

## Project Overview
**Connect to Connect** is a real-time web application that allows users to create or join "rooms" to watch movies, videos, or listen to music together, perfectly synchronized. If one person pauses, it pauses for everyone. If one person seeks to a specific timestamp, everyone jumps to that moment.

---

## 1. Requirements

### Frontend (Client-Side)
- **User Interface (UI)**:
    - Landing page to Create or Join a Room.
    - Room Interface: Video Player, Chat Box, User List, Control Bar (Play/Pause/Seek).
- **State Management**:
    - Real-time synchronization of video state (playing/paused, current time).
    - List of active users in the room.
- **Media Player**:
    - Capability to play YouTube links, direct video files (MP4, WebM), and audio files.

### Backend (Server-Side)
- **WebSocket Server**:
    - Handle real-time events: `join_room`, `leave_room`, `send_message`, `media_state_change` (play/pause/seek).
- **Room Management**:
    - Logic to create unique room IDs.
    - Track users within each room.
- **API Layer**:
    - Basic endpoints for health checks or retrieving room metadata (optional for MVP).

---

## 2. Required APIs & Libraries

### Core APIs
- **Socket.io (v4)**: The industry standard for real-time, bidirectional event-based communication. Essential for the synchronization logic.
- **React Player**: A React component for playing a variety of URLs, including file paths, YouTube, Facebook, Twitch, SoundCloud, Streamable, Vimeo, Wistia, Mixcloud, DailyMotion and Kaltura.

### Optional External APIs (For V2)
- **YouTube Data API**: To search for videos directly within your app (requires an API Key).
- **Spotify Web Playback SDK**: For syncing Spotify music (requires Premium accounts for all users, complex for MVP). *Recommendation: Stick to YouTube/SoundCloud for music in the 1-week MVP.*

---

## 3. Functionality & Logic

### The "Room" Concept
- A **Room** is a virtual space identified by a unique ID (e.g., `room-1234`).
- Users enter a name and the Room ID to join.
- **Socket Logic**: `socket.join('room-1234')` groups these sockets together.

### Synchronization Logic (The "Heart" of the App)
1.  **Play/Pause**: When User A clicks Play, the client emits a `play` event to the server. The server broadcasts this `play` event to all other users in the room.
2.  **Seeking**: When User A scrubs to 1:30, the client emits `seek_to` with the timestamp `90` (seconds). The server broadcasts `seek_to: 90` to everyone.
3.  **Late Joiners**: When User B joins a room that is already watching, the server asks the "Host" (User A) for the current timestamp and video state, then syncs User B to that state immediately.

---

## 4. Best Tech Stack (For a 1-Week Timeline)

This stack is chosen for **speed of development**, **simplicity**, and **robustness**.

| Component | Technology | Why? |
| :--- | :--- | :--- |
| **Frontend** | **Next.js (React)** | Easy routing, fast setup, great component ecosystem. |
| **Styling** | **Tailwind CSS** | Rapid UI development, modern look. |
| **Backend** | **Node.js + Express** | Simple, flexible, works perfectly with Socket.io. |
| **Real-Time** | **Socket.io** | Handles the heavy lifting of WebSockets, auto-reconnection, and rooms. |
| **Video Player** | **React-Player** | Handles YouTube/MP4/Audio URLs with a single component. |
| **Icons** | **Lucide React** | Clean, modern icons. |
| **Deployment** | **Vercel (FE) + Render (BE)** | Free tiers, easy setup, Vercel for Next.js is seamless. |

---

## 5. Hosting & Environment

### Development Environment (Local)
- **Node.js**: Version 18+ installed.
- **Code Editor**: VS Code.
- **Package Manager**: `npm` or `yarn` or `pnpm`.

### Production Hosting
1.  **Frontend**: **Vercel**. Connect your GitHub repo, it auto-deploys Next.js apps.
2.  **Backend**: **Render** (or Railway/Heroku). You need a service that supports *long-running processes* (WebSockets). Serverless functions (like Vercel API routes) are tricky with WebSockets for beginners. **Render Web Service** is recommended.

---

## 6. Step-by-Step 1-Week Roadmap

### **Day 1: Setup & Basic UI**
- **Goal**: Get the project running and pages built.
- **Tasks**:
    1.  Initialize Next.js project: `npx create-next-app@latest client`.
    2.  Initialize Node server: `npm init -y` in a `server` folder.
    3.  Install dependencies: `socket.io-client` (frontend), `socket.io`, `express`, `cors`, `nodemon` (backend).
    4.  Build the **Landing Page**: Input for "Display Name" and "Room ID", and a "Join" button.

### **Day 2: Backend Foundation**
- **Goal**: A working server that handles connections.
- **Tasks**:
    1.  Set up Express server with `http` and `socket.io`.
    2.  Implement `connection` event log.
    3.  Implement `join_room` event: Add socket to a room.
    4.  Implement `send_message` event: Broadcast chat messages to the room.
    5.  Test with Postman (Socket.io support) or simple console logs.

### **Day 3: Connecting Frontend to Backend**
- **Goal**: Users can join a room and chat.
- **Tasks**:
    1.  Initialize `socket` connection in Next.js (use a `useEffect` hook).
    2.  On "Join", emit `join_room`.
    3.  Build the **Chat UI**: Message list and input field.
    4.  Listen for incoming messages and update the UI.

### **Day 4: The Video Player**
- **Goal**: A video player that plays content.
- **Tasks**:
    1.  Install `react-player`.
    2.  Create a `PlayerComponent`.
    3.  Add an input field to "Load URL" (e.g., paste a YouTube link).
    4.  State variable `url` that controls what `ReactPlayer` shows.

### **Day 5: Synchronization Logic (The Hard Part)**
- **Goal**: Play/Pause/Seek works for everyone.
- **Tasks**:
    1.  **Play/Pause**: Use `onPlay` and `onPause` props in ReactPlayer to emit events (`emit('play')`).
    2.  **Listen**: In `useEffect`, listen for `receive_play` and programmatically play the video.
    3.  **Seek**: Use `onSeek` to emit timestamp. Listen for `receive_seek` and use `playerRef.current.seekTo()`.
    4.  **URL Change**: When someone changes the URL, broadcast it so everyone's player updates.

### **Day 6: Polish & Sync Refinement**
- **Goal**: Fix bugs and make it look good.
- **Tasks**:
    1.  **Sync on Join**: When a new user joins, ask existing users for current time/URL and send it to the new user.
    2.  **Styling**: Use Tailwind to make a dark-mode cinema feel.
    3.  **Responsiveness**: Ensure it works on mobile.

### **Day 7: Deployment**
- **Goal**: Live on the internet.
- **Tasks**:
    1.  Push code to GitHub (separate repos or monorepo).
    2.  Deploy Backend to **Render** (Environment: Node).
    3.  Deploy Frontend to **Vercel**.
    4.  Update Frontend socket URL to point to the live Render backend (not `localhost`).
    5.  Test with a friend!

---

## Quick Start Commands

### Backend
```bash
mkdir server && cd server
npm init -y
npm install express socket.io cors nodemon
```

### Frontend
```bash
npx create-next-app@latest client
cd client
npm install socket.io-client react-player lucide-react
```
