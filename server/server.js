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

// Helper to check if an origin is allowed (allows localhost, any vercel.app domain, and FRONTEND_URL)
const isOriginAllowed = (origin) => {
    if (!origin) return true;
    const cleanOrigin = origin.replace(/\/$/, "");
    
    // Allow localhost/127.0.0.1 on any port
    if (cleanOrigin.startsWith("http://localhost:") || cleanOrigin.startsWith("http://127.0.0.1:") || cleanOrigin === "http://localhost" || cleanOrigin === "http://127.0.0.1") {
        return true;
    }
    
    // Allow any Vercel deployment URL
    if (cleanOrigin.endsWith(".vercel.app")) {
        return true;
    }
    
    // Allow custom FRONTEND_URL if set
    if (process.env.FRONTEND_URL) {
        const cleanFrontendUrl = process.env.FRONTEND_URL.replace(/\/$/, "");
        if (cleanOrigin === cleanFrontendUrl) {
            return true;
        }
    }
    
    return false;
};

// Initialize socket.io server with dynamic CORS
export const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || isOriginAllowed(origin)) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        },
        methods: ["GET", "POST"],
        credentials: true
    }
});
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



// Middleware setup
app.use(express.json({ limit: "4mb" }));
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || isOriginAllowed(origin)) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
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
