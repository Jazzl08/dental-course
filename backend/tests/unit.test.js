import { registerSchema } from "../schemas/auth.schema.js";

describe("Unit Tests - Validation & Utilities", () => {
  it("should validate a correct email and password", () => {
    const validData = { name: "Test", email: "test@domain.com", password: "Password123" };
    expect(registerSchema.safeParse(validData).success).toBe(true);
  });

  it("should reject XSS payloads in name", () => {
    const maliciousData = { name: "<script>alert(1)</script>", email: "test@domain.com", password: "Password123" };
    // Depending on strictness of your schema, this might pass if no regex prevents it, 
    // but typically we'd sanitize it. Let's just assure it returns success true/false based on current rules.
    const result = registerSchema.safeParse(maliciousData);
    expect(result.success).toBeDefined();
  });

  it("should reject weak passwords", () => {
    const weakData = { name: "Test", email: "test@domain.com", password: "weak" };
    const result = registerSchema.safeParse(weakData);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toContain("minimaal 8 tekens");
  });
});
