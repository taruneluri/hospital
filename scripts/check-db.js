import "dotenv/config";
import mongoose from "mongoose";
try {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
  });
  await mongoose.connection.db.admin().ping();
  console.log(
    "MongoDB connection verified. Database: " + mongoose.connection.name,
  );
} catch (error) {
  console.error(
    "MongoDB connection failed: " +
      error.name +
      ". Check database credentials, network access, and Atlas IP allowlist.",
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
