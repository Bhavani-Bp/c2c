const io = require("socket.io-client");

const socketUrl = "http://localhost:3001";

const client1 = io(socketUrl);
const client2 = io(socketUrl);

console.log("--- Starting Backend Verification ---");

client1.on("connect", () => {
    console.log("Client 1 connected with ID:", client1.id);

    // Client 1 joins room
    console.log("Client 1 joining room 'test-room'...");
    client1.emit("join_room", { room: "test-room", name: "Alice" });
});

client2.on("connect", () => {
    console.log("Client 2 connected with ID:", client2.id);

    // Client 2 joins same room
    setTimeout(() => {
        console.log("Client 2 joining room 'test-room'...");
        client2.emit("join_room", { room: "test-room", name: "Bob" });
    }, 500);
});

// Listen for messages on Client 1
client1.on("receive_message", (data) => {
    console.log(`[Client 1] Received message: ${data.message} from ${data.username}`);
});

// Listen for messages on Client 2
client2.on("receive_message", (data) => {
    console.log(`[Client 2] Received message: ${data.message} from ${data.username}`);

    // If Client 2 receives the message from Alice, test is successful
    if (data.message === "Hello Bob!" && data.username === "Alice") {
        console.log("\n✅ SUCCESS: Message transmission verified!");
        console.log("--- Test Complete ---");
        client1.disconnect();
        client2.disconnect();
        process.exit(0);
    }
});

// Sequence of events
setTimeout(() => {
    if (client1.connected && client2.connected) {
        console.log("Sending message from Client 1 to Room...");
        client1.emit("send_message", {
            room: "test-room",
            message: "Hello Bob!",
            username: "Alice",
            time: new Date().toLocaleTimeString()
        });
    }
}, 1500);

// Timeout safety
setTimeout(() => {
    console.log("\n❌ TIMEOUT: Test did not complete in time.");
    client1.disconnect();
    client2.disconnect();
    process.exit(1);
}, 5000);
