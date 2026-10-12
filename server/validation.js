import { z } from "zod";
import { doctors, slots } from "./data/catalog.js";
export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{8,20}$/, "Enter a valid phone number")
    .refine((v) => v.replace(/\D/g, "").length >= 8, "Enter at least 8 digits"),
  password: z
    .string()
    .min(8)
    .max(72)
    .regex(/[a-zA-Z]/, "Include a letter")
    .regex(/[0-9]/, "Include a number")
    .refine(
      (v) => Buffer.byteLength(v, "utf8") <= 72,
      "Password must be no more than 72 bytes",
    ),
});
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(72),
});
export const profileSchema = signupSchema
  .omit({ password: true, email: true })
  .extend({
    dob: z
      .string()
      .refine(
        (v) =>
          !v ||
          (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
            new Date(v) <= new Date() &&
            new Date(v).toISOString().slice(0, 10) === v),
        "Enter a valid birth date",
      )
      .optional(),
    gender: z
      .enum(["", "Female", "Male", "Non-binary", "Prefer not to say"])
      .optional(),
    bloodGroup: z
      .enum(["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
      .optional(),
    address: z.string().trim().max(300).optional(),
    avatar: z
      .string()
      .max(2800000)
      .refine(
        (v) =>
          !v || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v),
        "Use a JPG, PNG, or WebP image",
      )
      .optional(),
  });
export const appointmentSchema = z
  .object({
    doctorId: z
      .string()
      .refine((v) => doctors.some((d) => d.id === v), "Choose a doctor"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z
      .string()
      .refine((v) => slots.includes(v), "Choose an available time"),
    comments: z.string().trim().max(1000).optional(),
  })
  .superRefine((v, ctx) => {
    const date = new Date(v.date + "T" + v.time + ":00+05:30");
    if (
      !Number.isFinite(date.getTime()) ||
      date <= new Date() ||
      date > new Date(Date.now() + 90 * 86400000) ||
      new Date(v.date + "T12:00:00Z").toISOString().slice(0, 10) !== v.date
    )
      ctx.addIssue({
        code: "custom",
        path: ["date"],
        message: "Choose a future appointment within 90 days",
      });
  });
export function validate(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const e = new Error(result.error.issues[0].message);
    e.status = 400;
    throw e;
  }
  return result.data;
}
