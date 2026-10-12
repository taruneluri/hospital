import { app } from "../server/app.js";
import { connectDatabase } from "../server/database.js";

// Reuse one MongoDB connection per warm function instance.
export default async function handler(req, res) {
  try {
    await connectDatabase();
  } catch {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(
      JSON.stringify({
        message:
          "The service is temporarily unavailable. Please try again shortly.",
      }),
    );
    return;
  }
  return app(req, res);
}
