// @vitest-environment node
import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import path from "node:path";
import { app } from "./app.js";
import { User, Appointment, Report } from "./models/index.js";
let mongo;
const account = {
  name: "Test Patient",
  email: "test@example.com",
  phone: "9876543210",
  password: "StrongPass123",
};
const date = () =>
  new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
async function patient(email = account.email) {
  const agent = request.agent(app);
  const signup = await agent
    .post("/api/auth/signup")
    .send({ ...account, email });
  expect(signup.status).toBe(201);
  return agent;
}
beforeAll(async () => {
  process.env.JWT_SECRET = "test-only-secret-abcdefghijklmnopqrstuvwxyz";
  process.env.NODE_ENV = "test";
  process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(".mongodb-binaries");
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Promise.all([User.init(), Appointment.init(), Report.init()]);
});
beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Appointment.deleteMany({}),
    Report.deleteMany({}),
  ]);
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
describe("authentication and profile", () => {
  it("rejects invalid input and duplicate emails, hashes passwords, and uses HttpOnly sessions", async () => {
    expect(
      (
        await request(app)
          .post("/api/auth/signup")
          .send({ ...account, password: "weak" })
      ).status,
    ).toBe(400);
    const response = await request(app).post("/api/auth/signup").send(account);
    expect(response.status).toBe(201);
    expect(response.body.password).toBeUndefined();
    expect(response.headers["set-cookie"][0]).toContain("HttpOnly");
    const user = await User.findOne({ email: account.email }).select(
      "+password",
    );
    expect(user.password).not.toBe(account.password);
    expect(
      (await request(app).post("/api/auth/signup").send(account)).status,
    ).toBe(409);
  });
  it("logs in, restores a session, updates profile, and logs out", async () => {
    await patient();
    const agent = request.agent(app);
    expect(
      (
        await agent
          .post("/api/auth/login")
          .send({ ...account, password: "wrong" })
      ).status,
    ).toBe(401);
    expect((await agent.post("/api/auth/login").send(account)).status).toBe(
      200,
    );
    expect((await agent.get("/api/auth/me")).body.email).toBe(account.email);
    const edited = await agent
      .put("/api/profile")
      .send({ name: "Updated Patient", phone: "9876543210", bloodGroup: "A+" });
    expect(edited.body.name).toBe("Updated Patient");
    expect(edited.body.bloodGroup).toBe("A+");
    await agent.post("/api/auth/logout");
    expect((await agent.get("/api/auth/me")).status).toBe(401);
  });
  it("rejects cross-origin changes", async () => {
    expect(
      (
        await request(app)
          .post("/api/auth/signup")
          .set("Origin", "https://untrusted.example")
          .send(account)
      ).status,
    ).toBe(403);
  });
});
describe("appointments and private reports", () => {
  it("requires login and rejects invalid or past bookings", async () => {
    expect((await request(app).get("/api/appointments")).status).toBe(401);
    const agent = await patient();
    expect(
      (
        await agent
          .post("/api/appointments")
          .field("doctorId", "ananya")
          .field("date", "2020-01-01")
          .field("time", "09:00")
      ).status,
    ).toBe(400);
    expect(
      (
        await agent
          .post("/api/appointments")
          .field("doctorId", "missing")
          .field("date", date())
          .field("time", "09:00")
      ).status,
    ).toBe(400);
  });
  it("stores bookings and reports, restricts ownership, and releases cancelled slots", async () => {
    const agent = await patient();
    const other = await patient("other@example.com");
    const booked = await agent
      .post("/api/appointments")
      .field("doctorId", "ananya")
      .field("date", date())
      .field("time", "09:00")
      .field("comments", "Checkup")
      .attach("reports", Buffer.from("%PDF-1.4\nTest report"), {
        filename: "report.pdf",
        contentType: "application/pdf",
      });
    expect(booked.status).toBe(201);
    const id = booked.body._id;
    const reportId = booked.body.reportIds[0]._id;
    expect((await agent.get("/api/appointments")).body).toHaveLength(1);
    expect((await other.get("/api/appointments")).body).toHaveLength(0);
    expect(
      (await other.patch("/api/appointments/" + id + "/cancel")).status,
    ).toBe(404);
    expect((await other.get("/api/reports/" + reportId)).status).toBe(404);
    expect((await agent.get("/api/reports/" + reportId)).status).toBe(200);
    expect(
      (
        await agent
          .get("/api/availability")
          .query({ doctorId: "ananya", date: date() })
      ).body,
    ).not.toContain("09:00");
    expect(
      (
        await other
          .post("/api/appointments")
          .field("doctorId", "ananya")
          .field("date", date())
          .field("time", "09:00")
      ).status,
    ).toBe(409);
    expect(
      (await agent.patch("/api/appointments/" + id + "/cancel")).body.status,
    ).toBe("cancelled");
    expect(
      (
        await agent
          .get("/api/availability")
          .query({ doctorId: "ananya", date: date() })
      ).body,
    ).toContain("09:00");
    expect(
      (
        await other
          .post("/api/appointments")
          .field("doctorId", "ananya")
          .field("date", date())
          .field("time", "09:00")
      ).status,
    ).toBe(201);
  });
  it("allows only one booking under concurrent requests", async () => {
    const a = await patient();
    const b = await patient("second@example.com");
    const book = (agent) =>
      agent
        .post("/api/appointments")
        .send({ doctorId: "arjun", date: date(), time: "10:00" });
    const results = await Promise.all([book(a), book(b)]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
  });
  it("rejects disguised reports without creating appointments", async () => {
    const agent = await patient();
    const response = await agent
      .post("/api/appointments")
      .field("doctorId", "ananya")
      .field("date", date())
      .field("time", "09:00")
      .attach("reports", Buffer.from("not a real PDF"), {
        filename: "fake.pdf",
        contentType: "application/pdf",
      });
    expect(response.status).toBe(400);
    expect(await Appointment.countDocuments()).toBe(0);
  });
});
