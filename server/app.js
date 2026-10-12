import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import multer from "multer";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { User, Appointment, Report } from "./models/index.js";
import { auth, session, publicUser } from "./middleware/auth.js";
import {
  validate,
  signupSchema,
  loginSchema,
  profileSchema,
  appointmentSchema,
} from "./validation.js";
import { doctors, services, slots } from "./data/catalog.js";
export const app = express();
app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", "data:"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  }),
);
app.use(express.json({ limit: "3mb" }), cookieParser());
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.get("origin");
    const allowed = [
      process.env.APP_ORIGIN,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ].filter(Boolean);
    if (process.env.NODE_ENV === "production") {
      const deploymentOrigins = [
        process.env.APP_ORIGIN,
        ...[process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
          .filter(Boolean)
          .map((host) => "https://" + host),
      ];
      if (!origin || !deploymentOrigins.includes(origin))
        return res
          .status(403)
          .json({ message: "Request origin is not allowed." });
    } else if (origin && !allowed.includes(origin))
      return res
        .status(403)
        .json({ message: "Request origin is not allowed." });
  }
  next();
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
});
app.get("/api/health", (req, res) =>
  res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({
    ok: mongoose.connection.readyState === 1,
    demo: process.env.DEMO_MODE === "true",
  }),
);
app.post("/api/auth/signup", loginLimiter, async (req, res) => {
  const data = validate(signupSchema, req.body);
  const user = await User.create({
    ...data,
    password: await bcrypt.hash(data.password, 12),
  });
  session(res, user);
  res.status(201).json(publicUser(user));
});
app.post("/api/auth/login", loginLimiter, async (req, res) => {
  const data = validate(loginSchema, req.body);
  const user = await User.findOne({ email: data.email }).select("+password");
  if (!user || !(await bcrypt.compare(data.password, user.password)))
    return res.status(401).json({ message: "Email or password is incorrect." });
  session(res, user);
  res.json(publicUser(user));
});
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("carewell_session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  res.json({ ok: true });
});
app.get("/api/auth/me", auth, (req, res) => res.json(publicUser(req.user)));
app.put("/api/profile", auth, async (req, res) => {
  Object.assign(req.user, validate(profileSchema, req.body));
  await req.user.save();
  res.json(publicUser(req.user));
});
app.get("/api/doctors", (req, res) => res.json(doctors));
app.get("/api/services", (req, res) => res.json(services));
app.get("/api/availability", auth, async (req, res) => {
  const { doctorId, date } = req.query;
  if (
    !doctors.some((d) => d.id === doctorId) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date || "")
  )
    return res.status(400).json({ message: "Choose a doctor and date." });
  const booked = await Appointment.find({
    doctorId,
    date,
    status: "confirmed",
  }).select("time");
  res.json(
    slots.filter(
      (s) =>
        !booked.some((b) => b.time === s) &&
        new Date(date + "T" + s + ":00+05:30") > new Date(),
    ),
  );
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024, files: 3, fields: 6 },
  fileFilter: (req, file, cb) => {
    if (
      !["application/pdf", "image/jpeg", "image/png"].includes(file.mimetype)
    ) {
      const error = new Error("Use PDF, JPG, or PNG reports.");
      error.status = 400;
      return cb(error);
    }
    cb(null, true);
  },
});
function validFile(file) {
  const b = file.buffer;
  return file.mimetype === "application/pdf"
    ? b.subarray(0, 5).toString() === "%PDF-"
    : file.mimetype === "image/png"
      ? b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : b[0] === 255 && b[1] === 216 && b[2] === 255;
}
app.get("/api/appointments", auth, async (req, res) => {
  const items = await Appointment.find({ patient: req.user._id })
    .sort({ date: -1, time: -1 })
    .populate("reportIds", "name");
  res.json(items);
});
app.post(
  "/api/appointments",
  auth,
  upload.array("reports", 3),
  async (req, res) => {
    const data = validate(appointmentSchema, req.body);
    if (
      (req.files || []).reduce((total, file) => total + file.size, 0) >
      3 * 1024 * 1024
    )
      return res
        .status(400)
        .json({ message: "Reports must total no more than 3 MB." });
    if ((req.files || []).some((f) => !validFile(f)))
      return res
        .status(400)
        .json({ message: "A report is not a valid PDF, JPG, or PNG file." });
    const appointment = await Appointment.create({
      ...data,
      patient: req.user._id,
    });
    let reportIds = [];
    try {
      const reports = await Report.insertMany(
        (req.files || []).map((f) => ({
          patient: req.user._id,
          name: f.originalname.slice(0, 150),
          mime: f.mimetype,
          data: f.buffer,
        })),
      );
      reportIds = reports.map((r) => r._id);
      appointment.reportIds = reportIds;
      await appointment.save();
      await appointment.populate("reportIds", "name");
      res.status(201).json(appointment);
    } catch (error) {
      await Report.deleteMany({
        _id: { $in: reportIds },
        patient: req.user._id,
      });
      await Appointment.deleteOne({ _id: appointment._id });
      throw error;
    }
  },
);
app.patch("/api/appointments/:id/cancel", auth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ message: "Appointment not found." });
  const item = await Appointment.findOne({
    _id: req.params.id,
    patient: req.user._id,
  });
  if (!item) return res.status(404).json({ message: "Appointment not found." });
  if (new Date(item.date + "T" + item.time + ":00+05:30") <= new Date())
    return res
      .status(400)
      .json({ message: "Past appointments cannot be cancelled." });
  item.status = "cancelled";
  await item.save();
  res.json(item);
});
app.get("/api/reports/:id", auth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ message: "Report not found." });
  const report = await Report.findOne({
    _id: req.params.id,
    patient: req.user._id,
  });
  if (!report) return res.status(404).json({ message: "Report not found." });
  res.type(report.mime);
  res.attachment(report.name);
  res.send(report.data);
});
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
app.use(express.static(path.join(root, "dist")));
app.use("/api", (req, res) =>
  res.status(404).json({ message: "API endpoint not found." }),
);
app.get("/{*path}", (req, res) =>
  res.sendFile(path.join(root, "dist", "index.html")),
);
app.use((err, req, res, next) => {
  if (err.code === 11000)
    return res.status(409).json({
      message: err.keyPattern?.email
        ? "An account with this email already exists."
        : "This time was just booked. Please choose another slot.",
    });
  if (err instanceof multer.MulterError)
    return res
      .status(400)
      .json({ message: "Upload up to 3 reports, no more than 3 MB in total." });
  res.status(err.status || 500).json({
    message: err.status
      ? err.message
      : "Something went wrong. Please try again.",
  });
  if (!err.status) console.error(err.message);
});
