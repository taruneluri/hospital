// @vitest-environment node
import { it, expect, vi, afterEach } from "vitest";
import request from "supertest";
vi.mock("./database.js", () => ({ connectDatabase: vi.fn() }));
import { connectDatabase } from "./database.js";
import handler from "../api/index.js";
afterEach(() => vi.resetAllMocks());
it("the Vercel handler forwards API paths to Express", async () => {
  connectDatabase.mockResolvedValue({});
  const response = await request(handler).get("/api/services");
  expect(response.status).toBe(200);
  expect(response.body[0].name).toBe("General medicine");
});
it("database failures produce a safe retryable response", async () => {
  connectDatabase.mockRejectedValue(new Error("private connection details"));
  const response = await request(handler).get("/api/services");
  expect(response.status).toBe(503);
  expect(response.text).not.toContain("private");
  expect(response.headers["cache-control"]).toBe("no-store");
});
