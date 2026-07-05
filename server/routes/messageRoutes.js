import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { getMessages, getUsersForSidebar, markMessageAsSeen, sendMessage, deleteChat, deleteMessage } from "../controllers/messageController.js";

const messageRouter = express.Router();

// 1. Get list of users available to text (for your UI sidebar)
messageRouter.get("/users", protectRoute, getUsersForSidebar);

// 2. Get message history with a specific user
messageRouter.get("/:id", protectRoute, getMessages);

// 3. Mark a specific message as read/seen
messageRouter.put("/mark/:id", protectRoute, markMessageAsSeen);

// 4. Send a new message to a specific user
messageRouter.post("/send/:id", protectRoute, sendMessage);

// 5. Delete entire chat history with a specific user
messageRouter.delete("/delete/:id", protectRoute, deleteChat);

// 6. Delete a specific message (Delete for Me or Delete for Everyone)
messageRouter.post("/delete-message/:messageId", protectRoute, deleteMessage);

export default messageRouter;