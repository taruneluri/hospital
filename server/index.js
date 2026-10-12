import "dotenv/config";
import mongoose from "mongoose";
import { app } from "./app.js";
if (
  !process.env.MONGODB_URI ||
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET.length < 32
)
  throw new Error(
    "Set MONGODB_URI and a JWT_SECRET of at least 32 characters in .env. For a temporary demo, use npm run dev:demo.",
  );
if (
  process.env.NODE_ENV === "production" &&
  !process.env.APP_ORIGIN?.startsWith("https://")
)
  throw new Error("Set APP_ORIGIN to your HTTPS production URL.");
await mongoose.connect(process.env.MONGODB_URI);
await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
const server = app.listen(process.env.PORT || 4000, "0.0.0.0", () =>
  console.log("Carewell API ready on port " + (process.env.PORT || 4000)),
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () =>
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    }),
  );
