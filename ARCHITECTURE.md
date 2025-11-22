# Connect to Connect - System Architecture

This document outlines the high-level architecture and data flow for the Connect to Connect application.

## 1. High-Level Component Diagram

This diagram shows how the different parts of the system interact.

```mermaid
graph TD
    subgraph "Client Side (Frontend)"
        UserA[User A (Browser)]
        UserB[User B (Browser)]
        
        subgraph "Next.js App"
            UI[User Interface]
            SocketClient[Socket.io Client]
            Player[Video Player Component]
        end
    end

    subgraph "Server Side (Backend)"
        LB[Load Balancer / Reverse Proxy]
        
        subgraph "Node.js Server"
            Express[Express API]
            SocketServer[Socket.io Server]
            RoomMgr[Room Manager Logic]
        end
        
        DB[(In-Memory Store / Redis)]
    end

    UserA -->|HTTP / WebSocket| LB
    UserB -->|HTTP / WebSocket| LB
    LB --> Express
    LB --> SocketServer
    
    SocketServer <--> RoomMgr
    RoomMgr <--> DB
```

## 2. Synchronization Flow (Sequence Diagram)

This diagram illustrates what happens when User A clicks "Play" or seeks the video.

```mermaid
sequenceDiagram
    participant UserA as User A (Host)
    participant Server as Socket.io Server
    participant UserB as User B (Viewer)

    Note over UserA, UserB: Both users are in Room "123"

    %% Play Event
    UserA->>UserA: Clicks Play
    UserA->>Server: emit('play', {roomId: '123', time: 10.5})
    Server->>UserB: emit('receive_play', {time: 10.5})
    UserB->>UserB: Video Starts Playing at 10.5s

    %% Seek Event
    UserA->>UserA: Seeks to 01:30
    UserA->>Server: emit('seek', {roomId: '123', time: 90})
    Server->>UserB: emit('receive_seek', {time: 90})
    UserB->>UserB: Video Jumps to 01:30

    %% New User Joins
    Note over UserA, UserB: User C joins the room
    participant UserC as User C (New Joiner)
    UserC->>Server: emit('join_room', '123')
    Server->>UserA: emit('get_current_state')
    UserA->>Server: emit('send_state', {isPlaying: true, time: 95})
    Server->>UserC: emit('sync_state', {isPlaying: true, time: 95})
    UserC->>UserC: Video Starts Playing at 95s
```

## 3. Data Structures

### Room Object (Server State)
```json
{
  "roomId": "room-1234",
  "users": [
    { "socketId": "abc-1", "username": "Alice" },
    { "socketId": "def-2", "username": "Bob" }
  ],
  "currentVideoUrl": "https://youtube.com/watch?v=...",
  "isPlaying": true,
  "lastKnownTime": 45.5,
  "lastUpdated": 1678900000
}
```
