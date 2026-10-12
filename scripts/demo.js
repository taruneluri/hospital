import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { spawn } from "node:child_process";
process.env.MONGOMS_DOWNLOAD_DIR = new URL(
  "../.mongodb-binaries",
  import.meta.url,
).pathname.replace(/^\/([A-Z]:)/, "$1");
const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri();
process.env.JWT_SECRET = randomBytes(48).toString("hex");
process.env.DEMO_MODE = "true";
const apiPort = Number(process.env.DEMO_API_PORT || 4000);
const webPort = Number(process.env.DEMO_WEB_PORT || 5173);
process.env.APP_ORIGIN = "http://127.0.0.1:" + webPort;
process.env.CAREWELL_API_TARGET = "http://127.0.0.1:" + apiPort;
const { app } = await import("../server/app.js");
const { User, Appointment } = await import("../server/models/index.js");
await mongoose.connect(process.env.MONGODB_URI);
await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
const patient = await User.create({
  name: "Alex Morgan",
  email: "alex@carewell.demo",
  phone: "9876543210",
  password: await bcrypt.hash("Carewell123", 12),
  gender: "Prefer not to say",
  bloodGroup: "O+",
  dob: "1998-06-15",
  address: "Hyderabad, Telangana",
});
const day = (offset) =>
  new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
await Appointment.create([
  {
    patient: patient._id,
    doctorId: "ananya",
    date: day(2),
    time: "10:00",
    comments: "Routine health checkup",
  },
  {
    patient: patient._id,
    doctorId: "meera",
    date: day(7),
    time: "14:30",
    comments: "Skin consultation",
  },
  {
    patient: patient._id,
    doctorId: "arjun",
    date: day(-20),
    time: "09:30",
    comments: "Follow-up consultation",
  },
]);
const server = app.listen(apiPort, "127.0.0.1", () =>
  console.log(
    "Temporary demo API ready. Data resets on restart. Login: alex@carewell.demo / Carewell123",
  ),
);
const vite = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "--host",
    "127.0.0.1",
    "--port",
    String(webPort),
  ],
  { stdio: "inherit" },
);
async function stop() {
  vite.kill();
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
  process.exit();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
