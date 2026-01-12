import { requireAuth, clerkClient } from "@clerk/express";
import User from "../models/User.js";

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const clerkId = req.auth().userId;

      if (!clerkId) return res.status(401).json({ message: "Unauthorized - invalid token" });

      // find user in db by clerk ID
      let user = await User.findOne({ clerkId });

      if (!user) {
        // Self-healing: User authenticated in Clerk but missing in DB.
        // Fetch details from Clerk and create DB record.
        try {
          const clerkUser = await clerkClient.users.getUser(clerkId);
          const email = clerkUser.emailAddresses[0]?.emailAddress;
          const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
          const image = clerkUser.imageUrl;

          user = await User.create({
            clerkId,
            email,
            name,
            profileImage: image,
          });

          console.log(`✅ Auto-synced user from Clerk: ${email} (${clerkId})`);
        } catch (clerkError) {
          console.error("Failed to auto-sync user from Clerk:", clerkError);
          return res.status(404).json({ message: "User not found and auto-sync failed" });
        }
      }

      // attach user to req
      req.user = user;

      next();
    } catch (error) {
      console.error("Error in protectRoute middleware", error);

      // Specifically handle DB connection errors to give better feedback
      if (error.name === "MongoServerSelectionError") {
        return res.status(503).json({ message: "Service Unavailable: Database connection failed. Please check server logs." });
      }

      res.status(500).json({ message: "Internal Server Error" });
    }
  },
];
