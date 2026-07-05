

// Get all user except the logged in user

import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";


export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password");

        // Count number of messages not seen

        const unseenMessages = {}
        const promises = filteredUsers.map(async (user) => {
            const messages = await Message.find({
                senderId: user._id, receiverId:
                    userId, seen: false
            })
            if (messages.length > 0) {
                unseenMessages[user._id] = messages.length;

            }
        })
        await Promise.all(promises);
        res.json({ success: true, users: filteredUsers, unseenMessages })

    }
    catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}
// Get all messages for selected user

export const getMessages = async (req, res) => {
    try {

        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ],
            deletedBy: { $ne: myId }
        })
        await Message.updateMany({ senderId: selectedUserId, receiverId: myId },
            { seen: true });

        // Emit socket event to sender that their messages were read
        const senderSocketId = userSocketMap[selectedUserId];
        if (senderSocketId) {
            io.to(senderSocketId).emit("messagesSeen", { receiverId: myId });
        }

        res.json({ success: true, messages })


    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

//api to mark message as seen using message id

export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedMessage = await Message.findByIdAndUpdate(id, { seen: true }, { new: true })
        
        if (updatedMessage) {
            const senderSocketId = userSocketMap[updatedMessage.senderId];
            if (senderSocketId) {
                io.to(senderSocketId).emit("messageSeen", { messageId: id });
            }
        }
        res.json({ success: true })

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }

}


//send message to selected user

export const sendMessage = async (req, res) => {
    try {
        const { text, image, file, fileName } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;


        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url;
        }

        let fileUrl;
        if (file) {
            const uploadResponse = await cloudinary.uploader.upload(file, {
                resource_type: "raw"
            });
            fileUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl,
            file: fileUrl,
            fileName: fileName
        })

        //Emit the new message to the receiver's socket
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage)
        }

        res.json({ success: true, newMessage });


    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// 5. DELETE A CONVERSATION WITH A USER
export const deleteChat = async (req, res) => {
    try {
        const { id: otherUserId } = req.params;
        const myId = req.user._id;

        await Message.deleteMany({
            $or: [
                { senderId: myId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: myId }
            ]
        });

        res.json({ success: true, message: "Chat deleted successfully" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// 6. DELETE A SPECIFIC MESSAGE (Delete for Me or Delete for Everyone)
export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { deleteType } = req.body; // "me" or "everyone"
        const myId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        if (deleteType === "me") {
            // Add the user to deletedBy if not already present
            if (!message.deletedBy.includes(myId)) {
                message.deletedBy.push(myId);
                await message.save();
            }
            return res.json({ success: true, message: "Message deleted for you" });
        } else if (deleteType === "everyone") {
            // Only the sender can delete for everyone
            if (message.senderId.toString() !== myId.toString()) {
                return res.status(403).json({ success: false, message: "Unauthorized to delete for everyone" });
            }

            await Message.findByIdAndDelete(messageId);

            // Broadcast the deletion to the receiver
            const receiverId = message.receiverId;
            const receiverSocketId = userSocketMap[receiverId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("messageDeleted", { messageId });
            }

            return res.json({ success: true, message: "Message deleted for everyone" });
        } else {
            return res.status(400).json({ success: false, message: "Invalid delete type" });
        }
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}