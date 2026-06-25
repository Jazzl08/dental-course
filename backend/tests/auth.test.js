import { jest } from "@jest/globals";

jest.unstable_mockModule("../config/db.js", () => ({
  default: { 
    query: jest.fn().mockResolvedValue({ rowCount: 0, rows: [] }),
    getClient: jest.fn(),
    testConnection: jest.fn()
  },
  query: jest.fn().mockResolvedValue({ rowCount: 0, rows: [] }),
  getClient: jest.fn(),
  testConnection: jest.fn()
}));

const request = (await import("supertest")).default;
const app = (await import("../src/app.js")).default;

describe("Auth Endpoints", () => {
  it("should return 400 for missing credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.statusCode).toBe(400); 
  });

  it("should fail login when user not found (mock DB returns empty)", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "invalid@email.com", password: "pwd" });
    expect(res.statusCode).toBe(401); // Assuming 401 on bad login
  });
});
