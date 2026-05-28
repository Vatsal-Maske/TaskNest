// One-time migration: set isVerified=true on all users created before OTP feature
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./src/config/db.js";
import User from "./src/models/user.model.js";

await connectDB();
const result = await User.updateMany(
  { isVerified: { $ne: true } },
  { $set: { isVerified: true } }
);
console.log(`✅ Migrated ${result.modifiedCount} existing user(s) → isVerified: true`);
console.log(`   (These were created before the OTP feature was added)`);
await mongoose.disconnect();
