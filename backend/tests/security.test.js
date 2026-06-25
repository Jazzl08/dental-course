import { jest } from "@jest/globals";

jest.unstable_mockModule("../config/db.js", () => ({
  default: { 
    query: jest.fn(),
    getClient: jest.fn(),
    testConnection: jest.fn()
  },
  query: jest.fn(),
  getClient: jest.fn(),
  testConnection: jest.fn()
}));

const request = (await import("supertest")).default;
const app = (await import("../src/app.js")).default;

describe("Security Tests", () => {
  it("should have Helmet security headers", async () => {
    const res = await request(app).get("/api/auth/login");
    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
  });

  it("should rate limit excessive requests", async () => {
    let finalRes = null;
    for(let i=0; i<15; i++){
      finalRes = await request(app).post("/api/auth/login").send({ email: "a@a.cm", password: "pwd" });
    }
    expect(finalRes.statusCode).toBe(429);
  });
});
