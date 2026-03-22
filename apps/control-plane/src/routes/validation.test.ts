import { describe, it, expect } from "vitest";
import { RegisterBody, LoginBody, parseBody } from "./validation.js";

describe("parseBody + Zod schemas", () => {
  it("RegisterBody accepts valid input and returns parsed data", () => {
    const input = {
      email: "user@example.com",
      password: "securepass",
      tenantName: "My Tenant",
    };
    const result = parseBody(RegisterBody, input);
    expect(result).toEqual(input);
  });

  it("RegisterBody throws statusCode 400 when email is missing", () => {
    try {
      parseBody(RegisterBody, {
        password: "securepass",
        tenantName: "My Tenant",
      });
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe("Validation failed");
    }
  });

  it("RegisterBody throws statusCode 400 for invalid email", () => {
    try {
      parseBody(RegisterBody, {
        email: "not-an-email",
        password: "securepass",
        tenantName: "My Tenant",
      });
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.statusCode).toBe(400);
    }
  });

  it("RegisterBody throws statusCode 400 for short password", () => {
    try {
      parseBody(RegisterBody, {
        email: "user@example.com",
        password: "short",
        tenantName: "My Tenant",
      });
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.statusCode).toBe(400);
    }
  });

  it("RegisterBody throws statusCode 400 when tenantName is missing", () => {
    try {
      parseBody(RegisterBody, {
        email: "user@example.com",
        password: "securepass",
      });
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.statusCode).toBe(400);
    }
  });

  it("LoginBody accepts valid input and returns parsed data", () => {
    const input = {
      email: "user@example.com",
      password: "mypassword",
    };
    const result = parseBody(LoginBody, input);
    expect(result).toEqual(input);
  });

  it("LoginBody throws statusCode 400 when fields are missing", () => {
    try {
      parseBody(LoginBody, {});
      expect.fail("should have thrown");
    } catch (err: any) {
      expect(err.statusCode).toBe(400);
      expect(err.validation).toBeDefined();
    }
  });
});
