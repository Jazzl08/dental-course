import { jest } from "@jest/globals";

jest.unstable_mockModule("../config/db.js", () => ({
  default: { 
    query: jest.fn().mockRejectedValue(new Error("Database disconnected")),
    getClient: jest.fn(),
    testConnection: jest.fn()
  },
  query: jest.fn().mockRejectedValue(new Error("Database disconnected")),
  getClient: jest.fn(),
  testConnection: jest.fn()
}));

const request = (await import("supertest")).default;
const app = (await import("../src/app.js")).default;

describe("Error Handling Tests", () => {
  it("should return 404 for unknown routes", async () => {
    const res = await request(app).get("/api/this-does-not-exist");
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
  
  it("should return 400 for invalid validation input", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "invalid-email" });
    expect(res.statusCode).toBe(400); 
  });
});
