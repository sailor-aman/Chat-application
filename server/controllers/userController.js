import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js"; // FIXED: Added .js extension
import bcrypt from "bcryptjs";

// ==========================================
// 1. SIGNUP A NEW USER
// ==========================================
export const signup = async (req, res) => {

    const { fullName, email, password, bio } = req.body;

    try {
        if (!fullName || !email || !password || !bio) {
            return res.status(400).json({ success: false, message: "Missing details" });
        }

        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: "Account already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
            bio
        });

        const token = generateToken(newUser._id);

        res.status(201).json({ success: true, userData: newUser, token, message: "Account created successfully" });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}

// ==========================================
// 2. LOGIN A USER
// ==========================================
export const login = async (req, res) => {
    try {
        // FIXED: Included password in destructuring
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Please fill all fields" });
        }

        const userData = await User.findOne({ email });
        if (!userData) {
            return res.status(400).json({ success: false, message: "Invalid Credentials" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, userData.password);
        if (!isPasswordCorrect) {
            // FIXED: Now correctly handling wrong passwords with a 400 error status
            return res.status(400).json({ success: false, message: "Invalid Credentials" });
        }

        // FIXED: Changed newUser._id to userData._id
        const token = generateToken(userData._id);

        res.status(200).json({ success: true, userData, token, message: "Login Successful" });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}

// ==========================================
// 3. CHECK AUTHENTICATION STATUS
// ==========================================
export const checkAuth = (req, res) => {
    res.status(200).json({ success: true, user: req.user });
}

// ==========================================
// 4. UPDATE USER PROFILE DETAILS
// ==========================================
export const updateProfile = async (req, res) => {
    try {
        const { profilePic, bio, fullName } = req.body;
        const userId = req.user._id; // Extracted from protectRoute middleware

        let updatedUser; // Clear structural container variable

        if (!profilePic) {
            // FIXED: Assigned result to updatedUser and unified field naming to fullName
            updatedUser = await User.findByIdAndUpdate(userId, { bio, fullName }, { new: true });
        } else {
            const upload = await cloudinary.uploader.upload(profilePic);
            // FIXED: Corrected lowercase variable 'userid' to 'userId'
            updatedUser = await User.findByIdAndUpdate(userId, { profilePic: upload.secure_url, bio, fullName }, { new: true });
        }

        res.status(200).json({ success: true, user: updatedUser });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}