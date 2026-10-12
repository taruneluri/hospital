import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true, select: false },
    dob: { type: String, default: "" },
    gender: { type: String, default: "" },
    bloodGroup: { type: String, default: "" },
    address: { type: String, default: "" },
    avatar: { type: String, default: "" },
  },
  { timestamps: true },
);
export const User = mongoose.model("User", userSchema);
const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    doctorId: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    comments: { type: String, default: "" },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
    reportIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Report" }],
  },
  { timestamps: true },
);
appointmentSchema.index(
  { doctorId: 1, date: 1, time: 1 },
  { unique: true, partialFilterExpression: { status: "confirmed" } },
);
export const Appointment = mongoose.model("Appointment", appointmentSchema);
export const Report = mongoose.model(
  "Report",
  new mongoose.Schema(
    {
      patient: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
      },
      name: String,
      mime: String,
      data: Buffer,
    },
    { timestamps: true },
  ),
);
