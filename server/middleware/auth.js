import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
export async function auth(req, res, next) {
  try {
    const claims = jwt.verify(
      req.cookies.carewell_session,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] },
    );
    req.user = await User.findById(claims.sub);
    if (!req.user)
      return res.status(401).json({ message: "Please log in to continue." });
    next();
  } catch {
    return res.status(401).json({ message: "Please log in to continue." });
  }
}
export function session(res, user) {
  res.cookie(
    "carewell_session",
    jwt.sign({ sub: String(user._id) }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 86400000,
      path: "/",
    },
  );
}
export function publicUser(user) {
  const value = user.toObject();
  delete value.password;
  delete value.__v;
  return value;
}
