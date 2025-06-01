import mongoose from "mongoose";

export const connectDB = async (
  connectionString: string,
  dbName: string
): Promise<void> => {
  try {
    await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 5000,
      dbName: dbName,
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // stop app if DB fails
  }
};

// Optional: Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.disconnect();
  console.log("🔌 MongoDB disconnected on app termination");
  process.exit(0);
});
