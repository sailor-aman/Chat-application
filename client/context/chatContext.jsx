import { createContext, useContext, useEffect, useState } from "react"; // FIXED: Removed unused 'Children' import reference
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]); // FIXED: Changed userState to useState
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const { socket, axios } = useContext(AuthContext);


    // Fetch all users for the chat sidebar
    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users);
                // FIXED: Standardized spelling matching state property mapping
                setUnseenMessages(data.unseenMessages || {});
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    // Fetch conversation messages history for a selected user
    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    // Send a new text/image message
    const sendMessage = async (messageData) => {
        if (!selectedUser) return;
        try {
            // FIXED: Extracted messageData payload parameter out of the URL path string parameter
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if (data.success) {
                setMessages((prevMessages) => [...prevMessages, data.newMessage]);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    // Delete entire conversation with a selected user
    const deleteChat = async (userId) => {
        try {
            const { data } = await axios.delete(`/api/messages/delete/${userId}`);
            if (data.success) {
                setMessages([]);
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    // Real-time listener: Subscribe to incoming Socket messages and read receipts
    const subscribeToMessage = () => {
        if (!socket) return;

        socket.on("newMessage", (newMessage) => {
            // If the message belongs to the current open chat panel conversation
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                newMessage.seen = true;
                setMessages((prevMessages) => [...prevMessages, newMessage]);

                // Let the server know this message was immediately read
                axios.put(`/api/messages/mark/${newMessage._id}`).catch((err) => console.log(err));
            } else {
                // Increment target notification counter badge if chat is closed
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages,
                    [newMessage.senderId]: (prevUnseenMessages[newMessage.senderId] || 0) + 1
                }));
            }
        });

        // Listen for when our sent messages are read by the other user (bulk read)
        socket.on("messagesSeen", ({ receiverId }) => {
            if (selectedUser && selectedUser._id === receiverId) {
                setMessages((prevMessages) =>
                    prevMessages.map((msg) => ({ ...msg, seen: true }))
                );
            }
        });

        // Listen for specific message read status updates
        socket.on("messageSeen", ({ messageId }) => {
            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    msg._id === messageId ? { ...msg, seen: true } : msg
                )
            );
        });

        // Listen for message deletion (Delete for Everyone)
        socket.on("messageDeleted", ({ messageId }) => {
            setMessages((prevMessages) =>
                prevMessages.filter((msg) => msg._id !== messageId)
            );
        });
    };

    // Clean up listeners when component unmounts or chat selections change
    const unsubscribeFromMessages = () => {
        if (socket) {
            socket.off("newMessage");
            socket.off("messagesSeen");
            socket.off("messageSeen");
            socket.off("messageDeleted");
        }
    };

    // Delete a specific message (Delete for Me or Delete for Everyone)
    const deleteMessage = async (messageId, deleteType) => {
        try {
            const { data } = await axios.post(`/api/messages/delete-message/${messageId}`, { deleteType });
            if (data.success) {
                setMessages((prevMessages) =>
                    prevMessages.filter((msg) => msg._id !== messageId)
                );
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    useEffect(() => {
        subscribeToMessage();
        return () => unsubscribeFromMessages();
    }, [socket, selectedUser]); // Re-binds smoothly when a user switches who they are talking to

    const value = {
        messages,
        users,
        selectedUser,
        getUsers,
        getMessages,
        sendMessage,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
        deleteChat,
        deleteMessage
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};