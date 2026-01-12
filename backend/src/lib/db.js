import mongoose from "mongoose";

import { ENV } from "./env.js";

export const connectDB = async () => {
  try {
    if (!ENV.DB_URL) {
      throw new Error("DB_URL is not defined in environment variables");
    }

    if (mongoose.connection.readyState === 1) {
      console.log("✅ MongoDB is already connected.");
      return;
    }

    const conn = await mongoose.connect(ENV.DB_URL);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    
    if (error.name === "MongoServerSelectionError" && error.message.includes("SSL")) {
        console.error("⚠️ CRITICAL: This is likely a MongoDB Atlas IP Whitelist issue.");
        console.error("👉 ACTION REQUIRED: Go to MongoDB Atlas -> Network Access -> Add IP Address -> Add Current IP");
    }

    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB Disconnected");
});

mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
});
