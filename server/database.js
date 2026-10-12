import mongoose from "mongoose";
let pendingConnection;

export async function connectDatabase() {
  if (
    !process.env.MONGODB_URI ||
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32
  ) {
    throw new Error(
      "Configure MONGODB_URI and JWT_SECRET before starting the API.",
    );
  }
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!pendingConnection) {
    pendingConnection = mongoose
      .connect(process.env.MONGODB_URI, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      })
      .then(async (connection) => {
        await Promise.all(
          Object.values(mongoose.models).map((model) => model.init()),
        );
        return connection;
      })
      .catch(async (error) => {
        await mongoose.disconnect();
        throw error;
      })
      .finally(() => {
        pendingConnection = undefined;
      });
  }
  return pendingConnection;
}
