import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// Create Expree app and HTTp server

const app = express();
const server = http.createServer(app)

// Initialize socket.io  server

export const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
})
// Store online users

export const userSocketMap = {}; // {userId:socketId}

//Socket.io connection handler
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);

    if (userId && userId !== "undefined") {
        userSocketMap[userId] = socket.id;
    }

    //Emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log("User Disconnected", userId);
        if (userId && userId !== "undefined") {
            delete userSocketMap[userId]; // Remove them from our online list
        }
        io.emit("getOnlineUsers", Object.keys(userSocketMap)); // Tell everyone they went offline
    });

});



const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    "http://localhost:5173",
    "http://127.0.0.1:5173"
].filter(Boolean);

// Middleware setup
app.use(express.json({ limit: "4mb" }));
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));


//Routes setup
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter)



// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        server.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));
    })
    .catch((err) => {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1);
    });
