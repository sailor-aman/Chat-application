import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const getBackendUrl = () => {
    if (import.meta.env.VITE_BACKEND_URL) {
        return import.meta.env.VITE_BACKEND_URL;
    }

    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
        return "http://localhost:5000";
    }

    return "";
};

const backendUrl = getBackendUrl();
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

// FIXED: Destructured lower-case children here
export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(localStorage.getItem("token"));
    const [authUser, setAuthUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);

    // Check if user is authenticated and if so, set the user data
    const checkAuth = async () => {
        try {
            const { data } = await axios.get("/api/auth/check");
            if (data.success) {
                setAuthUser(data.user);
            }
        } catch (error) {
            // Silently fail on initial auth check (e.g. backend sleeping or user not logged in)
            console.log("Auth check failed:", error.message);
        }
    }

    // Login function to handle user authentication and state updates
    const login = async (state, Credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, Credentials);
            if (data.success) {
                setAuthUser(data.userData);
                axios.defaults.headers.common["token"] = data.token;
                setToken(data.token);
                localStorage.setItem("token", data.token);
                toast.success(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    }

    // Logout function to handle user logout and clean up state
    const logout = async () => {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        axios.defaults.headers.common["token"] = null;
        toast.success("Logged out successfully");
    }

    // Update profile function to handle user profile updates
    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put("/api/auth/update-profile", body);
            if (data.success) {
                setAuthUser(data.user);
                toast.success("Profile updated successfully");
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    // Manage socket connection lifecycle based on authentication state
    useEffect(() => {
        if (!authUser) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const newSocket = io(backendUrl, {
            query: {
                userId: authUser._id,
            }
        });
        newSocket.connect();
        setSocket(newSocket);

        newSocket.on("getOnlineUsers", (userIds) => {
            setOnlineUsers(userIds);
        });

        return () => {
            newSocket.disconnect();
        };
    }, [authUser]);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["token"] = token;
        }
        checkAuth();
    }, [token]);

    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};