import mongoose from "mongoose";

// Function to connect to the mongodb datatbase

export const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

        if (!mongoUri) {
            throw new Error("Please provide MONGODB_URI or MONGO_URI in your environment variables.");
        }

        mongoose.connection.on('connected', () => console.log('Database Connected'));
        await mongoose.connect(mongoUri.endsWith('/') ? `${mongoUri}chat-app` : `${mongoUri}/chat-app`);

    } catch (error) {
        console.log(error);
    }
}