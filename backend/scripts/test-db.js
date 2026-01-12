import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Manually load env from backend root
const __dirname = path.resolve();
dotenv.config({ path: path.join(__dirname, ".env") });

console.log("🔍 Connection Diagnostic Tool");
console.log("============================");

if (!process.env.DB_URL) {
    console.error("❌ ERROR: DB_URL is missing from .env file");
    process.exit(1);
}

const secureUrl = process.env.DB_URL.replace(/:([^:@]+)@/, ":****@");
console.log(`ℹ️  Attempting to connect to: ${secureUrl}`);

const testConnection = async () => {
    try {
        await mongoose.connect(process.env.DB_URL, {
            serverSelectionTimeoutMS: 5000 // Fail fast
        });
        console.log("✅ SUCCESS: Connected to MongoDB successfully!");
        console.log(`   Host: ${mongoose.connection.host}`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("\n❌ CONNECTION FAILED");
        console.error(`   Error Name: ${error.name}`);
        console.error(`   Message: ${error.message}`);

        if (error.name === "MongoServerSelectionError") {
            console.log("\n💡 DIAGNOSIS: IP WHITELIST ISSUE");
            console.log("   MongoDB Atlas is rejecting the connection.");
            console.log("   1. Go to cloud.mongodb.com");
            console.log("   2. Click 'Network Access'");
            console.log("   3. Add your current IP address (or 0.0.0.0/0 for testing)");
        }
        process.exit(1);
    }
};

testConnection();
